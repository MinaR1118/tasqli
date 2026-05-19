import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { publicId, viewId, timeSpentSeconds } = body as {
    publicId?: string;
    viewId?: string;
    timeSpentSeconds?: number;
  };

  // Update an existing view row with time spent (called on beforeunload via sendBeacon)
  if (viewId && timeSpentSeconds !== undefined) {
    await supabase
      .from("proposal_views")
      .update({ time_spent_seconds: timeSpentSeconds })
      .eq("id", viewId);
    return NextResponse.json({ ok: true });
  }

  // Insert a new view row (called on page load)
  if (publicId) {
    const { data: proposal } = await supabase
      .from("proposals")
      .select("id")
      .eq("public_id", publicId)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const userAgent =
      request.headers.get("user-agent")?.slice(0, 200) ?? null;

    const { data: view } = await supabase
      .from("proposal_views")
      .insert({ proposal_id: proposal.id as string, user_agent: userAgent })
      .select("id")
      .single();

    return NextResponse.json({ viewId: (view as { id: string } | null)?.id ?? null });
  }

  return NextResponse.json(
    { error: "Provide publicId (insert) or viewId + timeSpentSeconds (update)" },
    { status: 400 }
  );
}
