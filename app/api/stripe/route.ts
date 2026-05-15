// Manual Stripe setup:
// 1. In Stripe Dashboard → Products, create "Tasqli Pro" with a recurring price of $14.99/month.
// 2. Copy the price ID (starts with price_...) and add it to .env.local as STRIPE_PRICE_ID.
// 3. In Stripe Dashboard → Webhooks, add an endpoint pointing to /api/webhooks/stripe.
//    Subscribe to: checkout.session.completed, customer.subscription.updated,
//    customer.subscription.deleted. Copy the signing secret into STRIPE_WEBHOOK_SECRET.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST() {
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
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: { supabase_user_id: user.id },
    // Carry user ID in subscription metadata too, for subscription events
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  };

  // Re-use existing Stripe customer to preserve saved payment methods
  const existingCustomerId = profile?.stripe_customer_id as string | null;
  if (existingCustomerId) {
    sessionParams.customer = existingCustomerId;
  } else {
    sessionParams.customer_email = user.email ?? undefined;
  }

  try {
    const session = await getStripeClient().checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
