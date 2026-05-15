"use client";

import { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UpgradeModal } from "@/components/UpgradeModal";

const SERVICE_TYPES = [
  "Executive Assistance",
  "Social Media Management",
  "Email Management",
  "Research & Admin",
  "Content Creation",
  "Bookkeeping Support",
  "Custom",
] as const;

interface FormState {
  vaName: string;
  clientName: string;
  serviceType: string;
  customService: string;
  scope: string;
  rate: string;
  timeline: string;
}

export function ProposalForm({ vaName: initialVaName }: { vaName: string }) {
  const [form, setForm] = useState<FormState>({
    vaName: initialVaName,
    clientName: "",
    serviceType: "Executive Assistance",
    customService: "",
    scope: "",
    rate: "",
    timeline: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [proposalId, setProposalId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming) {
      previewEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [previewContent, isStreaming]);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const effectiveServiceType =
    form.serviceType === "Custom" ? form.customService : form.serviceType;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveServiceType.trim()) {
      setError("Please enter a custom service type.");
      return;
    }

    setIsGenerating(true);
    setIsComplete(false);
    setPreviewContent("");
    setProposalId("");
    setError(null);

    try {
      const response = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaName: form.vaName,
          clientName: form.clientName,
          serviceType: effectiveServiceType,
          scope: form.scope,
          rate: form.rate,
          timeline: form.timeline,
        }),
      });

      if (response.status === 403) {
        const data = await response.json();
        if (data.message === "upgrade") {
          setShowUpgradeModal(true);
          return;
        }
      }

      if (!response.ok || !response.body) {
        setError("Generation failed. Please try again.");
        return;
      }

      const pid = response.headers.get("X-Proposal-Id") ?? "";
      setProposalId(pid);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setIsStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setPreviewContent((prev) => prev + decoder.decode(value, { stream: true }));
      }

      setIsStreaming(false);
      setIsComplete(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const renderedPreview = previewContent
    ? (marked.parse(previewContent) as string)
    : "";

  const showPreview = isGenerating && previewContent.length > 0;
  const showPanel = showPreview || isComplete;

  return (
    <>
      <div className={`grid gap-8 ${showPanel ? "lg:grid-cols-2 lg:items-start" : ""}`}>
        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="vaName"
            label="Your name"
            value={form.vaName}
            onChange={(e) => set("vaName", e.target.value)}
            placeholder="Your full name"
            required
          />

          <Input
            id="clientName"
            label="Client name"
            value={form.clientName}
            onChange={(e) => set("clientName", e.target.value)}
            placeholder="e.g. Acme Corp or Sarah Johnson"
            required
          />

          {/* Service type */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="serviceType"
              className="text-sm font-medium text-gray-700"
            >
              Service type
            </label>
            <select
              id="serviceType"
              value={form.serviceType}
              onChange={(e) => set("serviceType", e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {form.serviceType === "Custom" && (
            <Input
              id="customService"
              label="Custom service name"
              value={form.customService}
              onChange={(e) => set("customService", e.target.value)}
              placeholder="e.g. Podcast Production Support"
              required
            />
          )}

          {/* Scope textarea */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="scope"
              className="text-sm font-medium text-gray-700"
            >
              Scope of work
            </label>
            <textarea
              id="scope"
              value={form.scope}
              onChange={(e) => set("scope", e.target.value)}
              placeholder="Describe what you'll do for this client — tasks, responsibilities, output..."
              required
              rows={4}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-y"
            />
          </div>

          <Input
            id="rate"
            label="Rate"
            value={form.rate}
            onChange={(e) => set("rate", e.target.value)}
            placeholder="e.g. $35/hr or $800/month flat"
            required
          />

          <Input
            id="timeline"
            label="Timeline"
            value={form.timeline}
            onChange={(e) => set("timeline", e.target.value)}
            placeholder="e.g. Starting immediately, 3-month engagement"
            required
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating ? "Generating…" : "Generate proposal"}
          </Button>
        </form>

        {/* ── Streaming preview panel ── */}
        {showPanel && (
          <div className="flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                {isStreaming ? "Generating proposal…" : "Proposal ready"}
              </h2>
              {isComplete && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCopy}>
                    {copied ? "Copied!" : "Copy to clipboard"}
                  </Button>
                  {proposalId && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        (window.location.href = `/proposals/${proposalId}`)
                      }
                    >
                      View full proposal →
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white px-7 py-6 shadow-sm">
              <div
                className="proposal-prose"
                dangerouslySetInnerHTML={{ __html: renderedPreview }}
              />
              {isStreaming && <span className="cursor-blink text-brand-500" />}
              <div ref={previewEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* ── Upgrade modal ── */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
