/**
 * Next.js inlines NEXT_PUBLIC_* only when accessed as literal
 * `process.env.NEXT_PUBLIC_*` expressions. Dynamic access like
 * `process.env[key]` is NOT replaced on the client bundle.
 */
function assertDefined(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Validated at startup — crashes immediately if missing */
export const SUPABASE_URL = assertDefined(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "NEXT_PUBLIC_SUPABASE_URL",
);
export const SUPABASE_ANON_KEY = assertDefined(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
);
