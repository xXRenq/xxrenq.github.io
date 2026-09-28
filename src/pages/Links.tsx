import { Section, SectionHeading, Card } from "../components/Layout";
import { SocialLinkCard } from "../components/SocialLinkCard";
import { CopyButton } from "../components/CopyButton";
import { BrandIcon } from "../components/BrandIcon";
import { socialLinks, contact } from "../data/site";

export function Links() {
  return (
    <Section>
      <SectionHeading title="Links" description="Every place I'm active, in one list." />

      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {socialLinks.map((link) => (
          <SocialLinkCard key={link.id} link={link} />
        ))}
      </div>

      <Card className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded border border-border bg-raised text-ink-dim">
            <BrandIcon name="discord" />
          </span>
          <div>
            <h3 className="text-sm font-medium text-ink">Discord</h3>
            <p className="text-sm text-ink-dim">{contact.discordHandle}</p>
          </div>
        </div>
        <CopyButton value={contact.discordHandle} />
      </Card>
    </Section>
  );
}
