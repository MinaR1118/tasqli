"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

interface ProposalData {
  id: string;
  publicId: string;
  clientName: string;
  serviceType: string;
  createdAt: string;
  acceptedAt: string | null;
  acceptedByName: string | null;
  vaName: string;
}

export function ProposalViewer({
  proposal,
  html,
}: {
  proposal: ProposalData;
  html: string;
}) {
  const startTimeRef = useRef(Date.now());
  const viewIdRef = useRef<string | null>(null);

  const [accepted, setAccepted] = useState(!!proposal.acceptedAt);
  const [acceptedByName, setAcceptedByName] = useState(proposal.acceptedByName);
  const [acceptedAtTime, setAcceptedAtTime] = useState<string | null>(
    proposal.acceptedAt
  );
  const [showModal, setShowModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function formatDateTime(isoString: string): string {
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

  useEffect(() => {
    // Record page view and capture the generated view ID
    fetch("/api/proposals/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: proposal.publicId }),
    })
      .then((res) => res.json())
      .then((data: { viewId?: string }) => {
        if (data.viewId) viewIdRef.current = data.viewId;
      })
      .catch(() => {});

    // On tab/window close, send time spent back using sendBeacon (reliable on unload)
    const handleUnload = () => {
      const seconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (!viewIdRef.current || seconds < 3) return;
      const blob = new Blob(
        [
          JSON.stringify({
            viewId: viewIdRef.current,
            timeSpentSeconds: seconds,
          }),
        ],
        { type: "application/json" }
      );
      navigator.sendBeacon("/api/proposals/track", blob);
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [proposal.publicId]);

  async function handleAccept() {
    if (!clientName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/proposals/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: proposal.publicId,
          clientName: clientName.trim(),
        }),
      });
      if (res.ok) {
        setAccepted(true);
        setAcceptedByName(clientName.trim());
        setAcceptedAtTime(new Date().toISOString());
        setShowModal(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Document header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            Proposal
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">
            For {proposal.clientName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <span>Prepared by {proposal.vaName}</span>
            <span>·</span>
            <span>
              {new Date(proposal.createdAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Proposal content */}
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          <div
            className="proposal-prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        {/* Accept / accepted section */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white px-6 py-6">
          {accepted ? (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-4 w-4 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  You&apos;ve accepted this proposal
                  {acceptedAtTime
                    ? ` on ${formatDateTime(acceptedAtTime)}`
                    : ""}
                  .
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {proposal.vaName} will be in touch shortly.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Ready to move forward?
                </p>
                <p className="mt-0.5 text-sm text-gray-500">
                  Click below to accept and let {proposal.vaName} know.
                </p>
              </div>
              <Button onClick={() => setShowModal(true)}>
                Accept this proposal
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Accept modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Accept this proposal
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter your name so {proposal.vaName} knows who accepted.
            </p>
            <input
              autoFocus
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAccept()}
              placeholder="Your full name"
              className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleAccept}
                disabled={!clientName.trim() || submitting}
                className="flex-1"
              >
                {submitting ? "Confirming…" : "Confirm"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
