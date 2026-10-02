import { Download, PackageOpen } from "lucide-react";
import { Section, SectionHeading, Card } from "../components/Layout";
import { LinkButton } from "../components/Button";
import { Badge } from "../components/Badge";
import { DownloadKeyAccess } from "../components/DownloadKeyAccess";
import { downloads } from "../data/site";

export function Downloads() {
  return (
    <Section>
      <SectionHeading
        title="Tool Download"
        description="Standalone tools and files I've built, ready to download directly."
      />
      {downloads.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {downloads.map((tool) => (
            <Card key={tool.id} className="flex flex-col gap-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-ink">{tool.name}</h3>
                  {tool.version && (
                    <span className="font-mono text-xs text-ink-faint shrink-0">{tool.version}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-dim">{tool.description}</p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {tool.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
                <LinkButton
                  href={tool.fileHref}
                  download
                  variant="secondary"
                  size="sm"
                  icon={<Download size={14} />}
                >
                  {tool.fileSize ?? "Download"}
                </LinkButton>
              </div>
            </Card>
          ))}
        </div>
      )}
      {downloads.find((tool) => tool.id === "python-gartic-tool") && (
        <div className="mt-8">
          <DownloadKeyAccess
            toolId="python-gartic-tool"
            toolName={downloads.find((tool) => tool.id === "python-gartic-tool")!.name}
          />
        </div>
      )}
    </Section>
  );
}

function EmptyState() {
  return (
    <div className="rounded border border-border bg-surface p-8 flex flex-col items-center text-center gap-2">
      <PackageOpen size={24} className="text-ink-faint" />
      <p className="text-ink-dim">No downloads yet.</p>
      <p className="text-sm text-ink-faint max-w-[48ch]">
        Add entries to the downloads list in src/data/site.ts and they'll show up here.
      </p>
    </div>
  );
}
