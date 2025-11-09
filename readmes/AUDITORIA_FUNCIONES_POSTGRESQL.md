# 🔍 AUDITORÍA DETALLADA: Funciones PostgreSQL

## Funciones Auditadas

1. `validate_stock_available`
2. `complete_kitchen_transaction`
3. `create_donation_atomic` (ya auditada como correcta)

---

## 1. `validate_stock_available`

### Ubicación
`init/functions/validate_stock_available.sql`

### Código Actual
```sql
CREATE OR REPLACE FUNCTION public.validate_stock_available(
  p_product_id BIGINT,
  p_warehouse_id BIGINT,
  p_required_quantity NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  v_available_stock NUMERIC;
BEGIN
  SELECT COALESCE(SUM(current_quantity), 0) INTO v_available_stock
  FROM public.stock_lots
  WHERE product_id = p_product_id
    AND warehouse_id = p_warehouse_id
    AND is_expired = FALSE
    AND current_quantity > 0;
  
  RETURN v_available_stock >= p_required_quantity;
END;
$$ LANGUAGE plpgsql;
```

### ✅ Fortalezas

1. **Lógica Correcta:**
   - Excluye productos vencidos (`is_expired = FALSE`)
   - Excluye lotes sin stock (`current_quantity > 0`)
   - Usa `COALESCE` para manejar NULL

2. **Simplicidad:**
   - Función simple y clara
   - Retorna BOOLEAN (fácil de usar)

### ⚠️ Problemas Identificados

#### Problema 1: Falta de Índice Compuesto

**Análisis:**
La query usa estas columnas en el WHERE:
- `product_id`
- `warehouse_id`
- `is_expired`
- `current_quantity > 0`

**Índices Existentes (según schema):**
```sql
CREATE INDEX idx_stock_lots_product_warehouse ON public.stock_lots(product_id, warehouse_id);
CREATE INDEX idx_stock_lots_expired ON public.stock_lots(is_expired) WHERE is_expired = TRUE;
```

**Problema:**
- El índice `idx_stock_lots_product_warehouse` cubre `product_id` y `warehouse_id`
- Pero la query también filtra por `is_expired = FALSE` y `current_quantity > 0`
- PostgreSQL puede no usar el índice eficientemente para estas condiciones adicionales

**Solución Recomendada:**
```sql
-- Índice compuesto parcial optimizado para esta función
CREATE INDEX IF NOT EXISTS idx_stock_lots_available_stock 
ON public.stock_lots(product_id, warehouse_id, current_quantity)
WHERE is_expired = FALSE AND current_quantity > 0;
```

**Beneficio:**
- Query más rápida (especialmente con muchos lotes)
- Menor uso de CPU
- Escalabilidad mejorada

#### Problema 2: No Hay Validación de Parámetros

**Análisis:**
La función no valida que los parámetros sean válidos:
- `p_required_quantity` podría ser negativo
- No valida que `p_product_id` y `p_warehouse_id` existan

**Solución Recomendada:**
```sql
CREATE OR REPLACE FUNCTION public.validate_stock_available(
  p_product_id BIGINT,
  p_warehouse_id BIGINT,
  p_required_quantity NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  v_available_stock NUMERIC;
BEGIN
  -- Validar parámetros
  IF p_required_quantity < 0 THEN
    RAISE EXCEPTION 'Required quantity must be positive, got: %', p_required_quantity;
  END IF;
  
  IF p_required_quantity = 0 THEN
    RETURN TRUE; -- No se necesita stock
  END IF;
  
  -- Validar que el producto existe
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE product_id = p_product_id) THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;
  
  -- Validar que el almacén existe
  IF NOT EXISTS (SELECT 1 FROM public.warehouses WHERE warehouse_id = p_warehouse_id) THEN
    RAISE EXCEPTION 'Warehouse not found: %', p_warehouse_id;
  END IF;
  
  -- Calcular stock disponible
  SELECT COALESCE(SUM(current_quantity), 0) INTO v_available_stock
  FROM public.stock_lots
  WHERE product_id = p_product_id
    AND warehouse_id = p_warehouse_id
    AND is_expired = FALSE
    AND current_quantity > 0;
  
  RETURN v_available_stock >= p_required_quantity;
END;
$$ LANGUAGE plpgsql;
```

