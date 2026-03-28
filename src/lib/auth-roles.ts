/** Normaliza el rol de BD (mayúsculas, espacios, variantes) para UI y server actions. */
export function isRolAdmin(rol: unknown): boolean {
  if (rol == null) return false;
  const s = String(rol).trim().toLowerCase();
  return s === "admin";
}
