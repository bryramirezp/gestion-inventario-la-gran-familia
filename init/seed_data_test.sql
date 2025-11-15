-- ============================================================================
-- SCRIPT DE DATOS DE PRUEBA: Sistema de Gestión de Inventario "La Gran Familia"
-- ============================================================================
-- Versión: 1.0
-- Fecha: Diciembre 2024
-- 
-- Este script inserta datos de prueba para visualizar el sistema con inventario
-- completo y operativo. Incluye donantes, productos, donaciones históricas y
-- lotes de stock distribuidos en diferentes almacenes.
-- 
-- IMPORTANTE: Ejecutar DESPUÉS de:
--             1. database-schema-synced-with-code.sql
--             2. seed_data.sql (datos base: roles, categorías, unidades, etc.)
--             3. functions/*.sql (funciones como create_donation_atomic)
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
-- DONACIONES (usando create_donation_atomic)
-- ============================================================================
-- Las donaciones se crean usando la función create_donation_atomic que crea
-- automáticamente: donation_transactions, donation_items y stock_lots
-- NOTA: Usamos bloques DO para obtener los IDs antes de construir el JSON

-- Donación 1: Supermercado La Esperanza - Alimentos básicos (hace 5 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_arroz_id BIGINT;
  v_frijoles_id BIGINT;
  v_azucar_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Supermercado La Esperanza S.A.';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_arroz_id FROM public.products WHERE product_name = 'Arroz blanco';
  SELECT product_id INTO v_frijoles_id FROM public.products WHERE product_name = 'Frijoles negros';
  SELECT product_id INTO v_azucar_id FROM public.products WHERE product_name = 'Azúcar blanca';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_arroz_id, 'quantity', 500, 'market_unit_price', 25.50, 'actual_unit_price', 20.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_frijoles_id, 'quantity', 300, 'market_unit_price', 30.00, 'actual_unit_price', 25.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_azucar_id, 'quantity', 200, 'market_unit_price', 18.00, 'actual_unit_price', 15.00, 'expiry_date', NULL)
    ),
    (CURRENT_DATE - INTERVAL '5 months')::DATE
  );
END $$;

-- Donación 2: Distribuidora Alimentos del Norte - Enlatados (hace 4 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_atun_id BIGINT;
  v_sardinas_id BIGINT;
  v_frijoles_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Distribuidora Alimentos del Norte';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT product_id INTO v_atun_id FROM public.products WHERE product_name = 'Atún enlatado';
  SELECT product_id INTO v_sardinas_id FROM public.products WHERE product_name = 'Sardinas enlatadas';
  SELECT product_id INTO v_frijoles_id FROM public.products WHERE product_name = 'Frijoles enlatados';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_atun_id, 'quantity', 150, 'market_unit_price', 15.00, 'actual_unit_price', 12.00, 'expiry_date', '2025-12-31'),
      jsonb_build_object('product_id', v_sardinas_id, 'quantity', 120, 'market_unit_price', 12.00, 'actual_unit_price', 10.00, 'expiry_date', '2025-11-30'),
      jsonb_build_object('product_id', v_frijoles_id, 'quantity', 100, 'market_unit_price', 18.00, 'actual_unit_price', 15.00, 'expiry_date', '2025-10-31')
    ),
    (CURRENT_DATE - INTERVAL '4 months')::DATE
  );
END $$;

-- Donación 3: Farmacia San José - Higiene personal (hace 4 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_shampoo_id BIGINT;
  v_pasta_id BIGINT;
  v_jabon_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Farmacia San José';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Farmacia';
  SELECT product_id INTO v_shampoo_id FROM public.products WHERE product_name = 'Shampoo';
  SELECT product_id INTO v_pasta_id FROM public.products WHERE product_name = 'Pasta dental';
  SELECT product_id INTO v_jabon_id FROM public.products WHERE product_name = 'Jabón de baño';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_shampoo_id, 'quantity', 80, 'market_unit_price', 45.00, 'actual_unit_price', 35.00, 'expiry_date', '2026-06-30'),
      jsonb_build_object('product_id', v_pasta_id, 'quantity', 100, 'market_unit_price', 25.00, 'actual_unit_price', 20.00, 'expiry_date', '2026-08-31'),
      jsonb_build_object('product_id', v_jabon_id, 'quantity', 120, 'market_unit_price', 8.00, 'actual_unit_price', 6.00, 'expiry_date', NULL)
    ),
    (CURRENT_DATE - INTERVAL '4 months')::DATE
  );
END $$;

-- Donación 4: Panadería El Buen Pan - Productos básicos (hace 3 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_harina_id BIGINT;
  v_azucar_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Panadería El Buen Pan';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT product_id INTO v_harina_id FROM public.products WHERE product_name = 'Harina de trigo';
  SELECT product_id INTO v_azucar_id FROM public.products WHERE product_name = 'Azúcar blanca';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_harina_id, 'quantity', 400, 'market_unit_price', 22.00, 'actual_unit_price', 18.00, 'expiry_date', '2025-09-30'),
      jsonb_build_object('product_id', v_azucar_id, 'quantity', 150, 'market_unit_price', 18.00, 'actual_unit_price', 15.00, 'expiry_date', NULL)
    ),
    (CURRENT_DATE - INTERVAL '3 months')::DATE
  );
END $$;

-- Donación 5: Familia García - Varios productos (hace 3 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_aceite_id BIGINT;
  v_pasta_id BIGINT;
  v_sal_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Familia García';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_aceite_id FROM public.products WHERE product_name = 'Aceite vegetal';
  SELECT product_id INTO v_pasta_id FROM public.products WHERE product_name = 'Pasta de fideos';
  SELECT product_id INTO v_sal_id FROM public.products WHERE product_name = 'Sal de mesa';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_aceite_id, 'quantity', 50, 'market_unit_price', 35.00, 'actual_unit_price', 28.00, 'expiry_date', '2025-12-31'),
      jsonb_build_object('product_id', v_pasta_id, 'quantity', 80, 'market_unit_price', 12.00, 'actual_unit_price', 10.00, 'expiry_date', '2026-03-31'),
      jsonb_build_object('product_id', v_sal_id, 'quantity', 30, 'market_unit_price', 8.00, 'actual_unit_price', 6.00, 'expiry_date', NULL)
    ),
    (CURRENT_DATE - INTERVAL '3 months')::DATE
  );
END $$;

-- Donación 6: María Elena Pérez - Productos de limpieza (hace 2 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_detergente_id BIGINT;
  v_cloro_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'María Elena Pérez';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_detergente_id FROM public.products WHERE product_name = 'Detergente líquido';
  SELECT product_id INTO v_cloro_id FROM public.products WHERE product_name = 'Cloro';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_detergente_id, 'quantity', 60, 'market_unit_price', 55.00, 'actual_unit_price', 45.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_cloro_id, 'quantity', 40, 'market_unit_price', 25.00, 'actual_unit_price', 20.00, 'expiry_date', NULL)
    ),
    (CURRENT_DATE - INTERVAL '2 months')::DATE
  );
END $$;

-- Donación 7: Fundación Ayuda Comunitaria - Productos refrigerados (hace 2 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_leche_id BIGINT;
  v_huevos_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Fundación Ayuda Comunitaria';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT product_id INTO v_leche_id FROM public.products WHERE product_name = 'Leche entera';
  SELECT product_id INTO v_huevos_id FROM public.products WHERE product_name = 'Huevos';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_leche_id, 'quantity', 100, 'market_unit_price', 28.00, 'actual_unit_price', 22.00, 'expiry_date', '2024-12-15'),
      jsonb_build_object('product_id', v_huevos_id, 'quantity', 50, 'market_unit_price', 45.00, 'actual_unit_price', 35.00, 'expiry_date', '2024-12-20')
    ),
    (CURRENT_DATE - INTERVAL '2 months')::DATE
  );
END $$;

-- Donación 8: Asociación Solidaridad - Textiles (hace 2 meses)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_camisetas_id BIGINT;
  v_pantalones_id BIGINT;
  v_cobijas_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Asociación Solidaridad';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa';
  SELECT product_id INTO v_camisetas_id FROM public.products WHERE product_name = 'Camisetas';
  SELECT product_id INTO v_pantalones_id FROM public.products WHERE product_name = 'Pantalones';
  SELECT product_id INTO v_cobijas_id FROM public.products WHERE product_name = 'Cobijas';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_camisetas_id, 'quantity', 100, 'market_unit_price', 120.00, 'actual_unit_price', 80.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_pantalones_id, 'quantity', 80, 'market_unit_price', 250.00, 'actual_unit_price', 180.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_cobijas_id, 'quantity', 50, 'market_unit_price', 300.00, 'actual_unit_price', 200.00, 'expiry_date', NULL)
    ),
    (CURRENT_DATE - INTERVAL '2 months')::DATE
  );
END $$;

-- Donación 9: Universidad Nacional - Bebidas y alimentos (hace 1 mes)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_agua_id BIGINT;
  v_jugo_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Universidad Nacional';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_agua_id FROM public.products WHERE product_name = 'Agua embotellada';
  SELECT product_id INTO v_jugo_id FROM public.products WHERE product_name = 'Jugo de naranja';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_agua_id, 'quantity', 500, 'market_unit_price', 8.00, 'actual_unit_price', 6.00, 'expiry_date', '2026-12-31'),
      jsonb_build_object('product_id', v_jugo_id, 'quantity', 80, 'market_unit_price', 35.00, 'actual_unit_price', 28.00, 'expiry_date', '2025-06-30')
    ),
    (CURRENT_DATE - INTERVAL '1 month')::DATE
  );
END $$;

-- Donación 10: Secretaría de Desarrollo Social - Varios productos (hace 1 mes)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_arroz_id BIGINT;
  v_frijoles_id BIGINT;
  v_aceite_id BIGINT;
  v_pasta_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Secretaría de Desarrollo Social';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_arroz_id FROM public.products WHERE product_name = 'Arroz blanco';
  SELECT product_id INTO v_frijoles_id FROM public.products WHERE product_name = 'Frijoles negros';
  SELECT product_id INTO v_aceite_id FROM public.products WHERE product_name = 'Aceite vegetal';
  SELECT product_id INTO v_pasta_id FROM public.products WHERE product_name = 'Pasta de fideos';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_arroz_id, 'quantity', 300, 'market_unit_price', 25.50, 'actual_unit_price', 20.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_frijoles_id, 'quantity', 200, 'market_unit_price', 30.00, 'actual_unit_price', 25.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_aceite_id, 'quantity', 80, 'market_unit_price', 35.00, 'actual_unit_price', 28.00, 'expiry_date', '2025-11-30'),
      jsonb_build_object('product_id', v_pasta_id, 'quantity', 100, 'market_unit_price', 12.00, 'actual_unit_price', 10.00, 'expiry_date', '2026-04-30')
    ),
    (CURRENT_DATE - INTERVAL '1 month')::DATE
  );
END $$;

-- Donación 11: DIF Municipal - Higiene y limpieza (hace 1 mes)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_papel_id BIGINT;
  v_toallas_id BIGINT;
  v_jabon_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'DIF Municipal';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Farmacia';
  SELECT product_id INTO v_papel_id FROM public.products WHERE product_name = 'Papel higiénico';
  SELECT product_id INTO v_toallas_id FROM public.products WHERE product_name = 'Toallas sanitarias';
  SELECT product_id INTO v_jabon_id FROM public.products WHERE product_name = 'Jabón de barra';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_papel_id, 'quantity', 60, 'market_unit_price', 85.00, 'actual_unit_price', 65.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_toallas_id, 'quantity', 40, 'market_unit_price', 45.00, 'actual_unit_price', 35.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_jabon_id, 'quantity', 100, 'market_unit_price', 12.00, 'actual_unit_price', 8.00, 'expiry_date', NULL)
    ),
    (CURRENT_DATE - INTERVAL '1 month')::DATE
  );
END $$;

-- Donación 12: Grupo de Familias Solidarias - Frutas y verduras (hace 3 semanas)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_manzanas_id BIGINT;
  v_platanos_id BIGINT;
  v_zanahorias_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Grupo de Familias Solidarias';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT product_id INTO v_manzanas_id FROM public.products WHERE product_name = 'Manzanas';
  SELECT product_id INTO v_platanos_id FROM public.products WHERE product_name = 'Plátanos';
  SELECT product_id INTO v_zanahorias_id FROM public.products WHERE product_name = 'Zanahorias';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_manzanas_id, 'quantity', 50, 'market_unit_price', 35.00, 'actual_unit_price', 28.00, 'expiry_date', '2024-12-25'),
      jsonb_build_object('product_id', v_platanos_id, 'quantity', 40, 'market_unit_price', 20.00, 'actual_unit_price', 15.00, 'expiry_date', '2024-12-20'),
      jsonb_build_object('product_id', v_zanahorias_id, 'quantity', 30, 'market_unit_price', 25.00, 'actual_unit_price', 20.00, 'expiry_date', '2024-12-22')
    ),
    (CURRENT_DATE - INTERVAL '3 weeks')::DATE
  );
END $$;

-- Donación 13: Tienda de Abarrotes Doña Rosa - Varios (hace 3 semanas)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_maiz_id BIGINT;
  v_chiles_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Tienda de Abarrotes Doña Rosa';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_maiz_id FROM public.products WHERE product_name = 'Maíz enlatado';
  SELECT product_id INTO v_chiles_id FROM public.products WHERE product_name = 'Chiles enlatados';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_maiz_id, 'quantity', 60, 'market_unit_price', 15.00, 'actual_unit_price', 12.00, 'expiry_date', '2025-08-31'),
      jsonb_build_object('product_id', v_chiles_id, 'quantity', 50, 'market_unit_price', 18.00, 'actual_unit_price', 15.00, 'expiry_date', '2025-09-30')
    ),
    (CURRENT_DATE - INTERVAL '3 weeks')::DATE
  );
END $$;

-- Donación 14: Carnicería La Frontera - Productos refrigerados (hace 2 semanas)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_queso_id BIGINT;
  v_mantequilla_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Carnicería La Frontera';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT product_id INTO v_queso_id FROM public.products WHERE product_name = 'Queso fresco';
  SELECT product_id INTO v_mantequilla_id FROM public.products WHERE product_name = 'Mantequilla';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_queso_id, 'quantity', 25, 'market_unit_price', 85.00, 'actual_unit_price', 70.00, 'expiry_date', '2024-12-18'),
      jsonb_build_object('product_id', v_mantequilla_id, 'quantity', 20, 'market_unit_price', 45.00, 'actual_unit_price', 35.00, 'expiry_date', '2025-01-15')
    ),
    (CURRENT_DATE - INTERVAL '2 weeks')::DATE
  );
END $$;

-- Donación 15: Don Pedro Morales - Alimentos básicos (hace 2 semanas)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_arroz_id BIGINT;
  v_frijoles_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Don Pedro Morales';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_arroz_id FROM public.products WHERE product_name = 'Arroz blanco';
  SELECT product_id INTO v_frijoles_id FROM public.products WHERE product_name = 'Frijoles negros';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_arroz_id, 'quantity', 100, 'market_unit_price', 25.50, 'actual_unit_price', 20.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_frijoles_id, 'quantity', 80, 'market_unit_price', 30.00, 'actual_unit_price', 25.00, 'expiry_date', NULL)
    ),
    (CURRENT_DATE - INTERVAL '2 weeks')::DATE
  );
END $$;

-- Donación 16: Familia Rodríguez - Limpieza (hace 1 semana)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_escoba_id BIGINT;
  v_trapeador_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Familia Rodríguez';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_escoba_id FROM public.products WHERE product_name = 'Escoba';
  SELECT product_id INTO v_trapeador_id FROM public.products WHERE product_name = 'Trapeador';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_escoba_id, 'quantity', 20, 'market_unit_price', 45.00, 'actual_unit_price', 35.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_trapeador_id, 'quantity', 15, 'market_unit_price', 85.00, 'actual_unit_price', 65.00, 'expiry_date', NULL)
    ),
    (CURRENT_DATE - INTERVAL '1 week')::DATE
  );
END $$;

-- Donación 17: Fundación Esperanza - Varios productos (hace 1 semana)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_atun_id BIGINT;
  v_sardinas_id BIGINT;
  v_agua_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Fundación Esperanza';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_atun_id FROM public.products WHERE product_name = 'Atún enlatado';
  SELECT product_id INTO v_sardinas_id FROM public.products WHERE product_name = 'Sardinas enlatadas';
  SELECT product_id INTO v_agua_id FROM public.products WHERE product_name = 'Agua embotellada';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_atun_id, 'quantity', 80, 'market_unit_price', 15.00, 'actual_unit_price', 12.00, 'expiry_date', '2025-10-31'),
      jsonb_build_object('product_id', v_sardinas_id, 'quantity', 60, 'market_unit_price', 12.00, 'actual_unit_price', 10.00, 'expiry_date', '2025-09-30'),
      jsonb_build_object('product_id', v_agua_id, 'quantity', 200, 'market_unit_price', 8.00, 'actual_unit_price', 6.00, 'expiry_date', '2026-06-30')
    ),
    (CURRENT_DATE - INTERVAL '1 week')::DATE
  );
END $$;

-- Donación 18: Instituto Tecnológico Regional - Bebidas (hace 5 días)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_refresco_id BIGINT;
  v_jugo_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Instituto Tecnológico Regional';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_refresco_id FROM public.products WHERE product_name = 'Refresco cola';
  SELECT product_id INTO v_jugo_id FROM public.products WHERE product_name = 'Jugo de naranja';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_refresco_id, 'quantity', 60, 'market_unit_price', 28.00, 'actual_unit_price', 22.00, 'expiry_date', '2025-08-31'),
      jsonb_build_object('product_id', v_jugo_id, 'quantity', 40, 'market_unit_price', 35.00, 'actual_unit_price', 28.00, 'expiry_date', '2025-05-31')
    ),
    (CURRENT_DATE - INTERVAL '5 days')::DATE
  );
END $$;

-- Donación 19: Red de Apoyo Familiar - Textiles (hace 4 días)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_zapatos_id BIGINT;
  v_camisetas_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Red de Apoyo Familiar';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Ropa';
  SELECT product_id INTO v_zapatos_id FROM public.products WHERE product_name = 'Zapatos deportivos';
  SELECT product_id INTO v_camisetas_id FROM public.products WHERE product_name = 'Camisetas';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_zapatos_id, 'quantity', 30, 'market_unit_price', 350.00, 'actual_unit_price', 250.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_camisetas_id, 'quantity', 50, 'market_unit_price', 120.00, 'actual_unit_price', 80.00, 'expiry_date', NULL)
    ),
    (CURRENT_DATE - INTERVAL '4 days')::DATE
  );
END $$;

-- Donación 20: Familias Unidas - Varios productos (hace 3 días)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_papas_id BIGINT;
  v_cebollas_id BIGINT;
  v_bolsas_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Familias Unidas';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_papas_id FROM public.products WHERE product_name = 'Papas';
  SELECT product_id INTO v_cebollas_id FROM public.products WHERE product_name = 'Cebollas';
  SELECT product_id INTO v_bolsas_id FROM public.products WHERE product_name = 'Bolsas de plástico';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_papas_id, 'quantity', 60, 'market_unit_price', 18.00, 'actual_unit_price', 15.00, 'expiry_date', '2024-12-30'),
      jsonb_build_object('product_id', v_cebollas_id, 'quantity', 40, 'market_unit_price', 20.00, 'actual_unit_price', 16.00, 'expiry_date', '2024-12-28'),
      jsonb_build_object('product_id', v_bolsas_id, 'quantity', 200, 'market_unit_price', 2.00, 'actual_unit_price', 1.50, 'expiry_date', NULL)
    ),
    (CURRENT_DATE - INTERVAL '3 days')::DATE
  );
END $$;

-- Donación 21: Verdulería Fresca - Frutas y verduras (hace 2 días)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_manzanas_id BIGINT;
  v_platanos_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Verdulería Fresca';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Alimentos';
  SELECT product_id INTO v_manzanas_id FROM public.products WHERE product_name = 'Manzanas';
  SELECT product_id INTO v_platanos_id FROM public.products WHERE product_name = 'Plátanos';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_manzanas_id, 'quantity', 30, 'market_unit_price', 35.00, 'actual_unit_price', 28.00, 'expiry_date', '2024-12-23'),
      jsonb_build_object('product_id', v_platanos_id, 'quantity', 25, 'market_unit_price', 20.00, 'actual_unit_price', 15.00, 'expiry_date', '2024-12-19')
    ),
    (CURRENT_DATE - INTERVAL '2 days')::DATE
  );
END $$;

-- Donación 22: Supermercado La Esperanza - Segunda donación (hace 1 día)
DO $$
DECLARE
  v_donor_id BIGINT;
  v_warehouse_id BIGINT;
  v_arroz_id BIGINT;
  v_aceite_id BIGINT;
  v_pasta_id BIGINT;
BEGIN
  SELECT donor_id INTO v_donor_id FROM public.donors WHERE donor_name = 'Supermercado La Esperanza S.A.';
  SELECT warehouse_id INTO v_warehouse_id FROM public.warehouses WHERE warehouse_name = 'Bodega Central';
  SELECT product_id INTO v_arroz_id FROM public.products WHERE product_name = 'Arroz blanco';
  SELECT product_id INTO v_aceite_id FROM public.products WHERE product_name = 'Aceite vegetal';
  SELECT product_id INTO v_pasta_id FROM public.products WHERE product_name = 'Pasta de fideos';
  
  PERFORM public.create_donation_atomic(
    v_donor_id,
    v_warehouse_id,
    jsonb_build_array(
      jsonb_build_object('product_id', v_arroz_id, 'quantity', 200, 'market_unit_price', 25.50, 'actual_unit_price', 20.00, 'expiry_date', NULL),
      jsonb_build_object('product_id', v_aceite_id, 'quantity', 60, 'market_unit_price', 35.00, 'actual_unit_price', 28.00, 'expiry_date', '2025-10-31'),
      jsonb_build_object('product_id', v_pasta_id, 'quantity', 70, 'market_unit_price', 12.00, 'actual_unit_price', 10.00, 'expiry_date', '2026-02-28')
    ),
    (CURRENT_DATE - INTERVAL '1 day')::DATE
  );
END $$;

-- ============================================================================
-- STOCK LOTS ADICIONALES (creados manualmente)
-- ============================================================================
-- Estos lotes representan productos que no vienen de donaciones o que necesitan
-- ajustes manuales para probar diferentes escenarios

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
--    automáticamente crea: donation_transactions, donation_items y stock_lots.
--
-- 2. Los lotes de stock adicionales se crean manualmente para probar diferentes
--    escenarios: stock bajo, productos próximos a vencer y productos vencidos.
--
-- 3. El trigger check_expired_lots marcará automáticamente como vencidos los
--    productos con expiry_date en el pasado.
--
-- 4. Los productos vencidos deberían ser movidos al "Almacén de Caducados" (ID: 999)
--    mediante la interfaz de la aplicación.
--
-- 5. Este script usa subconsultas para obtener los IDs de las tablas de referencia,
--    lo que lo hace compatible con diferentes configuraciones de base de datos.
--
-- 6. Las fechas de donación se distribuyen en los últimos 6 meses para mostrar
--    un historial realista.
--
-- ============================================================================
-- FIN DEL SCRIPT DE DATOS DE PRUEBA
-- ============================================================================

