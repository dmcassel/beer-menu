import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface HierarchicalLocationPickerProps {
  value: number | null;
  onChange: (locationId: number | null) => void;
  disabled?: boolean;
}

export function HierarchicalLocationPicker({
  value,
  onChange,
  disabled = false,
}: HierarchicalLocationPickerProps) {
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedVineyard, setSelectedVineyard] = useState<number | null>(null);

  const { data: countries = [] } = trpc.location.getByType.useQuery({ type: "country" });
  const { data: states = [] } = trpc.location.getByParentId.useQuery(
    { parentId: selectedCountry },
    { enabled: selectedCountry !== null }
  );
  // Areas can have state OR area parents
  const { data: areas = [] } = trpc.location.getByParentId.useQuery(
    { parentId: selectedState || selectedArea },
    { enabled: selectedState !== null || selectedArea !== null }
  );
  // Vineyards always have area parents
  const { data: vineyards = [] } = trpc.location.getByParentId.useQuery(
    { parentId: selectedArea },
    { enabled: selectedArea !== null }
  );

  // Filter areas to show only those with the correct parent type
  const filteredAreas = areas.filter((area: any) => {
    if (selectedState && !selectedArea) {
      // First level areas - parent should be state
      return area.parentId === selectedState;
    } else if (selectedArea) {
      // Sub-areas - parent should be the selected area
      return area.parentId === selectedArea && area.type === "area";
    }
    return false;
  });

  // Note: Initialization from value would require fetching the location hierarchy
  // For now, the component starts fresh each time
  // TODO: Add proper initialization by fetching location and its parents

  const handleCountryChange = (countryId: string) => {
    const id = parseInt(countryId);
    setSelectedCountry(id);
    setSelectedState(null);
    setSelectedArea(null);
    setSelectedVineyard(null);
    onChange(id);
  };

  const handleStateChange = (stateId: string) => {
    const id = parseInt(stateId);
    setSelectedState(id);
    setSelectedArea(null);
    setSelectedVineyard(null);
    onChange(id);
  };

  const handleAreaChange = (areaId: string) => {
    const id = parseInt(areaId);
    setSelectedArea(id);
    setSelectedVineyard(null);
    onChange(id);
  };

  const handleVineyardChange = (vineyardId: string) => {
    const id = parseInt(vineyardId);
    setSelectedVineyard(id);
    onChange(id);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Country</Label>
        <Select
          value={selectedCountry?.toString() || ""}
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.locationId} value={country.locationId.toString()}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCountry && states.length > 0 && (
        <div className="space-y-2">
          <Label>State/Province</Label>
          <Select
            value={selectedState?.toString() || ""}
            onValueChange={handleStateChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state/province" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.locationId} value={state.locationId.toString()}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedState && filteredAreas.length > 0 && (
        <div className="space-y-2">
          <Label>Area/Region</Label>
          <Select
            value={selectedArea?.toString() || ""}
            onValueChange={handleAreaChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select area/region" />
            </SelectTrigger>
            <SelectContent>
              {filteredAreas.map((area: any) => (
                <SelectItem key={area.locationId} value={area.locationId.toString()}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedArea && vineyards.length > 0 && (
        <div className="space-y-2">
          <Label>Vineyard</Label>
          <Select
            value={selectedVineyard?.toString() || ""}
            onValueChange={handleVineyardChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vineyard" />
            </SelectTrigger>
            <SelectContent>
              {vineyards.map((vineyard) => (
                <SelectItem key={vineyard.locationId} value={vineyard.locationId.toString()}>
                  {vineyard.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
