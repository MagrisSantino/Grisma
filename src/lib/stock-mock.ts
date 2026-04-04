export type StockItem = {
  id: string;
  planillaId: string;
  marcaSlug: string;
  modelo: string;
  descripcion?: string;
  color: string;
  /** talle (e.g. "36") → unidades disponibles */
  talles: Record<string, number>;
  precio?: number;
};

/* ─── helpers ─────────────────────────────────────────────────────── */

function item(
  n: number,
  planillaId: string,
  marcaSlug: string,
  modelo: string,
  color: string,
  talles: Record<string, number>,
  precio: number,
  descripcion?: string
): StockItem {
  return {
    id: `${marcaSlug}_${planillaId}_${n}`,
    planillaId,
    marcaSlug,
    modelo,
    color,
    talles,
    precio,
    descripcion,
  };
}

/* ─── CROCS ────────────────────────────────────────────────────────── */

const CROCS_P1: StockItem[] = [
  item(1, "p1", "crocs", "Classic Clog", "Negro",
    { "35": 8, "36": 12, "37": 15, "38": 14, "39": 10, "40": 6, "41": 4, "42": 2 }, 8500),
  item(2, "p1", "crocs", "Classic Clog", "Blanco",
    { "35": 5, "36": 9, "37": 12, "38": 10, "39": 7, "40": 4, "41": 2, "42": 0 }, 8500),
  item(3, "p1", "crocs", "Classic Clog", "Navy",
    { "35": 3, "36": 6, "37": 8, "38": 9, "39": 5, "40": 3, "41": 1, "42": 0 }, 8500),
  item(4, "p1", "crocs", "Classic Clog", "Naranja Neon",
    { "35": 2, "36": 4, "37": 6, "38": 5, "39": 3, "40": 1, "41": 0, "42": 0 }, 8500),
  item(5, "p1", "crocs", "Classic Clog", "Rojo",
    { "35": 4, "36": 7, "37": 10, "38": 8, "39": 6, "40": 3, "41": 2, "42": 0 }, 8500),
  item(6, "p1", "crocs", "Classic Slide", "Negro",
    { "35": 10, "36": 15, "37": 18, "38": 12, "39": 8, "40": 5, "41": 3, "42": 0 }, 6200),
  item(7, "p1", "crocs", "Classic Slide", "Blanco",
    { "35": 7, "36": 11, "37": 14, "38": 10, "39": 6, "40": 3, "41": 0, "42": 0 }, 6200),
  item(8, "p1", "crocs", "Crocband Clog", "Azul Navy",
    { "35": 4, "36": 8, "37": 10, "38": 9, "39": 6, "40": 4, "41": 2, "42": 1 }, 9800),
  item(9, "p1", "crocs", "Crocband Clog", "Rojo",
    { "35": 3, "36": 6, "37": 8, "38": 7, "39": 4, "40": 2, "41": 1, "42": 0 }, 9800),
  item(10, "p1", "crocs", "LiteRide Clog", "Gris",
    { "35": 2, "36": 4, "37": 6, "38": 5, "39": 4, "40": 3, "41": 2, "42": 1 }, 12500),
];

const CROCS_P2: StockItem[] = CROCS_P1.map((it, i) => ({
  ...it,
  id: `crocs_p2_${i + 1}`,
  planillaId: "p2",
  precio: it.precio ? Math.round(it.precio * 0.6) : undefined,
  talles: Object.fromEntries(
    Object.entries(it.talles).map(([t, s]) => [t, Math.max(0, s - 3)])
  ),
})).filter((_, i) => i < 6);

const CROCS_P3: StockItem[] = [
  item(1, "p3", "crocs", "Classic Clog Kids", "Rosa",
    { "24": 6, "25": 8, "26": 10, "27": 9, "28": 7, "29": 5, "30": 3 }, 6500),
  item(2, "p3", "crocs", "Classic Clog Kids", "Azul",
    { "24": 4, "25": 7, "26": 9, "27": 8, "28": 6, "29": 4, "30": 2 }, 6500),
  item(3, "p3", "crocs", "Crocband Kids", "Verde",
    { "24": 3, "25": 5, "26": 7, "27": 6, "28": 4, "29": 3, "30": 1 }, 7800),
  item(4, "p3", "crocs", "Classic Clog", "Negro",
    { "35": 6, "36": 8, "37": 10, "38": 9, "39": 7, "40": 4, "41": 2 }, 8500),
  item(5, "p3", "crocs", "Classic Clog", "Blanco",
    { "35": 4, "36": 6, "37": 8, "38": 7, "39": 5, "40": 3, "41": 1 }, 8500),
];

