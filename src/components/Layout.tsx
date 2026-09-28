import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-content px-5 sm:px-8", className)}>{children}</div>;
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("py-14 sm:py-20", className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-2 border-b border-border pb-6">
      <h2 className="text-2xl font-semibold text-ink tracking-tight">{title}</h2>
      {description && <p className="text-ink-dim max-w-[60ch]">{description}</p>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded border border-border bg-surface p-5", className)}>{children}</div>
  );
}
