import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

type Option = { value: string; label: string };

type SelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
};

export function Select({ label, value, onChange, options, className }: SelectProps) {
  const id = useId();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm text-ink-dim">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full h-11 appearance-none rounded bg-surface border border-border text-ink px-3 pr-9 text-base outline-none transition-colors duration-150 focus:border-accent cursor-pointer"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
      </div>
    </div>
  );
}
