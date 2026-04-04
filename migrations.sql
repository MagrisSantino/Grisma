-- =============================================================================
-- GRISMA — Migraciones Supabase
-- Ejecutá este script en el Editor SQL de tu proyecto Supabase.
-- =============================================================================

-- ── stock_items ──────────────────────────────────────────────────────────────
-- Almacena el stock de cada planilla. Las columnas de talle y cantidad
-- se guardan en JSONB (ej: {"35": 8, "36": 12, "37": 15}).
-- Importás filas vía Excel/CSV desde el panel admin o con el editor SQL.

CREATE TABLE IF NOT EXISTS public.stock_items (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  planilla_id TEXT        NOT NULL,
  marca_slug  TEXT        NOT NULL,
  modelo      TEXT        NOT NULL,
  descripcion TEXT,
  color       TEXT        NOT NULL DEFAULT '',
  talles      JSONB       NOT NULL DEFAULT '{}',
  precio      NUMERIC(12, 2),
  activo      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS stock_items_planilla_idx ON public.stock_items (planilla_id, marca_slug);
CREATE INDEX IF NOT EXISTS stock_items_marca_idx    ON public.stock_items (marca_slug);

-- Row-Level Security
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer ítems activos
CREATE POLICY "authenticated_read_stock_items"
  ON public.stock_items FOR SELECT TO authenticated
  USING (activo = true);

-- Solo el service role puede insertar / actualizar / eliminar
-- (las operaciones admin usan la service role key que bypasea RLS)


-- ── pedidos ──────────────────────────────────────────────────────────────────
-- Cada fila es un pedido enviado por un cliente.
-- `items` contiene el array de CartItem serializado como JSONB.

CREATE TABLE IF NOT EXISTS public.pedidos (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id   UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  nombre_local TEXT,
  estado       TEXT        NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'revisando', 'aprobado', 'rechazado')),
  items        JSONB       NOT NULL DEFAULT '[]',
  notas        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pedidos_cliente_idx ON public.pedidos (cliente_id);
CREATE INDEX IF NOT EXISTS pedidos_estado_idx  ON public.pedidos (estado);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row-Level Security
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Clientes ven solo sus propios pedidos
CREATE POLICY "clients_select_own_pedidos"
  ON public.pedidos FOR SELECT TO authenticated
  USING (cliente_id = auth.uid());

-- Clientes pueden crear sus propios pedidos
CREATE POLICY "clients_insert_pedidos"
  ON public.pedidos FOR INSERT TO authenticated
  WITH CHECK (cliente_id = auth.uid());

-- El service role (admin) puede ver y modificar todo (bypasea RLS)


-- =============================================================================
-- DATOS DE EJEMPLO (opcional)
-- Descomentá las líneas de abajo para cargar stock de demo en la DB.
-- Si no corrés esto, la app usa datos internos de demostración.
-- =============================================================================

/*
INSERT INTO public.stock_items (planilla_id, marca_slug, modelo, color, talles, precio) VALUES
  ('p1', 'crocs', 'Classic Clog', 'Negro',  '{"35":8,"36":12,"37":15,"38":14,"39":10,"40":6,"41":4,"42":2}', 8500),
  ('p1', 'crocs', 'Classic Clog', 'Blanco', '{"35":5,"36":9,"37":12,"38":10,"39":7,"40":4,"41":2}',          8500),
  ('p1', 'crocs', 'Classic Slide','Negro',  '{"35":10,"36":15,"37":18,"38":12,"39":8,"40":5}',               6200),
  ('p1', 'reebok','Club C 85',    'Blanco / Verde','{"35":2,"36":4,"37":6,"38":5,"39":4,"40":3,"41":2,"42":1}',35000),
  ('p1', 'reebok','Classic Leather','Blanco','{"35":3,"36":5,"37":7,"38":6,"39":4,"40":3,"41":2,"42":1}',    38000);
*/
