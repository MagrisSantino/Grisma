"use client";

import { useCart } from "@/components/cart-provider";
import { isRolAdmin } from "@/lib/auth-roles";
import { CATALOGO_BASE } from "@/lib/catalog-structure";
import { createClient } from "@/lib/supabase/client";
import { getStockItems, type StockItem } from "@/actions/stock";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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

const MARCA_NAMES: Record<string, string> = {
  reebok: "Reebok",
  kappa: "Kappa",
  crocs: "Crocs",
  columbia: "Columbia",
};

function getMarcaName(slug: string) {
  return MARCA_NAMES[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

function getPlanillaInfo(
  marcaSlug: string,
  planillaId: string
): { title: string; sectionTitle: string } {
  const marca = CATALOGO_BASE.find((m) => m.slug === marcaSlug);
  if (!marca) return { title: planillaId, sectionTitle: "" };
  for (const s of marca.sections) {
    const p = s.planillas.find((p) => p.id === planillaId);
    if (p) return { title: p.title, sectionTitle: s.title };
  }
  return { title: planillaId, sectionTitle: "" };
}

function fmtPrecio(precio?: number) {
  if (!precio) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(precio);
}

function sortTalles(talles: string[]): string[] {
  return [...talles].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });
}

/* ─── CartBar ───────────────────────────────────────────────────────── */

function CartBar({ planillaItemCount, totalCount }: { planillaItemCount: number; totalCount: number }) {
  if (totalCount === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t border-neutral-800 bg-neutral-950/95 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="text-sm text-neutral-300">
        <span className="font-semibold text-white">{totalCount}</span> par
        {totalCount !== 1 ? "es" : ""} en el pedido
        {planillaItemCount > 0 && planillaItemCount !== totalCount && (
          <span className="ml-1 text-neutral-500">
            ({planillaItemCount} de esta planilla)
          </span>
        )}
      </div>
      <Link
        href="/pedido"
        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-lg transition hover:bg-neutral-200"
      >
        Ver pedido
        <iconify-icon
          icon="solar:arrow-right-linear"
          width="16"
          height="16"
          strokeWidth="1.5"
        />
      </Link>
    </div>
  );
}

/* ─── StockRow ─────────────────────────────────────────────────────── */

type StockRowProps = {
  item: StockItem;
  allTalles: string[];
  planillaId: string;
  planillaTitle: string;
  marcaSlug: string;
  qtys: Record<string, number>;
  onQtyChange: (item: StockItem, talle: string, qty: number) => void;
};

function StockRow({
  item,
  allTalles,
  planillaId,
  planillaTitle,
  marcaSlug,
  qtys,
  onQtyChange,
}: StockRowProps) {
  const rowSubtotal = allTalles.reduce((acc, t) => {
    const qty = qtys[`${item.id}:${t}`] ?? 0;
    return acc + qty;
  }, 0);

  return (
    <tr className="border-b border-neutral-800/60 transition hover:bg-neutral-900/40">
      {/* Artículo */}
      <td className="sticky left-0 z-10 min-w-[130px] max-w-[180px] bg-neutral-950 px-4 py-3 align-top">
        <p className="text-sm font-semibold leading-snug text-white">
          {item.modelo}
        </p>
        {item.descripcion && (
          <p className="mt-0.5 text-xs text-neutral-500">{item.descripcion}</p>
        )}
      </td>

      {/* Color */}
      <td className="sticky left-[130px] z-10 min-w-[90px] bg-neutral-950 px-3 py-3 align-top text-sm text-neutral-300 sm:left-[180px]">
        {item.color || "—"}
      </td>

      {/* Precio */}
      <td className="px-3 py-3 align-top text-sm font-medium text-neutral-200 tabular-nums">
        {fmtPrecio(item.precio)}
      </td>

      {/* Talle columns */}
      {allTalles.map((talle) => {
        const stock = item.talles[talle] ?? 0;
        const qty = qtys[`${item.id}:${talle}`] ?? 0;
        const disabled = stock === 0;

        return (
          <td
            key={talle}
            className={[
              "px-2 py-2 text-center align-top transition-colors",
              disabled ? "opacity-40" : "",
            ].join(" ")}
          >
            <div className="flex flex-col items-center gap-1">
              {/* stock disponible */}
              <span
                className={[
                  "text-xs tabular-nums leading-none",
                  disabled ? "text-neutral-600" : "text-neutral-400",
                ].join(" ")}
              >
                {stock}
              </span>
              {/* qty input */}
              <input
                type="number"
                min={0}
                max={stock}
                value={qty === 0 ? "" : qty}
                disabled={disabled}
                placeholder="0"
                onChange={(e) => {
                  const v = Math.min(
                    stock,
                    Math.max(0, parseInt(e.target.value, 10) || 0)
                  );
                  onQtyChange(item, talle, v);
                }}
                className={[
                  "w-10 rounded-md border py-1 text-center text-xs tabular-nums outline-none transition",
                  disabled
                    ? "cursor-not-allowed border-neutral-800 bg-neutral-900/30 text-neutral-600"
                    : qty > 0
                    ? "border-emerald-600 bg-emerald-950/40 text-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-600"
                    : "border-neutral-700 bg-neutral-900 text-white focus:border-neutral-500 focus:ring-1 focus:ring-neutral-600",
                ].join(" ")}
              />
            </div>
          </td>
        );
      })}

      {/* Subtotal pares */}
      <td className="px-3 py-3 text-right align-top text-xs font-semibold tabular-nums text-neutral-300">
        {rowSubtotal > 0 ? (
          <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-emerald-300">
            {rowSubtotal} par{rowSubtotal !== 1 ? "es" : ""}
          </span>
        ) : (
          <span className="text-neutral-700">—</span>
        )}
      </td>
    </tr>
  );
}

