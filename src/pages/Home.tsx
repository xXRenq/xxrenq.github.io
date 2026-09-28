import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Section, Container, SectionHeading, Card } from "../components/Layout";
import { Button, LinkButton } from "../components/Button";
import { SocialLinkCard } from "../components/SocialLinkCard";
import { Badge } from "../components/Badge";
import { profile, socialLinks, projects } from "../data/site";

export function Home() {
  return (
    <>
      <section className="border-b border-border">
        <Container className="py-16 sm:py-24">
          <p className="font-mono text-sm text-accent mb-4">{profile.handle}</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight max-w-[20ch]">
            {profile.tagline}
          </h1>
          <p className="mt-4 text-ink-dim max-w-[60ch]">{profile.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/tools">
              <Button icon={<ArrowRight size={16} />}>Open the tools</Button>
            </Link>
            <Link to="/projects">
              <Button variant="secondary">View projects</Button>
            </Link>
          </div>
        </Container>
      </section>

      <Section>
        <SectionHeading
          title="Featured tool"
          description="The Steam Points converter, rebuilt with live exchange rates."
        />
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ink">Steam Points Converter</h3>
            <p className="mt-1 text-sm text-ink-dim max-w-[50ch]">
              Convert Steam Points to real currency and back, using the official 100 points per
              dollar rate plus live exchange data.
            </p>
          </div>
          <Link to="/tools" className="shrink-0">
            <Button variant="secondary" icon={<ArrowRight size={16} />}>
              Open tool
            </Button>
          </Link>
        </Card>
      </Section>

      <Section className="border-t border-border">
        <SectionHeading title="Projects" description="A short list of what I've built." />
        <div className="grid sm:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col gap-3">
              <div>
                <h3 className="font-medium text-ink">{project.name}</h3>
                <p className="mt-1 text-sm text-ink-dim">{project.description}</p>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
                {project.href && (
                  <LinkButton
                    href={project.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    variant="ghost"
                    size="sm"
                  >
                    View
                  </LinkButton>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section className="border-t border-border">
        <SectionHeading title="Elsewhere" description="Where to find me outside this site." />
        <div className="grid sm:grid-cols-2 gap-3">
          {socialLinks.map((link) => (
            <SocialLinkCard key={link.id} link={link} />
          ))}
        </div>
      </Section>
    </>
  );
}
