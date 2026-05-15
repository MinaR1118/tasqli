import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Stripe sends raw bytes; we must NOT use request.json() here.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${msg}` },
      { status: 400 }
    );
  }

  // Use service-role client — webhook has no user session
  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // User completed checkout → activate Pro
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const customerId = session.customer as string | null;

        if (userId && customerId) {
          await supabase
            .from("users_profiles")
            .update({ plan: "pro", stripe_customer_id: customerId })
            .eq("id", userId);
        }
        break;
      }

      // Subscription was cancelled/deleted → downgrade to Free
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await supabase
          .from("users_profiles")
          .update({ plan: "free" })
          .eq("stripe_customer_id", customerId);
        break;
      }

      // Subscription status changed (renewal, payment failure, etc.)
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const proStatuses = ["active", "trialing"];
        const freeStatuses = [
          "canceled",
          "past_due",
          "unpaid",
          "incomplete_expired",
        ];

        if (proStatuses.includes(sub.status)) {
          await supabase
            .from("users_profiles")
            .update({ plan: "pro" })
            .eq("stripe_customer_id", customerId);
        } else if (freeStatuses.includes(sub.status)) {
          await supabase
            .from("users_profiles")
            .update({ plan: "free" })
            .eq("stripe_customer_id", customerId);
        }
        // "incomplete" / "paused" — leave plan unchanged while payment resolves
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    // Return 200 so Stripe does not retry — we logged the failure
  }

  return NextResponse.json({ received: true });
}
