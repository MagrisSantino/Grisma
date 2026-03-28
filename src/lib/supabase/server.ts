import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing env NEXT_PUBLIC_SUPABASE_URL.");
  }
  return url;
}

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
 * Cliente Supabase para Server Components, Server Actions y Route Handlers.
 * Lee/escribe la sesión en cookies de la petición (patrón App Router).
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Llamada desde un Server Component donde set() no está permitido;
          // el middleware / route handler puede refrescar la sesión.
        }
      },
    },
  });
}
