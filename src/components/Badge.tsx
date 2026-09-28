export function Badge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center h-6 px-2 rounded-sm border border-border text-xs text-ink-dim">
      {children}
    </span>
  );
}
