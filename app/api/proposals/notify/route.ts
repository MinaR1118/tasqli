import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // Verify this is an internal call — not exposed publicly
  const secret = request.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { vaId, clientName, serviceType, acceptedAt } = body as {
    vaId?: string;
    clientName?: string;
    serviceType?: string;
    acceptedAt?: string;
  };

  if (!vaId || !clientName || !serviceType || !acceptedAt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch VA auth record (email) and profile (display name) in parallel
  const [{ data: authData }, { data: profile }] = await Promise.all([
    supabase.auth.admin.getUserById(vaId),
    supabase.from("users_profiles").select("full_name").eq("id", vaId).single(),
  ]);

  const vaEmail = authData?.user?.email;
  if (!vaEmail) {
    console.warn("[notify] No email found for VA:", vaId);
    return NextResponse.json({ ok: true });
  }

  const vaFullName =
    (profile as { full_name?: string } | null)?.full_name ?? vaEmail.split("@")[0];
  const vaFirstName = vaFullName.split(" ")[0];

  // If SMTP is not configured, log a warning and exit cleanly
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } =
    process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[notify] SMTP_HOST / SMTP_USER / SMTP_PASS not set — skipping email"
    );
    return NextResponse.json({ ok: true });
  }

  // Format acceptance timestamp in UTC (server has no access to recipient's timezone)
  const d = new Date(acceptedAt);
  const dateStr = d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tasqli.com";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:32px 16px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb;">
    <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Great news, ${vaFirstName}!</h2>
    <p style="margin:0 0 12px;color:#374151;line-height:1.6;">
      <strong>${clientName}</strong> accepted your
      <strong>${serviceType}</strong> proposal on ${dateStr} at ${timeStr} UTC.
    </p>
    <p style="margin:0 0 24px;color:#374151;line-height:1.6;">
      Log in to view the details and reach out to get started.
    </p>
    <a
      href="${appUrl}/dashboard"
      style="display:inline-block;background:#14b8a6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;"
    >
      Go to dashboard
    </a>
    <p style="margin:32px 0 0;font-size:12px;color:#9ca3af;">
      You received this because a client accepted one of your Tasqli proposals.
    </p>
  </div>
</body>
</html>`;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: SMTP_FROM ?? SMTP_USER,
      to: vaEmail,
      subject: "🎉 Your proposal was accepted!",
      html,
    });
  } catch (err) {
    console.error("[notify] Failed to send email:", err);
    // Don't return an error — the acceptance already succeeded
  }

  return NextResponse.json({ ok: true });
}
