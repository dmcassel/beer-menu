import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelectAll = () => {
    onChange(options.map(option => option.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const displayText = React.useMemo(() => {
    if (selected.length === 0) {
      return placeholder;
    }
    if (selected.length === options.length) {
      return "All selected";
    }
    if (selected.length === 1) {
      return options.find(opt => opt.value === selected[0])?.label || placeholder;
    }
    return `${selected.length} selected`;
  }, [selected, options, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">{displayText}</span>
          <svg
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="p-2 space-y-1">
          <div className="flex items-center justify-between px-2 pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 text-xs"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-8 text-xs"
            >
              Clear All
            </Button>
          </div>
          <Separator />
          <div className="max-h-64 overflow-y-auto touch-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            {options.map(option => (
              <div
                key={option.value}
                className="flex items-center space-x-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                onClick={() => handleToggle(option.value)}
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => handleToggle(option.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <label
                  htmlFor={option.value}
                  className="flex-1 text-sm cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
