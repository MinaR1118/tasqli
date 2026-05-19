import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { publicId, clientName } = body as {
    publicId?: string;
    clientName?: string;
  };

  if (!publicId || !clientName?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch the proposal first so we can get va_id for the notification and
  // check idempotency without relying on .single() after a conditional update
  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, va_id, client_name, service_type, accepted_at")
    .eq("public_id", publicId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Already accepted — return success without overwriting
  if (proposal.accepted_at) {
    return NextResponse.json({ ok: true });
  }

  const acceptedAt = new Date().toISOString();

  const { error } = await supabase
    .from("proposals")
    .update({ accepted_at: acceptedAt, accepted_by_name: clientName.trim() })
    .eq("public_id", publicId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire email notification — intentionally not awaited so it never delays the
  // response to the client. Failures are logged inside the notify route.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const internalSecret = process.env.INTERNAL_API_SECRET ?? "";
  fetch(`${appUrl}/api/proposals/notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": internalSecret,
    },
    body: JSON.stringify({
      vaId: proposal.va_id,
      clientName: clientName.trim(),
      serviceType: proposal.service_type,
      proposalId: proposal.id,
      acceptedAt,
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
