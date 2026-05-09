-- ============================================================
-- MIGRACIÓN: MongoDB → Supabase (PostgreSQL)
-- InventApp - TEMU Clone
-- Ejecutar en: SQL Editor de Supabase
-- ============================================================

-- 0. PERMISOS para el rol anon
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;

-- 1. TABLA: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('usuario', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 2. TABLA: productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  precio_original DECIMAL(10,2) CHECK (precio_original >= 0),
  descuento INTEGER DEFAULT 0 CHECK (descuento >= 0 AND descuento <= 100),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unidad TEXT DEFAULT 'unidad',
  imagen TEXT DEFAULT 'https://via.placeholder.com/300',
  imagenes TEXT[] DEFAULT '{}',
  destacado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;

-- 3. TABLA: ordenes
CREATE TABLE IF NOT EXISTS ordenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  total DECIMAL(10,2) NOT NULL,
  direccion_envio TEXT NOT NULL,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('tarjeta', 'yape', 'plin', 'contraentrega')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'pagado', 'enviado', 'entregado', 'cancelado')),
  estado_pago TEXT DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'en_proceso', 'verificando', 'pagado', 'rechazado')),
  comprobante_pago TEXT,
  fecha_pago TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ordenes DISABLE ROW LEVEL SECURITY;

-- 4. TABLA: orden_productos (detalle de cada orden)
CREATE TABLE IF NOT EXISTS orden_productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio DECIMAL(10,2) NOT NULL
);
ALTER TABLE orden_productos DISABLE ROW LEVEL SECURITY;

-- 5. TABLA: config
CREATE TABLE IF NOT EXISTS config (
  clave TEXT PRIMARY KEY,
  valor TEXT,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE config DISABLE ROW LEVEL SECURITY;

-- 6. FUNCIÓN: calcular valor total del inventario
CREATE OR REPLACE FUNCTION calcular_valor_inventario()
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(precio * stock), 0) INTO total FROM productos WHERE activo = true;
  RETURN total;
END;
$$;

-- 7. ÍNDICES para rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario ON ordenes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado_pago ON ordenes(estado_pago);
CREATE INDEX IF NOT EXISTS idx_orden_productos_orden ON orden_productos(orden_id);

-- 8. SEED: admin por defecto (password: admin123)
INSERT INTO usuarios (nombre, email, password, rol)
VALUES ('Administrador', 'admin@temu.com', '$2b$10$qxhDqEVs8OFGKzfDChQWYOGtMWI95FQV7UNxJDYbeyVqF6Kz8XZYq', 'admin')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, nombre = EXCLUDED.nombre;

-- ============================================================
-- PASO ADICIONAL: Crear bucket de Storage para imágenes
-- Ve a Storage → Create bucket → nombre: "inventapp"
--   → Public bucket: ON
-- ============================================================
