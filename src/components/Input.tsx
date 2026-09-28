import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  suffix?: string;
};

export function Input({ label, error, suffix, className, id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm text-ink-dim">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            "w-full h-11 rounded bg-surface border text-ink placeholder:text-ink-faint px-3 text-base outline-none transition-colors duration-150",
            "border-border focus:border-accent",
            error && "border-red-500/70 focus:border-red-500",
            suffix && "pr-14",
            className
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint font-mono">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
