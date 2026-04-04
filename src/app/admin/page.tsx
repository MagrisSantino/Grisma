"use client";

import {
  crearCliente,
  listarClientesAdmin,
  type ClienteAdminRow,
} from "@/actions/admin";
import {
  actualizarEstadoPedido,
  listarPedidosAdmin,
  type PedidoEstado,
  type PedidoRow,
} from "@/actions/pedidos";
import {
  CATALOGO_BASE,
  emptyPermisos,
  permisosFullAccess,
  type CatalogMarca,
  type CatalogSection,
  type PermisosCatalogo,
} from "@/lib/catalog-structure";
import { isRolAdmin } from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AdminTab = "clientes" | "marcas" | "pedidos";

type ModalState =
  | null
  | { mode: "create" }
  | { mode: "edit"; row: ClienteAdminRow };

function countPlanillasMarca(marca: CatalogMarca): number {
  return marca.sections.reduce((acc, s) => acc + s.planillas.length, 0);
}

function countSelectedEnMarca(
  permisos: PermisosCatalogo,
  marca: CatalogMarca
): number {
  const m = permisos[marca.slug];
  if (!m) return 0;
  let n = 0;
  for (const s of marca.sections) {
    const set = new Set(m[s.id] ?? []);
    for (const p of s.planillas) {
      if (set.has(p.id)) n++;
    }
  }
  return n;
}

function countSelectedEnSeccion(
  permisos: PermisosCatalogo,
  marcaSlug: string,
  section: CatalogSection
): number {
  const m = permisos[marcaSlug];
  if (!m) return 0;
  const set = new Set(m[section.id] ?? []);
  return section.planillas.filter((p) => set.has(p.id)).length;
}

function clonePermisos(p: PermisosCatalogo): PermisosCatalogo {
  const out: PermisosCatalogo = {};
  for (const k of Object.keys(p)) {
    out[k] = { ...p[k] };
    for (const s of Object.keys(out[k])) {
      out[k][s] = [...(p[k][s] ?? [])];
    }
  }
  return out;
}

function limpiarVacios(permisos: PermisosCatalogo): PermisosCatalogo {
  const out = clonePermisos(permisos);
  for (const marcaSlug of Object.keys(out)) {
    const sec = out[marcaSlug];
    for (const sid of Object.keys(sec)) {
      if (!sec[sid]?.length) delete sec[sid];
    }
    if (Object.keys(sec).length === 0) delete out[marcaSlug];
  }
  return out;
}

