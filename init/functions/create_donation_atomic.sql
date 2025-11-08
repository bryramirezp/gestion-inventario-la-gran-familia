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
--            [{product_id, quantity, unit_price, discount_percentage, expiry_date}, ...]
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
  v_stock_lot_id BIGINT;
  v_stock_lots_created INTEGER := 0;
  v_total_before_discount NUMERIC := 0;
  v_total_after_discount NUMERIC := 0;
  v_item_total NUMERIC;
  v_item_discount NUMERIC;
  v_result JSON;
BEGIN
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
    total_value_before_discount,
    total_value_after_discount
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
    IF NOT (v_item ? 'product_id' AND v_item ? 'quantity' AND v_item ? 'unit_price') THEN
      RAISE EXCEPTION 'Each item must have product_id, quantity, and unit_price';
    END IF;
    
    -- Validar que el producto existe
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE product_id = (v_item->>'product_id')::BIGINT) THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;
    
    -- Calcular valores del item
    v_item_total := (v_item->>'quantity')::NUMERIC * (v_item->>'unit_price')::NUMERIC;
    v_item_discount := v_item_total * COALESCE((v_item->>'discount_percentage')::NUMERIC, 0) / 100;
    
    v_total_before_discount := v_total_before_discount + v_item_total;
    v_total_after_discount := v_total_after_discount + (v_item_total - v_item_discount);
    
    -- Crear item de donación
    INSERT INTO public.donation_items (
      donation_id,
      product_id,
      quantity,
      unit_price,
      discount_percentage,
      expiry_date
    )
    VALUES (
      v_donation_id,
      (v_item->>'product_id')::BIGINT,
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'unit_price')::NUMERIC,
      COALESCE((v_item->>'discount_percentage')::NUMERIC, 0),
      CASE 
        WHEN v_item ? 'expiry_date' AND v_item->>'expiry_date' != 'null' 
        THEN (v_item->>'expiry_date')::DATE
        ELSE NULL
      END
    );
    
    -- Crear lote de stock
    -- IMPORTANTE: Usar p_donation_date::TIMESTAMPTZ para FIFO correcto
    -- Esto asegura que el FIFO se base en la fecha de donación, no en la hora de registro
    INSERT INTO public.stock_lots (
      product_id,
      warehouse_id,
      current_quantity,
      received_date,
      expiry_date,
      unit_price
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
      (v_item->>'unit_price')::NUMERIC
    )
    RETURNING lot_id INTO v_stock_lot_id;
    
    v_stock_lots_created := v_stock_lots_created + 1;
  END LOOP;
  
  -- Actualizar totales de la donación
  UPDATE public.donation_transactions
  SET total_value_before_discount = v_total_before_discount,
      total_value_after_discount = v_total_after_discount,
      updated_at = NOW()
  WHERE donation_id = v_donation_id;
  
  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'donation_id', v_donation_id,
    'stock_lots_created', v_stock_lots_created,
    'total_value_before_discount', v_total_before_discount,
    'total_value_after_discount', v_total_after_discount
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

