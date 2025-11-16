-- Función para registrar un movimiento de stock y actualizar current_quantity de forma atómica
-- Esta función es la única forma permitida de modificar current_quantity en stock_lots
CREATE OR REPLACE FUNCTION public.register_stock_movement(
  p_lot_id BIGINT,
  p_movement_type_id BIGINT,
  p_quantity NUMERIC,
  p_notes TEXT DEFAULT NULL,
  p_requesting_department VARCHAR(100) DEFAULT NULL,
  p_recipient_organization VARCHAR(255) DEFAULT NULL,
  p_reference_id VARCHAR(100) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_movement_id BIGINT;
  v_lot RECORD;
  v_movement_type RECORD;
  v_new_quantity NUMERIC;
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

  -- Validar que el tipo de movimiento existe y está activo
  SELECT * INTO v_movement_type
  FROM public.movement_types
  WHERE type_id = p_movement_type_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tipo de movimiento con ID % no encontrado o inactivo', p_movement_type_id;
  END IF;

  -- Validar cantidad
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a 0';
  END IF;

  -- Calcular nueva cantidad según la categoría del movimiento
  IF v_movement_type.category = 'ENTRADA' OR v_movement_type.category = 'TRASPASO' THEN
    -- Entradas y traspasos aumentan el stock
    v_new_quantity := v_lot.current_quantity + p_quantity;
  ELSIF v_movement_type.category = 'SALIDA' THEN
    -- Salidas restan del stock
    IF v_lot.current_quantity < p_quantity THEN
      RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Solicitado: %', v_lot.current_quantity, p_quantity;
    END IF;
    v_new_quantity := v_lot.current_quantity - p_quantity;
  ELSIF v_movement_type.category = 'AJUSTE' THEN
    -- Para ajustes, permitir cualquier cantidad (puede ser negativa para correcciones)
    v_new_quantity := v_lot.current_quantity + p_quantity;
    IF v_new_quantity < 0 THEN
      RAISE EXCEPTION 'La cantidad resultante no puede ser negativa. Actual: %, Ajuste: %', v_lot.current_quantity, p_quantity;
    END IF;
  ELSE
    RAISE EXCEPTION 'Categoría de movimiento no válida: %', v_movement_type.category;
  END IF;

  -- Registrar el movimiento
  INSERT INTO public.stock_movements (
    lot_id,
    movement_type_id,
    quantity,
    notes,
    requesting_department,
    recipient_organization,
    reference_id,
    created_by
  )
  VALUES (
    p_lot_id,
    p_movement_type_id,
    p_quantity,
    p_notes,
    p_requesting_department,
    p_recipient_organization,
    p_reference_id,
    v_user_id
  )
  RETURNING movement_id INTO v_movement_id;

  -- Actualizar current_quantity en stock_lots
  -- El trigger prevent_direct_stock_update permitirá este cambio porque hay un movimiento reciente
  UPDATE public.stock_lots
  SET current_quantity = v_new_quantity,
      updated_at = NOW()
  WHERE lot_id = p_lot_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'movement_id', v_movement_id,
    'lot_id', p_lot_id,
    'previous_quantity', v_lot.current_quantity,
    'new_quantity', v_new_quantity,
    'movement_type', v_movement_type.type_name,
    'quantity', p_quantity
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al registrar movimiento de stock: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

