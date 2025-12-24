import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterControlsProps {
  selectedMenuCategory: string;
  setSelectedMenuCategory: (value: string) => void;
  selectedStyle: string;
  setSelectedStyle: (value: string) => void;
  selectedBrewery: string;
  setSelectedBrewery: (value: string) => void;
  menuCategories: Array<{ menu_cat_id: number; name: string }>;
  styles: Array<{ styleId: number; name: string }>;
  breweries: Array<{ breweryId: number; name: string }>;
}

export function FilterControls({
  selectedMenuCategory,
  setSelectedMenuCategory,
  selectedStyle,
  setSelectedStyle,
  selectedBrewery,
  setSelectedBrewery,
  menuCategories,
  styles,
  breweries,
}: FilterControlsProps) {
  return (
    <>
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
                key={cat.menu_cat_id}
                value={cat.menu_cat_id.toString()}
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
        <Select value={selectedBrewery} onValueChange={setSelectedBrewery}>
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
    </>
  );
}
