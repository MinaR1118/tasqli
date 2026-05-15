"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface UpgradeButtonProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UpgradeButton({ size = "sm", className }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  async function upgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button
      size={size}
      onClick={upgrade}
      disabled={loading}
      className={className}
    >
      {loading ? "Redirecting…" : "Upgrade to Pro"}
    </Button>
  );
}
