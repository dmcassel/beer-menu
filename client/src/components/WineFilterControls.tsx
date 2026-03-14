import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

interface WineFilterControlsProps {
  selectedLocations: string[];
  setSelectedLocations: (value: string[]) => void;
  locations: Array<{ locationId: number; fullPath: string }>;
}

export function WineFilterControls({
  selectedLocations,
  setSelectedLocations,
  locations,
}: WineFilterControlsProps) {
  const locationOptions: MultiSelectOption[] = locations.map(loc => ({
    label: loc.fullPath,
    value: loc.locationId.toString(),
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
    </>
  );
}
