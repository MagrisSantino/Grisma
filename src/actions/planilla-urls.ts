"use server";

import { isRolAdmin } from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceSupabase } from "@supabase/supabase-js";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

export type PlanillaUrl = {
  planillaId: string;
  marcaSlug: string;
  sheetsUrl: string;
};

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan variables de entorno de Supabase.");
  return createServiceSupabase(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Devuelve el Google Sheets URL del cliente autenticado para una planilla.
 * Retorna null si no tiene link asignado.
 */
export async function getPlanillaUrl(
  planillaId: string,
  marcaSlug: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("planilla_urls")
      .select("sheets_url")
      .eq("cliente_id", user.id)
      .eq("planilla_id", planillaId)
      .eq("marca_slug", marcaSlug)
      .maybeSingle();

    if (error || !data) return null;
    return data.sheets_url as string;
  } catch {
    return null;
  }
}

/**
 * Devuelve todos los links de planillas de un cliente (para el admin).
 */
export async function getPlanillaUrlsDeCliente(
  clienteId: string
): Promise<Ok<{ urls: PlanillaUrl[] }> | Err> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data: clienteRow } = await supabase
    .from("clientes")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!isRolAdmin(clienteRow?.rol)) {
    return { ok: false, error: "No autorizado." };
  }

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("planilla_urls")
    .select("planilla_id, marca_slug, sheets_url")
    .eq("cliente_id", clienteId);

  if (error) {
    if (error.code === "42P01") return { ok: true, data: { urls: [] } };
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    data: {
      urls: (data ?? []).map((r) => ({
        planillaId: r.planilla_id as string,
        marcaSlug: r.marca_slug as string,
        sheetsUrl: r.sheets_url as string,
      })),
    },
  };
}

/**
 * Guarda (upsert) los links de Google Sheets de un cliente.
 * Recibe el array completo: reemplaza todos los links del cliente.
 */
export async function guardarPlanillaUrls(
  clienteId: string,
  urls: PlanillaUrl[]
): Promise<Ok<null> | Err> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data: clienteRow } = await supabase
    .from("clientes")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!isRolAdmin(clienteRow?.rol)) {
    return { ok: false, error: "No autorizado." };
  }

  const admin = createServiceClient();

  // Borra los existentes y vuelve a insertar (más simple que upsert con unique)
  const { error: delErr } = await admin
    .from("planilla_urls")
    .delete()
    .eq("cliente_id", clienteId);

  if (delErr && delErr.code !== "42P01") {
    return { ok: false, error: delErr.message };
  }

  const validUrls = urls.filter((u) => u.sheetsUrl.trim() !== "");
  if (validUrls.length === 0) return { ok: true, data: null };

  const { error: insErr } = await admin.from("planilla_urls").insert(
    validUrls.map((u) => ({
      cliente_id: clienteId,
      planilla_id: u.planillaId,
      marca_slug: u.marcaSlug,
      sheets_url: u.sheetsUrl.trim(),
    }))
  );

  if (insErr) return { ok: false, error: insErr.message };
  return { ok: true, data: null };
}
