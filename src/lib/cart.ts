export type CartItem = {
  /** Unique key: planillaId::stockItemId::talle */
  id: string;
  planillaId: string;
  planillaTitle: string;
  marcaSlug: string;
  marcaName: string;
  stockItemId: string;
  modelo: string;
  color?: string;
  talle: string;
  cantidad: number;
  precio?: number;
};

const STORAGE_KEY = "grisma_cart_v1";

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export function persistCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // quota exceeded – ignore
  }
}

export function makeCartItemId(
  planillaId: string,
  stockItemId: string,
  talle: string
): string {
  return `${planillaId}::${stockItemId}::${talle}`;
}
