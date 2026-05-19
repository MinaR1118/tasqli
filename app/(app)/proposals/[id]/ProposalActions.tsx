"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ProposalActionsProps {
  content: string;
  shareUrl: string | null;
}

export function ProposalActions({ content, shareUrl }: ProposalActionsProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShareCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {shareUrl && (
          <Button variant="secondary" size="sm" onClick={handleShareCopy}>
            {linkCopied ? "Link copied!" : "Share proposal"}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy to clipboard"}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      {/* Read-only share link — VA can also manually copy */}
      {shareUrl && (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600 focus:outline-none"
          />
        </div>
      )}

      {linkCopied && (
        <p className="text-xs text-brand-600">
          Link copied! Send this to your client.
        </p>
      )}
    </div>
  );
}
