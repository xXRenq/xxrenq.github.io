import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./Button";

export function CopyButton({ value, disabled }: { value: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      return;
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleCopy}
      disabled={disabled}
      icon={copied ? <Check size={14} /> : <Copy size={14} />}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
