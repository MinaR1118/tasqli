"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? "Authentication failed. Please try again." : null
  );

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  }

  async function handleGoogle() {
    setOauthLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) {
      setError(authError.message);
      setOauthLoading(false);
    }
    // On success the browser is redirected by Supabase — no cleanup needed
  }

  return (
    <div className="w-full max-w-md">
      {/* Wordmark */}
      <div className="mb-8 text-center">
        <span className="text-4xl font-semibold tracking-tight text-brand-500">
          tasqli
        </span>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-gray-900">
          Sign in to Tasqli
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          The workspace where VAs and clients finally understand each other.
        </p>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {sent ? (
          <div className="rounded-lg bg-brand-50 px-4 py-5 text-sm">
            <p className="font-semibold text-brand-700">Check your email — we sent you a link.</p>
            <p className="mt-1 text-brand-600">
              We emailed <strong>{email}</strong>. Click the link to sign in.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleMagicLink} className="space-y-4">
              <Input
                id="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading || oauthLoading}
              >
                {loading ? "Sending…" : "Send magic link"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <hr className="flex-1 border-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <hr className="flex-1 border-gray-200" />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleGoogle}
              disabled={loading || oauthLoading}
            >
              <GoogleIcon className="mr-2 h-4 w-4 shrink-0" />
              {oauthLoading ? "Redirecting…" : "Continue with Google"}
            </Button>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-gray-400">
        Are you a client? Use the link your VA sent you.
      </p>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
