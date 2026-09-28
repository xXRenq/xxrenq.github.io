import type { ReactNode } from "react";

export function ToolLayout({
  name,
  description,
  children,
}: {
  name: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded border border-border bg-surface">
      <div className="border-b border-border p-5">
        <h3 className="text-lg font-semibold text-ink">{name}</h3>
        <p className="mt-1 text-sm text-ink-dim">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
