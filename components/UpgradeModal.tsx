"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        {/* Brand accent bar */}
        <div className="mb-6 h-1 w-10 rounded-full bg-brand-500" />

        <h2
          id="upgrade-modal-title"
          className="text-xl font-semibold text-gray-900"
        >
          You&apos;ve used all 3 free proposals
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Upgrade to <strong>Tasqli Pro</strong> to generate unlimited proposals
          and unlock the client portal.
        </p>

        {/* Price callout */}
        <div className="mt-5 flex items-baseline gap-1 rounded-xl bg-brand-50 px-4 py-3">
          <span className="text-3xl font-bold text-brand-700">$14.99</span>
          <span className="text-sm font-medium text-brand-500">/ month</span>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? "Redirecting to checkout…" : "Upgrade to Pro"}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={onClose}
            disabled={loading}
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}
