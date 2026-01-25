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
  const { data: areas = [] } = trpc.location.getByParentId.useQuery(
    { parentId: selectedState },
    { enabled: selectedState !== null }
  );
  const { data: vineyards = [] } = trpc.location.getByParentId.useQuery(
    { parentId: selectedArea },
    { enabled: selectedArea !== null }
  );

  // Initialize from value
  useEffect(() => {
    if (value) {
      // Fetch the location and its parents to populate the hierarchy
      trpc.location.getById.useQuery({ id: value }).then((location) => {
        if (location) {
          // This is a simplified version - in production, you'd need to traverse up the tree
          // For now, we'll just set the value
          if (location.type === "country") {
            setSelectedCountry(location.locationId);
          } else if (location.type === "state") {
            setSelectedState(location.locationId);
          } else if (location.type === "area") {
            setSelectedArea(location.locationId);
          } else if (location.type === "vineyard") {
            setSelectedVineyard(location.locationId);
          }
        }
      });
    }
  }, [value]);

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

      {selectedState && areas.length > 0 && (
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
              {areas.map((area) => (
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
