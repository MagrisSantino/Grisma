"use server";

import { getMockStockItems, type StockItem } from "@/lib/stock-mock";
import { createClient } from "@/lib/supabase/server";

export type { StockItem };

/**
 * Devuelve los ítems de stock para una planilla.
 * Intenta leer de la tabla `stock_items` en Supabase.
 * Si la tabla no existe o está vacía, cae en datos de demo.
 */
export async function getStockItems(
  planillaId: string,
  marcaSlug: string
): Promise<StockItem[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("stock_items")
      .select("id, modelo, descripcion, color, talles, precio")
      .eq("planilla_id", planillaId)
      .eq("marca_slug", marcaSlug)
      .eq("activo", true)
      .order("modelo");

    if (error || !data || data.length === 0) {
      return getMockStockItems(planillaId, marcaSlug);
    }

    return data.map((row) => ({
      id: row.id as string,
      planillaId,
      marcaSlug,
      modelo: row.modelo as string,
      descripcion: row.descripcion as string | undefined,
      color: (row.color as string) ?? "",
      talles: (row.talles as Record<string, number>) ?? {},
      precio: row.precio as number | undefined,
    }));
  } catch {
    // tabla aún no creada → usar datos de demo
    return getMockStockItems(planillaId, marcaSlug);
  }
}
