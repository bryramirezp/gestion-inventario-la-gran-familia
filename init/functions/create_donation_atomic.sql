-- ============================================================================
-- Función: create_donation_atomic
-- ============================================================================
-- Descripción: Crea una donación con múltiples items de forma atómica.
--              Si alguna operación falla, se hace rollback completo.
-- 
-- Parámetros:
--   p_donor_id: ID del donante
--   p_warehouse_id: ID del almacén destino
--   p_donation_date: Fecha de la donación (opcional, por defecto CURRENT_DATE)
--   p_items: JSON array con los items de la donación:
--            [{product_id, quantity, market_unit_price, actual_unit_price, expiry_date}, ...]
--
-- Retorna: JSON con { success: true, donation_id: ..., stock_lots_created: ... }
--
-- NOTA: Esta función es IDEMPOTENTE (usa CREATE OR REPLACE)
--       Puede ejecutarse múltiples veces sin errores.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_donation_atomic(
  p_donor_id BIGINT,
  p_warehouse_id BIGINT,
  p_items JSONB,
  p_donation_date DATE DEFAULT CURRENT_DATE
) RETURNS JSON AS $$
DECLARE
  v_item JSONB;
  v_donation_id BIGINT;
  v_donation_item_id BIGINT;
  v_stock_lot_id BIGINT;
  v_stock_lots_created INTEGER := 0;
  v_market_value NUMERIC := 0;
  v_actual_value NUMERIC := 0;
  v_market_total NUMERIC;
  v_actual_total NUMERIC;
  v_entrada_type_id BIGINT;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Obtener usuario actual
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Obtener ID del tipo de movimiento ENTRADA
  SELECT type_id INTO v_entrada_type_id
  FROM public.movement_types
  WHERE type_code = 'ENTRADA' AND is_active = TRUE;

  IF v_entrada_type_id IS NULL THEN
    RAISE EXCEPTION 'Tipo de movimiento ENTRADA no encontrado. Asegúrese de ejecutar seed_data.sql';
  END IF;

  -- Validar que el donante existe
  IF NOT EXISTS (SELECT 1 FROM public.donors WHERE donor_id = p_donor_id) THEN
    RAISE EXCEPTION 'Donor not found: %', p_donor_id;
  END IF;
  
  -- Validar que el almacén existe
  IF NOT EXISTS (SELECT 1 FROM public.warehouses WHERE warehouse_id = p_warehouse_id) THEN
    RAISE EXCEPTION 'Warehouse not found: %', p_warehouse_id;
  END IF;
  
  -- Validar que p_items es un array
  IF jsonb_typeof(p_items) != 'array' THEN
    RAISE EXCEPTION 'p_items must be a JSON array';
  END IF;
  
  -- Crear la transacción de donación
  INSERT INTO public.donation_transactions (
    donor_id,
    warehouse_id,
    donation_date,
    market_value,
    actual_value
  )
  VALUES (
    p_donor_id,
    p_warehouse_id,
    p_donation_date,
    0, -- Se actualizará después
    0  -- Se actualizará después
  )
  RETURNING donation_id INTO v_donation_id;
  
  -- Procesar cada item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Validar campos requeridos
    IF NOT (v_item ? 'product_id' AND v_item ? 'quantity' AND v_item ? 'market_unit_price' AND v_item ? 'actual_unit_price') THEN
      RAISE EXCEPTION 'Each item must have product_id, quantity, market_unit_price, and actual_unit_price';
    END IF;
    
    -- Validar que el producto existe
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE product_id = (v_item->>'product_id')::BIGINT) THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;
    
    -- Calcular valores del item
    v_market_total := (v_item->>'quantity')::NUMERIC * (v_item->>'market_unit_price')::NUMERIC;
    v_actual_total := (v_item->>'quantity')::NUMERIC * (v_item->>'actual_unit_price')::NUMERIC;
    
    v_market_value := v_market_value + v_market_total;
    v_actual_value := v_actual_value + v_actual_total;
    
    -- Crear item de donación
    INSERT INTO public.donation_items (
      donation_id,
      product_id,
      quantity,
      market_unit_price,
      actual_unit_price,
      expiry_date
    )
    VALUES (
      v_donation_id,
      (v_item->>'product_id')::BIGINT,
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'market_unit_price')::NUMERIC,
      (v_item->>'actual_unit_price')::NUMERIC,
      CASE 
        WHEN v_item ? 'expiry_date' AND v_item->>'expiry_date' != 'null' 
        THEN (v_item->>'expiry_date')::DATE
        ELSE NULL
      END
    )
    RETURNING item_id INTO v_donation_item_id;
    
    -- Crear lote de stock
    -- IMPORTANTE: Usar p_donation_date::TIMESTAMPTZ para FIFO correcto
    -- Esto asegura que el FIFO se base en la fecha de donación, no en la hora de registro
    INSERT INTO public.stock_lots (
      product_id,
      warehouse_id,
      current_quantity,
      received_date,
      expiry_date,
      unit_price,
      donation_item_id
    )
    VALUES (
      (v_item->>'product_id')::BIGINT,
      p_warehouse_id,
      (v_item->>'quantity')::NUMERIC,
      p_donation_date::TIMESTAMPTZ,  -- Usar fecha de donación, no NOW()
      CASE 
        WHEN v_item ? 'expiry_date' AND v_item->>'expiry_date' != 'null' 
        THEN (v_item->>'expiry_date')::DATE
        ELSE NULL
      END,
      (v_item->>'actual_unit_price')::NUMERIC,
      v_donation_item_id
    )
    RETURNING lot_id INTO v_stock_lot_id;
    
    -- Crear movimiento ENTRADA automáticamente
    INSERT INTO public.stock_movements (
      lot_id,
      movement_type_id,
      quantity,
      notes,
      reference_id,
      created_by
    )
    VALUES (
      v_stock_lot_id,
      v_entrada_type_id,
      (v_item->>'quantity')::NUMERIC,
      'Entrada por donación #' || v_donation_id::TEXT,
      'DONATION-' || v_donation_id::TEXT,
      v_user_id
    );
    
    v_stock_lots_created := v_stock_lots_created + 1;
  END LOOP;
  
  -- Actualizar totales de la donación
  UPDATE public.donation_transactions
  SET market_value = v_market_value,
      actual_value = v_actual_value,
      updated_at = NOW()
  WHERE donation_id = v_donation_id;
  
  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'donation_id', v_donation_id,
    'stock_lots_created', v_stock_lots_created,
    'market_value', v_market_value,
    'actual_value', v_actual_value
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback automático en caso de error
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON FUNCTION public.create_donation_atomic IS 
'Crea una donación con múltiples items de forma atómica. Si alguna operación falla, se hace rollback completo.';

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.create_donation_atomic(BIGINT, BIGINT, JSONB, DATE) TO anon, authenticated, service_role;

