"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ProposalActions({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy to clipboard"}
      </Button>
      <Button variant="secondary" size="sm" onClick={() => window.print()}>
        Print / Save as PDF
      </Button>
    </div>
  );
}