**Beneficio:**
- Mejor manejo de errores
- Previene bugs por datos inválidos
- Mensajes de error más claros

#### Problema 3: Uso Ineficiente en Bucle (Ya Identificado)

**Ubicación:** `src/data/api/kitchen.api.ts:131-165`

**Problema:**
- Se llama en bucle secuencial para cada item
- No hay validación batch

**Solución:** Crear función que valide múltiples items a la vez (ver Área 2 del informe principal)

---

## 2. `complete_kitchen_transaction`

### Ubicación
`init/functions/complete_kitchen_transaction.sql`

### Código Actual
Ver archivo completo en `init/functions/complete_kitchen_transaction.sql`

### ✅ Fortalezas

1. **Atomicidad:**
   - Todo dentro de una transacción PostgreSQL
   - Rollback automático en caso de error

2. **FIFO Correcto:**
   - Ordena por `received_date ASC`
   - Deducir desde los lotes más antiguos

3. **Prevención de Deadlocks:**
   - Usa `SELECT FOR UPDATE SKIP LOCKED`
   - Evita condiciones de carrera

4. **Validaciones:**
   - Verifica que la transacción existe
   - Verifica que esté en estado 'Approved'
   - Valida stock antes de deducir

### ⚠️ Problemas Identificados

#### Problema 1: Validación de Stock Duplicada

**Análisis:**
La función valida stock dos veces:

1. **Líneas 49-55:** Calcula stock disponible total
2. **Líneas 67-75:** Hace `SELECT FOR UPDATE` que también filtra por las mismas condiciones

**Problema:**
- La primera validación (líneas 49-55) no usa locks
- Entre la validación y el `FOR UPDATE`, otro proceso podría cambiar el stock
- Race condition potencial (aunque poco probable con `FOR UPDATE SKIP LOCKED`)

**Solución Recomendada:**
```sql
-- Eliminar validación previa y confiar en FOR UPDATE
-- El FOR UPDATE ya filtra por las condiciones correctas
FOR v_lot IN
  SELECT lot_id, current_quantity
  FROM public.stock_lots
  WHERE product_id = v_detail.product_id
    AND warehouse_id = v_source_warehouse_id
    AND is_expired = FALSE
  AND current_quantity > 0
  ORDER BY received_date ASC
  FOR UPDATE SKIP LOCKED
LOOP
  -- ...
END LOOP;

-- Validar después del loop si se dedujo suficiente
IF v_quantity_to_deduct > 0 THEN
  RAISE EXCEPTION 'Insufficient stock...';
END IF;
```

**Nota:** La validación actual funciona, pero es redundante. La solución propuesta es más eficiente.

#### Problema 2: No Usa `validate_stock_available`

**Análisis:**
La función recalcula stock disponible manualmente en lugar de usar `validate_stock_available`.

**Problema:**
- Duplicación de lógica
- Si se cambia la lógica de validación, hay que actualizarla en dos lugares

**Solución Recomendada:**
```sql
-- Usar la función existente para validar
IF NOT validate_stock_available(
  v_detail.product_id,
  v_source_warehouse_id,
  v_detail.quantity
) THEN
  RAISE EXCEPTION 'Insufficient stock for product %: required %', 
    v_detail.product_id, v_detail.quantity;
END IF;
```

