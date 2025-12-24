import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

interface FilterControlsProps {
  selectedMenuCategories: string[];
  setSelectedMenuCategories: (value: string[]) => void;
  selectedStyles: string[];
  setSelectedStyles: (value: string[]) => void;
  selectedBreweries: string[];
  setSelectedBreweries: (value: string[]) => void;
  menuCategories: Array<{ menu_cat_id: number; name: string }>;
  styles: Array<{ styleId: number; name: string }>;
  breweries: Array<{ breweryId: number; name: string }>;
}

export function FilterControls({
  selectedMenuCategories,
  setSelectedMenuCategories,
  selectedStyles,
  setSelectedStyles,
  selectedBreweries,
  setSelectedBreweries,
  menuCategories,
  styles,
  breweries,
}: FilterControlsProps) {
  const menuCategoryOptions: MultiSelectOption[] = menuCategories.map(cat => ({
    label: cat.name,
    value: cat.menu_cat_id.toString(),
  }));

  const styleOptions: MultiSelectOption[] = styles.map(style => ({
    label: style.name,
    value: style.styleId.toString(),
  }));

  const breweryOptions: MultiSelectOption[] = breweries.map(brewery => ({
    label: brewery.name,
    value: brewery.breweryId.toString(),
  }));

  return (
    <>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Menu Category
        </label>
        <MultiSelect
          options={menuCategoryOptions}
          selected={selectedMenuCategories}
          onChange={setSelectedMenuCategories}
          placeholder="All Categories"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Beer Style
        </label>
        <MultiSelect
          options={styleOptions}
          selected={selectedStyles}
          onChange={setSelectedStyles}
          placeholder="All Styles"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Brewery
        </label>
        <MultiSelect
          options={breweryOptions}
          selected={selectedBreweries}
          onChange={setSelectedBreweries}
          placeholder="All Breweries"
        />
      </div>
    </>
  );
}
