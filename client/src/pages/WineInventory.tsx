import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wine as WineIcon, Minus, Plus, Check } from "lucide-react";
import { toast } from "sonner";

type WineCounts = { cellared: number; refrigerated: number };

type WineRow = {
  wineId: number;
  label: string;
  vintage: number | null;
  cellared: number | null;
  refrigerated: number | null;
};

function QuantityStepper({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="h-11 w-11"
          onClick={onDecrement}
          disabled={value === 0}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="w-8 text-center text-lg font-semibold tabular-nums">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="h-11 w-11"
          onClick={onIncrement}
          aria-label={`Increase ${label}`}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function WineInventory() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: wines, isLoading: winesLoading } = trpc.wine.listAvailable.useQuery({});
  const updateMutation = trpc.wine.update.useMutation();
  const utils = trpc.useUtils();
  const [pending, setPending] = useState<Record<number, WineCounts>>({});

  // Redirect to login if not authenticated or not a curator/admin
  useEffect(() => {
    if (!userLoading && (!user || (user.role !== "curator" && user.role !== "admin"))) {
      setLocation("/browser");
    }
  }, [user, userLoading, setLocation]);

  const getCounts = (wine: WineRow): WineCounts =>
    pending[wine.wineId] ?? { cellared: wine.cellared ?? 0, refrigerated: wine.refrigerated ?? 0 };

  const adjust = (wine: WineRow, field: keyof WineCounts, delta: number) => {
    const current = getCounts(wine);
    const next = { ...current, [field]: Math.max(0, current[field] + delta) };
    setPending((prev) => ({ ...prev, [wine.wineId]: next }));
  };

  const isDirty = (wine: WineRow) => {
    const p = pending[wine.wineId];
    return !!p && (p.cellared !== (wine.cellared ?? 0) || p.refrigerated !== (wine.refrigerated ?? 0));
  };

  const handleSave = async (wine: WineRow) => {
    const counts = getCounts(wine);
    const data: Partial<WineCounts> = {};
    if (counts.cellared !== (wine.cellared ?? 0)) data.cellared = counts.cellared;
    if (counts.refrigerated !== (wine.refrigerated ?? 0)) data.refrigerated = counts.refrigerated;
    if (Object.keys(data).length === 0) return;

    try {
      await updateMutation.mutateAsync({ id: wine.wineId, ...data });
      setPending((prev) => {
        const { [wine.wineId]: _removed, ...rest } = prev;
        return rest;
      });
      if (counts.cellared === 0 && counts.refrigerated === 0) {
        utils.wine.listAvailable.setData({}, (old) => old?.filter((w) => w.wineId !== wine.wineId));
      } else {
        utils.wine.listAvailable.setData({}, (old) =>
          old?.map((w) => (w.wineId === wine.wineId ? { ...w, ...counts } : w))
        );
      }
      toast.success("Inventory updated");
    } catch (error) {
      toast.error("Error updating inventory");
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <WineIcon className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "curator" && user.role !== "admin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <WineIcon className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Wine Inventory</h1>
            {!winesLoading && <Badge variant="secondary">{wines?.length ?? 0} in stock</Badge>}
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-3">
        {winesLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : wines?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No wines currently available.</div>
        ) : (
          wines?.map((wine) => {
            const counts = getCounts(wine);
            return (
              <Card key={wine.wineId}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-medium">
                      {wine.label} {wine.vintage ? `(${wine.vintage})` : ""}
                    </span>
                    {isDirty(wine) && (
                      <Button variant="ghost" size="icon-sm" onClick={() => handleSave(wine)} aria-label="Save changes">
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <QuantityStepper
                      label="Cellar"
                      value={counts.cellared}
                      onDecrement={() => adjust(wine, "cellared", -1)}
                      onIncrement={() => adjust(wine, "cellared", 1)}
                    />
                    <QuantityStepper
                      label="Fridge"
                      value={counts.refrigerated}
                      onDecrement={() => adjust(wine, "refrigerated", -1)}
                      onIncrement={() => adjust(wine, "refrigerated", 1)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
