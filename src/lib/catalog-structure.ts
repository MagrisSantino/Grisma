/**
 * Jerarquía base del catálogo (Marca → Sección → Planilla) para permisos y UI admin.
 * Alineado con la estructura mock de Crocs en la vista marca; el resto de marcas
 * reutiliza la misma forma de árbol con IDs estables por marca.
 */

export type CatalogPlanilla = { id: string; title: string };
export type CatalogSection = {
  id: string;
  title: string;
  planillas: CatalogPlanilla[];
};
export type CatalogMarca = {
  slug: string;
  name: string;
  sections: CatalogSection[];
};

/** Permisos persistidos: marca → sección → ids de planillas visibles. */
export type PermisosCatalogo = Record<string, Record<string, string[]>>;

const SECCIONES_CROCS_TEMPLATE: CatalogSection[] = [
  {
    id: "promociones",
    title: "Promociones Vigentes",
    planillas: [
      { id: "p1", title: "Stock Classic Colors" },
      { id: "p2", title: "Outlet Verano 40%" },
      { id: "p3", title: "Pack Familiar" },
      { id: "p4", title: "Jibbitz & Accesorios" },
    ],
  },
  {
    id: "invierno",
    title: "Temporada Invierno",
    planillas: [
      { id: "w1", title: "Línea Lined & Warm" },
      { id: "w2", title: "Boots All Terrain" },
      { id: "w3", title: "Clogs Resistentes al frío" },
    ],
  },
];

function seccionesForMarca(): CatalogSection[] {
  return SECCIONES_CROCS_TEMPLATE.map((s) => ({
    ...s,
    planillas: s.planillas.map((p) => ({ ...p })),
  }));
}

export const CATALOGO_BASE: CatalogMarca[] = [
  { slug: "reebok", name: "Reebok", sections: seccionesForMarca() },
  { slug: "kappa", name: "Kappa", sections: seccionesForMarca() },
  { slug: "crocs", name: "Crocs", sections: seccionesForMarca() },
  { slug: "columbia", name: "Columbia", sections: seccionesForMarca() },
];

export function emptyPermisos(): PermisosCatalogo {
  return {};
}

export function permisosFullAccess(): PermisosCatalogo {
  const out: PermisosCatalogo = {};
  for (const m of CATALOGO_BASE) {
    out[m.slug] = {};
    for (const s of m.sections) {
      out[m.slug][s.id] = s.planillas.map((p) => p.id);
    }
  }
  return out;
}
