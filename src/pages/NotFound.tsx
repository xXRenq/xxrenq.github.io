import { Link } from "react-router-dom";
import { Section } from "../components/Layout";
import { Button } from "../components/Button";

export function NotFound() {
  return (
    <Section className="text-center">
      <p className="font-mono text-accent text-sm mb-3">404</p>
      <h1 className="text-2xl font-semibold text-ink mb-2">Page not found</h1>
      <p className="text-ink-dim mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/">
        <Button variant="secondary">Back to home</Button>
      </Link>
    </Section>
  );
}
