import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import { ProposalActions } from "./ProposalActions";
import { Badge } from "@/components/ui/Badge";

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

  const html = marked.parse(proposal.content as string) as string;

  return (
    <div id="proposal-print-content" className="mx-auto max-w-3xl px-6 py-8">
      {/* Top bar — hidden when printing */}
      <div
        data-no-print
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to dashboard
        </Link>
        <ProposalActions content={proposal.content as string} />
      </div>

      {/* Metadata card — hidden when printing */}
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
    </div>
  );
}
