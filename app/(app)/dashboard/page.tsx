import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { UpgradeButton } from "@/components/UpgradeButton";
import { LocalDateTime } from "@/components/LocalDateTime";
import { Greeting } from "./Greeting";
import { UpgradeToast } from "./UpgradeToast";

export const metadata: Metadata = { title: "Dashboard" };

const EyeIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

type ProposalRow = {
  id: string;
  client_name: string;
  service_type: string;
  created_at: string;
  accepted_at: string | null;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgraded?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users_profiles")
    .select("full_name, plan, proposal_count")
    .eq("id", user.id)
    .single();

  // Fetch 10 so we have enough to surface accepted ones even if they're older
  const { data: rawProposals } = await supabase
    .from("proposals")
    .select("id, client_name, service_type, created_at, accepted_at")
    .eq("va_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Sort: accepted (by accepted_at desc) first, then pending (by created_at desc)
  const sorted = [...(rawProposals ?? [])].sort((a, b) => {
    const aAcc = a.accepted_at as string | null;
    const bAcc = b.accepted_at as string | null;
    if (aAcc && !bAcc) return -1;
    if (!aAcc && bAcc) return 1;
    if (aAcc && bAcc)
      return new Date(bAcc).getTime() - new Date(aAcc).getTime();
    return (
      new Date(b.created_at as string).getTime() -
      new Date(a.created_at as string).getTime()
    );
  });

  const recentProposals = sorted.slice(0, 5) as ProposalRow[];
  const acceptedProposals = recentProposals.filter((p) => p.accepted_at);
  const pendingProposals = recentProposals.filter((p) => !p.accepted_at);

  // View counts — admin client bypasses RLS
  const proposalIds = recentProposals.map((p) => p.id);
  const viewCountMap: Record<string, number> = {};

  if (proposalIds.length > 0) {
    const adminSupabase = createAdminClient();
    const { data: viewRows } = await adminSupabase
      .from("proposal_views")
      .select("proposal_id")
      .in("proposal_id", proposalIds);

    for (const v of viewRows ?? []) {
      const pid = v.proposal_id as string;
      viewCountMap[pid] = (viewCountMap[pid] ?? 0) + 1;
    }
  }

  const plan: string = profile?.plan ?? "free";
  const proposalCount: number = profile?.proposal_count ?? 0;
  const displayName: string =
    profile?.full_name ?? user.email?.split("@")[0] ?? "there";
  const atLimit = plan === "free" && proposalCount >= 3;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <UpgradeToast show={searchParams.upgraded === "true"} />

      {/* Header row */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Greeting name={displayName} plan={plan} />
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s what&apos;s happening in your workspace.
          </p>
        </div>
        <Link href="/proposals/new">
          <Button disabled={atLimit}>New proposal</Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-3xl font-bold text-gray-900">{proposalCount}</p>
          <p className="mt-1 text-sm text-gray-500">Proposals created</p>
        </Card>
        <Card>
          <Badge variant={plan === "pro" ? "success" : "default"}>
            {plan === "pro" ? "Pro" : "Free"}
          </Badge>
          <p className="mt-2 text-sm text-gray-500">Current plan</p>
        </Card>
        {plan === "free" && (
          <Card>
            <p className="text-3xl font-bold text-gray-900">
              {Math.max(0, 3 - proposalCount)}
            </p>
            <p className="mt-1 text-sm text-gray-500">Proposals remaining</p>
          </Card>
        )}
      </div>

      {/* Upgrade CTA */}
      {atLimit && (
        <div className="mb-8 rounded-xl border border-brand-200 bg-brand-50 px-6 py-5">
          <h3 className="font-semibold text-brand-900">
            You&apos;ve used all 3 free proposals
          </h3>
          <p className="mt-1 text-sm text-brand-700">
            Upgrade to Pro for unlimited proposals and priority support.
          </p>
          <div className="mt-4">
            <UpgradeButton />
          </div>
        </div>
      )}

      {/* Free plan progress */}
      {plan === "free" && !atLimit && proposalCount > 0 && (
        <div className="mb-8 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{proposalCount} of 3</span> free
            proposals used
          </p>
          <UpgradeButton />
        </div>
      )}

      {/* Empty state — no proposals at all */}
      {recentProposals.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-medium text-gray-700">No proposals yet.</p>
          <p className="mt-1 text-sm text-gray-500">
            Create your first one to see how easy it is.
          </p>
          <Link href="/proposals/new">
            <Button variant="secondary" size="sm" className="mt-4">
              New proposal
            </Button>
          </Link>
        </div>
      )}

      {/* Accepted proposals */}
      {acceptedProposals.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-700">
            Accepted
          </h2>
          <Card className="divide-y divide-gray-100 overflow-hidden p-0">
            {acceptedProposals.map((p) => {
              const viewCount = viewCountMap[p.id] ?? 0;
              return (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {p.client_name}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        <svg
                          className="h-3 w-3"
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
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {p.service_type}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    {viewCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <EyeIcon />
                        {viewCount}
                      </span>
                    )}
                    <span className="text-xs text-green-600">
                      <LocalDateTime isoString={p.accepted_at!} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </Card>
        </div>
      )}

      {/* Pending proposals */}
      {pendingProposals.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Recent proposals
          </h2>
          <Card className="divide-y divide-gray-100 overflow-hidden p-0">
            {pendingProposals.map((p) => {
              const viewCount = viewCountMap[p.id] ?? 0;
              return (
                <Link
                  key={p.id}
                  href={`/proposals/${p.id}`}
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {p.client_name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="text-xs text-gray-500">{p.service_type}</p>
                      {viewCount > 0 && (
                        <span className="text-xs text-gray-400">
                          · Awaiting response
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    {viewCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <EyeIcon />
                        {viewCount}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
