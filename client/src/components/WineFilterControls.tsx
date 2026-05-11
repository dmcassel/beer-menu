import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

interface WineFilterControlsProps {
  selectedLocations: string[];
  setSelectedLocations: (value: string[]) => void;
  locations: Array<{ locationId: number; fullPath: string }>;
  selectedWineries: string[];
  setSelectedWineries: (value: string[]) => void;
  wineries: Array<{ wineryId: number; name: string }>;
}

export function WineFilterControls({
  selectedLocations,
  setSelectedLocations,
  locations,
  selectedWineries,
  setSelectedWineries,
  wineries,
}: WineFilterControlsProps) {
  const locationOptions: MultiSelectOption[] = locations.map(loc => ({
    label: loc.fullPath,
    value: loc.locationId.toString(),
  }));

  const wineryOptions: MultiSelectOption[] = wineries.map(w => ({
    label: w.name,
    value: w.wineryId.toString(),
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
          Winery
        </label>
        <MultiSelect
          options={wineryOptions}
          selected={selectedWineries}
          onChange={setSelectedWineries}
          placeholder="All Wineries"
        />
      </div>
    </>
  );
}
