-- Función para rechazar un ajuste de inventario (solo Administrador)
CREATE OR REPLACE FUNCTION public.reject_inventory_adjustment(
  p_adjustment_id BIGINT,
  p_rejection_reason TEXT
)
RETURNS JSON AS $$
DECLARE
  v_adjustment RECORD;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden rechazar ajustes';
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
    RAISE EXCEPTION 'Solo se pueden rechazar ajustes con status PENDING. Status actual: %', v_adjustment.status;
  END IF;

  -- Validar motivo de rechazo
  IF p_rejection_reason IS NULL OR LENGTH(TRIM(BOTH FROM p_rejection_reason)) = 0 THEN
    RAISE EXCEPTION 'El motivo de rechazo es obligatorio';
  END IF;

  -- Actualizar status a REJECTED
  UPDATE public.inventory_adjustments
  SET status = 'REJECTED',
      rejected_by = v_user_id,
      rejection_reason = p_rejection_reason,
      updated_at = NOW()
  WHERE adjustment_id = p_adjustment_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'adjustment_id', p_adjustment_id,
    'status', 'REJECTED',
    'rejection_reason', p_rejection_reason
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al rechazar ajuste: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

