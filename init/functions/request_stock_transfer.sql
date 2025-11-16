-- Función para solicitar un traspaso de stock entre almacenes
-- Crea una solicitud con status PENDING que requiere aprobación de administrador
CREATE OR REPLACE FUNCTION public.request_stock_transfer(
  p_lot_id BIGINT,
  p_to_warehouse_id BIGINT,
  p_quantity NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_transfer_id BIGINT;
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

  -- Validar que el almacén destino existe y es diferente al origen
  IF p_to_warehouse_id = v_lot.warehouse_id THEN
    RAISE EXCEPTION 'El almacén destino debe ser diferente al almacén origen';
  END IF;

  -- Validar que existe el almacén destino
  IF NOT EXISTS (SELECT 1 FROM public.warehouses WHERE warehouse_id = p_to_warehouse_id) THEN
    RAISE EXCEPTION 'Almacén destino con ID % no encontrado', p_to_warehouse_id;
  END IF;

  -- Validar cantidad
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a 0';
  END IF;

  -- Validar stock disponible
  IF v_lot.current_quantity < p_quantity THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Solicitado: %', v_lot.current_quantity, p_quantity;
  END IF;

  -- Crear solicitud de traspaso
  INSERT INTO public.stock_transfers (
    lot_id,
    from_warehouse_id,
    to_warehouse_id,
    quantity,
    status,
    requested_by,
    notes
  )
  VALUES (
    p_lot_id,
    v_lot.warehouse_id,
    p_to_warehouse_id,
    p_quantity,
    'PENDING',
    v_user_id,
    p_notes
  )
  RETURNING transfer_id INTO v_transfer_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'lot_id', p_lot_id,
    'from_warehouse_id', v_lot.warehouse_id,
    'to_warehouse_id', p_to_warehouse_id,
    'quantity', p_quantity,
    'status', 'PENDING'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al solicitar traspaso: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

