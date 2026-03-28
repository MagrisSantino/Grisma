"use server";

import { isRolAdmin } from "@/lib/auth-roles";
import type { PermisosCatalogo } from "@/lib/catalog-structure";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createServiceSupabase } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL.");
  return url;
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.");
  return key;
}

function createServiceRoleClient() {
  return createServiceSupabase(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type ClienteAdminRow = {
  id: string;
  email: string;
  nombre_local: string | null;
  permisos_catalogo: PermisosCatalogo | null;
  rol: string | null;
};

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

async function requireAdmin(): Promise<Ok<{ userId: string }> | Err> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "No autenticado." };
  }

  const { data: row, error } = await supabase
    .from("clientes")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (error || !isRolAdmin(row?.rol)) {
    return { ok: false, error: "No autorizado (se requiere rol admin)." };
  }

  return { ok: true, data: { userId: user.id } };
}

async function updateClienteAfterAuth(
  userId: string,
  patch: {
    nombre_local: string;
    permisos_catalogo: PermisosCatalogo;
    rol?: string;
  }
): Promise<Err | null> {
  const admin = createServiceRoleClient();
  const payload: Record<string, unknown> = {
    nombre_local: patch.nombre_local,
    permisos_catalogo: patch.permisos_catalogo,
  };
  if (patch.rol !== undefined) payload.rol = patch.rol;

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await admin
      .from("clientes")
      .update(payload)
      .eq("id", userId)
      .select("id")
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }
    if (data?.id) {
      return null;
    }
    await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
  }

  return {
    ok: false,
    error:
      "No se pudo actualizar la fila en clientes (¿el trigger creó el registro?).",
  };
}

export async function listarClientesAdmin(): Promise<
  Ok<{ rows: ClienteAdminRow[] }> | Err
> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const admin = createServiceRoleClient();

  const { data: clientesRows, error: cErr } = await admin
    .from("clientes")
    .select("id, nombre_local, permisos_catalogo, rol");

  if (cErr) {
    return { ok: false, error: cErr.message };
  }

  const { data: listData, error: lErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (lErr) {
    return { ok: false, error: lErr.message };
  }

  const emailById = new Map(
    listData.users.map((u) => [u.id, u.email ?? ""] as const)
  );

  const rows: ClienteAdminRow[] = (clientesRows ?? []).map((r) => ({
    id: r.id as string,
    email: emailById.get(r.id as string) ?? "",
    nombre_local: r.nombre_local as string | null,
    permisos_catalogo: (r.permisos_catalogo ?? null) as PermisosCatalogo | null,
    rol: r.rol as string | null,
  }));

  return { ok: true, data: { rows } };
}

export async function crearCliente(
  email: string,
  password: string,
  nombreLocal: string,
  permisos: PermisosCatalogo,
  rolCliente: string = "cliente"
): Promise<Ok<{ userId: string }> | Err> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate;

  const emailT = email.trim();
  const passwordT = password;
  const nombreT = nombreLocal.trim();

  if (!emailT || !passwordT || passwordT.length < 6) {
    return {
      ok: false,
      error: "Email válido y contraseña de al menos 6 caracteres.",
    };
  }

  const admin = createServiceRoleClient();

  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email: emailT,
      password: passwordT,
      email_confirm: true,
    });

  if (createErr || !created.user) {
    return {
      ok: false,
      error: createErr?.message ?? "No se pudo crear el usuario.",
    };
  }

  const userId = created.user.id;

  const upErr = await updateClienteAfterAuth(userId, {
    nombre_local: nombreT,
    permisos_catalogo: permisos,
    rol: rolCliente.trim() || "cliente",
  });

  if (upErr) {
    return upErr;
  }

  return { ok: true, data: { userId } };
}
