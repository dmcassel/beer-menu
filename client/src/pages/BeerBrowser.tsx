import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Beer, Droplet, Flame } from "lucide-react";
import { Link } from "wouter";

function BrowserHeader() {
  const { data: user } = trpc.auth.me.useQuery();
  
  if (user && (user.role === "curator" || user.role === "admin")) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Welcome, {user.name || user.email}</span>
        <a
          href="/dashboard"
          className="text-sm text-amber-700 hover:text-amber-900 underline"
        >
          Manage Catalog
        </a>
      </div>
    );
  }
  
  return (
    <a
      href="/login"
      className="text-sm text-amber-700 hover:text-amber-900 underline"
    >
      Login
    </a>
  );
}

export default function BeerBrowser() {
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedBrewery, setSelectedBrewery] = useState<string>("");

  // Fetch all data
  const { data: beers = [], isLoading: beersLoading } =
    trpc.beer.listAvailable.useQuery();
  const { data: styles = [] } = trpc.style.list.useQuery();
  const { data: breweries = [] } = trpc.brewery.list.useQuery();
  const { data: menuCategories = [] } = trpc.menuCategory.list.useQuery();
  const { data: menuCategoryBeers = [] } =
    trpc.menuCategoryBeer.getBeersInCategory.useQuery(
      { menuCatId: selectedMenuCategory ? parseInt(selectedMenuCategory) : 0 },
      { enabled: !!selectedMenuCategory }
    );

  // Filter beers based on selections
  const filteredBeers = useMemo(() => {
    let result = beers;

    // Filter by menu category
    if (
      selectedMenuCategory &&
      selectedMenuCategory !== "all" &&
      menuCategoryBeers
    ) {
      const beerIdsInCategory = menuCategoryBeers.map(mb => mb.beerId);
      result = result.filter(beer => beerIdsInCategory.includes(beer.beerId));
    }

    // Filter by style
    if (selectedStyle && selectedStyle !== "all") {
      result = result.filter(beer => beer.styleId === parseInt(selectedStyle));
    }

    // Filter by brewery
    if (selectedBrewery && selectedBrewery !== "all") {
      result = result.filter(
        beer => beer.breweryId === parseInt(selectedBrewery)
      );
    }

    return result;
  }, [
    beers,
    selectedMenuCategory,
    selectedStyle,
    selectedBrewery,
    menuCategoryBeers,
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
    setSelectedMenuCategory("");
    setSelectedStyle("");
    setSelectedBrewery("");
  };

  const hasActiveFilters =
    selectedMenuCategory || selectedStyle || selectedBrewery;

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
            <BrowserHeader />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Menu Category
              </label>
              <Select
                value={selectedMenuCategory}
                onValueChange={setSelectedMenuCategory}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {menuCategories.map(cat => (
                    <SelectItem
                      key={cat.menuCatId}
                      value={cat.menuCatId.toString()}
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Beer Style
              </label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Styles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  {styles.map(style => (
                    <SelectItem
                      key={style.styleId}
                      value={style.styleId.toString()}
                    >
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Brewery
              </label>
              <Select
                value={selectedBrewery}
                onValueChange={setSelectedBrewery}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Breweries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Breweries</SelectItem>
                  {breweries.map(brewery => (
                    <SelectItem
                      key={brewery.breweryId}
                      value={brewery.breweryId.toString()}
                    >
                      {brewery.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedMenuCategory && (
                <Badge variant="secondary">
                  {
                    menuCategories.find(
                      c => c.menuCatId === parseInt(selectedMenuCategory)
                    )?.name
                  }
                </Badge>
              )}
              {selectedStyle && (
                <Badge variant="secondary">
                  {
                    styles.find(s => s.styleId === parseInt(selectedStyle))
                      ?.name
                  }
                </Badge>
              )}
              {selectedBrewery && (
                <Badge variant="secondary">
                  {
                    breweries.find(
                      b => b.breweryId === parseInt(selectedBrewery)
                    )?.name
                  }
                </Badge>
              )}
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
