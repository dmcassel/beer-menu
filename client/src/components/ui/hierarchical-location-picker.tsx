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
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedVineyard, setSelectedVineyard] = useState<number | null>(null);

  const { data: countries = [] } = trpc.location.getByType.useQuery({ type: "country" });
  
  // Areas can have country OR area parents
  const { data: areas = [] } = trpc.location.getByParentId.useQuery(
    { parentId: selectedCountry || selectedArea },
    { enabled: selectedCountry !== null || selectedArea !== null }
  );
  
  // Vineyards always have area parents
  const { data: vineyards = [] } = trpc.location.getByParentId.useQuery(
    { parentId: selectedArea },
    { enabled: selectedArea !== null }
  );

  // Filter areas to show only those with the correct parent
  const filteredAreas = areas.filter((area: any) => {
    if (selectedCountry && !selectedArea) {
      // First level areas - parent should be country
      return area.parentId === selectedCountry && area.type === "area";
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

      {selectedCountry && filteredAreas.length > 0 && (
        <div className="space-y-2">
          <Label>Region/Area</Label>
          <Select
            value={selectedArea?.toString() || ""}
            onValueChange={handleAreaChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select region or area" />
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
