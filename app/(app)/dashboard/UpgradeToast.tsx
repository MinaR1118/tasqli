"use client";

import { useState, useEffect } from "react";

export function UpgradeToast({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-xl border border-brand-200 bg-white px-4 py-3 shadow-lg">
      <div className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
      <span className="text-sm font-medium text-gray-900">
        You&apos;re now on Pro. Unlimited proposals unlocked. 🎉
      </span>
      <button
        onClick={() => setVisible(false)}
        className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
