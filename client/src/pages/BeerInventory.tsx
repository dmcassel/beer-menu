import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Beer } from "lucide-react";
import { toast } from "sonner";

type BeerStatus = "on_tap" | "bottle_can" | "out";

export default function BeerInventory() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();
  const { data: beers, isLoading: beersLoading } = trpc.beer.listAvailable.useQuery();
  const updateMutation = trpc.beer.update.useMutation();
  const utils = trpc.useUtils();

  // Redirect to login if not authenticated or not a curator/admin
  useEffect(() => {
    if (!userLoading && (!user || (user.role !== "curator" && user.role !== "admin"))) {
      setLocation("/browser");
    }
  }, [user, userLoading, setLocation]);

  const handleStatusChange = async (beerId: number, status: BeerStatus) => {
    try {
      await updateMutation.mutateAsync({ id: beerId, status });
      if (status === "out") {
        utils.beer.listAvailable.setData(undefined, (old) => old?.filter((b) => b.beerId !== beerId));
      } else {
        utils.beer.listAvailable.setData(undefined, (old) =>
          old?.map((b) => (b.beerId === beerId ? { ...b, status } : b))
        );
      }
      toast.success("Status updated");
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Beer className="w-12 h-12 text-amber-600 mx-auto mb-4 animate-pulse" />
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
            <Beer className="w-8 h-8 text-amber-600" />
            <h1 className="text-2xl font-bold text-gray-900">Beer Inventory</h1>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-3">
        {beersLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : beers?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No beers currently available.</div>
        ) : (
          beers?.map((beer) => (
            <Card key={beer.beerId}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <span className="text-lg font-medium">{beer.name}</span>
                <Select
                  value={beer.status ?? "out"}
                  onValueChange={(value: BeerStatus) => handleStatusChange(beer.beerId, value)}
                >
                  <SelectTrigger className="h-12 w-40 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_tap">On Tap</SelectItem>
                    <SelectItem value="bottle_can">Bottle/Can</SelectItem>
                    <SelectItem value="out">Out</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
