import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeading, Card } from "../components/Layout";
import { Badge } from "../components/Badge";
import { LinkButton } from "../components/Button";
import { games } from "../data/site";

export function Games() {
  return (
    <Section>
      <SectionHeading
        title="Games"
        description="What I play and mod. Built to grow as more gets added."
      />
      <div className="grid sm:grid-cols-2 gap-4">
        {games.map((game) => (
          <Card key={game.id} className="flex flex-col gap-4">
            <div>
              <h3 className="font-medium text-ink">{game.name}</h3>
              <p className="mt-1 text-sm text-ink-dim">{game.description}</p>
            </div>
            {game.links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {game.links.map((link) => (
                  <LinkButton
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    size="sm"
                    icon={<ArrowUpRight size={14} />}
                  >
                    {link.label}
                  </LinkButton>
                ))}
              </div>
            )}
            <div className="mt-auto flex flex-wrap gap-2">
              {game.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
