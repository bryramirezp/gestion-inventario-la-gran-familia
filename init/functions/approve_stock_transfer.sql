-- Función para aprobar un traspaso de stock (solo Administrador)
-- Ejecuta el traspaso de forma atómica: crea movimientos y actualiza lotes
CREATE OR REPLACE FUNCTION public.approve_stock_transfer(
  p_transfer_id BIGINT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_transfer RECORD;
  v_lot RECORD;
  v_user_id UUID;
  v_entrada_type_id BIGINT;
  v_salida_type_id BIGINT;
  v_new_lot_id BIGINT;
  v_movement_salida_id BIGINT;
  v_movement_entrada_id BIGINT;
  v_result JSON;
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden aprobar traspasos';
  END IF;

  -- Obtener usuario actual
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Obtener la solicitud de traspaso
  SELECT * INTO v_transfer
  FROM public.stock_transfers
  WHERE transfer_id = p_transfer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Traspaso con ID % no encontrado', p_transfer_id;
  END IF;

  -- Validar que el status es PENDING
  IF v_transfer.status != 'PENDING' THEN
    RAISE EXCEPTION 'Solo se pueden aprobar traspasos con status PENDING. Status actual: %', v_transfer.status;
  END IF;

  -- Obtener el lote origen
  SELECT * INTO v_lot
  FROM public.stock_lots
  WHERE lot_id = v_transfer.lot_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote con ID % no encontrado', v_transfer.lot_id;
  END IF;

  -- Validar stock disponible
  IF v_lot.current_quantity < v_transfer.quantity THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Solicitado: %', v_lot.current_quantity, v_transfer.quantity;
  END IF;

  -- Obtener IDs de tipos de movimiento
  SELECT type_id INTO v_salida_type_id
  FROM public.movement_types
  WHERE type_code = 'TRASPASO_SALIDA' AND is_active = TRUE;
  
  SELECT type_id INTO v_entrada_type_id
  FROM public.movement_types
  WHERE type_code = 'TRASPASO_ENTRADA' AND is_active = TRUE;

  IF v_salida_type_id IS NULL OR v_entrada_type_id IS NULL THEN
    RAISE EXCEPTION 'Tipos de movimiento TRASPASO_SALIDA o TRASPASO_ENTRADA no encontrados';
  END IF;

  -- Actualizar status a APPROVED
  UPDATE public.stock_transfers
  SET status = 'APPROVED',
      approved_by = v_user_id,
      notes = COALESCE(p_notes, notes),
      updated_at = NOW()
  WHERE transfer_id = p_transfer_id;

  -- Registrar movimiento de salida en el lote origen
  INSERT INTO public.stock_movements (
    lot_id,
    movement_type_id,
    quantity,
    notes,
    reference_id,
    created_by
  )
  VALUES (
    v_transfer.lot_id,
    v_salida_type_id,
    v_transfer.quantity,
    COALESCE(p_notes, 'Traspaso aprobado'),
    'TRANSFER-' || p_transfer_id::TEXT,
    v_user_id
  )
  RETURNING movement_id INTO v_movement_salida_id;

  -- Decrementar stock del lote origen
  UPDATE public.stock_lots
  SET current_quantity = current_quantity - v_transfer.quantity,
      updated_at = NOW()
  WHERE lot_id = v_transfer.lot_id;

  -- Crear nuevo lote en el almacén destino
  INSERT INTO public.stock_lots (
    product_id,
    warehouse_id,
    current_quantity,
    received_date,
    expiry_date,
    is_expired,
    unit_price
  )
  VALUES (
    v_lot.product_id,
    v_transfer.to_warehouse_id,
    v_transfer.quantity,
    NOW(),
    v_lot.expiry_date,
    v_lot.is_expired,
    v_lot.unit_price
  )
  RETURNING lot_id INTO v_new_lot_id;

  -- Registrar movimiento de entrada en el nuevo lote
  INSERT INTO public.stock_movements (
    lot_id,
    movement_type_id,
    quantity,
    notes,
    reference_id,
    created_by
  )
  VALUES (
    v_new_lot_id,
    v_entrada_type_id,
    v_transfer.quantity,
    COALESCE(p_notes, 'Traspaso desde almacén ' || v_transfer.from_warehouse_id::TEXT),
    'TRANSFER-' || p_transfer_id::TEXT,
    v_user_id
  )
  RETURNING movement_id INTO v_movement_entrada_id;

  -- Actualizar status a COMPLETED
  UPDATE public.stock_transfers
  SET status = 'COMPLETED',
      updated_at = NOW()
  WHERE transfer_id = p_transfer_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'transfer_id', p_transfer_id,
    'from_lot_id', v_transfer.lot_id,
    'to_lot_id', v_new_lot_id,
    'quantity', v_transfer.quantity,
    'status', 'COMPLETED',
    'movement_salida_id', v_movement_salida_id,
    'movement_entrada_id', v_movement_entrada_id
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback automático en caso de error
    RAISE EXCEPTION 'Error al aprobar traspaso: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

