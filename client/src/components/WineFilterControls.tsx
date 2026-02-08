import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

interface WineFilterControlsProps {
  selectedLocations: string[];
  setSelectedLocations: (value: string[]) => void;
  selectedVarietals: string[];
  setSelectedVarietals: (value: string[]) => void;
  locations: Array<{ locationId: number; fullPath: string }>;
  varietals: Array<{ varietalId: number; name: string }>;
}

export function WineFilterControls({
  selectedLocations,
  setSelectedLocations,
  selectedVarietals,
  setSelectedVarietals,
  locations,
  varietals,
}: WineFilterControlsProps) {
  const locationOptions: MultiSelectOption[] = locations.map(loc => ({
    label: loc.fullPath,
    value: loc.locationId.toString(),
  }));

  const varietalOptions: MultiSelectOption[] = varietals.map(varietal => ({
    label: varietal.name,
    value: varietal.varietalId.toString(),
  }));

  return (
    <>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Location
        </label>
        <MultiSelect
          options={locationOptions}
          selected={selectedLocations}
          onChange={setSelectedLocations}
          placeholder="All Locations"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Varietal
        </label>
        <MultiSelect
          options={varietalOptions}
          selected={selectedVarietals}
          onChange={setSelectedVarietals}
          placeholder="All Varietals"
        />
      </div>
    </>
  );
}
