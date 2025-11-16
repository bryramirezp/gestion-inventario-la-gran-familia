-- Función para rechazar un traspaso de stock (solo Administrador)
CREATE OR REPLACE FUNCTION public.reject_stock_transfer(
  p_transfer_id BIGINT,
  p_rejection_reason TEXT
)
RETURNS JSON AS $$
DECLARE
  v_transfer RECORD;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Verificar que el usuario es administrador
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo los administradores pueden rechazar traspasos';
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
    RAISE EXCEPTION 'Solo se pueden rechazar traspasos con status PENDING. Status actual: %', v_transfer.status;
  END IF;

  -- Validar motivo de rechazo
  IF p_rejection_reason IS NULL OR LENGTH(TRIM(BOTH FROM p_rejection_reason)) = 0 THEN
    RAISE EXCEPTION 'El motivo de rechazo es obligatorio';
  END IF;

  -- Actualizar status a REJECTED
  UPDATE public.stock_transfers
  SET status = 'REJECTED',
      rejection_reason = p_rejection_reason,
      updated_at = NOW()
  WHERE transfer_id = p_transfer_id;

  -- Retornar resultado
  v_result := json_build_object(
    'success', true,
    'transfer_id', p_transfer_id,
    'status', 'REJECTED',
    'rejection_reason', p_rejection_reason
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al rechazar traspaso: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

