-- ============================================================================
-- Función: complete_kitchen_transaction
-- ============================================================================
-- Descripción: Completa una transacción de cocina con validación atómica de stock
--              y deducción FIFO usando SELECT FOR UPDATE SKIP LOCKED para
--              evitar condiciones de carrera.
-- 
-- Parámetros:
--   p_transaction_id: ID de la transacción a completar
--   p_approver_id: ID del usuario que aprueba/completa la transacción
--
-- Retorna: JSON con { success: true, transaction_id: ... } o lanza excepción
--
-- NOTA: Esta función es IDEMPOTENTE (usa CREATE OR REPLACE)
--       Puede ejecutarse múltiples veces sin errores.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.complete_kitchen_transaction(
  p_transaction_id BIGINT,
  p_approver_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_detail RECORD;
  v_lot RECORD;
  v_quantity_to_deduct NUMERIC;
  v_available_stock NUMERIC;
  v_deducted_amount NUMERIC;
  v_source_warehouse_id BIGINT;
  v_result JSON;
  v_transaction_status TEXT;
BEGIN
  -- Verificar que la transacción existe y está aprobada
  SELECT status, source_warehouse_id INTO v_transaction_status, v_source_warehouse_id
  FROM public.transactions
  WHERE transaction_id = p_transaction_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
  END IF;
  
  IF v_transaction_status != 'Approved' THEN
    RAISE EXCEPTION 'Transaction must be approved before completion. Current status: %', v_transaction_status;
  END IF;
  
  -- Para cada detalle de la transacción
  FOR v_detail IN 
    SELECT * FROM public.transaction_details 
    WHERE transaction_id = p_transaction_id
  LOOP
    -- Calcular stock disponible total (excluyendo vencidos)
    SELECT COALESCE(SUM(current_quantity), 0) INTO v_available_stock
    FROM public.stock_lots
    WHERE product_id = v_detail.product_id
      AND warehouse_id = v_source_warehouse_id
      AND is_expired = FALSE
      AND current_quantity > 0;
    
    -- Validar stock suficiente
    IF v_available_stock < v_detail.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %: required %, available %', 
        v_detail.product_id, v_detail.quantity, v_available_stock;
    END IF;
    
    -- Deducir stock usando FIFO con SELECT FOR UPDATE SKIP LOCKED
    -- Esto evita deadlocks y condiciones de carrera
    v_quantity_to_deduct := v_detail.quantity;
    
    FOR v_lot IN
      SELECT lot_id, current_quantity
      FROM public.stock_lots
      WHERE product_id = v_detail.product_id
        AND warehouse_id = v_source_warehouse_id
        AND is_expired = FALSE
        AND current_quantity > 0
      ORDER BY received_date ASC
      FOR UPDATE SKIP LOCKED  -- Evita deadlocks
    LOOP
      EXIT WHEN v_quantity_to_deduct <= 0;
      
      v_deducted_amount := LEAST(v_lot.current_quantity, v_quantity_to_deduct);
      
      UPDATE public.stock_lots
      SET current_quantity = current_quantity - v_deducted_amount,
          updated_at = NOW()
      WHERE lot_id = v_lot.lot_id;
      
      v_quantity_to_deduct := v_quantity_to_deduct - v_deducted_amount;
    END LOOP;
    
    -- Validar que se dedujo todo el stock necesario
    IF v_quantity_to_deduct > 0 THEN
      RAISE EXCEPTION 'Failed to deduct full quantity for product %. Remaining: %', 
        v_detail.product_id, v_quantity_to_deduct;
    END IF;
  END LOOP;
  
  -- Marcar transacción como completada
  UPDATE public.transactions
  SET status = 'Completed',
      approver_id = p_approver_id,
      updated_at = NOW()
  WHERE transaction_id = p_transaction_id;
  
  -- Retornar éxito
  v_result := json_build_object(
    'success', true, 
    'transaction_id', p_transaction_id
  );
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback automático en caso de error
    -- PostgreSQL hace rollback automático de la transacción
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON FUNCTION public.complete_kitchen_transaction IS 
'Completa una transacción de cocina con validación atómica de stock y deducción FIFO. Usa SELECT FOR UPDATE SKIP LOCKED para evitar condiciones de carrera.';

