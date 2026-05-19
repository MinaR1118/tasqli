import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { marked } from "marked";
import { ProposalActions } from "./ProposalActions";
import { Badge } from "@/components/ui/Badge";
import { LocalDateTime } from "@/components/LocalDateTime";

export const metadata: Metadata = { title: "Proposal" };

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default async function ProposalPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", params.id)
    .eq("va_id", user.id)
    .single();

  if (!proposal) notFound();

  // Fetch analytics — uses admin client so RLS doesn't block the aggregate read
  const adminSupabase = createAdminClient();
  const { data: views } = await adminSupabase
    .from("proposal_views")
    .select("viewed_at, time_spent_seconds")
    .eq("proposal_id", params.id);

  const totalViews = views?.length ?? 0;

  const lastViewed =
    views && views.length > 0
      ? new Date(
          Math.max(
            ...views.map((v) =>
              new Date(v.viewed_at as string).getTime()
            )
          )
        )
      : null;

  const timesWithData = (views ?? []).filter(
    (v) => typeof v.time_spent_seconds === "number"
  );
  const avgSeconds =
    timesWithData.length > 0
      ? timesWithData.reduce(
          (sum, v) => sum + (v.time_spent_seconds as number),
          0
        ) / timesWithData.length
      : null;

  const acceptedAt = (proposal.accepted_at as string | null) ?? null;
  const acceptedByName = (proposal.accepted_by_name as string | null) ?? null;
  const publicId = (proposal.public_id as string | null) ?? null;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const shareUrl = publicId ? `${appUrl}/p/${publicId}` : null;

  const html = marked.parse(proposal.content as string) as string;

  return (
    <div id="proposal-print-content" className="mx-auto max-w-3xl px-6 py-8">
      {/* Top bar */}
      <div
        data-no-print
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to dashboard
        </Link>
        <ProposalActions
          content={proposal.content as string}
          shareUrl={shareUrl}
        />
      </div>

      {/* Metadata card */}
      <div
        data-no-print
        className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm"
      >
        <div>
          <span className="text-gray-500">Client </span>
          <span className="font-medium text-gray-900">
            {proposal.client_name as string}
          </span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <Badge variant="info">{proposal.service_type as string}</Badge>
        <div className="h-4 w-px bg-gray-200" />
        <div>
          <span className="text-gray-500">Created </span>
          <span className="text-gray-700">
            {new Date(proposal.created_at as string).toLocaleDateString(
              undefined,
              { month: "long", day: "numeric", year: "numeric" }
            )}
          </span>
        </div>
      </div>

      {/* Proposal content */}
      <div className="proposal-prose-card rounded-xl border border-gray-200 bg-white px-8 py-10 shadow-sm print:border-none print:shadow-none print:px-0 print:py-0">
        <div
          className="proposal-prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* Analytics section */}
      <div
        data-no-print
        className="mt-6 rounded-xl border border-gray-200 bg-white px-6 py-5"
      >
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Analytics
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
            <p className="mt-0.5 text-xs text-gray-500">Total views</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {lastViewed
                ? lastViewed.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">Last viewed</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {avgSeconds !== null ? formatDuration(Math.round(avgSeconds)) : "—"}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">Avg. time reading</p>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          {acceptedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <svg
                className="h-3.5 w-3.5"
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
              Accepted
              {acceptedByName && ` by ${acceptedByName}`} on{" "}
              <LocalDateTime isoString={acceptedAt} />
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
              Awaiting response
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