const CROCS_P4: StockItem[] = [
  item(1, "p4", "crocs", "Jibbitz Personaje", "Variado",
    { "U": 24 }, 1200, "Pack x3 Jibbitz personajes varios"),
  item(2, "p4", "crocs", "Jibbitz Letras", "Variado",
    { "U": 18 }, 800, "Pack x5 letras"),
  item(3, "p4", "crocs", "Jibbitz Emojis", "Variado",
    { "U": 15 }, 900, "Pack x4 emojis"),
];

const CROCS_W1: StockItem[] = [
  item(1, "w1", "crocs", "Classic Lined Clog", "Negro",
    { "35": 5, "36": 8, "37": 10, "38": 9, "39": 6, "40": 4, "41": 2, "42": 1 }, 14500),
  item(2, "w1", "crocs", "Classic Lined Clog", "Gris",
    { "35": 3, "36": 6, "37": 8, "38": 7, "39": 5, "40": 3, "41": 1, "42": 0 }, 14500),
  item(3, "w1", "crocs", "Classic Lined Clog", "Marrón",
    { "35": 2, "36": 4, "37": 6, "38": 5, "39": 3, "40": 2, "41": 1, "42": 0 }, 14500),
  item(4, "w1", "crocs", "Classic All-Terrain Clog", "Oliva",
    { "35": 4, "36": 7, "37": 9, "38": 8, "39": 5, "40": 3, "41": 2, "42": 1 }, 13800),
  item(5, "w1", "crocs", "Classic All-Terrain Clog", "Negro",
    { "35": 3, "36": 5, "37": 7, "38": 6, "39": 4, "40": 2, "41": 1, "42": 0 }, 13800),
];

const CROCS_W2: StockItem[] = [
  item(1, "w2", "crocs", "Freesail Chelsea Boot", "Negro",
    { "35": 4, "36": 6, "37": 8, "38": 7, "39": 5, "40": 3, "41": 2 }, 22000),
  item(2, "w2", "crocs", "Freesail Chelsea Boot", "Marrón",
    { "35": 2, "36": 4, "37": 6, "38": 5, "39": 3, "40": 2, "41": 1 }, 22000),
  item(3, "w2", "crocs", "Classic Short Boot", "Negro",
    { "35": 3, "36": 5, "37": 7, "38": 6, "39": 4, "40": 2, "41": 1 }, 19500),
];

const CROCS_W3: StockItem[] = [
  item(1, "w3", "crocs", "Classic Lined Clog", "Bordo",
    { "35": 6, "36": 9, "37": 12, "38": 10, "39": 7, "40": 4, "41": 2, "42": 1 }, 15500),
  item(2, "w3", "crocs", "Classic Lined Flip", "Negro",
    { "35": 8, "36": 12, "37": 14, "38": 12, "39": 8, "40": 5, "41": 3 }, 10200),
  item(3, "w3", "crocs", "Classic Lined Flip", "Gris",
    { "35": 6, "36": 10, "37": 12, "38": 10, "39": 6, "40": 4, "41": 2 }, 10200),
];

/* ─── REEBOK ───────────────────────────────────────────────────────── */

const REEBOK_P1: StockItem[] = [
  item(1, "p1", "reebok", "Club C 85", "Blanco / Verde",
    { "35": 2, "36": 4, "37": 6, "38": 5, "39": 4, "40": 3, "41": 2, "42": 1 }, 35000),
  item(2, "p1", "reebok", "Club C 85", "Blanco / Rojo",
    { "35": 1, "36": 3, "37": 5, "38": 4, "39": 3, "40": 2, "41": 1, "42": 0 }, 35000),
  item(3, "p1", "reebok", "Classic Leather", "Blanco",
    { "35": 3, "36": 5, "37": 7, "38": 6, "39": 4, "40": 3, "41": 2, "42": 1 }, 38000),
  item(4, "p1", "reebok", "Classic Leather", "Negro",
    { "35": 2, "36": 4, "37": 6, "38": 5, "39": 3, "40": 2, "41": 1, "42": 0 }, 38000),
  item(5, "p1", "reebok", "Club C Legacy", "Blanco / Gris",
    { "35": 2, "36": 3, "37": 5, "38": 4, "39": 3, "40": 2, "41": 1, "42": 0 }, 32000),
  item(6, "p1", "reebok", "Nano X3", "Core Black",
    { "35": 1, "36": 3, "37": 4, "38": 5, "39": 4, "40": 3, "41": 2, "42": 1 }, 45000),
  item(7, "p1", "reebok", "Floatride Energy 5", "Azul / Blanco",
    { "36": 2, "37": 3, "38": 4, "39": 3, "40": 2, "41": 1, "42": 0 }, 52000),
  item(8, "p1", "reebok", "Flexagon Force 4", "Negro / Rojo",
    { "35": 1, "36": 2, "37": 4, "38": 5, "39": 4, "40": 3, "41": 2, "42": 1 }, 48000),
];

