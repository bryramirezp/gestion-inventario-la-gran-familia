-- Función para obtener lotes disponibles para consumo ordenados por política FEFO/FIFO
-- FEFO (First Expired, First Out): Productos que vencen antes tienen prioridad
-- FIFO (First In, First Out): Productos recibidos antes tienen prioridad (desempate o sin caducidad)
CREATE OR REPLACE FUNCTION public.get_lots_for_consumption(
  p_product_id BIGINT,
  p_warehouse_id BIGINT,
  p_quantity NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  lot_id BIGINT,
  product_id BIGINT,
  warehouse_id BIGINT,
  current_quantity NUMERIC,
  received_date TIMESTAMPTZ,
  expiry_date DATE,
  is_expired BOOLEAN,
  unit_price NUMERIC,
  priority_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.lot_id,
    sl.product_id,
    sl.warehouse_id,
    sl.current_quantity,
    sl.received_date,
    sl.expiry_date,
    sl.is_expired,
    sl.unit_price,
    ROW_NUMBER() OVER (
      ORDER BY 
        -- FEFO: Primero por fecha de expiración (productos que vencen antes primero)
        -- NULLS LAST: Productos sin fecha de expiración van al final
        sl.expiry_date ASC NULLS LAST,
        -- FIFO: Desempate por fecha de recepción (productos recibidos antes primero)
        sl.received_date ASC
    )::INTEGER AS priority_order
  FROM public.stock_lots sl
  WHERE sl.product_id = p_product_id
    AND sl.warehouse_id = p_warehouse_id
    AND sl.is_expired = FALSE
    AND sl.current_quantity > 0
  ORDER BY 
    sl.expiry_date ASC NULLS LAST,
    sl.received_date ASC;
END;
$$ LANGUAGE plpgsql;

