"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function Greeting({ name, plan }: { name: string; plan?: string }) {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <div className="flex items-center gap-3">
      <h1
        suppressHydrationWarning
        className="text-2xl font-semibold text-gray-900"
      >
        {greeting}, {name}
      </h1>
      {plan && (
        <Badge variant={plan === "pro" ? "success" : "default"}>
          {plan === "pro" ? "Pro" : "Free"}
        </Badge>
      )}
    </div>
  );
}
