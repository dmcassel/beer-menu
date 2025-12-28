import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectOption {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
}

// Normalize strings to remove diacritics
const normalizeString = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  emptyText = "No results found.",
  searchPlaceholder = "Search...",
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Pre-compute normalized labels for efficient filtering
  const normalizedOptionsMap = React.useMemo(() => {
    const map = new Map<string, string>();
    options.forEach(option => {
      map.set(option.value, normalizeString(option.label));
    });
    return map;
  }, [options]);

  const selectedOption = options.find(option => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command
          filter={(value, search) => {
            // Custom filter for case-insensitive and diacritic-insensitive substring matching
            const normalizedLabel = normalizedOptionsMap.get(value);
            if (!normalizedLabel) return 0;

            const normalizedSearch = normalizeString(search);

            // Match if search term appears anywhere in the label
            return normalizedLabel.includes(normalizedSearch) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={currentValue => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
