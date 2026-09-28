import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeading, Card } from "../components/Layout";
import { Badge } from "../components/Badge";
import { projects } from "../data/site";

export function Projects() {
  return (
    <Section>
      <SectionHeading
        title="Projects"
        description="Things I've built and maintained, with links to source where available."
      />
      <div className="grid sm:grid-cols-2 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-ink">{project.name}</h3>
              {project.href && (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-ink-faint hover:text-ink transition-colors duration-150 shrink-0"
                  aria-label={`Open ${project.name} repository`}
                >
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
            <p className="text-sm text-ink-dim">{project.description}</p>
            <div className="mt-auto flex gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
