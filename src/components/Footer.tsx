import { Container } from "./Layout";
import { profile } from "../data/site";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-ink-faint">
          {profile.handle} · Built and maintained personally.
        </p>
        <p className="text-sm text-ink-faint">{new Date().getFullYear()}</p>
      </Container>
    </footer>
  );
}