const REEBOK_P2: StockItem[] = REEBOK_P1.map((it, i) => ({
  ...it,
  id: `reebok_p2_${i + 1}`,
  planillaId: "p2",
  precio: it.precio ? Math.round(it.precio * 0.6) : undefined,
  talles: Object.fromEntries(
    Object.entries(it.talles).map(([t, s]) => [t, Math.max(0, s - 2)])
  ),
})).filter((_, i) => i < 5);

const REEBOK_W1: StockItem[] = [
  item(1, "w1", "reebok", "Club C Clean MR", "Blanco",
    { "35": 2, "36": 3, "37": 4, "38": 3, "39": 2, "40": 1, "41": 0 }, 42000),
  item(2, "w1", "reebok", "Floatzig 1", "Core Black",
    { "36": 1, "37": 3, "38": 4, "39": 3, "40": 2, "41": 1, "42": 0 }, 58000),
  item(3, "w1", "reebok", "Nano X4", "Blue / White",
    { "35": 1, "36": 2, "37": 3, "38": 4, "39": 3, "40": 2, "41": 1 }, 55000),
];

const REEBOK_W2: StockItem[] = [
  item(1, "w2", "reebok", "Classic Boot", "Negro",
    { "35": 2, "36": 3, "37": 4, "38": 3, "39": 2, "40": 1, "41": 0 }, 62000),
  item(2, "w2", "reebok", "Classic Boot", "Marrón",
    { "35": 1, "36": 2, "37": 3, "38": 2, "39": 1, "40": 0 }, 62000),
];

/* ─── KAPPA ────────────────────────────────────────────────────────── */

const KAPPA_P1: StockItem[] = [
  item(1, "p1", "kappa", "Authentic Plus", "Negro / Blanco",
    { "35": 6, "36": 10, "37": 12, "38": 11, "39": 8, "40": 5, "41": 3, "42": 2 }, 28000),
  item(2, "p1", "kappa", "Authentic Plus", "Blanco / Azul",
    { "35": 4, "36": 8, "37": 10, "38": 9, "39": 6, "40": 4, "41": 2, "42": 1 }, 28000),
  item(3, "p1", "kappa", "Banda Rossi", "Negro / Rojo",
    { "35": 5, "36": 9, "37": 11, "38": 10, "39": 7, "40": 4, "41": 2, "42": 1 }, 25000),
  item(4, "p1", "kappa", "Banda Rossi", "Blanco / Negro",
    { "35": 3, "36": 6, "37": 8, "38": 7, "39": 5, "40": 3, "41": 1, "42": 0 }, 25000),
  item(5, "p1", "kappa", "Logo Akeen", "Negro",
    { "35": 4, "36": 7, "37": 9, "38": 8, "39": 5, "40": 3, "41": 2, "42": 1 }, 22000),
  item(6, "p1", "kappa", "Logo Akeen", "Blanco",
    { "35": 3, "36": 6, "37": 8, "38": 7, "39": 4, "40": 2, "41": 1, "42": 0 }, 22000),
  item(7, "p1", "kappa", "Sabara Classic", "Negro / Plata",
    { "35": 2, "36": 5, "37": 7, "38": 6, "39": 4, "40": 3, "41": 2, "42": 1 }, 30000),
];

const KAPPA_P2: StockItem[] = KAPPA_P1.map((it, i) => ({
  ...it,
  id: `kappa_p2_${i + 1}`,
  planillaId: "p2",
  precio: it.precio ? Math.round(it.precio * 0.6) : undefined,
  talles: Object.fromEntries(
    Object.entries(it.talles).map(([t, s]) => [t, Math.max(0, s - 2)])
  ),
})).filter((_, i) => i < 5);

const KAPPA_W1: StockItem[] = [
  item(1, "w1", "kappa", "Authentic Warm", "Negro",
    { "35": 3, "36": 5, "37": 7, "38": 6, "39": 4, "40": 2, "41": 1 }, 32000),
  item(2, "w1", "kappa", "Banda Boot", "Negro / Rojo",
    { "35": 2, "36": 4, "37": 6, "38": 5, "39": 3, "40": 2, "41": 1 }, 38000),
];

/* ─── COLUMBIA ─────────────────────────────────────────────────────── */