function PermisosCatalogoEditor({
  value,
  onChange,
}: {
  value: PermisosCatalogo;
  onChange: (next: PermisosCatalogo) => void;
}) {
  const marcaRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const seccionRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const marcaStates = useMemo(() => {
    const map: Record<
      string,
      { checked: boolean; indeterminate: boolean }
    > = {};
    for (const m of CATALOGO_BASE) {
      const total = countPlanillasMarca(m);
      const sel = countSelectedEnMarca(value, m);
      map[m.slug] = {
        checked: total > 0 && sel === total,
        indeterminate: sel > 0 && sel < total,
      };
    }
    return map;
  }, [value]);

  const seccionStates = useMemo(() => {
    const map: Record<string, { checked: boolean; indeterminate: boolean }> =
      {};
    for (const m of CATALOGO_BASE) {
      for (const s of m.sections) {
        const key = `${m.slug}:${s.id}`;
        const total = s.planillas.length;
        const sel = countSelectedEnSeccion(value, m.slug, s);
        map[key] = {
          checked: total > 0 && sel === total,
          indeterminate: sel > 0 && sel < total,
        };
      }
    }
    return map;
  }, [value]);

  useEffect(() => {
    for (const m of CATALOGO_BASE) {
      const el = marcaRefs.current[m.slug];
      if (el) {
        const st = marcaStates[m.slug];
        el.indeterminate = st.indeterminate;
      }
      for (const s of m.sections) {
        const key = `${m.slug}:${s.id}`;
        const elS = seccionRefs.current[key];
        if (elS) {
          elS.indeterminate = seccionStates[key].indeterminate;
        }
      }
    }
  }, [marcaStates, seccionStates]);

  const toggleMarca = (marca: CatalogMarca) => {
    const total = countPlanillasMarca(marca);
    const sel = countSelectedEnMarca(value, marca);
    const full = total > 0 && sel === total;
    const next = clonePermisos(value);
    if (full || sel > 0) {
      delete next[marca.slug];
    } else {
      next[marca.slug] = {};
      for (const s of marca.sections) {
        next[marca.slug][s.id] = s.planillas.map((p) => p.id);
      }
    }
    onChange(limpiarVacios(next));
  };

  const toggleSeccion = (marca: CatalogMarca, section: CatalogSection) => {
    const total = section.planillas.length;
    const sel = countSelectedEnSeccion(value, marca.slug, section);
    const full = total > 0 && sel === total;
    const next = clonePermisos(value);
    if (!next[marca.slug]) next[marca.slug] = {};
    if (full) {
      delete next[marca.slug][section.id];
    } else {
      next[marca.slug][section.id] = section.planillas.map((p) => p.id);
    }
    onChange(limpiarVacios(next));
  };

  const togglePlanilla = (
    marca: CatalogMarca,
    section: CatalogSection,
    planillaId: string
  ) => {
    const next = clonePermisos(value);
    if (!next[marca.slug]) next[marca.slug] = {};
    const cur = new Set(next[marca.slug][section.id] ?? []);
    if (cur.has(planillaId)) cur.delete(planillaId);
    else cur.add(planillaId);
    next[marca.slug][section.id] = Array.from(cur);
    onChange(limpiarVacios(next));
  };

  return (
    <div className="max-h-[min(52vh,420px)] space-y-2 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950/50 p-3">
      <p className="text-xs text-neutral-500">
        Marca completa incluye todas las secciones y planillas. Podés dejar
        estados parciales.
      </p>
      {CATALOGO_BASE.map((marca) => {
        const ms = marcaStates[marca.slug];
        return (
          <details
            key={marca.slug}
            className="group rounded-lg border border-neutral-800/80 bg-neutral-900/40 open:border-neutral-700"
            open
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
              <input
                ref={(el) => {
                  marcaRefs.current[marca.slug] = el;
                }}
                type="checkbox"
                checked={ms.checked}
                onChange={() => toggleMarca(marca)}
                onClick={(e) => e.stopPropagation()}
                className="size-4 shrink-0 rounded border-neutral-600 bg-neutral-900 text-white focus:ring-2 focus:ring-white/30"
              />
              <span className="flex-1">{marca.name}</span>
              <span className="text-neutral-500 group-open:rotate-180">▼</span>
            </summary>
            <div className="space-y-1 border-t border-neutral-800/80 px-2 py-2">
              {marca.sections.map((section) => {
                const sk = `${marca.slug}:${section.id}`;
                const ss = seccionStates[sk];
                return (
                  <div key={section.id} className="rounded-md py-1 pl-6">
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-neutral-200">
                      <input
                        ref={(el) => {
                          seccionRefs.current[sk] = el;
                        }}
                        type="checkbox"
                        checked={ss.checked}
                        onChange={() => toggleSeccion(marca, section)}
                        className="mt-0.5 size-4 shrink-0 rounded border-neutral-600 bg-neutral-900 text-white focus:ring-2 focus:ring-white/30"
                      />
                      <span className="font-medium">{section.title}</span>
                    </label>
                    <div className="mt-1 space-y-1 pl-6">
                      {section.planillas.map((p) => {
                        const set = new Set(
                          value[marca.slug]?.[section.id] ?? []
                        );
                        const checked = set.has(p.id);
                        return (
                          <label
                            key={p.id}
                            className="flex cursor-pointer items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                togglePlanilla(marca, section, p.id)
                              }
                              className="size-3.5 shrink-0 rounded border-neutral-600 bg-neutral-900 text-white focus:ring-2 focus:ring-white/30"
                            />
                            {p.title}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("clientes");
  const [sessionReady, setSessionReady] = useState(false);
  const [gateAdmin, setGateAdmin] = useState(false);

  const [rows, setRows] = useState<ClienteAdminRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [pedidosLoading, setPedidosLoading] = useState(false);
  const [pedidosError, setPedidosError] = useState<string | null>(null);
  const [updatingPedidoId, setUpdatingPedidoId] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalState>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreLocal, setNombreLocal] = useState("");
  const [esAdminRol, setEsAdminRol] = useState(false);
  const [permisos, setPermisos] = useState<PermisosCatalogo>(() =>
    emptyPermisos()
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    const res = await listarClientesAdmin();
    if (!res.ok) {
      setListError(res.error);
      setRows([]);
    } else {
      setRows(res.data.rows);
    }
    setListLoading(false);
  }, []);

  const refreshPedidos = useCallback(async () => {
    setPedidosLoading(true);
    setPedidosError(null);
    const res = await listarPedidosAdmin();
    if (!res.ok) {
      setPedidosError(res.error);
      setPedidos([]);
    } else {
      setPedidos(res.data.rows);
    }
    setPedidosLoading(false);
  }, []);

  const handleCambiarEstado = async (pedidoId: string, estado: PedidoEstado) => {
    setUpdatingPedidoId(pedidoId);
    await actualizarEstadoPedido(pedidoId, estado);
    setUpdatingPedidoId(null);
    await refreshPedidos();
  };

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

      const { data: cliente, error } = await supabase
        .from("clientes")
        .select("rol")
        .eq("id", session.user.id)
        .single();

      if (cancelled) return;

      if (error || !isRolAdmin(cliente?.rol)) {
        router.replace("/");
        return;
      }

      setGateAdmin(true);
      setSessionReady(true);
      await refreshList();
    })();

    return () => {
      cancelled = true;
    };
  }, [router, refreshList]);

  const openCreate = () => {
    setFormError(null);
    setEmail("");
    setPassword("");
    setNombreLocal("");
    setEsAdminRol(false);
    setPermisos(emptyPermisos());
    setModal({ mode: "create" });
  };

  const openEdit = (row: ClienteAdminRow) => {
    setFormError(null);
    setEmail(row.email);
    setPassword("");
    setNombreLocal(row.nombre_local ?? "");
    setEsAdminRol(isRolAdmin(row.rol));
    setPermisos(
      row.permisos_catalogo && Object.keys(row.permisos_catalogo).length
        ? clonePermisos(row.permisos_catalogo as PermisosCatalogo)
        : emptyPermisos()
    );
    setModal({ mode: "edit", row });
  };

  const closeModal = (force?: boolean) => {
    if (saving && !force) return;
    setModal(null);
    setFormError(null);
  };

  const handleMarcarTodo = () => setPermisos(permisosFullAccess());
  const handleLimpiarPermisos = () => setPermisos(emptyPermisos());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      if (modal?.mode === "create") {
        const res = await crearCliente(
          email.trim(),
          password,
          nombreLocal.trim(),
          permisos,
          esAdminRol ? "admin" : "cliente"
        );
        if (!res.ok) {
          setFormError(res.error);
          return;
        }
        closeModal(true);
        await refreshList();
        return;
      }

      if (modal?.mode === "edit") {
        const supabase = createClient();
        const { error } = await supabase
          .from("clientes")
          .update({
            nombre_local: nombreLocal.trim(),
            permisos_catalogo: permisos,
            rol: esAdminRol ? "admin" : "cliente",
          })
          .eq("id", modal.row.id);

        if (error) {
          setFormError(
            error.message +
              " · Si falla por RLS, añadí una política que permita a admins actualizar otras filas."
          );
          return;
        }
        closeModal(true);
        await refreshList();
      }
    } finally {
      setSaving(false);
    }
  };

  if (!sessionReady || !gateAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        <p className="text-sm">Cargando panel…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 antialiased selection:bg-white selection:text-neutral-950">
      <header className="sticky top-0 z-40 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-sm font-medium text-neutral-500 transition hover:text-white"
          >
            ← Portal
          </Link>
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-600">
            Grisma · Admin
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-12">
        <div className="mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Panel de Administración — Grisma
            </h1>
            <p className="mt-2 max-w-xl text-sm text-neutral-400">
              Alta de usuarios, permisos por catálogo (marca → sección →
              planilla) y roles.
            </p>
          </div>
          {tab === "clientes" && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-lg shadow-black/20 transition hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="text-lg leading-none">+</span>
              Nuevo Cliente
            </button>
          )}
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setTab("clientes")}
            className={[
              "group rounded-2xl border p-5 text-left transition sm:p-6",
              tab === "clientes"
                ? "border-white/20 bg-neutral-900/90 ring-1 ring-white/15"
                : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-900/70",
            ].join(" ")}
          >
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500 group-hover:text-neutral-400">
              Sección
            </span>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Clientes
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Locales, accesos y permisos.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("pedidos");
              void refreshPedidos();
            }}
            className={[
              "group rounded-2xl border p-5 text-left transition sm:p-6",
              tab === "pedidos"
                ? "border-white/20 bg-neutral-900/90 ring-1 ring-white/15"
                : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-900/70",
            ].join(" ")}
          >
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500 group-hover:text-neutral-400">
              Sección
            </span>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Pedidos
              {pedidos.filter((p) => p.estado === "pendiente").length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  {pedidos.filter((p) => p.estado === "pendiente").length}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Pedidos de clientes y estados.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTab("marcas")}
            className={[
              "group rounded-2xl border p-5 text-left transition sm:p-6",
              tab === "marcas"
                ? "border-white/20 bg-neutral-900/90 ring-1 ring-white/15"
                : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-900/70",
            ].join(" ")}
          >
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500 group-hover:text-neutral-400">
              Sección
            </span>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Marcas
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Catálogos y visibilidad en el portal.
            </p>
          </button>
        </div>

        {tab === "clientes" && (
          <section
            aria-labelledby="clientes-heading"
            className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/30 shadow-xl shadow-black/40"
          >
            <div className="border-b border-neutral-800 px-4 py-4 sm:px-6">
              <h3
                id="clientes-heading"
                className="text-sm font-semibold text-white"
              >
                Clientes registrados
              </h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                Datos desde Supabase (auth + tabla clientes).
              </p>
              {listError && (
                <p className="mt-2 text-xs text-red-400">{listError}</p>
              )}
            </div>

            <div className="overflow-x-auto">
              {listLoading ? (
                <p className="px-6 py-10 text-sm text-neutral-500">
                  Cargando clientes…
                </p>
              ) : (
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/80">
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 sm:px-6">
                        Local
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 sm:px-6">
                        Email
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 sm:px-6">
                        Rol
                      </th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 sm:px-6">
                        Permisos
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 sm:px-6">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {rows.map((row) => {
                      const marcasCount = row.permisos_catalogo
                        ? Object.keys(row.permisos_catalogo).length
                        : 0;
                      return (
                        <tr
                          key={row.id}
                          className="transition hover:bg-neutral-800/40"
                        >
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-white sm:px-6">
                            {row.nombre_local || "—"}
                          </td>
                          <td className="px-4 py-4 text-neutral-400 sm:px-6">
                            {row.email || "—"}
                          </td>
                          <td className="px-4 py-4 sm:px-6">
                            <span
                              className={[
                                "rounded-full border px-2.5 py-0.5 text-xs",
                                isRolAdmin(row.rol)
                                  ? "border-amber-700/60 bg-amber-950/40 text-amber-200"
                                  : "border-neutral-700 bg-neutral-800/50 text-neutral-300",
                              ].join(" ")}
                            >
                              {isRolAdmin(row.rol) ? "admin" : row.rol ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-neutral-400 sm:px-6">
                            {marcasCount > 0
                              ? `${marcasCount} marca(s) configuradas`
                              : "Sin catálogo"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {tab === "pedidos" && (
          <section aria-labelledby="pedidos-heading">
            <div className="mb-4 flex items-center justify-between">
              <h3 id="pedidos-heading" className="text-sm font-semibold text-white">
                Pedidos recibidos
              </h3>
              <button
                type="button"
                onClick={() => void refreshPedidos()}
                disabled={pedidosLoading}
                className="text-xs text-neutral-500 underline hover:text-white disabled:opacity-50"
              >
                Actualizar
              </button>
            </div>

            {pedidosError && (
              <p className="mb-4 rounded-lg border border-red-800 bg-red-950/30 px-4 py-2 text-xs text-red-400">
                {pedidosError}
              </p>
            )}

            {pedidosLoading ? (
              <p className="py-10 text-center text-sm text-neutral-500">Cargando pedidos…</p>
            ) : pedidos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-800 py-16 text-center">
                <p className="text-sm text-neutral-500">No hay pedidos todavía.</p>
                <p className="mt-1 text-xs text-neutral-600">
                  Cuando un cliente envíe un pedido aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pedidos.map((pedido) => {
                  const totalPares = pedido.items.reduce(
                    (acc, i) => acc + i.cantidad,
                    0
                  );
                  const isPending = updatingPedidoId === pedido.id;

                  const estadoColors: Record<string, string> = {
                    pendiente: "border-amber-700/60 bg-amber-950/40 text-amber-200",
                    revisando: "border-blue-700/60 bg-blue-950/40 text-blue-200",
                    aprobado: "border-emerald-700/60 bg-emerald-950/40 text-emerald-200",
                    rechazado: "border-red-700/60 bg-red-950/40 text-red-300",
                  };

                  return (
                    <div
                      key={pedido.id}
                      className="rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden"
                    >
                      {/* header */}
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-800 bg-neutral-900/50 px-5 py-4">
                        <div>
                          <p className="font-semibold text-white">
                            {pedido.nombre_local || "Sin nombre"}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {new Date(pedido.created_at).toLocaleString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" · "}
                            {totalPares} par{totalPares !== 1 ? "es" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={[
                              "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              estadoColors[pedido.estado] ?? "border-neutral-700 text-neutral-300",
                            ].join(" ")}
                          >
                            {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
                          </span>
                          {/* action buttons */}
                          {pedido.estado === "pendiente" && (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => void handleCambiarEstado(pedido.id, "revisando")}
                                className="rounded-lg border border-neutral-700 px-3 py-1 text-xs text-neutral-300 transition hover:border-blue-600 hover:text-blue-300 disabled:opacity-40"
                              >
                                En revisión
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => void handleCambiarEstado(pedido.id, "aprobado")}
                                className="rounded-lg border border-emerald-700/60 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-300 transition hover:bg-emerald-900/50 disabled:opacity-40"
                              >
                                Aprobar
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => void handleCambiarEstado(pedido.id, "rechazado")}
                                className="rounded-lg border border-red-700/60 bg-red-950/20 px-3 py-1 text-xs text-red-400 transition hover:bg-red-950/40 disabled:opacity-40"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {pedido.estado === "revisando" && (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => void handleCambiarEstado(pedido.id, "aprobado")}
                                className="rounded-lg border border-emerald-700/60 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-300 transition hover:bg-emerald-900/50 disabled:opacity-40"
                              >
                                Aprobar
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => void handleCambiarEstado(pedido.id, "rechazado")}
                                className="rounded-lg border border-red-700/60 bg-red-950/20 px-3 py-1 text-xs text-red-400 transition hover:bg-red-950/40 disabled:opacity-40"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {(pedido.estado === "aprobado" || pedido.estado === "rechazado") && (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => void handleCambiarEstado(pedido.id, "pendiente")}
                              className="rounded-lg border border-neutral-700 px-3 py-1 text-xs text-neutral-500 transition hover:text-neutral-300 disabled:opacity-40"
                            >
                              Reabrir
                            </button>
                          )}
                        </div>
                      </div>

                      {/* items */}
                      <div className="divide-y divide-neutral-800/50">
                        {pedido.items.slice(0, 8).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
                          >
                            <span className="text-neutral-300">
                              {item.modelo}
                              {item.color ? (
                                <span className="ml-1 text-neutral-500">{item.color}</span>
                              ) : null}
                              {" "}
                              <span className="text-neutral-500">T. {item.talle}</span>
                            </span>
                            <span className="tabular-nums font-semibold text-white">
                              {item.cantidad} par{item.cantidad !== 1 ? "es" : ""}
                            </span>
                          </div>
                        ))}
                        {pedido.items.length > 8 && (
                          <p className="px-5 py-2 text-xs text-neutral-600">
                            …y {pedido.items.length - 8} ítems más
                          </p>
                        )}
                      </div>

                      {/* notas */}
                      {pedido.notas && (
                        <div className="border-t border-neutral-800 bg-neutral-900/30 px-5 py-3">
                          <p className="text-xs text-neutral-500">
                            <span className="font-medium text-neutral-400">Nota:</span>{" "}
                            {pedido.notas}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === "marcas" && (
          <section
            aria-labelledby="marcas-heading"
            className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/20 px-6 py-16 text-center"
          >
            <h3
              id="marcas-heading"
              className="text-lg font-semibold text-white"
            >
              Gestión de Marcas
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              Próximamente. Los permisos por marca ya se definen al crear o
              editar clientes.
            </p>
          </section>
        )}
      </main>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/95 px-5 py-4 backdrop-blur">
              <h2
                id="modal-title"
                className="text-lg font-semibold text-white"
              >
                {modal.mode === "create"
                  ? "Crear cliente"
                  : "Editar cliente"}
              </h2>
              <button
                type="button"
                onClick={() => closeModal()}
                disabled={saving}
                className="rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-800 hover:text-white disabled:opacity-50"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-medium text-neutral-400"
                >
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={modal.mode === "edit" || saving}
                  required={modal.mode === "create"}
                  className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none disabled:opacity-60"
                  placeholder="cliente@ejemplo.com"
                />
              </div>

              {modal.mode === "create" && (
                <div>
                  <label
                    htmlFor="admin-pass"
                    className="block text-xs font-medium text-neutral-400"
                  >
                    Contraseña
                  </label>
                  <input
                    id="admin-pass"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={saving}
                    required
                    minLength={6}
                    className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-local"
                  className="block text-xs font-medium text-neutral-400"
                >
                  Nombre del local
                </label>
                <input
                  id="admin-local"
                  type="text"
                  value={nombreLocal}
                  onChange={(e) => setNombreLocal(e.target.value)}
                  disabled={saving}
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                  placeholder="Ej. Local Centro"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-200">
                <input
                  type="checkbox"
                  checked={esAdminRol}
                  onChange={(e) => setEsAdminRol(e.target.checked)}
                  disabled={saving}
                  className="size-4 rounded border-neutral-600 bg-neutral-900"
                />
                Rol administrador (ve el lápiz de edición en el portal)
              </label>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-neutral-400">
                    Permisos de catálogo
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleMarcarTodo}
                      disabled={saving}
                      className="text-xs text-neutral-400 underline hover:text-white disabled:opacity-50"
                    >
                      Marcar todo
                    </button>
                    <button
                      type="button"
                      onClick={handleLimpiarPermisos}
                      disabled={saving}
                      className="text-xs text-neutral-400 underline hover:text-white disabled:opacity-50"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                <PermisosCatalogoEditor
                  value={permisos}
                  onChange={setPermisos}
                />
              </div>

              {formError && (
                <p className="text-sm text-red-400" role="alert">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-neutral-800 pt-4">
                <button
                  type="button"
                  onClick={() => closeModal()}
                  disabled={saving}
                  className="rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
