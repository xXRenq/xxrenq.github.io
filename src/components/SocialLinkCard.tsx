import { ArrowUpRight } from "lucide-react";
import { SocialIcon } from "./SocialIcon";
import type { SocialLink } from "../data/site";

export function SocialLinkCard({ link }: { link: SocialLink }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex items-center gap-3 rounded border border-border bg-surface p-3 hover:border-border-strong hover:bg-raised transition-colors duration-150"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded border border-border bg-raised text-ink-dim group-hover:text-accent group-hover:border-border-strong transition-colors duration-150">
        <SocialIcon icon={link.icon} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-ink">{link.label}</span>
        <span className="block text-sm text-ink-faint truncate">{link.handle}</span>
      </span>
      <ArrowUpRight
        size={16}
        className="text-ink-faint group-hover:text-ink transition-colors duration-150 shrink-0"
      />
    </a>
  );
}