const COLUMBIA_P1: StockItem[] = [
  item(1, "p1", "columbia", "Newton Ridge Plus II", "Gris / Negro",
    { "35": 3, "36": 5, "37": 7, "38": 6, "39": 4, "40": 3, "41": 2, "42": 1 }, 55000),
  item(2, "p1", "columbia", "Newton Ridge Plus II", "Marrón / Tan",
    { "35": 2, "36": 4, "37": 6, "38": 5, "39": 3, "40": 2, "41": 1, "42": 0 }, 55000),
  item(3, "p1", "columbia", "Redmond V3", "Negro",
    { "35": 4, "36": 6, "37": 8, "38": 7, "39": 5, "40": 3, "41": 2, "42": 1 }, 48000),
  item(4, "p1", "columbia", "Redmond V3", "Azul / Gris",
    { "35": 3, "36": 5, "37": 7, "38": 6, "39": 4, "40": 2, "41": 1, "42": 0 }, 48000),
  item(5, "p1", "columbia", "Vitesse Outdry", "Verde Oliva",
    { "35": 2, "36": 4, "37": 5, "38": 4, "39": 3, "40": 2, "41": 1, "42": 0 }, 62000),
  item(6, "p1", "columbia", "Facet 75 Outdry", "Negro / Blanco",
    { "35": 1, "36": 3, "37": 4, "38": 5, "39": 4, "40": 3, "41": 2, "42": 1 }, 72000),
];

const COLUMBIA_P2: StockItem[] = COLUMBIA_P1.map((it, i) => ({
  ...it,
  id: `columbia_p2_${i + 1}`,
  planillaId: "p2",
  precio: it.precio ? Math.round(it.precio * 0.6) : undefined,
  talles: Object.fromEntries(
    Object.entries(it.talles).map(([t, s]) => [t, Math.max(0, s - 2)])
  ),
})).filter((_, i) => i < 4);

const COLUMBIA_W1: StockItem[] = [
  item(1, "w1", "columbia", "Bugaboot III", "Negro",
    { "35": 3, "36": 5, "37": 6, "38": 5, "39": 4, "40": 3, "41": 2, "42": 1 }, 85000),
  item(2, "w1", "columbia", "Bugaboot III", "Azul / Gris",
    { "35": 2, "36": 3, "37": 5, "38": 4, "39": 3, "40": 2, "41": 1, "42": 0 }, 85000),
  item(3, "w1", "columbia", "Minx Mid III Omni-Heat", "Negro",
    { "35": 2, "36": 4, "37": 5, "38": 4, "39": 3, "40": 2, "41": 1 }, 78000),
  item(4, "w1", "columbia", "Rope Tow Shorty", "Gris / Plata",
    { "35": 1, "36": 3, "37": 4, "38": 3, "39": 2, "40": 1, "41": 0 }, 68000),
];

const COLUMBIA_W2: StockItem[] = [
  item(1, "w2", "columbia", "Newton Ridge WP", "Camouflage",
    { "38": 2, "39": 3, "40": 4, "41": 3, "42": 2, "43": 1, "44": 0 }, 60000),
  item(2, "w2", "columbia", "Redmond V3 WP", "Negro / Rojo",
    { "38": 3, "39": 4, "40": 5, "41": 4, "42": 3, "43": 2, "44": 1 }, 52000),
  item(3, "w2", "columbia", "Facet 75 Trail", "Verde Oliva",
    { "38": 1, "39": 2, "40": 3, "41": 2, "42": 1, "43": 0 }, 68000),
];

/* ─── lookup map ───────────────────────────────────────────────────── */

const MOCK_MAP: Record<string, StockItem[]> = {
  "crocs::p1": CROCS_P1,
  "crocs::p2": CROCS_P2,
  "crocs::p3": CROCS_P3,
  "crocs::p4": CROCS_P4,
  "crocs::w1": CROCS_W1,
  "crocs::w2": CROCS_W2,
  "crocs::w3": CROCS_W3,
  "reebok::p1": REEBOK_P1,
  "reebok::p2": REEBOK_P2,
  "reebok::w1": REEBOK_W1,
  "reebok::w2": REEBOK_W2,
  "kappa::p1": KAPPA_P1,
  "kappa::p2": KAPPA_P2,
  "kappa::w1": KAPPA_W1,
  "columbia::p1": COLUMBIA_P1,
  "columbia::p2": COLUMBIA_P2,
  "columbia::w1": COLUMBIA_W1,
  "columbia::w2": COLUMBIA_W2,
};

/** Returns mock stock items for a given planilla, falling back to a generic set. */
export function getMockStockItems(
  planillaId: string,
  marcaSlug: string
): StockItem[] {
  const key = `${marcaSlug}::${planillaId}`;
  if (MOCK_MAP[key]) return MOCK_MAP[key];

  // Generic fallback using the first known planilla for this brand
  const brandKeys = Object.keys(MOCK_MAP).filter((k) =>
    k.startsWith(`${marcaSlug}::`)
  );
  if (brandKeys.length > 0) {
    return (MOCK_MAP[brandKeys[0]] ?? []).map((it, i) => ({
      ...it,
      id: `${marcaSlug}_${planillaId}_${i + 1}`,
      planillaId,
    }));
  }

  return [];
}
