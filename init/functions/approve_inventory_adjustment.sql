-- Función para aprobar un ajuste de inventario (solo Administrador)
-- Actualiza el stock y crea un movimiento de tipo AJUSTE
CREATE OR REPLACE FUNCTION public.approve_inventory_adjustment(
  p_adjustment_id BIGINT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_adjustment RECORD;
  v_lot RECORD;
  v_user_id UUID;
  v_ajuste_type_id BIGINT;
  v_quantity_difference NUMERIC;
  v_movement_id BIGINT;
  v_result JSON;
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden aprobar ajustes';
  END IF;

  -- Obtener usuario actual
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Obtener el ajuste
  SELECT * INTO v_adjustment
  FROM public.inventory_adjustments
  WHERE adjustment_id = p_adjustment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ajuste con ID % no encontrado', p_adjustment_id;
  END IF;

  -- Validar que el status es PENDING
  IF v_adjustment.status != 'PENDING' THEN
    RAISE EXCEPTION 'Solo se pueden aprobar ajustes con status PENDING. Status actual: %', v_adjustment.status;
  END IF;

  -- Obtener el lote
  SELECT * INTO v_lot
  FROM public.stock_lots
  WHERE lot_id = v_adjustment.lot_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote con ID % no encontrado', v_adjustment.lot_id;
  END IF;

  -- Verificar que la cantidad actual coincide con quantity_before
  IF v_lot.current_quantity != v_adjustment.quantity_before THEN
    RAISE EXCEPTION 'La cantidad actual del lote (%) no coincide con la cantidad registrada en el ajuste (%)', 
      v_lot.current_quantity, v_adjustment.quantity_before;
  END IF;

  -- Calcular diferencia
  v_quantity_difference := v_adjustment.quantity_after - v_adjustment.quantity_before;

  -- Obtener ID del tipo de movimiento AJUSTE
  SELECT type_id INTO v_ajuste_type_id
  FROM public.movement_types
  WHERE type_code = 'AJUSTE' AND is_active = TRUE;

  IF v_ajuste_type_id IS NULL THEN
    RAISE EXCEPTION 'Tipo de movimiento AJUSTE no encontrado';
  END IF;

  -- Actualizar status a APPROVED
  UPDATE public.inventory_adjustments
  SET status = 'APPROVED',
      approved_by = v_user_id,
      updated_at = NOW()
  WHERE adjustment_id = p_adjustment_id;

  -- Registrar movimiento de ajuste
  INSERT INTO public.stock_movements (
    lot_id,
    movement_type_id,
    quantity,
    notes,
    reference_id,
    created_by
  )
  VALUES (
    v_adjustment.lot_id,
    v_ajuste_type_id,
    (v_quantity_difference),
    COALESCE(p_notes, v_adjustment.reason),
    'ADJUSTMENT-' || p_adjustment_id::TEXT,
    v_user_id
  )
  RETURNING movement_id INTO v_movement_id;

  -- Actualizar current_quantity en stock_lots
  UPDATE public.stock_lots
  SET current_quantity = v_adjustment.quantity_after,
      updated_at = NOW()
  WHERE lot_id = v_adjustment.lot_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'adjustment_id', p_adjustment_id,
    'lot_id', v_adjustment.lot_id,
    'quantity_before', v_adjustment.quantity_before,
    'quantity_after', v_adjustment.quantity_after,
    'quantity_difference', v_quantity_difference,
    'status', 'APPROVED',
    'movement_id', v_movement_id
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback automático en caso de error
    RAISE EXCEPTION 'Error al aprobar ajuste: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

