-- ============================================================================
-- Función: validate_stock_available
-- ============================================================================
-- Descripción: Valida si hay suficiente stock disponible para un producto
--              en un almacén específico (excluyendo productos vencidos).
-- 
-- Parámetros:
--   p_product_id: ID del producto
--   p_warehouse_id: ID del almacén
--   p_required_quantity: Cantidad requerida
--
-- Retorna: BOOLEAN (true si hay stock suficiente, false si no)
--
-- NOTA: Esta función es IDEMPOTENTE (usa CREATE OR REPLACE)
--       Puede ejecutarse múltiples veces sin errores.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.validate_stock_available(
  p_product_id BIGINT,
  p_warehouse_id BIGINT,
  p_required_quantity NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  v_available_stock NUMERIC;
BEGIN
  -- Validar parámetros de entrada
  IF p_required_quantity < 0 THEN
    RAISE EXCEPTION 'Required quantity must be positive, got: %', p_required_quantity;
  END IF;
  
  -- Si no se requiere stock, retornar true inmediatamente
  IF p_required_quantity = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Validar que el producto existe
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE product_id = p_product_id) THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;
  
  -- Validar que el almacén existe
  IF NOT EXISTS (SELECT 1 FROM public.warehouses WHERE warehouse_id = p_warehouse_id) THEN
    RAISE EXCEPTION 'Warehouse not found: %', p_warehouse_id;
  END IF;
  
  -- Calcular stock disponible (excluyendo vencidos)
  -- NOTA: El índice idx_stock_lots_available_stock (definido en database-schema-synced-with-code.sql) optimiza esta query
  SELECT COALESCE(SUM(current_quantity), 0) INTO v_available_stock
  FROM public.stock_lots
  WHERE product_id = p_product_id
    AND warehouse_id = p_warehouse_id
    AND is_expired = FALSE
    AND current_quantity > 0;
  
  -- Retornar true si hay stock suficiente
  RETURN v_available_stock >= p_required_quantity;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON FUNCTION public.validate_stock_available IS 
'Valida si hay suficiente stock disponible para un producto en un almacén. Excluye productos vencidos.';

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.validate_stock_available(BIGINT, BIGINT, NUMERIC) TO anon, authenticated, service_role;

