"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signError) {
        setError(signError.message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 antialiased selection:bg-white selection:text-neutral-950">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-neutral-950 shadow-lg shadow-black/30">
                <span className="text-2xl font-semibold tracking-tighter">
                  G
                </span>
              </div>
              <span className="text-3xl font-semibold tracking-tighter sm:text-4xl">
                GRISMA
              </span>
            </div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
              Acceso a portal mayorista
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-xs font-medium uppercase tracking-wider text-neutral-500"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 px-4 py-3 text-sm text-neutral-100 outline-none ring-neutral-600 transition placeholder:text-neutral-600 focus:border-neutral-500 focus:ring-2"
                  placeholder="tu@email.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-xs font-medium uppercase tracking-wider text-neutral-500"
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 px-4 py-3 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-600"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-neutral-950 shadow-lg transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Iniciando sesión…" : "Iniciar Sesión"}
              </button>

              {error ? (
                <p
                  className="text-center text-sm text-red-400"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-neutral-600">
            <Link
              href="/"
              className="font-medium text-neutral-400 underline-offset-4 transition hover:text-white hover:underline"
            >
              Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
