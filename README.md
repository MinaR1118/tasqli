# Tasqli

Tasqli is the workspace built for virtual assistants and their clients. VAs generate polished, AI-written proposals in seconds, manage client projects, and share a live portal — clients never need to sign up themselves.

---

## Local setup

```bash
git clone https://github.com/MinaR1118/tasqli.git
cd tasqli
npm install
cp .env.local.example .env.local   # then fill in the keys below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in every value:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (keep secret, server-only) |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_PRICE_ID` | See Stripe setup below |
| `STRIPE_WEBHOOK_SECRET` | See Stripe setup below |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally; your production URL on Vercel |

---

## Supabase setup

1. Create a new Supabase project.
2. In the SQL editor, run the entire contents of `supabase/schema.sql`. This creates all tables, RLS policies, and the auto-profile trigger.
3. Go to **Storage** and create a public bucket named `files`.
4. Go to **Database → Replication** and enable Realtime on the `messages` table.
5. In **Authentication → Providers**, enable **Google** OAuth and add your client ID/secret. Set the redirect URL to `https://<your-domain>/auth/callback`.

---

## Stripe setup

1. In the Stripe Dashboard → **Products**, create a product called **Tasqli Pro** with a recurring price of **$14.99 / month**.
2. Copy the price ID (starts with `price_`) into `STRIPE_PRICE_ID` in your env file.
3. In **Developers → Webhooks**, add an endpoint:
   - URL: `https://<your-domain>/api/webhooks/stripe`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
5. For local testing, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

---

## Deploy to Vercel

1. Push this repo to GitHub at `github.com/MinaR1118/tasqli`.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Add all environment variables from `.env.local.example` in the **Environment Variables** section. Set `NEXT_PUBLIC_APP_URL` to your Vercel production URL.
4. Click **Deploy**. Vercel will detect Next.js automatically.
5. After deploy, update your Stripe webhook endpoint URL and Supabase OAuth redirect URL to the production domain.

---

## Tech stack

- **Next.js 14** App Router + TypeScript
- **Supabase** — auth (magic link + Google OAuth), Postgres, Storage, Realtime
- **Anthropic Claude** (`claude-sonnet-4-5`) — streaming proposal generation
- **Stripe** — subscription billing
- **Tailwind CSS** + Geist font
