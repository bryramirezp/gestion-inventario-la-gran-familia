-- ============================================================================
-- SCRIPT DE POBLACIÓN DE DATOS: Sistema de Gestión de Inventario "La Gran Familia"
-- ============================================================================
-- Versión: 2.0 (Sincronizado con database-schema-synced-with-code.sql)
-- Fecha: Diciembre 2024
-- 
-- Este script inserta datos básicos necesarios para el funcionamiento del sistema.
-- Ejecutar después de database-schema-synced-with-code.sql
-- 
-- NOTA: Este script es IDEMPOTENTE (usa ON CONFLICT DO NOTHING)
--       Puede ejecutarse múltiples veces sin errores.
-- ============================================================================

-- ============================================================================
-- ROLES
-- ============================================================================

INSERT INTO public.roles (role_name, is_active) VALUES 
  ('Administrador', TRUE),
  ('Operador', TRUE),
  ('Consultor', TRUE)
ON CONFLICT (role_name) DO NOTHING;

-- ============================================================================
-- ALMACENES
-- ============================================================================

INSERT INTO public.warehouses (warehouse_name, location_description, is_active) VALUES
  ('Bodega Central', 'Almacén principal de la organización', TRUE),
  ('Farmacia', 'Productos médicos y de higiene', TRUE),
  ('Ropa', 'Almacén de textiles y calzado', TRUE),
  ('Alimentos', 'Almacén de productos alimenticios', TRUE),
  ('Bodega Secundaria', 'Almacén auxiliar', TRUE)
ON CONFLICT (warehouse_name) DO NOTHING;

INSERT INTO public.warehouses (warehouse_id, warehouse_name, location_description, is_active) 
OVERRIDING SYSTEM VALUE
VALUES
  (999, 'Almacén de Caducados', 'Almacén para productos caducados', TRUE)
ON CONFLICT (warehouse_id) DO NOTHING;

-- ============================================================================
-- CATEGORÍAS
-- ============================================================================

INSERT INTO public.categories (category_name, is_active) VALUES
  ('Alimentos básicos', TRUE),
  ('Enlatados y conservas', TRUE),
  ('Productos refrigerados y perecederos', TRUE),
  ('Frutas y verduras', TRUE),
  ('Panadería y repostería', TRUE),
  ('Bebidas', TRUE),
  ('Limpieza del hogar', TRUE),
  ('Higiene y cuidado personal', TRUE),
  ('Papelería y oficina', TRUE),
  ('Textiles y hogar', TRUE),
  ('Regalos y temporadas', TRUE),
  ('Otros productos', TRUE)
ON CONFLICT (category_name) DO NOTHING;

-- ============================================================================
-- UNIDADES DE MEDIDA
-- ============================================================================
-- Peso, Volumen, Unidad/Pieza, Longitud, Otros

INSERT INTO public.units (unit_name, abbreviation, is_active) VALUES
  -- === PESO ===
  ('Gramo', 'g', TRUE),
  ('Kilogramo', 'kg', TRUE),
  ('Libra', 'lb', TRUE),
  ('Tonelada', 't', TRUE),
  -- === VOLUMEN ===
  ('Mililitro', 'ml', TRUE),
  ('Litro', 'L', TRUE),
  ('Galón', 'gal', TRUE),
  -- === UNIDAD / PIEZA ===
  ('Unidad', 'u', TRUE),
  ('Pieza', 'pz', TRUE),
  ('Paquete', 'paq', TRUE),
  ('Caja', 'cj', TRUE),
  ('Docena', 'dz', TRUE),
  -- === LONGITUD (por si se requiere en productos específicos) ===
  ('Metro', 'm', TRUE),
  ('Centímetro', 'cm', TRUE),
  -- === OTROS ===
  ('Botella', 'bot', TRUE),
  ('Lata', 'lat', TRUE),
  ('Bolsa', 'bol', TRUE),
  ('Sobre', 'sob', TRUE)
ON CONFLICT (unit_name) DO NOTHING;

-- ============================================================================
-- TIPOS DE DONANTES
-- ============================================================================

INSERT INTO public.donor_types (type_name, description, is_active) VALUES
  ('Aportaciones por familia', 'Apoyo de familias', TRUE),
  ('Empresas con recibo', 'Con factura fiscal', TRUE),
  ('Empresas sin recibo', 'Sin comprobante fiscal', TRUE),
  ('Particulares', 'Donante individual', TRUE),
  ('Fundaciones', 'Organismo benéfico', TRUE),
  ('Universidades', 'Institución educativa', TRUE),
  ('Gobierno', 'Entidad pública', TRUE),
  ('Anónimo', 'Donante no identificado', TRUE)
ON CONFLICT (type_name) DO NOTHING;

-- ============================================================================
-- TIPOS DE TRANSACCIÓN
-- ============================================================================
-- Nota: Esta tabla se mantiene para uso futuro. Actualmente no se utiliza
-- en el código, pero puede ser útil para categorizar diferentes tipos de transacciones.

INSERT INTO public.transaction_types (type_name, is_active) VALUES
  ('Entrada', TRUE),
  ('Salida', TRUE),
  ('Transferencia', TRUE),
  ('Ajuste', TRUE)
ON CONFLICT (type_name) DO NOTHING;

-- ============================================================================
-- MARCAS
-- ============================================================================

INSERT INTO public.brands (brand_name, is_active) VALUES
  ('Genérico', TRUE),
  ('Sin marca', TRUE),
  ('Marca propia', TRUE)
ON CONFLICT (brand_name) DO NOTHING;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 
-- 1. Los usuarios (users) se crean automáticamente mediante el trigger
--    cuando se crean usuarios en Supabase Auth. No es necesario insertarlos
--    manualmente aquí.
--
-- 2. Los productos, donantes, lotes de stock, etc. se deben crear mediante
--    la interfaz de la aplicación o mediante scripts de migración específicos.
--
-- 3. Este script usa ON CONFLICT DO NOTHING para evitar errores si los datos
--    ya existen, lo que permite ejecutarlo múltiples veces de forma segura.
--
-- 4. Para un entorno de producción, considera agregar más datos de ejemplo
--    como productos, donantes de prueba, etc., según tus necesidades.
--
-- ============================================================================

COMMENT ON TABLE public.roles IS 'Roles del sistema: Administrador, Operador, Consultor';
COMMENT ON TABLE public.warehouses IS 'Almacenes físicos donde se guarda el inventario';
COMMENT ON TABLE public.categories IS 'Categorías de productos para organización';
COMMENT ON TABLE public.units IS 'Unidades de medida para productos';
COMMENT ON TABLE public.donor_types IS 'Tipos de donantes que pueden realizar donaciones';

-- ============================================================================
-- FIN DEL SCRIPT DE POBLACIÓN
-- ============================================================================

