import { createClient } from "@/lib/supabase/server";
import { ProposalForm } from "./ProposalForm";

export default async function NewProposalPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let vaName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("users_profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    vaName = (profile?.full_name as string | null) ?? user.email ?? "";
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">New proposal</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details and let AI draft a polished, client-ready proposal
          in seconds.
        </p>
      </div>
      <ProposalForm vaName={vaName} />
    </div>
  );
}
