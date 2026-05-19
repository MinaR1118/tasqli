import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/claude";

const SYSTEM_PROMPT = `You are a professional proposal writer for virtual assistants. Write polished, confident, client-ready proposals. Use the information provided to write a complete proposal in Markdown. The proposal should include: a brief personalized introduction, a clear scope of work section, the deliverables, timeline, investment (rate), terms (net 14 payment), and a warm closing. Tone: professional but warm. Length: 400–600 words. Do not use placeholder text. Write it as if it's ready to send.

FORBIDDEN WORDS — never use these under any circumstances:
delve, tapestry, multifaceted, nuanced, landscape (metaphorical), comprehensive, pivotal, crucial, robust, streamline, utilize, facilitate, endeavor, paramount, seamless, seamlessly, leverage, leveraging, elevate, enhance, harness, empower, resonate, unlock, foster, intricate, groundbreaking, innovative, revolutionary, transformative, dynamic, embark, embarking

FORBIDDEN PHRASES — never use these:
- "it's worth noting that"
- "it's important to note"
- "in today's digital age" or "in today's ever-evolving"
- "in the realm of"
- "it is important to understand"
- "this is particularly true"
- "one might argue"
- "it goes without saying"
- "at the end of the day"
- "in an era where"
- "when it comes to"
- "drive engagement"
- "harness the power of"
- "navigate the complexities"
- "unlock the potential"
- "a testament to"
- "shed light on"
- "furthermore" / "moreover" / "additionally" / "consequently" / "nevertheless"
- "in conclusion" / "to summarize" / "that being said" / "with that in mind"
- "I can't wait to" / "thank you for this opportunity"
- em dashes (—) or en dashes (–): use commas or periods instead

STYLE RULES:
- CRITICAL RULE: Never use contractions under any circumstances. This means never write: I'll, I'd, I've, I'm, you'll, you'd, you've, we'll, we'd, we've, they'll, they'd, don't, doesn't, didn't, won't, wouldn't, can't, couldn't, shouldn't, isn't, aren't, wasn't, weren't, it's, that's, there's, here's, what's, who's. Write every word in full: "I will" not "I'll", "I would" not "I'd", "do not" not "don't", "it is" not "it's", etc. This rule has no exceptions.
- Use simple, direct words: "use" not "utilize", "help" not "facilitate", "important" not "paramount", "try" not "endeavor"
- Write like a confident human professional, not a corporate consultant
- Vary sentence length: mix short punchy sentences with longer ones
- Never start consecutive sentences with "I"
- State facts directly without hedging phrases
- No academic transition words (furthermore, moreover, additionally): use "also" or "and" instead
- Never use en dashes or hyphens in date ranges. Write "June 1 to 30" or "June 1 to June 30" instead of "June 1–30" or "June 1-30".
- Always use 2026 as the current year when referencing dates or timelines.`;

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
    `Write this as a real human professional would. Use plain, direct language. Avoid any word or phrase that sounds like it was written by AI.`,
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
