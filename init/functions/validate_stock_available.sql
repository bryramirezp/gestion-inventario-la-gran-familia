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
  -- Calcular stock disponible (excluyendo vencidos)
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