**Beneficio:**
- DRY (Don't Repeat Yourself)
- Mantenibilidad mejorada
- Consistencia de lógica

#### Problema 3: Falta de Logging/Auditoría

**Análisis:**
La función no registra:
- Qué lotes se modificaron
- Cuánto stock se dedujo de cada lote
- Timestamp de la operación

**Problema:**
- Difícil auditar cambios de stock
- No hay trazabilidad de qué lotes se usaron

**Solución Recomendada:**
```sql
-- Crear tabla de auditoría (opcional, para futuro)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  movement_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  transaction_id BIGINT REFERENCES public.transactions(transaction_id),
  lot_id BIGINT REFERENCES public.stock_lots(lot_id),
  quantity_deducted NUMERIC(10, 2) NOT NULL,
  movement_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT REFERENCES public.users(user_id)
);

-- En la función, registrar movimientos
INSERT INTO public.stock_movements (
  transaction_id,
  lot_id,
  quantity_deducted,
  created_by
) VALUES (
  p_transaction_id,
  v_lot.lot_id,
  v_deducted_amount,
  p_approver_id
);
```

**Nota:** Esto es opcional y puede agregarse en el futuro si se necesita auditoría detallada.

#### Problema 4: No Maneja Lotes con `current_quantity = 0`

**Análisis:**
La query filtra `current_quantity > 0`, pero después de deducir, un lote puede quedar con `current_quantity = 0`.

**Problema:**
- Lotes con cantidad 0 siguen en la base de datos
- Pueden acumularse y afectar rendimiento de queries

**Solución Recomendada:**
```sql
-- Opción 1: Eliminar lotes vacíos (no recomendado si se necesita historial)
-- Opción 2: Marcar como "agotado" (recomendado)
UPDATE public.stock_lots
SET current_quantity = 0,
    updated_at = NOW()
WHERE lot_id = v_lot.lot_id
  AND current_quantity - v_deducted_amount = 0;

-- Opción 3: Dejar como está (actual, aceptable)
```

**Nota:** La solución actual es aceptable. Los lotes vacíos no afectan significativamente el rendimiento si hay índices apropiados.

---

## Resumen de Problemas y Soluciones

### `validate_stock_available`

| Problema | Severidad | Solución | Esfuerzo |
|----------|-----------|----------|----------|
| Falta índice compuesto parcial | MEDIA | Crear índice optimizado | 5 min |
| No valida parámetros | BAJA | Agregar validaciones | 15 min |
| Uso en bucle secuencial | ALTA | Función batch (ver informe principal) | 2-3 días |

### `complete_kitchen_transaction`

| Problema | Severidad | Solución | Esfuerzo |
|----------|-----------|----------|----------|
| Validación de stock duplicada | BAJA | Eliminar validación redundante | 15 min |
| No usa `validate_stock_available` | MEDIA | Refactorizar para usar función existente | 30 min |
| Falta de logging/auditoría | BAJA | Tabla de auditoría (futuro) | 1-2 días |
| Lotes vacíos | BAJA | Opcional, actual es aceptable | - |

---

## Recomendaciones Prioritarias

### Prioridad ALTA
1. **Crear índice compuesto parcial** para `validate_stock_available`
2. **Refactorizar `complete_kitchen_transaction`** para usar `validate_stock_available`

### Prioridad MEDIA
3. **Agregar validación de parámetros** en `validate_stock_available`
4. **Eliminar validación duplicada** en `complete_kitchen_transaction`

### Prioridad BAJA
5. **Implementar logging/auditoría** (futuro)
6. **Manejo de lotes vacíos** (opcional)

---

## Conclusión

Ambas funciones están **bien diseñadas** y funcionan correctamente. Los problemas identificados son principalmente de **optimización** y **mantenibilidad**, no de funcionalidad.

La función más crítica es `complete_kitchen_transaction`, que maneja la deducción de stock de forma atómica y correcta. Los problemas son menores y se pueden mejorar incrementalmente.

---

**Fecha de Auditoría:** Diciembre 2024  
**Auditor:** Arquitecto de Sistemas Senior

