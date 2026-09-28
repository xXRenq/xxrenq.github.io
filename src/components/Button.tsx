import { forwardRef } from "react";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 rounded disabled:opacity-40 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-base hover:bg-accent-dim active:bg-accent-dim",
  secondary:
    "bg-transparent text-ink border border-border hover:border-border-strong hover:bg-raised",
  ghost: "bg-transparent text-ink-dim hover:text-ink hover:bg-raised",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon, className, children, ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
    </button>
  )
);
Button.displayName = "Button";

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
};

export function LinkButton({
  variant = "secondary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <a className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
    </a>
  );
}
