"use client";
import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser-only Supabase client.
 * We intentionally do NOT pass a custom cookies shim (which touches document.cookie),
 * so that prerender/SSG never trips over "document is not defined".
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // Return a typed "null" so callers can feature-detect misconfig.
    return null as any;
  }

  if (client) return client;
  client = createBrowserClient(url, anon);
  return client;
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
