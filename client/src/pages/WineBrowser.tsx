import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wine, Filter, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { WineFilterControls } from "@/components/WineFilterControls";

function WineHeader() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      await utils.auth.me.invalidate();
      toast.success("Logged out successfully");
      setLocation("/wine");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Welcome, {user.name || user.email}
        </span>
        {(user.role === "curator" || user.role === "admin") && (
          <a
            href="/dashboard"
            className="text-sm text-purple-700 hover:text-purple-900 underline"
          >
            Manage Catalog
          </a>
        )}
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    );
  }

  return (
    <a
      href="/login?returnUrl=/wine"
      className="text-sm text-purple-700 hover:text-purple-900 underline"
    >
      Login
    </a>
  );
}

export default function WineBrowser() {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedVarietals, setSelectedVarietals] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch filtered wines from the backend
  const { data: wines = [], isLoading: winesLoading } =
    trpc.wine.listAvailableWithFilters.useQuery({
      locationIds: selectedLocations.map(id => parseInt(id)),
      varietalIds: selectedVarietals.map(id => parseInt(id)),
    });

  // Fetch all locations with full paths for filter options
  const { data: locations = [] } = trpc.location.listWithPaths.useQuery();

  // Fetch all varietals for filter options
  const { data: varietals = [] } = trpc.varietal.list.useQuery();

  const handleClearFilters = () => {
    setSelectedLocations([]);
    setSelectedVarietals([]);
  };

  const hasActiveFilters =
    selectedLocations.length > 0 || selectedVarietals.length > 0;

  const activeFilterCount = selectedLocations.length + selectedVarietals.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-purple-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <div className="flex items-center gap-3">
                <Wine className="w-8 h-8 text-purple-700" />
                <h1 className="text-3xl font-bold text-purple-900">
                  Wine Catalog
                </h1>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(true)}
                className="md:hidden relative"
              >
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              <WineHeader />
            </div>
          </div>

          {/* Desktop Filters - Hidden on Mobile */}
          <div className="hidden md:grid md:grid-cols-2 gap-4">
            <WineFilterControls
              selectedLocations={selectedLocations}
              setSelectedLocations={setSelectedLocations}
              selectedVarietals={selectedVarietals}
              setSelectedVarietals={setSelectedVarietals}
              locations={locations}
              varietals={varietals}
            />
          </div>

          {/* Active Filters Display - Desktop and Mobile */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {selectedLocations.map(id => {
                const location = locations.find(
                  l => l.locationId === parseInt(id)
                );
                return location ? (
                  <Badge
                    key={`loc-${id}`}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedLocations(
                        selectedLocations.filter(locId => locId !== id)
                      )
                    }
                  >
                    {location.fullPath}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ) : null;
              })}
              {selectedVarietals.map(id => {
                const varietal = varietals.find(
                  v => v.varietalId === parseInt(id)
                );
                return varietal ? (
                  <Badge
                    key={`var-${id}`}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedVarietals(
                        selectedVarietals.filter(varId => varId !== id)
                      )
                    }
                  >
                    {varietal.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ) : null;
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-purple-700 hover:text-purple-900"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen} modal={false}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>Filter Wines</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <WineFilterControls
              selectedLocations={selectedLocations}
              setSelectedLocations={setSelectedLocations}
              selectedVarietals={selectedVarietals}
              setSelectedVarietals={setSelectedVarietals}
              locations={locations}
              varietals={varietals}
            />
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {winesLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-purple-700 animate-spin" />
          </div>
        ) : wines && wines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wines.map((wine) => (
              <Card
                key={wine.wineId}
                className="border-purple-200 hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-lg text-purple-900">
                    {wine.label}
                    {wine.vintage && (
                      <span className="text-purple-600 font-normal ml-2">
                        {wine.vintage}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {wine.wineryName && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Winery:</span>{" "}
                        {wine.wineryName}
                      </p>
                    )}

                    {wine.varietals && wine.varietals.length > 0 && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">
                          Varietal{wine.varietals.length > 1 ? "s" : ""}:
                        </span>{" "}
                        {wine.varietals.map((v) => v.name).join(", ")}
                      </p>
                    )}

                    {wine.locationName && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Location:</span>{" "}
                        {wine.locationName}
                      </p>
                    )}

                    <div className="flex gap-4 text-sm text-gray-700 pt-2">
                      {wine.refrigerated > 0 && (
                        <span className="font-medium">
                          🧊 Refrigerated: {wine.refrigerated}
                        </span>
                      )}
                      {wine.cellared > 0 && (
                        <span className="font-medium">
                          🍷 Cellared: {wine.cellared}
                        </span>
                      )}
                    </div>

                    {wine.description && (
                      <p className="text-sm text-gray-600 pt-2 border-t border-gray-200 mt-3 whitespace-pre-line">
                        {wine.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto border-2 border-purple-200">
            <CardContent className="text-center py-12">
              <Wine className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-purple-800 mb-2">
                No wines found
              </p>
              <p className="text-gray-600">
                {hasActiveFilters
                  ? "Try adjusting your filters to see more results."
                  : "There are currently no wines with bottles in stock."}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
