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
import { Loader2, Beer, Droplet, Flame, Filter, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { FilterControls } from "@/components/FilterControls";

function BrowserHeader() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      await utils.auth.me.invalidate();
      toast.success("Logged out successfully");
      setLocation("/browser");
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
            className="text-sm text-amber-700 hover:text-amber-900 underline"
          >
            Manage Catalog
          </a>
        )}
        {!(user.role === "curator" || user.role === "admin") && (
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        )}
      </div>
    );
  }

  return (
    <a
      href="/login?returnUrl=/browser"
      className="text-sm text-amber-700 hover:text-amber-900 underline"
    >
      Login
    </a>
  );
}

export default function BeerBrowser() {
  const [selectedMenuCategories, setSelectedMenuCategories] = useState<
    string[]
  >([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedBreweries, setSelectedBreweries] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch all data
  const { data: beers = [], isLoading: beersLoading } =
    trpc.beer.listAvailable.useQuery();
  const { data: styles = [] } = trpc.style.listAvailable.useQuery({
    menuCategoryIds: selectedMenuCategories.map(id => parseInt(id)),
    breweryIds: selectedBreweries.map(id => parseInt(id)),
  });
  const { data: menuCategories = [] } =
    trpc.menuCategory.listAvailable.useQuery();

  // Fetch available breweries based on selected filters
  const { data: breweries = [] } = trpc.brewery.listAvailable.useQuery({
    menuCategoryIds: selectedMenuCategories.map(id => parseInt(id)),
    styleIds: selectedStyles.map(id => parseInt(id)),
  });

  // Filter beers based on selections
  const filteredBeers = useMemo(() => {
    let result = beers;

    // Filter by menu categories (OR logic within filter)
    if (selectedMenuCategories.length > 0) {
      result = result.filter(beer => {
        const beerStyleId = beer.styleId;
        if (!beerStyleId) return false;

        const beerStyle = styles.find(s => s.styleId === beerStyleId);
        if (!beerStyle || !beerStyle.menuCategoryId) return false;

        return selectedMenuCategories.includes(
          beerStyle.menuCategoryId.toString()
        );
      });
    }

    // Filter by styles (OR logic within filter)
    if (selectedStyles.length > 0) {
      result = result.filter(
        beer => beer.styleId && selectedStyles.includes(beer.styleId.toString())
      );
    }

    // Filter by breweries (OR logic within filter)
    if (selectedBreweries.length > 0) {
      result = result.filter(
        beer =>
          beer.breweryId &&
          selectedBreweries.includes(beer.breweryId.toString())
      );
    }

    return result;
  }, [
    beers,
    selectedMenuCategories,
    selectedStyles,
    selectedBreweries,
    styles,
  ]);

  const getStyleName = (styleId: number | null | undefined) => {
    if (!styleId) return "Unknown Style";
    return styles.find(s => s.styleId === styleId)?.name || "Unknown Style";
  };

  const getBreweryName = (breweryId: number | null | undefined) => {
    if (!breweryId) return "Unknown Brewery";
    return (
      breweries.find(b => b.breweryId === breweryId)?.name || "Unknown Brewery"
    );
  };

  const handleClearFilters = () => {
    setSelectedMenuCategories([]);
    setSelectedStyles([]);
    setSelectedBreweries([]);
  };

  const hasActiveFilters =
    selectedMenuCategories.length > 0 ||
    selectedStyles.length > 0 ||
    selectedBreweries.length > 0;

  const activeFilterCount =
    selectedMenuCategories.length +
    selectedStyles.length +
    selectedBreweries.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <div className="flex items-center gap-3">
                <Beer className="w-8 h-8 text-amber-700" />
                <h1 className="text-3xl font-bold text-amber-900">
                  Beer Catalog
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
              <BrowserHeader />
            </div>
          </div>

          {/* Desktop Filters - Hidden on Mobile */}
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            <FilterControls
              selectedMenuCategories={selectedMenuCategories}
              setSelectedMenuCategories={setSelectedMenuCategories}
              selectedStyles={selectedStyles}
              setSelectedStyles={setSelectedStyles}
              selectedBreweries={selectedBreweries}
              setSelectedBreweries={setSelectedBreweries}
              menuCategories={menuCategories}
              styles={styles}
              breweries={breweries}
            />
          </div>

          {/* Active Filters Display - Desktop and Mobile */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {selectedMenuCategories.map(id => {
                const category = menuCategories.find(
                  c => c.menu_cat_id === parseInt(id)
                );
                return category ? (
                  <Badge
                    key={`cat-${id}`}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedMenuCategories(
                        selectedMenuCategories.filter(catId => catId !== id)
                      )
                    }
                  >
                    {category.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ) : null;
              })}
              {selectedStyles.map(id => {
                const style = styles.find(s => s.styleId === parseInt(id));
                return style ? (
                  <Badge
                    key={`style-${id}`}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedStyles(
                        selectedStyles.filter(styleId => styleId !== id)
                      )
                    }
                  >
                    {style.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ) : null;
              })}
              {selectedBreweries.map(id => {
                const brewery = breweries.find(
                  b => b.breweryId === parseInt(id)
                );
                return brewery ? (
                  <Badge
                    key={`brewery-${id}`}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedBreweries(
                        selectedBreweries.filter(breweryId => breweryId !== id)
                      )
                    }
                  >
                    {brewery.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ) : null;
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-amber-700 hover:text-amber-900"
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
            <SheetTitle>Filter Beers</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <FilterControls
              selectedMenuCategories={selectedMenuCategories}
              setSelectedMenuCategories={setSelectedMenuCategories}
              selectedStyles={selectedStyles}
              setSelectedStyles={setSelectedStyles}
              selectedBreweries={selectedBreweries}
              setSelectedBreweries={setSelectedBreweries}
              menuCategories={menuCategories}
              styles={styles}
              breweries={breweries}
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

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {beersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-700" />
          </div>
        ) : filteredBeers.length === 0 ? (
          <div className="text-center py-12">
            <Beer className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {hasActiveFilters
                ? "No beers match your filters. Try adjusting your selection."
                : "No beers in the catalog yet."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-6">
              Showing {filteredBeers.length} beer
              {filteredBeers.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBeers.map(beer => (
                <Card
                  key={beer.beerId}
                  className="hover:shadow-lg transition-shadow border-amber-200"
                >
                  <CardHeader>
                    <CardTitle className="text-amber-900">
                      {beer.name}
                    </CardTitle>
                    <CardDescription className="text-amber-700">
                      {getBreweryName(beer.breweryId)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {beer.description && (
                      <p className="text-sm text-gray-700">
                        {beer.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-900 border-amber-300"
                        >
                          {getStyleName(beer.styleId)}
                        </Badge>
                        {beer.status === "on_tap" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-900 border-blue-300"
                          >
                            On Tap
                          </Badge>
                        )}
                        {beer.status === "bottle_can" && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-900 border-green-300"
                          >
                            Bottle/Can
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-100">
                        {beer.abv && (
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-600" />
                            <div>
                              <p className="text-xs text-gray-500">ABV</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {beer.abv}%
                              </p>
                            </div>
                          </div>
                        )}
                        {beer.ibu && (
                          <div className="flex items-center gap-2">
                            <Droplet className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="text-xs text-gray-500">IBU</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {beer.ibu}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
