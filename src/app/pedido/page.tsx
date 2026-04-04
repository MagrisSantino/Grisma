"use client";

import { useCart } from "@/components/cart-provider";
import { crearPedido } from "@/actions/pedidos";
import { isRolAdmin } from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/lib/cart";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ─── helpers ──────────────────────────────────────────────────────── */

function labelFromEmail(email: string) {
  const i = email.indexOf("@");
  return i > 0 ? email.slice(0, i) : email;
}
function initialsFromEmail(email: string) {
  const base = labelFromEmail(email) || email;
  const alnum = base.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]/g, "");
  if (alnum.length >= 2) return alnum.slice(0, 2).toUpperCase();
  if (alnum.length === 1) return (alnum + alnum).toUpperCase();
  return "??";
}

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  revisando: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

function fmtPrecio(precio?: number) {
  if (!precio) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(precio);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── GroupedCart ──────────────────────────────────────────────────── */

type GroupedItem = {
  marcaSlug: string;
  marcaName: string;
  planillaId: string;
  planillaTitle: string;
  items: CartItem[];
};

function groupCartItems(items: CartItem[]): GroupedItem[] {
  const map = new Map<string, GroupedItem>();
  for (const item of items) {
    const key = `${item.marcaSlug}::${item.planillaId}`;
    if (!map.has(key)) {
      map.set(key, {
        marcaSlug: item.marcaSlug,
        marcaName: item.marcaName,
        planillaId: item.planillaId,
        planillaTitle: item.planillaTitle,
        items: [],
      });
    }
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values());
}

/* ─── CartSection ──────────────────────────────────────────────────── */

function CartSection({
  group,
  onRemove,
  onUpdateQty,
}: {
  group: GroupedItem;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, qty: number) => void;
}) {
  const sectionTotal = group.items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/30">
      {/* section header */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/50 px-5 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            {group.marcaName}
          </p>
          <p className="text-sm font-semibold text-white">{group.planillaTitle}</p>
        </div>
        <Link
          href={`/marca/${group.marcaSlug}/planilla/${group.planillaId}`}
          className="text-xs text-neutral-500 underline-offset-2 transition hover:text-neutral-300 hover:underline"
        >
          Editar
        </Link>
      </div>

      {/* items */}
      <div className="divide-y divide-neutral-800/60">
        {group.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-5 py-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">
                {item.modelo}
                {item.color ? (
                  <span className="ml-2 font-normal text-neutral-400">
                    {item.color}
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-neutral-500">
                Talle {item.talle}
                {item.precio ? (
                  <span className="ml-2 tabular-nums">{fmtPrecio(item.precio)}</span>
                ) : null}
              </p>
            </div>

            {/* qty */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateQty(item.id, item.cantidad - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 transition hover:border-neutral-500 hover:text-white disabled:opacity-30"
                disabled={item.cantidad <= 0}
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums text-white">
                {item.cantidad}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(item.id, item.cantidad + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 transition hover:border-neutral-500 hover:text-white"
              >
                +
              </button>
            </div>

            {/* subtotal */}
            {item.precio && (
              <span className="hidden w-24 text-right text-sm font-semibold tabular-nums text-neutral-200 sm:block">
                {fmtPrecio(item.precio * item.cantidad)}
              </span>
            )}

            {/* delete */}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-red-950/60 hover:text-red-400"
              aria-label="Quitar ítem"
            >
              <iconify-icon icon="solar:trash-bin-minimalistic-linear" width="16" height="16" />
            </button>
          </div>
        ))}
      </div>

      {/* section footer */}
      <div className="flex justify-end border-t border-neutral-800 bg-neutral-900/30 px-5 py-2.5">
        <span className="text-xs text-neutral-500">
          {sectionTotal} par{sectionTotal !== 1 ? "es" : ""} en esta planilla
        </span>
      </div>
    </div>
  );
}

/* ─── page ─────────────────────────────────────────────────────────── */

export default function PedidoPage() {
  const router = useRouter();
  const { items, itemCount, updateQuantity, removeItem, clearCart } = useCart();

  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [nombreLocal, setNombreLocal] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);

  /* ── auth ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setUserEmail(session.user.email ?? "");
      const { data: clienteRow } = await supabase
        .from("clientes")
        .select("nombre_local")
        .eq("id", session.user.id)
        .single();
      if (!cancelled) {
        setNombreLocal(clienteRow?.nombre_local ?? null);
        setSessionReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  /* ── theme ── */
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }, [router]);

  const grouped = useMemo(() => groupCartItems(items), [items]);

  const totalPrecio = useMemo(
    () =>
      items.reduce(
        (acc, item) => acc + (item.precio ?? 0) * item.cantidad,
        0
      ),
    [items]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await crearPedido(items, notas);
      if (!res.ok) {
        setSubmitError(res.error);
        return;
      }
      setPedidoId(res.data.pedidoId);
      clearCart();
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const themeIcon = isDark ? "solar:sun-linear" : "solar:moon-linear";

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        <p className="text-sm">Cargando…</p>
      </div>
    );
  }

  /* ── success state ── */
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-900/60 text-emerald-400 mb-6">
          <iconify-icon icon="solar:check-circle-bold" width="40" height="40" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          ¡Pedido enviado!
        </h1>
        <p className="mt-3 max-w-sm text-sm text-neutral-400">
          Tu pedido fue recibido correctamente.
          {pedidoId && (
            <span className="mt-1 block text-xs text-neutral-600">
              Referencia: {pedidoId}
            </span>
          )}
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Te avisaremos cuando sea revisado y aprobado.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/"
            className="rounded-full border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-white"
          >
            Volver al inicio
          </Link>
          <Link
            href="/"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
          >
            Ver más stock
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 antialiased">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-neutral-800/70 bg-neutral-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-neutral-400 transition hover:bg-neutral-800/60 hover:text-white"
            >
              <iconify-icon icon="solar:arrow-left-linear" width="16" height="16" strokeWidth="2" />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
            <div className="hidden h-4 w-px bg-neutral-800 sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-white">
                <span className="text-xs font-semibold tracking-tighter text-neutral-900">G</span>
              </div>
              <span className="text-base font-semibold tracking-tighter text-white">GRISMA</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-xs font-medium text-neutral-300">
                {initialsFromEmail(userEmail)}
              </div>
              <span className="max-w-[140px] truncate text-xs text-neutral-400">
                {nombreLocal || labelFromEmail(userEmail)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              className="p-1.5 text-neutral-500 transition hover:text-white"
            >
              <iconify-icon icon={themeIcon} width="18" height="18" />
            </button>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="p-1.5 text-neutral-500 transition hover:text-white"
            >
              <iconify-icon icon="solar:logout-2-linear" width="18" height="18" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Resumen del Pedido
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Revisá tu pedido antes de enviarlo.
          </p>
        </div>

        {items.length === 0 ? (
          /* empty state */
          <div className="rounded-2xl border border-dashed border-neutral-800 py-20 text-center">
            <iconify-icon
              icon="solar:cart-large-minimalistic-linear"
              width="40"
              height="40"
              className="mx-auto text-neutral-700"
            />
            <p className="mt-4 text-sm font-medium text-neutral-500">
              Tu pedido está vacío.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 shadow transition hover:bg-neutral-200"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
              {/* items list */}
              <div className="space-y-4">
                {grouped.map((group) => (
                  <CartSection
                    key={`${group.marcaSlug}::${group.planillaId}`}
                    group={group}
                    onRemove={removeItem}
                    onUpdateQty={updateQuantity}
                  />
                ))}
              </div>

              {/* order summary sidebar */}
              <div className="lg:sticky lg:top-24 self-start space-y-4">
                {/* summary card */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
                    Resumen
                  </h2>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-neutral-300">
                      <span>Total de pares</span>
                      <span className="font-semibold text-white tabular-nums">
                        {itemCount}
                      </span>
                    </div>
                    {totalPrecio > 0 && (
                      <div className="flex justify-between text-sm text-neutral-300">
                        <span>Importe estimado</span>
                        <span className="font-semibold text-white tabular-nums">
                          {new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: "ARS",
                            maximumFractionDigits: 0,
                          }).format(totalPrecio)}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-neutral-600">
                      Los precios son orientativos. El precio final lo confirma
                      el representante.
                    </p>
                  </div>

                  {/* notas */}
                  <div className="mt-5">
                    <label
                      htmlFor="notas"
                      className="block text-xs font-medium text-neutral-400"
                    >
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      id="notas"
                      rows={3}
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Ej: necesito el pedido para la 2ª semana del mes…"
                      className="mt-1.5 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                    />
                  </div>

                  {submitError && (
                    <p className="mt-3 rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-400">
                      {submitError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || items.length === 0}
                    className="mt-5 w-full rounded-xl bg-white py-3 text-sm font-semibold text-neutral-950 shadow-lg transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Enviando…" : "Enviar Pedido"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("¿Vaciar el pedido?")) clearCart();
                    }}
                    className="mt-2 w-full rounded-xl border border-neutral-800 py-2.5 text-xs font-medium text-neutral-500 transition hover:border-neutral-600 hover:text-neutral-300"
                  >
                    Vaciar pedido
                  </button>
                </div>

                <Link
                  href="/"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 py-3 text-sm font-medium text-neutral-400 transition hover:border-neutral-600 hover:text-white"
                >
                  <iconify-icon icon="solar:arrow-left-linear" width="14" height="14" />
                  Seguir eligiendo
                </Link>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
