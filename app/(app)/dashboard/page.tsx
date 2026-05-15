import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { UpgradeButton } from "@/components/UpgradeButton";
import { Greeting } from "./Greeting";
import { UpgradeToast } from "./UpgradeToast";

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

  const { data: recentProposals } = await supabase
    .from("proposals")
    .select("id, client_name, service_type, created_at")
    .eq("va_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const plan: string = profile?.plan ?? "free";
  const proposalCount: number = profile?.proposal_count ?? 0;
  const displayName: string =
    profile?.full_name ?? user.email?.split("@")[0] ?? "there";
  const atLimit = plan === "free" && proposalCount >= 3;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Success toast — shown once after Stripe redirect */}
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

      {/* Upgrade CTA — shown when free plan limit is reached */}
      {atLimit && (
        <div className="mb-8 rounded-xl border border-brand-200 bg-brand-50 px-6 py-5">
          <h3 className="font-semibold text-brand-900">
            You&apos;ve used all 3 free proposals
          </h3>
          <p className="mt-1 text-sm text-brand-700">
            Upgrade to Pro for unlimited proposals, the client portal, and
            priority support.
          </p>
          <div className="mt-4">
            <UpgradeButton />
          </div>
        </div>
      )}

      {/* Free plan progress — shown before limit */}
      {plan === "free" && !atLimit && proposalCount > 0 && (
        <div className="mb-8 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-5 py-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{proposalCount} of 3</span> free
            proposals used
          </p>
          <UpgradeButton />
        </div>
      )}

      {/* Recent proposals */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Recent proposals
        </h2>

        {recentProposals && recentProposals.length > 0 ? (
          <Card className="divide-y divide-gray-100 overflow-hidden p-0">
            {recentProposals.map((p) => (
              <Link
                key={p.id as string}
                href={`/proposals/${p.id as string}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {p.client_name as string}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p.service_type as string}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(p.created_at as string).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                </span>
              </Link>
            ))}
          </Card>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-700">
              No proposals yet.
            </p>
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
      </div>
    </div>
  );
}
