import { Section, SectionHeading } from "../components/Layout";
import { ToolLayout } from "../components/ToolLayout";
import { SteamPointsConverter } from "../components/SteamPointsConverter";

export function Tools() {
  return (
    <Section>
      <SectionHeading
        title="Tools"
        description="Small utilities I use myself. More get added here over time."
      />
      <div className="flex flex-col gap-6">
        <ToolLayout
          name="Steam Points Converter"
          description="Convert between Steam Points and real currency using live exchange rates."
        >
          <SteamPointsConverter />
        </ToolLayout>
      </div>
    </Section>
  );
}
