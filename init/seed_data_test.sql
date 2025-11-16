-- ============================================================================
-- SCRIPT DE DATOS DE PRUEBA: Sistema de Gestión de Inventario "La Gran Familia"
-- ============================================================================
-- Versión: 2.0 (Sincronizado con database-schema-synced-with-code.sql)
-- Fecha: Diciembre 2024
-- 
-- Este script inserta datos de prueba para visualizar el sistema con inventario
-- completo y operativo. Incluye donantes, productos, donaciones históricas y
-- lotes de stock distribuidos en diferentes almacenes.
-- 
-- IMPORTANTE: Ejecutar DESPUÉS de:
--             1. database-schema-synced-with-code.sql
--             2. seed_data.sql (datos base: roles, categorías, unidades, movement_types, etc.)
--             3. rls_policies.sql (políticas de seguridad)
--             4. grant_permissions.sql (permisos)
--             5. functions/*.sql (funciones como create_donation_atomic)
-- 
-- NOTA: Este script es IDEMPOTENTE (usa ON CONFLICT DO NOTHING)
--       Puede ejecutarse múltiples veces sin errores.
-- ============================================================================

-- ============================================================================
-- DONANTES
-- ============================================================================

INSERT INTO public.donors (donor_name, donor_type_id, contact_person, phone, email, address) VALUES
  -- Empresas con recibo
  ('Supermercado La Esperanza S.A.', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Empresas con recibo'), 'María González', '555-0101', 'contacto@laesperanza.com', 'Av. Principal 123, Ciudad'),
  ('Distribuidora Alimentos del Norte', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Empresas con recibo'), 'Carlos Ramírez', '555-0102', 'ventas@alimentosnorte.com', 'Calle Comercial 456, Zona Industrial'),
  ('Farmacia San José', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Empresas con recibo'), 'Ana Martínez', '555-0103', 'info@farmaciasanjose.com', 'Boulevard Central 789'),
  ('Panadería El Buen Pan', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Empresas con recibo'), 'Roberto Sánchez', '555-0104', 'pedidos@elbuenpan.com', 'Av. Panaderos 321'),
  
  -- Empresas sin recibo
  ('Tienda de Abarrotes Doña Rosa', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Empresas sin recibo'), 'Rosa Hernández', '555-0201', NULL, 'Mercado Central, Local 15'),
  ('Carnicería La Frontera', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Empresas sin recibo'), 'Luis Fernández', '555-0202', NULL, 'Calle del Mercado 22'),
  ('Verdulería Fresca', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Empresas sin recibo'), 'Carmen López', '555-0203', NULL, 'Plaza del Sol, Stand 8'),
  
  -- Particulares
  ('Familia García', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Particulares'), 'Juan García', '555-0301', 'juan.garcia@email.com', 'Colonia Residencial, Calle 5 #12'),
  ('María Elena Pérez', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Particulares'), 'María Elena Pérez', '555-0302', 'maria.perez@email.com', 'Barrio San Miguel, Av. Flores 45'),
  ('Don Pedro Morales', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Particulares'), 'Pedro Morales', '555-0303', NULL, 'Zona Centro, Calle Principal 78'),
  ('Familia Rodríguez', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Particulares'), 'Laura Rodríguez', '555-0304', 'laura.rodriguez@email.com', 'Fraccionamiento Las Flores, Casa 23'),
  
  -- Fundaciones
  ('Fundación Ayuda Comunitaria', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Fundaciones'), 'Dr. Fernando Torres', '555-0401', 'contacto@ayudacomunitaria.org', 'Oficinas Centrales, Piso 3'),
  ('Asociación Solidaridad', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Fundaciones'), 'Lic. Patricia Vega', '555-0402', 'info@solidaridad.org', 'Centro de Operaciones, Edificio A'),
  ('Fundación Esperanza', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Fundaciones'), 'Ing. Miguel Ángel', '555-0403', 'donaciones@esperanza.org', 'Sede Principal, Av. Benéfica 100'),
  
  -- Universidades
  ('Universidad Nacional', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Universidades'), 'Dra. Silvia Mendoza', '555-0501', 'extension@universidad.edu', 'Campus Central, Edificio Administrativo'),
  ('Instituto Tecnológico Regional', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Universidades'), 'Mtro. José Luis', '555-0502', 'vinculacion@tecnologico.edu', 'Campus Norte, Oficina 205'),
  
  -- Gobierno
  ('Secretaría de Desarrollo Social', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Gobierno'), 'Lic. Adriana Contreras', '555-0601', 'desarrollo@gobernacion.gob', 'Palacio de Gobierno, Piso 2'),
  ('DIF Municipal', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Gobierno'), 'Sra. Carmen Díaz', '555-0602', 'donaciones@difmunicipal.gob', 'Oficinas DIF, Av. Municipal 50'),
  
  -- Aportaciones por familia
  ('Grupo de Familias Solidarias', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Aportaciones por familia'), 'Coordinadora: Sofía Ramírez', '555-0701', 'familias@solidarias.org', 'Centro Comunitario, Salón Principal'),
  ('Red de Apoyo Familiar', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Aportaciones por familia'), 'Coordinador: Andrés Castro', '555-0702', 'red@apoyofamiliar.org', 'Sede Comunitaria, Local 3'),
  ('Familias Unidas', (SELECT donor_type_id FROM public.donor_types WHERE type_name = 'Aportaciones por familia'), 'Coordinadora: Elena Morales', '555-0703', NULL, 'Parroquia San José, Salón Parroquial')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PRODUCTOS
-- ============================================================================

INSERT INTO public.products (product_name, sku, description, category_id, brand_id, official_unit_id, low_stock_threshold) VALUES
  -- Alimentos básicos
  ('Arroz blanco', 'ARZ-001', 'Arroz blanco de grano largo', (SELECT category_id FROM public.categories WHERE category_name = 'Alimentos básicos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 50.00),
  ('Frijoles negros', 'FRJ-001', 'Frijoles negros secos', (SELECT category_id FROM public.categories WHERE category_name = 'Alimentos básicos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 30.00),
  ('Azúcar blanca', 'AZU-001', 'Azúcar refinada', (SELECT category_id FROM public.categories WHERE category_name = 'Alimentos básicos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 40.00),
  ('Aceite vegetal', 'ACE-001', 'Aceite de cocina', (SELECT category_id FROM public.categories WHERE category_name = 'Alimentos básicos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'L'), 25.00),
  ('Sal de mesa', 'SAL-001', 'Sal refinada', (SELECT category_id FROM public.categories WHERE category_name = 'Alimentos básicos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 20.00),
  ('Harina de trigo', 'HAR-001', 'Harina para panadería', (SELECT category_id FROM public.categories WHERE category_name = 'Alimentos básicos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 35.00),
  ('Pasta de fideos', 'PAS-001', 'Fideos tipo espagueti', (SELECT category_id FROM public.categories WHERE category_name = 'Alimentos básicos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'paq'), 50.00),
  
  -- Enlatados y conservas
  ('Atún enlatado', 'ATU-001', 'Atún en agua', (SELECT category_id FROM public.categories WHERE category_name = 'Enlatados y conservas'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'lat'), 100.00),
  ('Sardinas enlatadas', 'SAR-001', 'Sardinas en aceite', (SELECT category_id FROM public.categories WHERE category_name = 'Enlatados y conservas'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'lat'), 80.00),
  ('Frijoles enlatados', 'FRJ-002', 'Frijoles refritos enlatados', (SELECT category_id FROM public.categories WHERE category_name = 'Enlatados y conservas'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'lat'), 60.00),
  ('Maíz enlatado', 'MAI-001', 'Granos de elote enlatados', (SELECT category_id FROM public.categories WHERE category_name = 'Enlatados y conservas'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'lat'), 50.00),
  ('Chiles enlatados', 'CHI-001', 'Chiles jalapeños enlatados', (SELECT category_id FROM public.categories WHERE category_name = 'Enlatados y conservas'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'lat'), 40.00),
  
  -- Productos refrigerados y perecederos
  ('Leche entera', 'LEC-001', 'Leche pasteurizada', (SELECT category_id FROM public.categories WHERE category_name = 'Productos refrigerados y perecederos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'L'), 30.00),
  ('Queso fresco', 'QUE-001', 'Queso tipo panela', (SELECT category_id FROM public.categories WHERE category_name = 'Productos refrigerados y perecederos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 20.00),
  ('Huevos', 'HUE-001', 'Huevos de gallina', (SELECT category_id FROM public.categories WHERE category_name = 'Productos refrigerados y perecederos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'dz'), 25.00),
  ('Mantequilla', 'MAN-001', 'Mantequilla sin sal', (SELECT category_id FROM public.categories WHERE category_name = 'Productos refrigerados y perecederos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 15.00),
  
  -- Frutas y verduras
  ('Manzanas', NULL, 'Manzanas rojas', (SELECT category_id FROM public.categories WHERE category_name = 'Frutas y verduras'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 30.00),
  ('Plátanos', NULL, 'Plátanos macho', (SELECT category_id FROM public.categories WHERE category_name = 'Frutas y verduras'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 25.00),
  ('Zanahorias', NULL, 'Zanahorias frescas', (SELECT category_id FROM public.categories WHERE category_name = 'Frutas y verduras'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 20.00),
  ('Papas', NULL, 'Papas para cocinar', (SELECT category_id FROM public.categories WHERE category_name = 'Frutas y verduras'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 40.00),
  ('Cebollas', NULL, 'Cebollas blancas', (SELECT category_id FROM public.categories WHERE category_name = 'Frutas y verduras'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'kg'), 30.00),
  
  -- Bebidas
  ('Agua embotellada', 'AGU-001', 'Agua purificada 500ml', (SELECT category_id FROM public.categories WHERE category_name = 'Bebidas'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'bot'), 200.00),
  ('Jugo de naranja', 'JUG-001', 'Jugo de naranja natural', (SELECT category_id FROM public.categories WHERE category_name = 'Bebidas'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'L'), 40.00),
  ('Refresco cola', 'REF-001', 'Refresco de cola', (SELECT category_id FROM public.categories WHERE category_name = 'Bebidas'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'L'), 50.00),
  
  -- Limpieza del hogar
  ('Detergente líquido', 'DET-001', 'Detergente para ropa', (SELECT category_id FROM public.categories WHERE category_name = 'Limpieza del hogar'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'L'), 30.00),
  ('Jabón de barra', 'JAB-001', 'Jabón para lavar ropa', (SELECT category_id FROM public.categories WHERE category_name = 'Limpieza del hogar'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'pz'), 50.00),
  ('Cloro', 'CLO-001', 'Cloro líquido', (SELECT category_id FROM public.categories WHERE category_name = 'Limpieza del hogar'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'L'), 20.00),
  ('Escoba', 'ESC-001', 'Escoba de plástico', (SELECT category_id FROM public.categories WHERE category_name = 'Limpieza del hogar'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'pz'), 10.00),
  ('Trapeador', 'TRA-001', 'Trapeador con cubeta', (SELECT category_id FROM public.categories WHERE category_name = 'Limpieza del hogar'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'pz'), 8.00),
  
  -- Higiene y cuidado personal
  ('Shampoo', 'SHA-001', 'Shampoo para cabello normal', (SELECT category_id FROM public.categories WHERE category_name = 'Higiene y cuidado personal'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'bot'), 40.00),
  ('Pasta dental', 'PAS-002', 'Pasta de dientes', (SELECT category_id FROM public.categories WHERE category_name = 'Higiene y cuidado personal'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'pz'), 50.00),
  ('Jabón de baño', 'JAB-002', 'Jabón de tocador', (SELECT category_id FROM public.categories WHERE category_name = 'Higiene y cuidado personal'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'pz'), 60.00),
  ('Papel higiénico', 'PAP-001', 'Papel higiénico 4 rollos', (SELECT category_id FROM public.categories WHERE category_name = 'Higiene y cuidado personal'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'paq'), 30.00),
  ('Toallas sanitarias', 'TOA-001', 'Toallas sanitarias', (SELECT category_id FROM public.categories WHERE category_name = 'Higiene y cuidado personal'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'paq'), 25.00),
  
  -- Textiles y hogar
  ('Camisetas', NULL, 'Camisetas de algodón', (SELECT category_id FROM public.categories WHERE category_name = 'Textiles y hogar'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'pz'), 20.00),
  ('Pantalones', NULL, 'Pantalones de mezclilla', (SELECT category_id FROM public.categories WHERE category_name = 'Textiles y hogar'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'pz'), 15.00),
  ('Zapatos deportivos', NULL, 'Zapatos deportivos varios tallas', (SELECT category_id FROM public.categories WHERE category_name = 'Textiles y hogar'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'pz'), 10.00),
  ('Cobijas', NULL, 'Cobijas de algodón', (SELECT category_id FROM public.categories WHERE category_name = 'Textiles y hogar'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'pz'), 12.00),
  
  -- Otros productos
  ('Bolsas de plástico', 'BOL-001', 'Bolsas reutilizables', (SELECT category_id FROM public.categories WHERE category_name = 'Otros productos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Genérico'), (SELECT unit_id FROM public.units WHERE abbreviation = 'bol'), 100.00),
  ('Velas', 'VEL-001', 'Velas de parafina', (SELECT category_id FROM public.categories WHERE category_name = 'Otros productos'), (SELECT brand_id FROM public.brands WHERE brand_name = 'Sin marca'), (SELECT unit_id FROM public.units WHERE abbreviation = 'pz'), 50.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DONACIONES (simulación directa sin autenticación)
-- ============================================================================
-- Las donaciones se crean directamente en SQL sin usar create_donation_atomic
-- porque los scripts SQL no tienen contexto de autenticación (auth.uid() es NULL).
-- Simulamos la misma lógica de la función:
--   - donation_transactions (con market_value y actual_value)
--   - donation_items
--   - stock_lots
--   - stock_movements (movimiento ENTRADA automático para cada lote)
-- NOTA: Usamos el UUID del administrador (ea2db40d-abd3-4969-871e-1e2f4c9eaadc) como created_by

-- Donación 1: Supermercado La Esperanza - Alimentos básicos (hace 5 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_arroz_id BIGINT;
  v_frijoles_id BIGINT;
  v_azucar_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Supermercado La Esperanza S.A.';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_arroz_id FROM public.products WHERE product_name = 'Arroz blanco';
  SELECT product_id INTO v_frijoles_id FROM public.products WHERE product_name = 'Frijoles negros';
  SELECT product_id INTO v_azucar_id FROM public.products WHERE product_name = 'Azúcar blanca';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '5 months')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Arroz
  v_market_total := 500 * 25.50;
  v_actual_total := 500 * 20.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_arroz_id, 500, 25.50, 20.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_arroz_id, v_warehouse_id, 500, v_donation_date::TIMESTAMPTZ, NULL, 20.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 500, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Frijoles
  v_market_total := 300 * 30.00;
  v_actual_total := 300 * 25.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_frijoles_id, 300, 30.00, 25.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_frijoles_id, v_warehouse_id, 300, v_donation_date::TIMESTAMPTZ, NULL, 25.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 300, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 3: Azúcar
  v_market_total := 200 * 18.00;
  v_actual_total := 200 * 15.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_azucar_id, 200, 18.00, 15.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_azucar_id, v_warehouse_id, 200, v_donation_date::TIMESTAMPTZ, NULL, 15.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 200, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 2: Distribuidora Alimentos del Norte - Enlatados (hace 4 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_atun_id BIGINT;
  v_sardinas_id BIGINT;
  v_frijoles_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Distribuidora Alimentos del Norte';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_atun_id FROM public.products WHERE product_name = 'Atún enlatado';
  SELECT product_id INTO v_sardinas_id FROM public.products WHERE product_name = 'Sardinas enlatadas';
  SELECT product_id INTO v_frijoles_id FROM public.products WHERE product_name = 'Frijoles enlatados';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '4 months')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Atún
  v_market_total := 150 * 15.00;
  v_actual_total := 150 * 12.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_atun_id, 150, 15.00, 12.00, '2025-12-31'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_atun_id, v_warehouse_id, 150, v_donation_date::TIMESTAMPTZ, '2025-12-31'::DATE, 12.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 150, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Sardinas
  v_market_total := 120 * 12.00;
  v_actual_total := 120 * 10.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_sardinas_id, 120, 12.00, 10.00, '2025-11-30'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_sardinas_id, v_warehouse_id, 120, v_donation_date::TIMESTAMPTZ, '2025-11-30'::DATE, 10.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 120, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 3: Frijoles enlatados
  v_market_total := 100 * 18.00;
  v_actual_total := 100 * 15.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_frijoles_id, 100, 18.00, 15.00, '2025-10-31'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_frijoles_id, v_warehouse_id, 100, v_donation_date::TIMESTAMPTZ, '2025-10-31'::DATE, 15.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 100, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 3: Farmacia San José - Higiene personal (hace 4 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_shampoo_id BIGINT;
  v_pasta_id BIGINT;
  v_jabon_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Farmacia San José';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Farmacia';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_shampoo_id FROM public.products WHERE product_name = 'Shampoo';
  SELECT product_id INTO v_pasta_id FROM public.products WHERE product_name = 'Pasta dental';
  SELECT product_id INTO v_jabon_id FROM public.products WHERE product_name = 'Jabón de baño';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '4 months')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Shampoo
  v_market_total := 80 * 45.00;
  v_actual_total := 80 * 35.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_shampoo_id, 80, 45.00, 35.00, '2026-06-30'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_shampoo_id, v_warehouse_id, 80, v_donation_date::TIMESTAMPTZ, '2026-06-30'::DATE, 35.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 80, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Pasta dental
  v_market_total := 100 * 25.00;
  v_actual_total := 100 * 20.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_pasta_id, 100, 25.00, 20.00, '2026-08-31'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_pasta_id, v_warehouse_id, 100, v_donation_date::TIMESTAMPTZ, '2026-08-31'::DATE, 20.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 100, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 3: Jabón
  v_market_total := 120 * 8.00;
  v_actual_total := 120 * 6.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_jabon_id, 120, 8.00, 6.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_jabon_id, v_warehouse_id, 120, v_donation_date::TIMESTAMPTZ, NULL, 6.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 120, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 4: Panadería El Buen Pan - Productos básicos (hace 3 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_harina_id BIGINT;
  v_azucar_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Panadería El Buen Pan';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_harina_id FROM public.products WHERE product_name = 'Harina de trigo';
  SELECT product_id INTO v_azucar_id FROM public.products WHERE product_name = 'Azúcar blanca';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '3 months')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Harina
  v_market_total := 400 * 22.00;
  v_actual_total := 400 * 18.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_harina_id, 400, 22.00, 18.00, '2025-09-30'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_harina_id, v_warehouse_id, 400, v_donation_date::TIMESTAMPTZ, '2025-09-30'::DATE, 18.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 400, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Azúcar
  v_market_total := 150 * 18.00;
  v_actual_total := 150 * 15.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_azucar_id, 150, 18.00, 15.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_azucar_id, v_warehouse_id, 150, v_donation_date::TIMESTAMPTZ, NULL, 15.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 150, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 5: Familia García - Varios productos (hace 3 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_aceite_id BIGINT;
  v_pasta_id BIGINT;
  v_sal_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Familia García';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_aceite_id FROM public.products WHERE product_name = 'Aceite vegetal';
  SELECT product_id INTO v_pasta_id FROM public.products WHERE product_name = 'Pasta de fideos';
  SELECT product_id INTO v_sal_id FROM public.products WHERE product_name = 'Sal de mesa';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '3 months')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Aceite
  v_market_total := 50 * 35.00;
  v_actual_total := 50 * 28.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_aceite_id, 50, 35.00, 28.00, '2025-12-31'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_aceite_id, v_warehouse_id, 50, v_donation_date::TIMESTAMPTZ, '2025-12-31'::DATE, 28.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 50, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Pasta
  v_market_total := 80 * 12.00;
  v_actual_total := 80 * 10.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_pasta_id, 80, 12.00, 10.00, '2026-03-31'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_pasta_id, v_warehouse_id, 80, v_donation_date::TIMESTAMPTZ, '2026-03-31'::DATE, 10.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 80, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 3: Sal
  v_market_total := 30 * 8.00;
  v_actual_total := 30 * 6.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_sal_id, 30, 8.00, 6.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_sal_id, v_warehouse_id, 30, v_donation_date::TIMESTAMPTZ, NULL, 6.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 30, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 6: María Elena Pérez - Productos de limpieza (hace 2 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_detergente_id BIGINT;
  v_cloro_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'María Elena Pérez';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_detergente_id FROM public.products WHERE product_name = 'Detergente líquido';
  SELECT product_id INTO v_cloro_id FROM public.products WHERE product_name = 'Cloro';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '2 months')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Detergente
  v_market_total := 60 * 55.00;
  v_actual_total := 60 * 45.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_detergente_id, 60, 55.00, 45.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_detergente_id, v_warehouse_id, 60, v_donation_date::TIMESTAMPTZ, NULL, 45.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 60, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Cloro
  v_market_total := 40 * 25.00;
  v_actual_total := 40 * 20.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_cloro_id, 40, 25.00, 20.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_cloro_id, v_warehouse_id, 40, v_donation_date::TIMESTAMPTZ, NULL, 20.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 40, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 7: Fundación Ayuda Comunitaria - Productos refrigerados (hace 2 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_leche_id BIGINT;
  v_huevos_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Fundación Ayuda Comunitaria';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_leche_id FROM public.products WHERE product_name = 'Leche entera';
  SELECT product_id INTO v_huevos_id FROM public.products WHERE product_name = 'Huevos';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '2 months')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Leche
  v_market_total := 100 * 28.00;
  v_actual_total := 100 * 22.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_leche_id, 100, 28.00, 22.00, '2024-12-15'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_leche_id, v_warehouse_id, 100, v_donation_date::TIMESTAMPTZ, '2024-12-15'::DATE, 22.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 100, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Huevos
  v_market_total := 50 * 45.00;
  v_actual_total := 50 * 35.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_huevos_id, 50, 45.00, 35.00, '2024-12-20'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_huevos_id, v_warehouse_id, 50, v_donation_date::TIMESTAMPTZ, '2024-12-20'::DATE, 35.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 50, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 8: Asociación Solidaridad - Textiles (hace 2 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_camisetas_id BIGINT;
  v_pantalones_id BIGINT;
  v_cobijas_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Asociación Solidaridad';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_camisetas_id FROM public.products WHERE product_name = 'Camisetas';
  SELECT product_id INTO v_pantalones_id FROM public.products WHERE product_name = 'Pantalones';
  SELECT product_id INTO v_cobijas_id FROM public.products WHERE product_name = 'Cobijas';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '2 months')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Camisetas
  v_market_total := 100 * 120.00;
  v_actual_total := 100 * 80.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_camisetas_id, 100, 120.00, 80.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_camisetas_id, v_warehouse_id, 100, v_donation_date::TIMESTAMPTZ, NULL, 80.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 100, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Pantalones
  v_market_total := 80 * 250.00;
  v_actual_total := 80 * 180.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_pantalones_id, 80, 250.00, 180.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_pantalones_id, v_warehouse_id, 80, v_donation_date::TIMESTAMPTZ, NULL, 180.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 80, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 3: Cobijas
  v_market_total := 50 * 300.00;
  v_actual_total := 50 * 200.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_cobijas_id, 50, 300.00, 200.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_cobijas_id, v_warehouse_id, 50, v_donation_date::TIMESTAMPTZ, NULL, 200.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 50, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 9: Universidad Nacional - Bebidas y alimentos (hace 1 mes)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_agua_id BIGINT;
  v_jugo_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Universidad Nacional';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_agua_id FROM public.products WHERE product_name = 'Agua embotellada';
  SELECT product_id INTO v_jugo_id FROM public.products WHERE product_name = 'Jugo de naranja';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '1 month')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Agua
  v_market_total := 500 * 8.00;
  v_actual_total := 500 * 6.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_agua_id, 500, 8.00, 6.00, '2026-12-31'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_agua_id, v_warehouse_id, 500, v_donation_date::TIMESTAMPTZ, '2026-12-31'::DATE, 6.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 500, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Jugo
  v_market_total := 80 * 35.00;
  v_actual_total := 80 * 28.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_jugo_id, 80, 35.00, 28.00, '2025-06-30'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_jugo_id, v_warehouse_id, 80, v_donation_date::TIMESTAMPTZ, '2025-06-30'::DATE, 28.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 80, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 10: Secretaría de Desarrollo Social - Varios productos (hace 1 mes)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_arroz_id BIGINT;
  v_frijoles_id BIGINT;
  v_aceite_id BIGINT;
  v_pasta_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Secretaría de Desarrollo Social';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_arroz_id FROM public.products WHERE product_name = 'Arroz blanco';
  SELECT product_id INTO v_frijoles_id FROM public.products WHERE product_name = 'Frijoles negros';
  SELECT product_id INTO v_aceite_id FROM public.products WHERE product_name = 'Aceite vegetal';
  SELECT product_id INTO v_pasta_id FROM public.products WHERE product_name = 'Pasta de fideos';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '1 month')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Arroz
  v_market_total := 300 * 25.50;
  v_actual_total := 300 * 20.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_arroz_id, 300, 25.50, 20.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_arroz_id, v_warehouse_id, 300, v_donation_date::TIMESTAMPTZ, NULL, 20.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 300, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Frijoles
  v_market_total := 200 * 30.00;
  v_actual_total := 200 * 25.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_frijoles_id, 200, 30.00, 25.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_frijoles_id, v_warehouse_id, 200, v_donation_date::TIMESTAMPTZ, NULL, 25.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 200, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 3: Aceite
  v_market_total := 80 * 35.00;
  v_actual_total := 80 * 28.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_aceite_id, 80, 35.00, 28.00, '2025-11-30'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_aceite_id, v_warehouse_id, 80, v_donation_date::TIMESTAMPTZ, '2025-11-30'::DATE, 28.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 80, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 4: Pasta
  v_market_total := 100 * 12.00;
  v_actual_total := 100 * 10.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_pasta_id, 100, 12.00, 10.00, '2026-04-30'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_pasta_id, v_warehouse_id, 100, v_donation_date::TIMESTAMPTZ, '2026-04-30'::DATE, 10.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 100, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 11: DIF Municipal - Higiene y limpieza (hace 1 mes)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_papel_id BIGINT;
  v_toallas_id BIGINT;
  v_jabon_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'DIF Municipal';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Farmacia';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_papel_id FROM public.products WHERE product_name = 'Papel higiénico';
  SELECT product_id INTO v_toallas_id FROM public.products WHERE product_name = 'Toallas sanitarias';
  SELECT product_id INTO v_jabon_id FROM public.products WHERE product_name = 'Jabón de barra';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '1 month')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Papel
  v_market_total := 60 * 85.00;
  v_actual_total := 60 * 65.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_papel_id, 60, 85.00, 65.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_papel_id, v_warehouse_id, 60, v_donation_date::TIMESTAMPTZ, NULL, 65.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 60, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Toallas
  v_market_total := 40 * 45.00;
  v_actual_total := 40 * 35.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_toallas_id, 40, 45.00, 35.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_toallas_id, v_warehouse_id, 40, v_donation_date::TIMESTAMPTZ, NULL, 35.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 40, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 3: Jabón
  v_market_total := 100 * 12.00;
  v_actual_total := 100 * 8.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_jabon_id, 100, 12.00, 8.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_jabon_id, v_warehouse_id, 100, v_donation_date::TIMESTAMPTZ, NULL, 8.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 100, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 12: Grupo de Familias Solidarias - Frutas y verduras (hace 3 semanas)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_manzanas_id BIGINT;
  v_platanos_id BIGINT;
  v_zanahorias_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Grupo de Familias Solidarias';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_manzanas_id FROM public.products WHERE product_name = 'Manzanas';
  SELECT product_id INTO v_platanos_id FROM public.products WHERE product_name = 'Plátanos';
  SELECT product_id INTO v_zanahorias_id FROM public.products WHERE product_name = 'Zanahorias';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '3 weeks')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Manzanas
  v_market_total := 50 * 35.00;
  v_actual_total := 50 * 28.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_manzanas_id, 50, 35.00, 28.00, '2024-12-25'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_manzanas_id, v_warehouse_id, 50, v_donation_date::TIMESTAMPTZ, '2024-12-25'::DATE, 28.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 50, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Plátanos
  v_market_total := 40 * 20.00;
  v_actual_total := 40 * 15.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_platanos_id, 40, 20.00, 15.00, '2024-12-20'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_platanos_id, v_warehouse_id, 40, v_donation_date::TIMESTAMPTZ, '2024-12-20'::DATE, 15.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 40, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 3: Zanahorias
  v_market_total := 30 * 25.00;
  v_actual_total := 30 * 20.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_zanahorias_id, 30, 25.00, 20.00, '2024-12-22'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_zanahorias_id, v_warehouse_id, 30, v_donation_date::TIMESTAMPTZ, '2024-12-22'::DATE, 20.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 30, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 13: Tienda de Abarrotes Doña Rosa - Varios (hace 3 semanas)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_maiz_id BIGINT;
  v_chiles_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Tienda de Abarrotes Doña Rosa';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_maiz_id FROM public.products WHERE product_name = 'Maíz enlatado';
  SELECT product_id INTO v_chiles_id FROM public.products WHERE product_name = 'Chiles enlatados';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '3 weeks')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Maíz
  v_market_total := 60 * 15.00;
  v_actual_total := 60 * 12.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_maiz_id, 60, 15.00, 12.00, '2025-08-31'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_maiz_id, v_warehouse_id, 60, v_donation_date::TIMESTAMPTZ, '2025-08-31'::DATE, 12.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 60, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Chiles
  v_market_total := 50 * 18.00;
  v_actual_total := 50 * 15.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_chiles_id, 50, 18.00, 15.00, '2025-09-30'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_chiles_id, v_warehouse_id, 50, v_donation_date::TIMESTAMPTZ, '2025-09-30'::DATE, 15.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 50, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 14: Carnicería La Frontera - Productos refrigerados (hace 2 semanas)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_queso_id BIGINT;
  v_mantequilla_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Carnicería La Frontera';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_queso_id FROM public.products WHERE product_name = 'Queso fresco';
  SELECT product_id INTO v_mantequilla_id FROM public.products WHERE product_name = 'Mantequilla';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '2 weeks')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Queso
  v_market_total := 25 * 85.00;
  v_actual_total := 25 * 70.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_queso_id, 25, 85.00, 70.00, '2024-12-18'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_queso_id, v_warehouse_id, 25, v_donation_date::TIMESTAMPTZ, '2024-12-18'::DATE, 70.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 25, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Mantequilla
  v_market_total := 20 * 45.00;
  v_actual_total := 20 * 35.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_mantequilla_id, 20, 45.00, 35.00, '2025-01-15'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_mantequilla_id, v_warehouse_id, 20, v_donation_date::TIMESTAMPTZ, '2025-01-15'::DATE, 35.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 20, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 15: Don Pedro Morales - Alimentos básicos (hace 2 semanas)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_arroz_id BIGINT;
  v_frijoles_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Don Pedro Morales';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_arroz_id FROM public.products WHERE product_name = 'Arroz blanco';
  SELECT product_id INTO v_frijoles_id FROM public.products WHERE product_name = 'Frijoles negros';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '2 weeks')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Arroz
  v_market_total := 100 * 25.50;
  v_actual_total := 100 * 20.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_arroz_id, 100, 25.50, 20.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_arroz_id, v_warehouse_id, 100, v_donation_date::TIMESTAMPTZ, NULL, 20.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 100, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Frijoles
  v_market_total := 80 * 30.00;
  v_actual_total := 80 * 25.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_frijoles_id, 80, 30.00, 25.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_frijoles_id, v_warehouse_id, 80, v_donation_date::TIMESTAMPTZ, NULL, 25.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 80, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 16: Familia Rodríguez - Limpieza (hace 1 semana)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_escoba_id BIGINT;
  v_trapeador_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Familia Rodríguez';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_escoba_id FROM public.products WHERE product_name = 'Escoba';
  SELECT product_id INTO v_trapeador_id FROM public.products WHERE product_name = 'Trapeador';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '1 week')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Escoba
  v_market_total := 20 * 45.00;
  v_actual_total := 20 * 35.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_escoba_id, 20, 45.00, 35.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_escoba_id, v_warehouse_id, 20, v_donation_date::TIMESTAMPTZ, NULL, 35.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 20, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Trapeador
  v_market_total := 15 * 85.00;
  v_actual_total := 15 * 65.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_trapeador_id, 15, 85.00, 65.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_trapeador_id, v_warehouse_id, 15, v_donation_date::TIMESTAMPTZ, NULL, 65.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 15, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 17: Fundación Esperanza - Varios productos (hace 1 semana)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_atun_id BIGINT;
  v_sardinas_id BIGINT;
  v_agua_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Fundación Esperanza';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_atun_id FROM public.products WHERE product_name = 'Atún enlatado';
  SELECT product_id INTO v_sardinas_id FROM public.products WHERE product_name = 'Sardinas enlatadas';
  SELECT product_id INTO v_agua_id FROM public.products WHERE product_name = 'Agua embotellada';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '1 week')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Atún
  v_market_total := 80 * 15.00;
  v_actual_total := 80 * 12.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_atun_id, 80, 15.00, 12.00, '2025-10-31'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_atun_id, v_warehouse_id, 80, v_donation_date::TIMESTAMPTZ, '2025-10-31'::DATE, 12.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 80, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Sardinas
  v_market_total := 60 * 12.00;
  v_actual_total := 60 * 10.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_sardinas_id, 60, 12.00, 10.00, '2025-09-30'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_sardinas_id, v_warehouse_id, 60, v_donation_date::TIMESTAMPTZ, '2025-09-30'::DATE, 10.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 60, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 3: Agua
  v_market_total := 200 * 8.00;
  v_actual_total := 200 * 6.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_agua_id, 200, 8.00, 6.00, '2026-06-30'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_agua_id, v_warehouse_id, 200, v_donation_date::TIMESTAMPTZ, '2026-06-30'::DATE, 6.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 200, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 18: Instituto Tecnológico Regional - Bebidas (hace 5 días)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_refresco_id BIGINT;
  v_jugo_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Instituto Tecnológico Regional';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_refresco_id FROM public.products WHERE product_name = 'Refresco cola';
  SELECT product_id INTO v_jugo_id FROM public.products WHERE product_name = 'Jugo de naranja';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '5 days')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Refresco
  v_market_total := 60 * 28.00;
  v_actual_total := 60 * 22.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_refresco_id, 60, 28.00, 22.00, '2025-08-31'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_refresco_id, v_warehouse_id, 60, v_donation_date::TIMESTAMPTZ, '2025-08-31'::DATE, 22.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 60, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Jugo
  v_market_total := 40 * 35.00;
  v_actual_total := 40 * 28.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_jugo_id, 40, 35.00, 28.00, '2025-05-31'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_jugo_id, v_warehouse_id, 40, v_donation_date::TIMESTAMPTZ, '2025-05-31'::DATE, 28.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 40, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 19: Red de Apoyo Familiar - Textiles (hace 4 días)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_zapatos_id BIGINT;
  v_camisetas_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Red de Apoyo Familiar';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_zapatos_id FROM public.products WHERE product_name = 'Zapatos deportivos';
  SELECT product_id INTO v_camisetas_id FROM public.products WHERE product_name = 'Camisetas';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '4 days')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Zapatos
  v_market_total := 30 * 350.00;
  v_actual_total := 30 * 250.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_zapatos_id, 30, 350.00, 250.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_zapatos_id, v_warehouse_id, 30, v_donation_date::TIMESTAMPTZ, NULL, 250.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 30, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Camisetas
  v_market_total := 50 * 120.00;
  v_actual_total := 50 * 80.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_camisetas_id, 50, 120.00, 80.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_camisetas_id, v_warehouse_id, 50, v_donation_date::TIMESTAMPTZ, NULL, 80.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 50, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 20: Familias Unidas - Varios productos (hace 3 días)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_papas_id BIGINT;
  v_cebollas_id BIGINT;
  v_bolsas_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Familias Unidas';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_papas_id FROM public.products WHERE product_name = 'Papas';
  SELECT product_id INTO v_cebollas_id FROM public.products WHERE product_name = 'Cebollas';
  SELECT product_id INTO v_bolsas_id FROM public.products WHERE product_name = 'Bolsas de plástico';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '3 days')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Papas
  v_market_total := 60 * 18.00;
  v_actual_total := 60 * 15.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_papas_id, 60, 18.00, 15.00, '2024-12-30'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_papas_id, v_warehouse_id, 60, v_donation_date::TIMESTAMPTZ, '2024-12-30'::DATE, 15.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 60, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Cebollas
  v_market_total := 40 * 20.00;
  v_actual_total := 40 * 16.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_cebollas_id, 40, 20.00, 16.00, '2024-12-28'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_cebollas_id, v_warehouse_id, 40, v_donation_date::TIMESTAMPTZ, '2024-12-28'::DATE, 16.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 40, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 3: Bolsas
  v_market_total := 200 * 2.00;
  v_actual_total := 200 * 1.50;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_bolsas_id, 200, 2.00, 1.50, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_bolsas_id, v_warehouse_id, 200, v_donation_date::TIMESTAMPTZ, NULL, 1.50, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 200, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 21: Verdulería Fresca - Frutas y verduras (hace 2 días)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_manzanas_id BIGINT;
  v_platanos_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Verdulería Fresca';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_manzanas_id FROM public.products WHERE product_name = 'Manzanas';
  SELECT product_id INTO v_platanos_id FROM public.products WHERE product_name = 'Plátanos';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '2 days')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Manzanas
  v_market_total := 30 * 35.00;
  v_actual_total := 30 * 28.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_manzanas_id, 30, 35.00, 28.00, '2024-12-23'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_manzanas_id, v_warehouse_id, 30, v_donation_date::TIMESTAMPTZ, '2024-12-23'::DATE, 28.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 30, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Plátanos
  v_market_total := 25 * 20.00;
  v_actual_total := 25 * 15.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_platanos_id, 25, 20.00, 15.00, '2024-12-19'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_platanos_id, v_warehouse_id, 25, v_donation_date::TIMESTAMPTZ, '2024-12-19'::DATE, 15.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 25, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- Donación 22: Supermercado La Esperanza - Segunda donación (hace 1 día)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_entrada_type_id BIGINT;
  v_donation_date DATE;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_arroz_id BIGINT;
  v_aceite_id BIGINT;
  v_pasta_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Supermercado La Esperanza S.A.';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'ENTRADA' AND is_active = TRUE;
  SELECT product_id INTO v_arroz_id FROM public.products WHERE product_name = 'Arroz blanco';
  SELECT product_id INTO v_aceite_id FROM public.products WHERE product_name = 'Aceite vegetal';
  SELECT product_id INTO v_pasta_id FROM public.products WHERE product_name = 'Pasta de fideos';
  
  v_donation_date := (CURRENT_DATE - INTERVAL '1 day')::DATE;
  
  INSERT INTO public.donation_transactions (donor_id, warehouse_id, donation_date, market_value, actual_value)
  VALUES (v_donor_id, v_warehouse_id, v_donation_date, 0, 0)
  RETURNING donation_id INTO v_donation_id;
  
  -- Item 1: Arroz
  v_market_total := 200 * 25.50;
  v_actual_total := 200 * 20.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_arroz_id, 200, 25.50, 20.00, NULL)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_arroz_id, v_warehouse_id, 200, v_donation_date::TIMESTAMPTZ, NULL, 20.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 200, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 2: Aceite
  v_market_total := 60 * 35.00;
  v_actual_total := 60 * 28.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_aceite_id, 60, 35.00, 28.00, '2025-10-31'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_aceite_id, v_warehouse_id, 60, v_donation_date::TIMESTAMPTZ, '2025-10-31'::DATE, 28.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 60, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  -- Item 3: Pasta
  v_market_total := 70 * 12.00;
  v_actual_total := 70 * 10.00;
  v_market_value := v_market_value + v_market_total;
  v_actual_value := v_actual_value + v_actual_total;
  
  INSERT INTO public.donation_items (donation_id, product_id, quantity, market_unit_price, actual_unit_price, expiry_date)
  VALUES (v_donation_id, v_pasta_id, 70, 12.00, 10.00, '2026-02-28'::DATE)
  RETURNING item_id INTO v_donation_item_id;
  
  INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price, donation_item_id)
  VALUES (v_pasta_id, v_warehouse_id, 70, v_donation_date::TIMESTAMPTZ, '2026-02-28'::DATE, 10.00, v_donation_item_id)
  RETURNING lot_id INTO v_stock_lot_id;
  
  INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by)
  VALUES (v_stock_lot_id, v_entrada_type_id, 70, 'Entrada por donación #' || v_donation_id::TEXT, 'DONATION-' || v_donation_id::TEXT, v_admin_id);
  
  UPDATE public.donation_transactions
  SET market_value = v_market_value, actual_value = v_actual_value, updated_at = NOW()
  WHERE donation_id = v_donation_id;
END $$;

-- ============================================================================
-- STOCK LOTS ADICIONALES (creados manualmente)
-- ============================================================================
-- Estos lotes representan productos que no vienen de donaciones o que necesitan
-- ajustes manuales para probar diferentes escenarios.
-- NOTA: Estos lotes NO tienen movimientos asociados en stock_movements (intencional).
--       Para crear lotes con movimientos, use create_donation_atomic o register_stock_movement.

-- Lotes con stock disponible normal
INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price) VALUES
  ((SELECT product_id FROM public.products WHERE product_name = 'Velas'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central'), 45, CURRENT_DATE - INTERVAL '1 month', NULL, 5.00),
  ((SELECT product_id FROM public.products WHERE product_name = 'Bolsas de plástico'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central'), 150, CURRENT_DATE - INTERVAL '2 weeks', NULL, 1.50)
ON CONFLICT DO NOTHING;

-- Lotes con stock bajo (cerca del umbral)
INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price) VALUES
  ((SELECT product_id FROM public.products WHERE product_name = 'Sal de mesa'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central'), 18, CURRENT_DATE - INTERVAL '3 months', NULL, 6.00),
  ((SELECT product_id FROM public.products WHERE product_name = 'Cloro'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central'), 15, CURRENT_DATE - INTERVAL '2 months', NULL, 20.00),
  ((SELECT product_id FROM public.products WHERE product_name = 'Escoba'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central'), 8, CURRENT_DATE - INTERVAL '1 month', NULL, 35.00)
ON CONFLICT DO NOTHING;

-- Lotes próximos a vencer (30 días o menos)
INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price) VALUES
  ((SELECT product_id FROM public.products WHERE product_name = 'Leche entera'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos'), 25, CURRENT_DATE - INTERVAL '1 week', CURRENT_DATE + INTERVAL '7 days', 22.00),
  ((SELECT product_id FROM public.products WHERE product_name = 'Huevos'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos'), 12, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 35.00),
  ((SELECT product_id FROM public.products WHERE product_name = 'Queso fresco'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos'), 8, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '5 days', 70.00),
  ((SELECT product_id FROM public.products WHERE product_name = 'Manzanas'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos'), 15, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', 28.00)
ON CONFLICT DO NOTHING;

-- Lotes vencidos (para probar el sistema de caducados)
INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, unit_price) VALUES
  ((SELECT product_id FROM public.products WHERE product_name = 'Leche entera'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos'), 10, CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE - INTERVAL '10 days', 22.00),
  ((SELECT product_id FROM public.products WHERE product_name = 'Huevos'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos'), 8, CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE - INTERVAL '5 days', 35.00),
  ((SELECT product_id FROM public.products WHERE product_name = 'Manzanas'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos'), 5, CURRENT_DATE - INTERVAL '3 weeks', CURRENT_DATE - INTERVAL '2 days', 28.00),
  ((SELECT product_id FROM public.products WHERE product_name = 'Plátanos'), (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos'), 3, CURRENT_DATE - INTERVAL '2 weeks', CURRENT_DATE - INTERVAL '1 day', 15.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MOVIMIENTOS DE SALIDA (CONSUMO, MERMA, BAZAR, DONACION_ONG)
-- ============================================================================
-- NOTA: Insertamos el movimiento primero y luego actualizamos current_quantity
-- en el mismo bloque DO para que el trigger prevent_direct_stock_update lo permita

-- Movimiento 1: Consumo - Arroz blanco (hace 5 meses)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 50;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Arroz blanco')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id 
  FROM public.movement_types 
  WHERE type_code = 'CONSUMO';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (
      lot_id, movement_type_id, quantity, notes, requesting_department, created_by, created_at
    ) VALUES (
      v_lot_id, v_movement_type_id, v_quantity, 'Consumo interno - Comedor', 'Comedor', v_user_id, 
      (CURRENT_DATE - INTERVAL '5 months')::TIMESTAMPTZ
    );
    
    UPDATE public.stock_lots 
    SET current_quantity = current_quantity - v_quantity, updated_at = NOW()
    WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 2: Consumo - Frijoles negros (hace 4 meses)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 30;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Frijoles negros')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'CONSUMO';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, requesting_department, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Consumo interno - Comedor', 'Comedor', v_user_id, (CURRENT_DATE - INTERVAL '4 months')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 3: Merma - Leche entera vencida (hace 3 meses)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 10;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Leche entera')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'MERMA';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Merma por deterioro - Producto vencido', v_user_id, (CURRENT_DATE - INTERVAL '3 months')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 4: Bazar - Camisetas (hace 3 meses)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 20;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Camisetas')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'BAZAR';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, recipient_organization, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Venta en bazar benéfico', 'Bazar La Esperanza', v_user_id, (CURRENT_DATE - INTERVAL '3 months')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 5: Donación ONG - Atún enlatado (hace 3 meses)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 40;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Atún enlatado')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'DONACION_ONG';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, recipient_organization, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Donación a otra ONG', 'Fundación Hermanos Unidos', v_user_id, (CURRENT_DATE - INTERVAL '3 months')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 6: Consumo - Aceite vegetal (hace 2 meses)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 15;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Aceite vegetal')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'CONSUMO';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, requesting_department, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Consumo interno - Cocina', 'Cocina', v_user_id, (CURRENT_DATE - INTERVAL '2 months')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 7: Merma - Huevos rotos (hace 2 meses)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 5;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Huevos')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'MERMA';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Merma por rotura durante transporte', v_user_id, (CURRENT_DATE - INTERVAL '2 months')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 8: Bazar - Pantalones (hace 2 meses)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 10;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Pantalones')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'BAZAR';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, recipient_organization, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Venta en bazar benéfico', 'Bazar La Esperanza', v_user_id, (CURRENT_DATE - INTERVAL '2 months')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 9: Donación ONG - Sardinas enlatadas (hace 2 meses)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 30;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Sardinas enlatadas')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'DONACION_ONG';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, recipient_organization, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Donación a otra ONG', 'Asociación Ayuda Vecinal', v_user_id, (CURRENT_DATE - INTERVAL '2 months')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 10: Consumo - Pasta de fideos (hace 1 mes)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 25;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Pasta de fideos')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'CONSUMO';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, requesting_department, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Consumo interno - Comedor', 'Comedor', v_user_id, (CURRENT_DATE - INTERVAL '1 month')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 11: Merma - Manzanas deterioradas (hace 1 mes)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 8;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Manzanas')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'MERMA';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Merma por deterioro - Frutas en mal estado', v_user_id, (CURRENT_DATE - INTERVAL '1 month')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 12: Bazar - Cobijas (hace 1 mes)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 15;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Cobijas')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'BAZAR';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, recipient_organization, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Venta en bazar benéfico', 'Bazar La Esperanza', v_user_id, (CURRENT_DATE - INTERVAL '1 month')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 13: Consumo - Detergente líquido (hace 3 semanas)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 12;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Detergente líquido')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'CONSUMO';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, requesting_department, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Consumo interno - Lavandería', 'Lavandería', v_user_id, (CURRENT_DATE - INTERVAL '3 weeks')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 14: Donación ONG - Agua embotellada (hace 2 semanas)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 100;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Agua embotellada')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'DONACION_ONG';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, recipient_organization, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Donación a otra ONG', 'Fundación Ayuda Comunitaria', v_user_id, (CURRENT_DATE - INTERVAL '2 weeks')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 15: Consumo - Shampoo (hace 1 semana)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 20;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Shampoo')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Farmacia')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'CONSUMO';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, requesting_department, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Consumo interno - Área de baños', 'Mantenimiento', v_user_id, (CURRENT_DATE - INTERVAL '1 week')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 16: Merma - Papas deterioradas (hace 5 días)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 10;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Papas')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'MERMA';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Merma por deterioro - Verduras en mal estado', v_user_id, (CURRENT_DATE - INTERVAL '5 days')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 17: Bazar - Zapatos deportivos (hace 3 días)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 8;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Zapatos deportivos')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'BAZAR';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, recipient_organization, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Venta en bazar benéfico', 'Bazar La Esperanza', v_user_id, (CURRENT_DATE - INTERVAL '3 days')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Movimiento 18: Donación ONG - Frijoles enlatados (hace 2 días)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_movement_type_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 25;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Frijoles enlatados')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT type_id INTO v_movement_type_id FROM public.movement_types WHERE type_code = 'DONACION_ONG';
  
  IF v_lot_id IS NOT NULL AND v_movement_type_id IS NOT NULL THEN
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, recipient_organization, created_by, created_at)
    VALUES (v_lot_id, v_movement_type_id, v_quantity, 'Donación a otra ONG', 'Centro Comunitario Solidario', v_user_id, (CURRENT_DATE - INTERVAL '2 days')::TIMESTAMPTZ);
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- ============================================================================
-- TRASPASOS ENTRE ALMACENES
-- ============================================================================

-- Traspaso 1: PENDING - Arroz blanco de Bodega Central a Alimentos (hace 2 semanas)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_from_warehouse_id BIGINT;
  v_to_warehouse_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 100;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Arroz blanco')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT warehouse_id INTO v_from_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT warehouse_id INTO v_to_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  
  IF v_lot_id IS NOT NULL THEN
    INSERT INTO public.stock_transfers (
      lot_id, from_warehouse_id, to_warehouse_id, quantity, status, requested_by, notes, created_at
    ) VALUES (
      v_lot_id, v_from_warehouse_id, v_to_warehouse_id, v_quantity, 'PENDING', v_user_id, 
      'Solicitud de traspaso para distribución', (CURRENT_DATE - INTERVAL '2 weeks')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- Traspaso 2: PENDING - Atún enlatado de Alimentos a Farmacia (hace 1 semana)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_from_warehouse_id BIGINT;
  v_to_warehouse_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 50;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Atún enlatado')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT warehouse_id INTO v_from_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT warehouse_id INTO v_to_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Farmacia';
  
  IF v_lot_id IS NOT NULL THEN
    INSERT INTO public.stock_transfers (
      lot_id, from_warehouse_id, to_warehouse_id, quantity, status, requested_by, notes, created_at
    ) VALUES (
      v_lot_id, v_from_warehouse_id, v_to_warehouse_id, v_quantity, 'PENDING', v_user_id, 
      'Traspaso para mejor distribución', (CURRENT_DATE - INTERVAL '1 week')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- Traspaso 3: PENDING - Shampoo de Farmacia a Bodega Central (hace 5 días)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_from_warehouse_id BIGINT;
  v_to_warehouse_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 30;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Shampoo')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Farmacia')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT warehouse_id INTO v_from_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Farmacia';
  SELECT warehouse_id INTO v_to_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  
  IF v_lot_id IS NOT NULL THEN
    INSERT INTO public.stock_transfers (
      lot_id, from_warehouse_id, to_warehouse_id, quantity, status, requested_by, notes, created_at
    ) VALUES (
      v_lot_id, v_from_warehouse_id, v_to_warehouse_id, v_quantity, 'PENDING', v_user_id, 
      'Reorganización de inventario', (CURRENT_DATE - INTERVAL '5 days')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- Traspaso 4: PENDING - Camisetas de Ropa a Bodega Central (hace 2 días)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_from_warehouse_id BIGINT;
  v_to_warehouse_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity NUMERIC := 25;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Camisetas')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT warehouse_id INTO v_from_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa';
  SELECT warehouse_id INTO v_to_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  
  IF v_lot_id IS NOT NULL THEN
    INSERT INTO public.stock_transfers (
      lot_id, from_warehouse_id, to_warehouse_id, quantity, status, requested_by, notes, created_at
    ) VALUES (
      v_lot_id, v_from_warehouse_id, v_to_warehouse_id, v_quantity, 'PENDING', v_user_id, 
      'Traspaso para evento benéfico', (CURRENT_DATE - INTERVAL '2 days')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- Traspaso 5: APPROVED/COMPLETED - Azúcar blanca de Bodega Central a Alimentos (hace 1 mes)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_from_warehouse_id BIGINT;
  v_to_warehouse_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_quantity NUMERIC := 80;
  v_transfer_id BIGINT;
  v_new_lot_id BIGINT;
  v_salida_type_id BIGINT;
  v_entrada_type_id BIGINT;
  v_lot RECORD;
  v_transfer_created_at TIMESTAMPTZ := (CURRENT_DATE - INTERVAL '1 month')::TIMESTAMPTZ;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Azúcar blanca')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT warehouse_id INTO v_from_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT warehouse_id INTO v_to_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT type_id INTO v_salida_type_id FROM public.movement_types WHERE type_code = 'TRASPASO_SALIDA';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'TRASPASO_ENTRADA';
  
  IF v_lot_id IS NOT NULL AND v_salida_type_id IS NOT NULL AND v_entrada_type_id IS NOT NULL THEN
    SELECT * INTO v_lot FROM public.stock_lots WHERE lot_id = v_lot_id;
    
    -- Crear traspaso
    INSERT INTO public.stock_transfers (
      lot_id, from_warehouse_id, to_warehouse_id, quantity, status, requested_by, approved_by, notes, created_at, updated_at
    ) VALUES (
      v_lot_id, v_from_warehouse_id, v_to_warehouse_id, v_quantity, 'COMPLETED', v_user_id, v_admin_id, 
      'Traspaso aprobado y completado', v_transfer_created_at, v_transfer_created_at
    ) RETURNING transfer_id INTO v_transfer_id;
    
    -- Crear movimiento de salida
    INSERT INTO public.stock_movements (
      lot_id, movement_type_id, quantity, notes, reference_id, created_by, created_at
    ) VALUES (
      v_lot_id, v_salida_type_id, v_quantity, 'Traspaso aprobado', 'TRANSFER-' || v_transfer_id::TEXT, v_admin_id, v_transfer_created_at
    );
    
    -- Decrementar stock del lote origen
    UPDATE public.stock_lots 
    SET current_quantity = current_quantity - v_quantity, updated_at = NOW()
    WHERE lot_id = v_lot_id;
    
    -- Crear nuevo lote en almacén destino
    INSERT INTO public.stock_lots (
      product_id, warehouse_id, current_quantity, received_date, expiry_date, is_expired, unit_price
    ) VALUES (
      v_lot.product_id, v_to_warehouse_id, v_quantity, v_transfer_created_at, v_lot.expiry_date, v_lot.is_expired, v_lot.unit_price
    ) RETURNING lot_id INTO v_new_lot_id;
    
    -- Crear movimiento de entrada
    INSERT INTO public.stock_movements (
      lot_id, movement_type_id, quantity, notes, reference_id, created_by, created_at
    ) VALUES (
      v_new_lot_id, v_entrada_type_id, v_quantity, 'Traspaso desde almacén ' || v_from_warehouse_id::TEXT, 
      'TRANSFER-' || v_transfer_id::TEXT, v_admin_id, v_transfer_created_at
    );
  END IF;
END $$;

-- Traspaso 6: APPROVED/COMPLETED - Harina de trigo de Alimentos a Bodega Central (hace 3 semanas)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_from_warehouse_id BIGINT;
  v_to_warehouse_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_quantity NUMERIC := 120;
  v_transfer_id BIGINT;
  v_new_lot_id BIGINT;
  v_salida_type_id BIGINT;
  v_entrada_type_id BIGINT;
  v_lot RECORD;
  v_transfer_created_at TIMESTAMPTZ := (CURRENT_DATE - INTERVAL '3 weeks')::TIMESTAMPTZ;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Harina de trigo')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT warehouse_id INTO v_from_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT warehouse_id INTO v_to_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_salida_type_id FROM public.movement_types WHERE type_code = 'TRASPASO_SALIDA';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'TRASPASO_ENTRADA';
  
  IF v_lot_id IS NOT NULL AND v_salida_type_id IS NOT NULL AND v_entrada_type_id IS NOT NULL THEN
    SELECT * INTO v_lot FROM public.stock_lots WHERE lot_id = v_lot_id;
    
    INSERT INTO public.stock_transfers (
      lot_id, from_warehouse_id, to_warehouse_id, quantity, status, requested_by, approved_by, notes, created_at, updated_at
    ) VALUES (
      v_lot_id, v_from_warehouse_id, v_to_warehouse_id, v_quantity, 'COMPLETED', v_user_id, v_admin_id, 
      'Traspaso aprobado y completado', v_transfer_created_at, v_transfer_created_at
    ) RETURNING transfer_id INTO v_transfer_id;
    
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by, created_at)
    VALUES (v_lot_id, v_salida_type_id, v_quantity, 'Traspaso aprobado', 'TRANSFER-' || v_transfer_id::TEXT, v_admin_id, v_transfer_created_at);
    
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
    
    INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, is_expired, unit_price)
    VALUES (v_lot.product_id, v_to_warehouse_id, v_quantity, v_transfer_created_at, v_lot.expiry_date, v_lot.is_expired, v_lot.unit_price)
    RETURNING lot_id INTO v_new_lot_id;
    
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by, created_at)
    VALUES (v_new_lot_id, v_entrada_type_id, v_quantity, 'Traspaso desde almacén ' || v_from_warehouse_id::TEXT, 
      'TRANSFER-' || v_transfer_id::TEXT, v_admin_id, v_transfer_created_at);
  END IF;
END $$;

-- Traspaso 7: APPROVED/COMPLETED - Pantalones de Ropa a Bodega Central (hace 2 semanas)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_from_warehouse_id BIGINT;
  v_to_warehouse_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_quantity NUMERIC := 15;
  v_transfer_id BIGINT;
  v_new_lot_id BIGINT;
  v_salida_type_id BIGINT;
  v_entrada_type_id BIGINT;
  v_lot RECORD;
  v_transfer_created_at TIMESTAMPTZ := (CURRENT_DATE - INTERVAL '2 weeks')::TIMESTAMPTZ;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Pantalones')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT warehouse_id INTO v_from_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa';
  SELECT warehouse_id INTO v_to_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT type_id INTO v_salida_type_id FROM public.movement_types WHERE type_code = 'TRASPASO_SALIDA';
  SELECT type_id INTO v_entrada_type_id FROM public.movement_types WHERE type_code = 'TRASPASO_ENTRADA';
  
  IF v_lot_id IS NOT NULL AND v_salida_type_id IS NOT NULL AND v_entrada_type_id IS NOT NULL THEN
    SELECT * INTO v_lot FROM public.stock_lots WHERE lot_id = v_lot_id;
    
    INSERT INTO public.stock_transfers (
      lot_id, from_warehouse_id, to_warehouse_id, quantity, status, requested_by, approved_by, notes, created_at, updated_at
    ) VALUES (
      v_lot_id, v_from_warehouse_id, v_to_warehouse_id, v_quantity, 'COMPLETED', v_user_id, v_admin_id, 
      'Traspaso aprobado y completado', v_transfer_created_at, v_transfer_created_at
    ) RETURNING transfer_id INTO v_transfer_id;
    
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by, created_at)
    VALUES (v_lot_id, v_salida_type_id, v_quantity, 'Traspaso aprobado', 'TRANSFER-' || v_transfer_id::TEXT, v_admin_id, v_transfer_created_at);
    
    UPDATE public.stock_lots SET current_quantity = current_quantity - v_quantity, updated_at = NOW() WHERE lot_id = v_lot_id;
    
    INSERT INTO public.stock_lots (product_id, warehouse_id, current_quantity, received_date, expiry_date, is_expired, unit_price)
    VALUES (v_lot.product_id, v_to_warehouse_id, v_quantity, v_transfer_created_at, v_lot.expiry_date, v_lot.is_expired, v_lot.unit_price)
    RETURNING lot_id INTO v_new_lot_id;
    
    INSERT INTO public.stock_movements (lot_id, movement_type_id, quantity, notes, reference_id, created_by, created_at)
    VALUES (v_new_lot_id, v_entrada_type_id, v_quantity, 'Traspaso desde almacén ' || v_from_warehouse_id::TEXT, 
      'TRANSFER-' || v_transfer_id::TEXT, v_admin_id, v_transfer_created_at);
  END IF;
END $$;

-- Traspaso 8: REJECTED - Leche entera de Alimentos a Bodega Central (hace 1 semana)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_from_warehouse_id BIGINT;
  v_to_warehouse_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_quantity NUMERIC := 50;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Leche entera')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT warehouse_id INTO v_from_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT warehouse_id INTO v_to_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  
  IF v_lot_id IS NOT NULL THEN
    INSERT INTO public.stock_transfers (
      lot_id, from_warehouse_id, to_warehouse_id, quantity, status, requested_by, approved_by, rejection_reason, notes, created_at, updated_at
    ) VALUES (
      v_lot_id, v_from_warehouse_id, v_to_warehouse_id, v_quantity, 'REJECTED', v_user_id, v_admin_id, 
      'Producto próximo a vencer, debe permanecer en almacén de alimentos', 
      'Solicitud de traspaso rechazada', (CURRENT_DATE - INTERVAL '1 week')::TIMESTAMPTZ, (CURRENT_DATE - INTERVAL '1 week')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- Traspaso 9: REJECTED - Agua embotellada de Bodega Central a Farmacia (hace 4 días)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_from_warehouse_id BIGINT;
  v_to_warehouse_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_quantity NUMERIC := 200;
BEGIN
  SELECT lot_id INTO v_lot_id 
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Agua embotellada')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
    AND current_quantity >= v_quantity
  LIMIT 1;
  
  SELECT warehouse_id INTO v_from_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT warehouse_id INTO v_to_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Farmacia';
  
  IF v_lot_id IS NOT NULL THEN
    INSERT INTO public.stock_transfers (
      lot_id, from_warehouse_id, to_warehouse_id, quantity, status, requested_by, approved_by, rejection_reason, notes, created_at, updated_at
    ) VALUES (
      v_lot_id, v_from_warehouse_id, v_to_warehouse_id, v_quantity, 'REJECTED', v_user_id, v_admin_id, 
      'Cantidad excesiva para el almacén destino', 
      'Solicitud de traspaso rechazada', (CURRENT_DATE - INTERVAL '4 days')::TIMESTAMPTZ, (CURRENT_DATE - INTERVAL '4 days')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- ============================================================================
-- AJUSTES DE INVENTARIO (MERMAS)
-- ============================================================================

-- Ajuste 1: PENDING - Corrección de conteo en Arroz blanco (hace 1 semana)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity_before NUMERIC;
  v_quantity_after NUMERIC := 0;
BEGIN
  SELECT lot_id, current_quantity INTO v_lot_id, v_quantity_before
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Arroz blanco')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
  LIMIT 1;
  
  IF v_lot_id IS NOT NULL AND v_quantity_before > 10 THEN
    -- Ajustar a cantidad menor (diferencia de hasta 10 unidades)
    v_quantity_after := GREATEST(0, v_quantity_before - 10);
    
    INSERT INTO public.inventory_adjustments (
      lot_id, quantity_before, quantity_after, reason, status, created_by, created_at
    ) VALUES (
      v_lot_id, v_quantity_before, v_quantity_after, 
      'Error en conteo físico - Diferencia encontrada en inventario', 
      'PENDING', v_user_id, (CURRENT_DATE - INTERVAL '1 week')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- Ajuste 2: PENDING - Merma por deterioro en Manzanas (hace 5 días)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity_before NUMERIC;
  v_quantity_after NUMERIC := 0;
BEGIN
  SELECT lot_id, current_quantity INTO v_lot_id, v_quantity_before
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Manzanas')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
  LIMIT 1;
  
  IF v_lot_id IS NOT NULL AND v_quantity_before > 5 THEN
    v_quantity_after := GREATEST(0, v_quantity_before - 5);
    
    INSERT INTO public.inventory_adjustments (
      lot_id, quantity_before, quantity_after, reason, status, created_by, created_at
    ) VALUES (
      v_lot_id, v_quantity_before, v_quantity_after, 
      'Merma por deterioro de frutas - Productos en mal estado detectados', 
      'PENDING', v_user_id, (CURRENT_DATE - INTERVAL '5 days')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- Ajuste 3: PENDING - Corrección de inventario en Atún enlatado (hace 3 días)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity_before NUMERIC;
  v_quantity_after NUMERIC := 0;
BEGIN
  SELECT lot_id, current_quantity INTO v_lot_id, v_quantity_before
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Atún enlatado')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
  LIMIT 1;
  
  IF v_lot_id IS NOT NULL AND v_quantity_before > 15 THEN
    v_quantity_after := GREATEST(0, v_quantity_before - 15);
    
    INSERT INTO public.inventory_adjustments (
      lot_id, quantity_before, quantity_after, reason, status, created_by, created_at
    ) VALUES (
      v_lot_id, v_quantity_before, v_quantity_after, 
      'Error en conteo físico - Diferencias encontradas en inventario mensual', 
      'PENDING', v_user_id, (CURRENT_DATE - INTERVAL '3 days')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- Ajuste 4: PENDING - Pérdida por rotura en Huevos (hace 1 día)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_quantity_before NUMERIC;
  v_quantity_after NUMERIC := 0;
BEGIN
  SELECT lot_id, current_quantity INTO v_lot_id, v_quantity_before
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Huevos')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
  LIMIT 1;
  
  IF v_lot_id IS NOT NULL AND v_quantity_before > 3 THEN
    v_quantity_after := GREATEST(0, v_quantity_before - 3);
    
    INSERT INTO public.inventory_adjustments (
      lot_id, quantity_before, quantity_after, reason, status, created_by, created_at
    ) VALUES (
      v_lot_id, v_quantity_before, v_quantity_after, 
      'Pérdida por rotura durante manejo - Huevos dañados al mover', 
      'PENDING', v_user_id, (CURRENT_DATE - INTERVAL '1 day')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- Ajuste 5: APPROVED - Merma por deterioro en Leche entera (hace 2 semanas)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_quantity_before NUMERIC;
  v_quantity_after NUMERIC := 0;
  v_quantity_difference NUMERIC;
  v_adjustment_id BIGINT;
  v_ajuste_type_id BIGINT;
  v_created_at TIMESTAMPTZ := (CURRENT_DATE - INTERVAL '2 weeks')::TIMESTAMPTZ;
BEGIN
  SELECT lot_id, current_quantity INTO v_lot_id, v_quantity_before
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Leche entera')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
  LIMIT 1;
  
  SELECT type_id INTO v_ajuste_type_id FROM public.movement_types WHERE type_code = 'AJUSTE';
  
  IF v_lot_id IS NOT NULL AND v_quantity_before > 8 AND v_ajuste_type_id IS NOT NULL THEN
    v_quantity_after := GREATEST(0, v_quantity_before - 8);
    v_quantity_difference := v_quantity_after - v_quantity_before;
    
    -- Crear ajuste
    INSERT INTO public.inventory_adjustments (
      lot_id, quantity_before, quantity_after, reason, status, created_by, approved_by, created_at, updated_at
    ) VALUES (
      v_lot_id, v_quantity_before, v_quantity_after, 
      'Merma por deterioro - Producto próximo a vencer deteriorado', 
      'APPROVED', v_user_id, v_admin_id, v_created_at, v_created_at
    ) RETURNING adjustment_id INTO v_adjustment_id;
    
    -- Crear movimiento de ajuste
    INSERT INTO public.stock_movements (
      lot_id, movement_type_id, quantity, notes, reference_id, created_by, created_at
    ) VALUES (
      v_lot_id, v_ajuste_type_id, ABS(v_quantity_difference), 
      'Merma por deterioro - Producto próximo a vencer deteriorado', 
      'ADJUSTMENT-' || v_adjustment_id::TEXT, v_admin_id, v_created_at
    );
    
    -- Actualizar current_quantity
    UPDATE public.stock_lots 
    SET current_quantity = v_quantity_after, updated_at = NOW()
    WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Ajuste 6: APPROVED - Corrección de inventario en Frijoles negros (hace 1 semana)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_quantity_before NUMERIC;
  v_quantity_after NUMERIC := 0;
  v_quantity_difference NUMERIC;
  v_adjustment_id BIGINT;
  v_ajuste_type_id BIGINT;
  v_created_at TIMESTAMPTZ := (CURRENT_DATE - INTERVAL '1 week')::TIMESTAMPTZ;
BEGIN
  SELECT lot_id, current_quantity INTO v_lot_id, v_quantity_before
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Frijoles negros')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
  LIMIT 1;
  
  SELECT type_id INTO v_ajuste_type_id FROM public.movement_types WHERE type_code = 'AJUSTE';
  
  IF v_lot_id IS NOT NULL AND v_quantity_before > 20 AND v_ajuste_type_id IS NOT NULL THEN
    v_quantity_after := GREATEST(0, v_quantity_before - 20);
    v_quantity_difference := v_quantity_after - v_quantity_before;
    
    INSERT INTO public.inventory_adjustments (
      lot_id, quantity_before, quantity_after, reason, status, created_by, approved_by, created_at, updated_at
    ) VALUES (
      v_lot_id, v_quantity_before, v_quantity_after, 
      'Error en conteo físico - Corrección de inventario después de conteo manual', 
      'APPROVED', v_user_id, v_admin_id, v_created_at, v_created_at
    ) RETURNING adjustment_id INTO v_adjustment_id;
    
    INSERT INTO public.stock_movements (
      lot_id, movement_type_id, quantity, notes, reference_id, created_by, created_at
    ) VALUES (
      v_lot_id, v_ajuste_type_id, ABS(v_quantity_difference), 
      'Error en conteo físico - Corrección de inventario después de conteo manual', 
      'ADJUSTMENT-' || v_adjustment_id::TEXT, v_admin_id, v_created_at
    );
    
    UPDATE public.stock_lots SET current_quantity = v_quantity_after, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Ajuste 7: APPROVED - Pérdida por rotura en Detergente líquido (hace 4 días)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_quantity_before NUMERIC;
  v_quantity_after NUMERIC := 0;
  v_quantity_difference NUMERIC;
  v_adjustment_id BIGINT;
  v_ajuste_type_id BIGINT;
  v_created_at TIMESTAMPTZ := (CURRENT_DATE - INTERVAL '4 days')::TIMESTAMPTZ;
BEGIN
  SELECT lot_id, current_quantity INTO v_lot_id, v_quantity_before
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Detergente líquido')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
  LIMIT 1;
  
  SELECT type_id INTO v_ajuste_type_id FROM public.movement_types WHERE type_code = 'AJUSTE';
  
  IF v_lot_id IS NOT NULL AND v_quantity_before > 5 AND v_ajuste_type_id IS NOT NULL THEN
    v_quantity_after := GREATEST(0, v_quantity_before - 5);
    v_quantity_difference := v_quantity_after - v_quantity_before;
    
    INSERT INTO public.inventory_adjustments (
      lot_id, quantity_before, quantity_after, reason, status, created_by, approved_by, created_at, updated_at
    ) VALUES (
      v_lot_id, v_quantity_before, v_quantity_after, 
      'Pérdida por rotura - Botellas de detergente rotas durante almacenamiento', 
      'APPROVED', v_user_id, v_admin_id, v_created_at, v_created_at
    ) RETURNING adjustment_id INTO v_adjustment_id;
    
    INSERT INTO public.stock_movements (
      lot_id, movement_type_id, quantity, notes, reference_id, created_by, created_at
    ) VALUES (
      v_lot_id, v_ajuste_type_id, ABS(v_quantity_difference), 
      'Pérdida por rotura - Botellas de detergente rotas durante almacenamiento', 
      'ADJUSTMENT-' || v_adjustment_id::TEXT, v_admin_id, v_created_at
    );
    
    UPDATE public.stock_lots SET current_quantity = v_quantity_after, updated_at = NOW() WHERE lot_id = v_lot_id;
  END IF;
END $$;

-- Ajuste 8: REJECTED - Corrección de inventario en Aceite vegetal (hace 3 días)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_quantity_before NUMERIC;
  v_quantity_after NUMERIC := 0;
BEGIN
  SELECT lot_id, current_quantity INTO v_lot_id, v_quantity_before
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Aceite vegetal')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central')
  LIMIT 1;
  
  IF v_lot_id IS NOT NULL AND v_quantity_before > 10 THEN
    v_quantity_after := GREATEST(0, v_quantity_before - 10);
    
    INSERT INTO public.inventory_adjustments (
      lot_id, quantity_before, quantity_after, reason, status, created_by, approved_by, rejection_reason, created_at, updated_at
    ) VALUES (
      v_lot_id, v_quantity_before, v_quantity_after, 
      'Error en conteo físico - Solicitud de corrección', 
      'REJECTED', v_user_id, v_admin_id, 
      'Se requiere verificación adicional antes de aprobar el ajuste', 
      (CURRENT_DATE - INTERVAL '3 days')::TIMESTAMPTZ, (CURRENT_DATE - INTERVAL '3 days')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- Ajuste 9: REJECTED - Merma por deterioro en Plátanos (hace 1 día)
DO $$
DECLARE
  v_lot_id BIGINT;
  v_user_id UUID := 'a2e179b9-4583-462c-80d0-15527ae4bb5f';
  v_admin_id UUID := 'ea2db40d-abd3-4969-871e-1e2f4c9eaadc';
  v_quantity_before NUMERIC;
  v_quantity_after NUMERIC := 0;
BEGIN
  SELECT lot_id, current_quantity INTO v_lot_id, v_quantity_before
  FROM public.stock_lots 
  WHERE product_id = (SELECT product_id FROM public.products WHERE product_name = 'Plátanos')
    AND warehouse_id = (SELECT warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos')
  LIMIT 1;
  
  IF v_lot_id IS NOT NULL AND v_quantity_before > 2 THEN
    v_quantity_after := GREATEST(0, v_quantity_before - 2);
    
    INSERT INTO public.inventory_adjustments (
      lot_id, quantity_before, quantity_after, reason, status, created_by, approved_by, rejection_reason, created_at, updated_at
    ) VALUES (
      v_lot_id, v_quantity_before, v_quantity_after, 
      'Merma por deterioro - Frutas en mal estado', 
      'REJECTED', v_user_id, v_admin_id, 
      'La cantidad de merma reportada no justifica el ajuste solicitado', 
      (CURRENT_DATE - INTERVAL '1 day')::TIMESTAMPTZ, (CURRENT_DATE - INTERVAL '1 day')::TIMESTAMPTZ
    );
  END IF;
END $$;

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE public.donors IS 'Donantes del sistema. Incluye empresas, particulares, fundaciones, etc.';
COMMENT ON TABLE public.products IS 'Productos del inventario con diferentes categorías, marcas y unidades';
COMMENT ON TABLE public.donation_transactions IS 'Transacciones de donación creadas mediante create_donation_atomic';
COMMENT ON TABLE public.stock_lots IS 'Lotes de stock incluyendo productos disponibles, bajos, próximos a vencer y vencidos';

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 
-- 1. Las donaciones se crean usando la función create_donation_atomic que
--    automáticamente crea:
--    - donation_transactions (con market_value y actual_value calculados)
--    - donation_items
--    - stock_lots
--    - stock_movements (movimiento ENTRADA automático para cada lote creado)
--
-- 2. Los lotes de stock adicionales se crean manualmente para probar diferentes
--    escenarios: stock bajo, productos próximos a vencer y productos vencidos.
--    NOTA: Estos lotes NO tienen movimientos asociados en stock_movements (intencional).
--
-- 3. El trigger check_expired_lots marcará automáticamente como vencidos los
--    productos con expiry_date en el pasado.
--
-- 4. Los productos vencidos deberían ser movidos al "Almacén de Caducados" (ID: 999)
--    mediante la interfaz de la aplicación usando traspasos o ajustes.
--
-- 5. Este script usa subconsultas para obtener los IDs de las tablas de referencia,
--    lo que lo hace compatible con diferentes configuraciones de base de datos.
--
-- 6. Las fechas de donación se distribuyen en los últimos 6 meses para mostrar
--    un historial realista.
--
-- 7. Los campos market_value y actual_value en donation_transactions se calculan
--    automáticamente por create_donation_atomic (no usar total_market_value ni
--    total_actual_value, que fueron renombrados).
--
-- 8. El trigger prevent_direct_stock_update previene actualizaciones directas de
--    current_quantity. Use register_stock_movement para registrar cambios de stock.
--
-- 9. Los movimientos de SALIDA se insertan directamente junto con la actualización
--    de current_quantity en el mismo bloque DO para que el trigger permita el cambio
--    (el trigger permite actualizaciones si hay un movimiento reciente en los últimos 5 segundos).
--
-- 10. Los traspasos APPROVED/COMPLETED simulan la lógica de approve_stock_transfer:
--     - Crean movimientos TRASPASO_SALIDA y TRASPASO_ENTRADA
--     - Actualizan lotes origen y destino
--     - Crean nuevo lote en almacén destino si no existe
--
-- 11. Los ajustes APPROVED simulan la lógica de approve_inventory_adjustment:
--     - Actualizan current_quantity del lote
--     - Crean movimiento AJUSTE con la diferencia de cantidad
--     - Actualizan status a APPROVED
--
-- 12. Los datos de prueba incluyen:
--     - 18 movimientos de SALIDA (CONSUMO, MERMA, BAZAR, DONACION_ONG)
--     - 9 traspasos (4 PENDING, 3 APPROVED/COMPLETED, 2 REJECTED)
--     - 9 ajustes de inventario (4 PENDING, 3 APPROVED, 2 REJECTED)
--
-- 13. Usuarios de prueba usados:
--     - Operador: a2e179b9-4583-462c-80d0-15527ae4bb5f
--     - Administrador: ea2db40d-abd3-4969-871e-1e2f4c9eaadc (Lorena)
--
-- ============================================================================
-- FIN DEL SCRIPT DE DATOS DE PRUEBA
-- ============================================================================

