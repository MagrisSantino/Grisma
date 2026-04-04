"use server";

import { isRolAdmin } from "@/lib/auth-roles";
import type { CartItem } from "@/lib/cart";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceSupabase } from "@supabase/supabase-js";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

export type PedidoEstado = "pendiente" | "revisando" | "aprobado" | "rechazado";

export type PedidoRow = {
  id: string;
  cliente_id: string;
  nombre_local: string | null;
  estado: PedidoEstado;
  items: CartItem[];
  notas: string | null;
  created_at: string;
};

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase.");
  return createServiceSupabase(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/* ─── crear pedido ─────────────────────────────────────────────────── */

export async function crearPedido(
  items: CartItem[],
  notas?: string
): Promise<Ok<{ pedidoId: string }> | Err> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "No autenticado." };
  if (items.length === 0) return { ok: false, error: "El pedido está vacío." };

  const { data: cliente } = await supabase
    .from("clientes")
    .select("nombre_local")
    .eq("id", user.id)
    .single();

  const { data, error } = await supabase
    .from("pedidos")
    .insert({
      cliente_id: user.id,
      nombre_local: cliente?.nombre_local ?? null,
      estado: "pendiente",
      items,
      notas: notas?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    // tabla no existe todavía – informar al usuario
    if (error.code === "42P01") {
      return {
        ok: false,
        error:
          "La tabla de pedidos no está creada en Supabase. Ejecutá las migraciones primero.",
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, data: { pedidoId: data.id as string } };
}

/* ─── listar pedidos (admin) ───────────────────────────────────────── */

export async function listarPedidosAdmin(): Promise<
  Ok<{ rows: PedidoRow[] }> | Err
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data: clienteRow, error: roleErr } = await supabase
    .from("clientes")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (roleErr || !isRolAdmin(clienteRow?.rol)) {
    return { ok: false, error: "No autorizado." };
  }

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("pedidos")
    .select("id, cliente_id, nombre_local, estado, items, notas, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    if (error.code === "42P01") {
      return { ok: true, data: { rows: [] } }; // tabla no existe aún
    }
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    data: {
      rows: (data ?? []).map((r) => ({
        id: r.id as string,
        cliente_id: r.cliente_id as string,
        nombre_local: r.nombre_local as string | null,
        estado: r.estado as PedidoEstado,
        items: (r.items as CartItem[]) ?? [],
        notas: r.notas as string | null,
        created_at: r.created_at as string,
      })),
    },
  };
}

/* ─── actualizar estado (admin) ────────────────────────────────────── */

export async function actualizarEstadoPedido(
  pedidoId: string,
  nuevoEstado: PedidoEstado
): Promise<Ok<null> | Err> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data: clienteRow, error: roleErr } = await supabase
    .from("clientes")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (roleErr || !isRolAdmin(clienteRow?.rol)) {
    return { ok: false, error: "No autorizado." };
  }

  const admin = createServiceClient();
  const { error } = await admin
    .from("pedidos")
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq("id", pedidoId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

/* ─── pedidos del cliente autenticado ─────────────────────────────── */

export async function listarMisPedidos(): Promise<
  Ok<{ rows: PedidoRow[] }> | Err
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data, error } = await supabase
    .from("pedidos")
    .select("id, cliente_id, nombre_local, estado, items, notas, created_at")
    .eq("cliente_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (error.code === "42P01") return { ok: true, data: { rows: [] } };
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    data: {
      rows: (data ?? []).map((r) => ({
        id: r.id as string,
        cliente_id: r.cliente_id as string,
        nombre_local: r.nombre_local as string | null,
        estado: r.estado as PedidoEstado,
        items: (r.items as CartItem[]) ?? [],
        notas: r.notas as string | null,
        created_at: r.created_at as string,
      })),
    },
  };
}
