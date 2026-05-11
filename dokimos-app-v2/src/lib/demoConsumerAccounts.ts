/**
 * Seeded in Fastify `src/index.ts` — password for all: `demo1234`.
 * Used by demo login quick-pick and verifier dashboard "Send request" dropdown.
 */
export const DEMO_CONSUMER_ACCOUNTS = [
  { email: "janice.sample@example.com", name: "Janice Sample", note: "Primary storyline" },
  { email: "marcus.chen@example.com", name: "Marcus Chen", note: "Host verification" },
  { email: "sara.kim@example.com", name: "Sara Kim", note: "Host verification" },
  { email: "alex.rivera@example.com", name: "Alex Rivera", note: "Guest identity check" },
] as const;

export const DEMO_DEFAULT_PASSWORD = "demo1234";
