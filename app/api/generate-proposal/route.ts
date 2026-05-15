import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/claude";

const SYSTEM_PROMPT = `You are a professional proposal writer for virtual assistants. Write polished, confident, client-ready proposals. Use the information provided to write a complete proposal in Markdown. The proposal should include: a brief personalized introduction, a clear scope of work section, the deliverables, timeline, investment (rate), terms (net 14 payment), and a warm closing. Tone: professional but warm. Length: 400–600 words. Do not use placeholder text. Write it as if it's ready to send.`;

export async function POST(request: Request) {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientName, serviceType, scope, rate, timeline, vaName } = body;

  if (!clientName || !serviceType || !scope || !rate || !timeline || !vaName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users_profiles")
    .select("plan, proposal_count")
    .eq("id", user.id)
    .single();

  const plan: string = profile?.plan ?? "free";
  const proposalCount: number = profile?.proposal_count ?? 0;

  if (plan === "free" && proposalCount >= 3) {
    return NextResponse.json({ message: "upgrade" }, { status: 403 });
  }

  const proposalId = crypto.randomUUID();

  const userMessage = [
    `VA Name: ${vaName}`,
    `Client Name: ${clientName}`,
    `Service Type: ${serviceType}`,
    `Scope of Work: ${scope}`,
    `Rate: ${rate}`,
    `Timeline: ${timeline}`,
  ].join("\n");

  const stream = getAnthropicClient().messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const encoder = new TextEncoder();
  let fullContent = "";

  const readable = new ReadableStream({
    async start(controller) {
      // Forward each text delta to the client as it arrives
      stream.on("text", (textDelta: string) => {
        fullContent += textDelta;
        controller.enqueue(encoder.encode(textDelta));
      });

      try {
        await stream.finalMessage();
      } catch (err) {
        controller.error(err instanceof Error ? err : new Error(String(err)));
        return;
      }

      // Stream finished — persist proposal silently (client already received content)
      try {
        await supabase.from("proposals").insert({
          id: proposalId,
          va_id: user.id,
          client_name: clientName,
          service_type: serviceType,
          scope,
          rate,
          timeline,
          content: fullContent,
        });

        await supabase
          .from("users_profiles")
          .update({ proposal_count: proposalCount + 1 })
          .eq("id", user.id);
      } catch {
        // DB write failed — content was sent, log in production
      }

      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Proposal-Id": proposalId,
      "X-Accel-Buffering": "no",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
