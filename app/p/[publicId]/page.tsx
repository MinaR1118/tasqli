import { createAdminClient } from "@/lib/supabase/admin";
import { marked } from "marked";
import type { Metadata } from "next";
import { ProposalViewer } from "./ProposalViewer";

export async function generateMetadata({
  params,
}: {
  params: { publicId: string };
}): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("proposals")
    .select("client_name")
    .eq("public_id", params.publicId)
    .single();

  const clientName = (data as { client_name?: string } | null)?.client_name;
  return { title: clientName ? `Proposal for ${clientName}` : "Proposal" };
}

export default async function PublicProposalPage({
  params,
}: {
  params: { publicId: string };
}) {
  const supabase = createAdminClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select(
      "id, public_id, client_name, service_type, content, created_at, is_published, accepted_at, accepted_by_name, va_id"
    )
    .eq("public_id", params.publicId)
    .single();

  // Not found, or VA explicitly unpublished the proposal
  if (!proposal || (proposal as { is_published?: boolean }).is_published === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            This proposal is no longer available
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            The link may have expired or the proposal has been removed by its
            author.
          </p>
        </div>
      </div>
    );
  }

  // Fetch the VA's display name
  const { data: vaProfile } = await supabase
    .from("users_profiles")
    .select("full_name")
    .eq("id", proposal.va_id as string)
    .single();

  const vaName =
    (vaProfile as { full_name?: string } | null)?.full_name ??
    "Your virtual assistant";

  const html = marked.parse(proposal.content as string) as string;

  return (
    <ProposalViewer
      proposal={{
        id: proposal.id as string,
        publicId: proposal.public_id as string,
        clientName: proposal.client_name as string,
        serviceType: proposal.service_type as string,
        createdAt: proposal.created_at as string,
        acceptedAt: (proposal.accepted_at as string | null) ?? null,
        acceptedByName: (proposal.accepted_by_name as string | null) ?? null,
        vaName,
      }}
      html={html}
    />
  );
}
