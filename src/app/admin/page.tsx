"use client";

import Link from "next/link";
import { useState } from "react";

type AdminTab = "clientes" | "marcas";

const MOCK_CLIENTES = [
  {
    id: "1",
    local: "Local Centro",
    email: "pedidos.centro@localcentro.com.ar",
    marcas: ["Reebok", "Crocs"],
  },
  {
    id: "2",
    local: "Distribuidora Sur",
    email: "compras@distsur.com.ar",
    marcas: ["Kappa", "Columbia"],
  },
  {
    id: "3",
    local: "Sport House Norte",
    email: "mayorista@sporthouse.ar",
    marcas: ["Reebok", "Kappa", "Crocs", "Columbia"],
  },
  {
    id: "4",
    local: "Calzados Rivadavia",
    email: "rivadavia.calzados@gmail.com",
    marcas: ["Crocs"],
  },
];

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("clientes");

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
              Gestión centralizada de clientes B2B y marcas habilitadas.
            </p>
          </div>
          {tab === "clientes" && (
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-lg shadow-black/20 transition hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="text-lg leading-none">+</span>
              Nuevo Cliente
            </button>
          )}
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTab("clientes")}
            className={[
              "group rounded-2xl border p-6 text-left transition sm:p-8",
              tab === "clientes"
                ? "border-white/20 bg-neutral-900/90 ring-1 ring-white/15"
                : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-900/70",
            ].join(" ")}
          >
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500 group-hover:text-neutral-400">
              Sección
            </span>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Gestión de Clientes
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              Locales, accesos y marcas permitidas por cuenta.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTab("marcas")}
            className={[
              "group rounded-2xl border p-6 text-left transition sm:p-8",
              tab === "marcas"
                ? "border-white/20 bg-neutral-900/90 ring-1 ring-white/15"
                : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-600 hover:bg-neutral-900/70",
            ].join(" ")}
          >
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500 group-hover:text-neutral-400">
              Sección
            </span>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Gestión de Marcas
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              Catálogos, activación y visibilidad en el portal.
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
                Datos de prueba · la lógica se conectará más adelante.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/80">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 sm:px-6">
                      Nombre del Local
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 sm:px-6">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500 sm:px-6">
                      Marcas permitidas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500 sm:px-6">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {MOCK_CLIENTES.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-neutral-800/40"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-white sm:px-6">
                        {row.local}
                      </td>
                      <td className="px-4 py-4 text-neutral-400 sm:px-6">
                        {row.email}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {row.marcas.map((m) => (
                            <span
                              key={m}
                              className="rounded-full border border-neutral-700 bg-neutral-800/50 px-2.5 py-0.5 text-xs text-neutral-300"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-red-900/60 px-3 py-1.5 text-xs font-medium text-red-300/90 transition hover:border-red-700 hover:bg-red-950/40 hover:text-red-200"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              Aquí irá el listado y la configuración de marcas. Por ahora solo
              la interfaz de clientes está detallada.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
