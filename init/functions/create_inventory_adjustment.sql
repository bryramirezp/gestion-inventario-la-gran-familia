-- Función para crear un ajuste de inventario
-- Siempre crea el ajuste con status PENDING (requiere aprobación de administrador)
CREATE OR REPLACE FUNCTION public.create_inventory_adjustment(
  p_lot_id BIGINT,
  p_quantity_after NUMERIC,
  p_reason TEXT
)
RETURNS JSON AS $$
DECLARE
  v_adjustment_id BIGINT;
  v_lot RECORD;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Obtener usuario actual
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Validar que el lote existe
  SELECT * INTO v_lot
  FROM public.stock_lots
  WHERE lot_id = p_lot_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote con ID % no encontrado', p_lot_id;
  END IF;

  -- Validar cantidad
  IF p_quantity_after < 0 THEN
    RAISE EXCEPTION 'La cantidad después del ajuste no puede ser negativa';
  END IF;

  -- Validar que hay cambio
  IF v_lot.current_quantity = p_quantity_after THEN
    RAISE EXCEPTION 'La cantidad después del ajuste debe ser diferente a la cantidad actual';
  END IF;

  -- Validar motivo (debe tener al menos 10 caracteres)
  IF p_reason IS NULL OR LENGTH(TRIM(BOTH FROM p_reason)) <= 10 THEN
    RAISE EXCEPTION 'El motivo del ajuste debe tener al menos 10 caracteres';
  END IF;

  -- Crear ajuste con status PENDING
  INSERT INTO public.inventory_adjustments (
    lot_id,
    quantity_before,
    quantity_after,
    reason,
    status,
    created_by
  )
  VALUES (
    p_lot_id,
    v_lot.current_quantity,
    p_quantity_after,
    p_reason,
    'PENDING',
    v_user_id
  )
  RETURNING adjustment_id INTO v_adjustment_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'adjustment_id', v_adjustment_id,
    'lot_id', p_lot_id,
    'quantity_before', v_lot.current_quantity,
    'quantity_after', p_quantity_after,
    'status', 'PENDING'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear ajuste de inventario: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

