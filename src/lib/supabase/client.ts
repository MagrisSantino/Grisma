import { createBrowserClient } from "@supabase/ssr";

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Missing env NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local (see Supabase project settings → API)."
    );
  }
  return url;
}

/** Clave pública: anon (legacy) o publishable (nueva). */
function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      "Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
  return key;
}

/**
 * Cliente Supabase para Client Components y código en el navegador.
 * Usa cookies vía @supabase/ssr (singleton en el cliente).
 */
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
