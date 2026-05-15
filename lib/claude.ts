import Anthropic from "@anthropic-ai/sdk";

// Lazy singleton — defer instantiation to first request so build-time env vars
// don't need to be set (Next.js evaluates module-level code during bundling).
let _client: Anthropic | undefined;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}