/* ─── page ─────────────────────────────────────────────────────────── */

export default function PlanillaPage() {
  const params = useParams();
  const router = useRouter();
  const { items: cartItems, addItem, itemCount } = useCart();

  const marcaSlug =
    typeof params.nombreMarca === "string"
      ? params.nombreMarca
      : Array.isArray(params.nombreMarca)
        ? params.nombreMarca[0]
        : "";

  const planillaId =
    typeof params.planillaId === "string"
      ? params.planillaId
      : Array.isArray(params.planillaId)
        ? params.planillaId[0]
        : "";

  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [nombreLocal, setNombreLocal] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [search, setSearch] = useState("");
  const [colorFilter, setColorFilter] = useState("__all__");

  // qtys: `${stockItemId}:${talle}` → quantity
  const [qtys, setQtys] = useState<Record<string, number>>({});

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
    return () => {
      cancelled = true;
    };
  }, [router]);

  /* ── theme ── */
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  /* ── load stock ── */
  useEffect(() => {
    if (!sessionReady || !planillaId || !marcaSlug) return;
    setLoadingStock(true);
    getStockItems(planillaId, marcaSlug).then((items) => {
      setStockItems(items);
      // init qtys from cart
      const initial: Record<string, number> = {};
      for (const ci of cartItems) {
        if (ci.planillaId === planillaId) {
          initial[`${ci.stockItemId}:${ci.talle}`] = ci.cantidad;
        }
      }
      setQtys(initial);
      setLoadingStock(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, planillaId, marcaSlug]);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }, [router]);

  /* ── planilla metadata ── */
  const { title: planillaTitle, sectionTitle } = useMemo(
    () => getPlanillaInfo(marcaSlug, planillaId),
    [marcaSlug, planillaId]
  );
  const marcaName = getMarcaName(marcaSlug);

  /* ── derived data ── */
  const allTalles = useMemo(() => {
    const set = new Set<string>();
    stockItems.forEach((item) =>
      Object.keys(item.talles).forEach((t) => set.add(t))
    );
    return sortTalles(Array.from(set));
  }, [stockItems]);

  const availableColors = useMemo(() => {
    const set = new Set<string>();
    stockItems.forEach((item) => { if (item.color) set.add(item.color); });
    return Array.from(set).sort();
  }, [stockItems]);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return stockItems.filter((item) => {
      if (colorFilter !== "__all__" && item.color !== colorFilter) return false;
      if (!q) return true;
      return (
        item.modelo.toLowerCase().includes(q) ||
        (item.color?.toLowerCase().includes(q) ?? false) ||
        (item.descripcion?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [stockItems, search, colorFilter]);

  const handleQtyChange = useCallback(
    (item: StockItem, talle: string, qty: number) => {
      const key = `${item.id}:${talle}`;
      setQtys((prev) => {
        const next = { ...prev };
        if (qty <= 0) delete next[key];
        else next[key] = qty;
        return next;
      });
      addItem({
        planillaId,
        planillaTitle,
        marcaSlug,
        marcaName,
        stockItemId: item.id,
        modelo: item.modelo,
        color: item.color,
        talle,
        cantidad: qty,
        precio: item.precio,
      });
    },
    [addItem, planillaId, planillaTitle, marcaSlug, marcaName]
  );

  /* cart stats */
  const planillaCartItems = cartItems.filter(
    (ci) => ci.planillaId === planillaId
  );
  const planillaCartCount = planillaCartItems.reduce(
    (acc, ci) => acc + ci.cantidad,
    0
  );

  /* ── total by row ── */
  const totalesPorFila = useMemo(() => {
    const map: Record<string, number> = {};
    filteredItems.forEach((item) => {
      map[item.id] = allTalles.reduce(
        (acc, t) => acc + (qtys[`${item.id}:${t}`] ?? 0),
        0
      );
    });
    return map;
  }, [filteredItems, allTalles, qtys]);

  const grandTotal = Object.values(totalesPorFila).reduce(
    (acc, v) => acc + v,
    0
  );

  const themeIcon = isDark ? "solar:sun-linear" : "solar:moon-linear";

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        <p className="text-sm">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 antialiased">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-neutral-800/70 bg-neutral-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* left */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/marca/${marcaSlug}`}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-neutral-400 transition hover:bg-neutral-800/60 hover:text-white"
            >
              <iconify-icon
                icon="solar:arrow-left-linear"
                width="16"
                height="16"
                strokeWidth="2"
              />
              <span className="hidden sm:inline">Atrás</span>
            </Link>

            <div className="hidden h-4 w-px bg-neutral-800 sm:block" />

            {/* breadcrumb */}
            <nav className="flex min-w-0 items-center gap-1 text-xs text-neutral-500">
              <Link href="/" className="shrink-0 hover:text-neutral-300">
                Inicio
              </Link>
              <span>/</span>
              <Link
                href={`/marca/${marcaSlug}`}
                className="hidden shrink-0 hover:text-neutral-300 sm:inline"
              >
                {marcaName}
              </Link>
              <span className="hidden sm:inline">/</span>
              <span className="truncate text-neutral-300">{planillaTitle}</span>
            </nav>
          </div>

          {/* right */}
          <div className="flex shrink-0 items-center gap-3">
            {/* cart */}
            <Link
              href="/pedido"
              className="relative flex items-center justify-center rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800/60 hover:text-white"
              title="Ver pedido"
              aria-label={`Ver pedido (${itemCount} pares)`}
            >
              <iconify-icon
                icon="solar:cart-large-minimalistic-linear"
                width="20"
                height="20"
                strokeWidth="1.5"
              />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            <div className="hidden h-4 w-px bg-neutral-800 sm:block" />

            {/* user */}
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
              className="flex items-center justify-center p-1.5 text-neutral-500 transition hover:text-white"
              aria-label="Cambiar tema"
            >
              <iconify-icon icon={themeIcon} width="18" height="18" />
            </button>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex items-center justify-center p-1.5 text-neutral-500 transition hover:text-white"
              aria-label="Cerrar sesión"
            >
              <iconify-icon
                icon="solar:logout-2-linear"
                width="18"
                height="18"
              />
            </button>
          </div>
        </div>
      </header>

      {/* ── Page header ── */}
      <div className="border-b border-neutral-800/50 bg-neutral-900/30 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
            {marcaName}
            {sectionTitle ? ` · ${sectionTitle}` : ""}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {planillaTitle}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Ingresá la cantidad de pares que querés pedir. Los campos en gris
            no tienen stock disponible.
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sticky top-14 z-30 border-b border-neutral-800/50 bg-neutral-950/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          {/* search */}
          <div className="relative min-w-[180px] flex-1">
            <iconify-icon
              icon="solar:magnifer-linear"
              width="16"
              height="16"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="text"
              placeholder="Buscar modelo o color…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-9 pr-4 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
            />
          </div>

          {/* color filter */}
          {availableColors.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setColorFilter("__all__")}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  colorFilter === "__all__"
                    ? "border-white/30 bg-white text-neutral-950"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white",
                ].join(" ")}
              >
                Todos
              </button>
              {availableColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setColorFilter(color === colorFilter ? "__all__" : color)
                  }
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    colorFilter === color
                      ? "border-white/30 bg-white text-neutral-950"
                      : "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white",
                  ].join(" ")}
                >
                  {color}
                </button>
              ))}
            </div>
          )}

          {/* total seleccionado */}
          {grandTotal > 0 && (
            <span className="ml-auto text-xs font-semibold text-emerald-400">
              {grandTotal} par{grandTotal !== 1 ? "es" : ""} seleccionados
            </span>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <main className="mx-auto max-w-7xl px-0 pb-36 pt-4 sm:px-2">
        {loadingStock ? (
          <div className="flex items-center justify-center py-24 text-neutral-500">
            <iconify-icon
              icon="solar:loading-linear"
              width="24"
              height="24"
              className="animate-spin"
            />
            <span className="ml-2 text-sm">Cargando stock…</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center text-neutral-500">
            <p className="text-sm">No se encontraron artículos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60">
                  <th className="sticky left-0 z-20 min-w-[130px] bg-neutral-900/90 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400 sm:min-w-[180px]">
                    Artículo
                  </th>
                  <th className="sticky left-[130px] z-20 min-w-[90px] bg-neutral-900/90 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400 sm:left-[180px]">
                    Color
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Precio
                  </th>
                  {allTalles.map((t) => (
                    <th
                      key={t}
                      className="w-14 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400"
                    >
                      {t}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Selec.
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <StockRow
                    key={item.id}
                    item={item}
                    allTalles={allTalles}
                    planillaId={planillaId}
                    planillaTitle={planillaTitle}
                    marcaSlug={marcaSlug}
                    qtys={qtys}
                    onQtyChange={handleQtyChange}
                  />
                ))}
              </tbody>
              {grandTotal > 0 && (
                <tfoot>
                  <tr className="border-t border-neutral-700 bg-neutral-900/60">
                    <td
                      colSpan={3 + allTalles.length}
                      className="px-4 py-3 text-sm font-semibold text-white"
                    >
                      Total seleccionado
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-400">
                      {grandTotal} par{grandTotal !== 1 ? "es" : ""}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </main>

      {/* ── Floating cart bar ── */}
      <CartBar
        planillaItemCount={planillaCartCount}
        totalCount={itemCount}
      />
    </div>
  );
}
