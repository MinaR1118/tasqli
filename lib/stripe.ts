import Stripe from "stripe";

// Lazy singleton — same reason as lib/claude.ts
let _client: Stripe | undefined;

export function getStripeClient(): Stripe {
  if (!_client) {
    _client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return _client;
}
