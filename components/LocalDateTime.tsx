"use client";

import { useEffect, useState } from "react";

function formatLocal(isoString: string): string {
  const d = new Date(isoString);
  const date = d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} at ${time}`;
}

// Renders a date+time string in the viewer's local timezone.
// Server renders date-only as a stable fallback; useEffect hydrates to local time.
export function LocalDateTime({ isoString }: { isoString: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(formatLocal(isoString));
  }, [isoString]);

  return (
    <time dateTime={isoString} suppressHydrationWarning>
      {text ??
        new Date(isoString).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
    </time>
  );
}
