# 📋 PLAN DE MEJORAS: Sistema de Gestión de Inventario "La Gran Familia"

**Fecha de Creación:** Diciembre 2024  
**Basado en:** Auditoría Técnica y Contexto del Proyecto  
**Objetivo:** Mejorar la calidad, seguridad y rendimiento del sistema mediante un plan estructurado por fases

---

## 🎯 Estrategia de Implementación

Este plan está dividido en **3 fases principales**, cada una con múltiples pasos detallados. 

**Proceso de trabajo:**
1. ✅ Completar todos los pasos de una fase
2. ✅ Verificar que los cambios funcionan correctamente
3. ✅ Informar al equipo: "✅ **Fase X completada** - Revisa los cambios y confirma 'ok' para avanzar a la siguiente fase"

**Importante:** Cada fase debe completarse y verificarse antes de pasar a la siguiente.

---

## 📊 RESUMEN DE FASES

| Fase | Prioridad | Tiempo Estimado | Problemas Críticos a Resolver |
|------|-----------|-----------------|-------------------------------|
| **Fase 1** | 🔴 CRÍTICA | 1-2 semanas | Discrepancia SQL/Código, Transacciones Atómicas, Validación de Stock |
| **Fase 2** | 🟡 IMPORTANTE | 2-3 semanas | Optimización de Consultas, Índices, Reserva de Stock, Manejo de Errores |
| **Fase 3** | 🟢 MEJORAS | 2-4 semanas | Paginación, Tests, Documentación, Optimización |

---

## 🔴 FASE 1: CORRECCIONES CRÍTICAS (URGENTE)

**Objetivo:** Corregir los problemas críticos que impiden el correcto funcionamiento del sistema y garantizar la integridad de los datos.

**Tiempo estimado:** 1-2 semanas  
**Estado:** ✅ Completada (Pasos 1.1-1.5), ⏳ Pendiente verificación (Paso 1.6)

### ✅ PASO 1.1: Analizar y Sincronizar Esquema SQL con Código TypeScript

**Problema:** El esquema SQL no coincide con el código TypeScript, causando que el sistema no funcione correctamente.

**Acciones:**

1. **Auditar el código TypeScript para identificar la estructura real:**
   - Revisar `types.ts` para ver qué campos se esperan
   - Revisar `services/api.ts` para ver qué campos se usan
   - Documentar todas las tablas y campos que el código realmente usa

2. **Comparar con el esquema SQL:**
   - Revisar `init/database-normalization-ngo-inventory-system-1762408899807.sql`
   - Identificar discrepancias:
     - Campos que existen en SQL pero no en código
     - Campos que existen en código pero no en SQL
     - Nombres diferentes para el mismo concepto
     - Tipos de datos diferentes

3. **Decidir la fuente de verdad:**
   - El código TypeScript es la fuente de verdad (el sistema actual funciona con Supabase)
   - Actualizar el esquema SQL para que coincida con el código

**Archivos a modificar:**
- `init/database-normalization-ngo-inventory-system-1762408899807.sql`
- `types.ts` (si es necesario actualizar tipos)
- Crear: `init/migrations/001_sync_schema_with_code.sql`

**Criterios de éxito:**
- ✅ El esquema SQL tiene todas las tablas que el código usa: `donation_transactions`, `donation_items`, `transaction_details`, `transactions` (con estructura de cocina)
- ✅ Los campos coinciden: `stock_lots.current_quantity` (no `quantity`), `stock_lots.unit_price` (no `unit_cost`)
- ✅ El constraint de `expiry_date` permite fechas pasadas
- ✅ El campo `is_expired` existe en `stock_lots`

---

### ✅ PASO 1.2: Corregir Constraint de Fecha de Caducidad

**Problema:** El constraint actual no permite registrar productos ya vencidos.

**Acciones:**

1. **Eliminar constraint restrictivo:**
   ```sql
   ALTER TABLE stock_lots DROP CONSTRAINT IF EXISTS chk_expiry_date;
   ```

2. **Verificar que el trigger de `is_expired` funciona:**
   - El trigger `check_expired_lots()` ya existe en el SQL
   - Asegurarse de que está asociado a `stock_lots`
   - Verificar que marca `is_expired = TRUE` cuando `expiry_date < CURRENT_DATE`

3. **Actualizar el código para usar `is_expired` en lugar de `warehouse_id = 999`:**
   - Modificar consultas de stock para filtrar por `is_expired = FALSE`
   - Mantener compatibilidad temporal con `warehouse_id != 999`

**Archivos a modificar:**
- `init/database-normalization-ngo-inventory-system-1762408899807.sql`
- `services/api.ts` (buscar referencias a `EXPIRED_WAREHOUSE_ID`)

**Criterios de éxito:**
- ✅ Se pueden insertar productos con `expiry_date` en el pasado
- ✅ El campo `is_expired` se actualiza automáticamente
- ✅ Las consultas de stock excluyen productos vencidos correctamente

---

### ✅ PASO 1.3: Crear Función PostgreSQL para Completar Transacciones con Validación Atómica

**Problema:** Las operaciones de completar transacciones no son atómicas y no validan stock suficiente.

**Acciones:**

1. **Crear función PostgreSQL `complete_kitchen_transaction`:**
   - Validar que la transacción existe y está aprobada
   - Para cada producto, validar stock disponible total
   - Deducir stock usando FIFO con `SELECT FOR UPDATE SKIP LOCKED`
   - Marcar transacción como completada
   - Todo en una transacción atómica (rollback automático en caso de error)

2. **Crear función PostgreSQL `create_donation_atomic`:**
   - Crear `donation_transactions`
   - Crear múltiples `stock_lots` en una transacción
   - Rollback si alguna operación falla

**Archivos a crear:**
- `init/functions/complete_kitchen_transaction.sql`
- `init/functions/create_donation_atomic.sql`

**Archivos a modificar:**
- `services/api.ts` (modificar `updateRequestStatus` y `createDonation` para usar las funciones)

**Criterios de éxito:**
- ✅ Las funciones PostgreSQL están creadas y probadas
- ✅ El código TypeScript llama a las funciones mediante `supabase.rpc()`
- ✅ Las operaciones son atómicas (todo o nada)
- ✅ Se valida stock antes de deducir
- ✅ Se usa FIFO correctamente con locks para evitar condiciones de carrera

---

### ✅ PASO 1.4: Implementar Validación de Stock en Backend

**Problema:** La validación de stock solo existe en el frontend, lo que permite crear solicitudes con stock insuficiente.

**Acciones:**

1. **Crear función PostgreSQL `validate_stock_available`:**
   ```sql
   CREATE OR REPLACE FUNCTION validate_stock_available(
     p_product_id BIGINT,
     p_warehouse_id BIGINT,
     p_required_quantity NUMERIC
   ) RETURNS BOOLEAN AS $$
   DECLARE
     v_available_stock NUMERIC;
   BEGIN
     SELECT COALESCE(SUM(current_quantity), 0) INTO v_available_stock
     FROM stock_lots
     WHERE product_id = p_product_id
     AND warehouse_id = p_warehouse_id
     AND is_expired = FALSE
     AND current_quantity > 0;
     
     RETURN v_available_stock >= p_required_quantity;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **Validar stock antes de crear solicitudes:**
   - Modificar `transactionApi.create` en `services/api.ts`
   - Llamar a `validate_stock_available` para cada producto antes de crear la solicitud
   - Lanzar error si no hay stock suficiente

3. **Validar stock antes de aprobar solicitudes:**
   - Modificar `transactionApi.updateStatus` en `services/api.ts`
   - Validar stock antes de cambiar estado a 'Approved' o 'Completed'

**Archivos a crear:**
- `init/functions/validate_stock_available.sql`

**Archivos a modificar:**
- `services/api.ts` (modificar `createRequest` y `updateRequestStatus`)

**Criterios de éxito:**
- ✅ No se pueden crear solicitudes con stock insuficiente
- ✅ No se pueden aprobar solicitudes con stock insuficiente
- ✅ Los mensajes de error son claros para el usuario
- ✅ La validación se hace en el backend, no solo en el frontend

---

### ✅ PASO 1.5: Actualizar Código TypeScript para Usar Funciones PostgreSQL

**Problema:** El código TypeScript hace múltiples operaciones sin transacciones atómicas.

**Acciones:**

1. **Modificar `updateRequestStatus` en `services/api.ts`:**
   - Reemplazar la lógica de deducción de stock por una llamada a `complete_kitchen_transaction`
   - Manejar errores de la función PostgreSQL
   - Proporcionar mensajes de error user-friendly

2. **Modificar `createDonation` en `services/api.ts`:**
   - Usar función `create_donation_atomic` o mantener lógica actual pero dentro de una transacción
   - Asegurar que todas las operaciones son atómicas

3. **Actualizar tipos TypeScript:**
   - Agregar tipos para las respuestas de las funciones PostgreSQL
   - Actualizar `types.ts` si es necesario

**Archivos a modificar:**
- `services/api.ts`
- `types.ts` (si es necesario)

**Criterios de éxito:**
- ✅ El código usa las funciones PostgreSQL para operaciones críticas
- ✅ Las operaciones son atómicas
- ✅ Los errores se manejan correctamente
- ✅ Los mensajes de error son claros para el usuario

---

### ✅ PASO 1.6: Probar y Verificar Fase 1

**Acciones:**

1. **Probar creación de donaciones:**
   - Crear una donación con múltiples productos
   - Verificar que se crean todos los lotes correctamente
   - Verificar que si falla una parte, se hace rollback completo

2. **Probar transacciones de cocina:**
   - Crear una solicitud con stock suficiente
   - Crear una solicitud con stock insuficiente (debe fallar)
   - Aprobar una solicitud
   - Completar una solicitud (debe deducir stock correctamente)
   - Intentar completar una solicitud con stock insuficiente (debe fallar)

3. **Probar condiciones de carrera:**
   - Simular múltiples usuarios completando transacciones simultáneamente
   - Verificar que no se permite stock negativo
   - Verificar que todas las transacciones se procesan correctamente

4. **Verificar productos vencidos:**
   - Crear un producto con fecha de caducidad pasada
   - Verificar que `is_expired = TRUE`
   - Verificar que no aparece en consultas de stock disponible

**Criterios de éxito:**
- ✅ Todas las pruebas pasan
- ✅ No hay stock negativo
- ✅ Las transacciones son atómicas
- ✅ La validación de stock funciona correctamente
- ✅ Los productos vencidos se manejan correctamente

---

## 🟡 FASE 2: OPTIMIZACIONES Y MEJORAS IMPORTANTES

**Objetivo:** Mejorar el rendimiento, agregar índices, implementar reserva de stock y mejorar el manejo de errores.

**Tiempo estimado:** 2-3 semanas  
**Estado:** ⏳ Pendiente (Esperando confirmación de Fase 1)

### ✅ PASO 2.1: Agregar Índices Faltantes

**Problema:** Faltan índices en campos críticos, causando consultas lentas.

**Acciones:**

1. **Crear índices para consultas de stock disponible:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_stock_lots_available 
   ON stock_lots(product_id, warehouse_id, current_quantity) 
   WHERE current_quantity > 0 AND is_expired = FALSE;
   ```

2. **Crear índice para ordenamiento FIFO:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_stock_lots_fifo 
   ON stock_lots(product_id, warehouse_id, received_date) 
   WHERE current_quantity > 0 AND is_expired = FALSE;
   ```

3. **Crear índice para búsqueda de productos vencidos:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_stock_lots_expired 
   ON stock_lots(expiry_date, is_expired) 
   WHERE is_expired = TRUE;
   ```

4. **Crear índices para foreign keys frecuentemente consultadas:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_transaction_details_transaction 
   ON transaction_details(transaction_id);
   
   CREATE INDEX IF NOT EXISTS idx_donation_items_donation 
   ON donation_items(donation_id);
   
   CREATE INDEX IF NOT EXISTS idx_stock_lots_product_warehouse 
   ON stock_lots(product_id, warehouse_id);
   ```

**Archivos a crear:**
- `init/migrations/002_add_performance_indexes.sql`

**Criterios de éxito:**
- ✅ Los índices están creados
- ✅ Las consultas de stock son más rápidas
- ✅ Las consultas FIFO son más rápidas
- ✅ Las consultas de productos vencidos son más rápidas

---

### ✅ PASO 2.2: Optimizar Consultas N+1

**Problema:** Múltiples consultas N+1 causan rendimiento lento.

**Acciones:**

1. **Optimizar `getFullProductDetails` en `services/api.ts`:**
   - Usar JOINs en lugar de múltiples consultas
   - Cargar datos relacionados en una sola consulta
   - Usar agregaciones de PostgreSQL cuando sea posible

2. **Optimizar `getDonorAnalysisData` en `services/api.ts`:**
   - Usar JOINs para cargar productos y categorías
   - Usar agregaciones de PostgreSQL para cálculos
   - Evitar iterar sobre datos en JavaScript cuando se puede hacer en SQL

3. **Optimizar consultas de stock por almacén:**
   - Usar JOINs para cargar productos, categorías, marcas en una consulta
   - Usar agregaciones para calcular stock total

**Archivos a modificar:**
- `services/api.ts` (múltiples funciones)

**Criterios de éxito:**
- ✅ Las consultas usan JOINs en lugar de múltiples consultas
- ✅ El número de consultas a la base de datos se reduce significativamente
- ✅ El rendimiento mejora notablemente
- ✅ Los tiempos de carga son menores

---

### ✅ PASO 2.3: Implementar Reserva de Stock

**Problema:** El stock no se reserva cuando se crea una solicitud, causando sobreventa.

**Acciones:**

1. **Crear tabla `stock_reservations`:**
   ```sql
   CREATE TABLE stock_reservations (
     reservation_id BIGSERIAL PRIMARY KEY,
     transaction_id BIGINT NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
     product_id BIGINT NOT NULL REFERENCES products(product_id),
     quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
     reserved_at TIMESTAMPTZ DEFAULT NOW(),
     expires_at TIMESTAMPTZ,
     UNIQUE(transaction_id, product_id)
   );
   
   CREATE INDEX idx_stock_reservations_transaction 
   ON stock_reservations(transaction_id);
   
   CREATE INDEX idx_stock_reservations_product 
   ON stock_reservations(product_id);
   ```

2. **Modificar función `validate_stock_available`:**
   - Incluir stock reservado en el cálculo
   - Excluir stock reservado del stock disponible

3. **Crear función para reservar stock:**
   ```sql
   CREATE OR REPLACE FUNCTION reserve_stock_for_transaction(
     p_transaction_id BIGINT,
     p_product_id BIGINT,
     p_quantity NUMERIC
   ) RETURNS BOOLEAN AS $$
   -- Lógica para reservar stock
   $$ LANGUAGE plpgsql;
   ```

4. **Modificar `createRequest` en `services/api.ts`:**
   - Reservar stock cuando se crea una solicitud
   - Validar que hay stock disponible (incluyendo reservas)

5. **Modificar `updateRequestStatus` en `services/api.ts`:**
   - Liberar reservas cuando se rechaza una transacción
   - Liberar reservas cuando se completa una transacción (después de deducir stock)

**Archivos a crear:**
- `init/migrations/003_create_stock_reservations.sql`
- `init/functions/reserve_stock_for_transaction.sql`
- `init/functions/release_stock_reservations.sql`

**Archivos a modificar:**
- `services/api.ts`
- `types.ts` (agregar tipo `StockReservation`)

**Criterios de éxito:**
- ✅ El stock se reserva cuando se crea una solicitud
- ✅ El stock reservado no está disponible para otras solicitudes
- ✅ Las reservas se liberan cuando se rechaza o completa una transacción
- ✅ No se puede crear solicitudes con stock insuficiente (incluyendo reservas)

---

### ✅ PASO 2.4: Agregar Campos de Auditoría

**Problema:** No hay manera de rastrear quién hizo qué cambios.

**Acciones:**

1. **Agregar campos de auditoría a tablas críticas:**
   ```sql
   ALTER TABLE stock_lots 
   ADD COLUMN IF NOT EXISTS created_by TEXT,
   ADD COLUMN IF NOT EXISTS updated_by TEXT;
   
   ALTER TABLE transactions 
   ADD COLUMN IF NOT EXISTS created_by TEXT,
   ADD COLUMN IF NOT EXISTS updated_by TEXT;
   
   ALTER TABLE donation_transactions 
   ADD COLUMN IF NOT EXISTS created_by TEXT,
   ADD COLUMN IF NOT EXISTS updated_by TEXT;
   ```

2. **Modificar código TypeScript para incluir `created_by` y `updated_by`:**
   - Obtener el ID del usuario actual desde `AuthContext`
   - Incluir `created_by` al crear registros
   - Incluir `updated_by` al actualizar registros

3. **Crear triggers para actualizar `updated_by` automáticamente:**
   ```sql
   CREATE OR REPLACE FUNCTION update_updated_by()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Actualizar updated_by con el usuario actual
     -- Nota: Esto requiere que se pase el usuario en la sesión
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

**Archivos a crear:**
- `init/migrations/004_add_audit_fields.sql`

**Archivos a modificar:**
- `services/api.ts` (múltiples funciones)
- `types.ts` (actualizar tipos)

**Criterios de éxito:**
- ✅ Los campos `created_by` y `updated_by` están en las tablas
- ✅ Se registra el usuario que crea registros
- ✅ Se registra el usuario que actualiza registros
- ✅ Se puede rastrear quién hizo qué cambios

---

### ✅ PASO 2.5: Mejorar Manejo de Errores

**Problema:** El manejo de errores es inconsistente y no informativo.

**Acciones:**

1. **Crear sistema de códigos de error estándar:**
   - Crear archivo `services/errors.ts` con códigos de error
   - Definir tipos de error: `ValidationError`, `NotFoundError`, `InsufficientStockError`, etc.

2. **Implementar logging centralizado:**
   - Crear función `logError` en `services/logger.ts`
   - Registrar todos los errores con contexto (usuario, acción, timestamp)
   - Usar console.error en desarrollo, servicio de logging en producción

3. **Mejorar mensajes de error para el usuario:**
   - Traducir mensajes de error de PostgreSQL a mensajes user-friendly
   - Proporcionar mensajes específicos para cada tipo de error
   - Incluir sugerencias cuando sea posible

4. **Actualizar funciones de API para usar el nuevo sistema:**
   - Reemplazar `throw new Error()` por errores tipados
   - Usar `logError` para registrar errores
   - Proporcionar mensajes user-friendly

**Archivos a crear:**
- `services/errors.ts`
- `services/logger.ts`

**Archivos a modificar:**
- `services/api.ts` (múltiples funciones)
- `contexts/AlertContext.tsx` (mejorar manejo de errores)

**Criterios de éxito:**
- ✅ Los errores tienen códigos estándar
- ✅ Los errores se registran con contexto
- ✅ Los mensajes de error son claros y user-friendly
- ✅ Los errores se manejan consistentemente en toda la aplicación

---

### ✅ PASO 2.6: Implementar Soft Deletes

**Problema:** No hay manera de "eliminar" registros sin perder el historial.

**Acciones:**

1. **Agregar campo `deleted_at` a tablas:**
   ```sql
   ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
   ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
   ALTER TABLE donors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
   ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
   ALTER TABLE brands ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
   ```

2. **Crear índices para consultas que excluyen eliminados:**
   ```sql
   CREATE INDEX idx_products_deleted ON products(deleted_at) WHERE deleted_at IS NULL;
   CREATE INDEX idx_warehouses_deleted ON warehouses(deleted_at) WHERE deleted_at IS NULL;
   CREATE INDEX idx_donors_deleted ON donors(deleted_at) WHERE deleted_at IS NULL;
   ```

3. **Modificar funciones de API para excluir registros eliminados:**
   - Agregar filtro `deleted_at IS NULL` en todas las consultas
   - Modificar `delete` para hacer soft delete (actualizar `deleted_at`)
   - Crear función `restore` para restaurar registros eliminados

4. **Actualizar tipos TypeScript:**
   - Agregar `deleted_at` a los tipos
   - Actualizar funciones de API

**Archivos a crear:**
- `init/migrations/005_add_soft_deletes.sql`

**Archivos a modificar:**
- `services/api.ts` (múltiples funciones)
- `types.ts` (actualizar tipos)

**Criterios de éxito:**
- ✅ Los registros se marcan como eliminados en lugar de eliminarse físicamente
- ✅ Las consultas excluyen registros eliminados
- ✅ Se puede restaurar registros eliminados
- ✅ El historial se preserva

---

### ✅ PASO 2.7: Probar y Verificar Fase 2

**Acciones:**

1. **Probar índices:**
   - Verificar que las consultas son más rápidas
   - Usar `EXPLAIN ANALYZE` para verificar que se usan los índices

2. **Probar optimizaciones de consultas:**
   - Verificar que el número de consultas se reduce
   - Verificar que los tiempos de carga mejoran

3. **Probar reserva de stock:**
   - Crear múltiples solicitudes simultáneas
   - Verificar que el stock se reserva correctamente
   - Verificar que no se puede crear solicitudes con stock insuficiente

4. **Probar auditoría:**
   - Crear y actualizar registros
   - Verificar que `created_by` y `updated_by` se registran correctamente

5. **Probar manejo de errores:**
   - Generar errores intencionalmente
   - Verificar que los mensajes son claros
   - Verificar que los errores se registran

6. **Probar soft deletes:**
   - Eliminar registros
   - Verificar que no aparecen en consultas
   - Restaurar registros
   - Verificar que aparecen nuevamente

**Criterios de éxito:**
- ✅ Todas las pruebas pasan
- ✅ El rendimiento mejora significativamente
- ✅ La reserva de stock funciona correctamente
- ✅ La auditoría funciona correctamente
- ✅ El manejo de errores es consistente
- ✅ Los soft deletes funcionan correctamente

---

## 🟢 FASE 3: MEJORAS Y OPTIMIZACIONES ADICIONALES

**Objetivo:** Implementar paginación, tests, documentación y optimizaciones finales.

**Tiempo estimado:** 2-4 semanas  
**Estado:** ⏳ Pendiente (Esperando confirmación de Fase 2)

### ✅ PASO 3.1: Implementar Paginación en Consultas

**Problema:** Las consultas cargan todos los datos sin paginación, causando problemas de rendimiento.

**Acciones:**

1. **Crear tipo para paginación:**
   ```typescript
   export interface PaginationParams {
     page: number;
     pageSize: number;
   }
   
   export interface PaginatedResponse<T> {
     data: T[];
     total: number;
     page: number;
     pageSize: number;
     totalPages: number;
   }
   ```

2. **Implementar paginación en funciones de API:**
   - Modificar `getAll` en cada API para aceptar `PaginationParams`
   - Usar `LIMIT` y `OFFSET` en consultas SQL
   - Contar total de registros para calcular `totalPages`

3. **Actualizar componentes para usar paginación:**
   - Modificar tablas para mostrar paginación
   - Agregar controles de paginación (anterior, siguiente, ir a página)
   - Mantener estado de página en `useTableState`

**Archivos a modificar:**
- `types.ts` (agregar tipos de paginación)
- `services/api.ts` (múltiples funciones)
- `hooks/useTableState.ts` (agregar paginación)
- `components/Table.tsx` (mejorar paginación)
- Páginas que usan tablas (Products, Donations, Donors, etc.)

**Criterios de éxito:**
- ✅ Las consultas usan paginación
- ✅ Los componentes muestran controles de paginación
- ✅ El rendimiento mejora con grandes cantidades de datos
- ✅ La experiencia de usuario es buena

---

### ✅ PASO 3.2: Optimizar Cálculo de Stock Total

**Problema:** El stock total se calcula en JavaScript, lo que es ineficiente.

**Acciones:**

1. **Crear vista materializada para stock total:**
   ```sql
   CREATE MATERIALIZED VIEW stock_total_by_product_warehouse AS
   SELECT 
     product_id,
     warehouse_id,
     SUM(current_quantity) as total_stock,
     MIN(expiry_date) as earliest_expiry_date,
     COUNT(*) as lot_count
   FROM stock_lots
   WHERE is_expired = FALSE AND current_quantity > 0
   GROUP BY product_id, warehouse_id;
   
   CREATE UNIQUE INDEX ON stock_total_by_product_warehouse(product_id, warehouse_id);
   ```

2. **Crear función para refrescar la vista:**
   ```sql
   CREATE OR REPLACE FUNCTION refresh_stock_total_view()
   RETURNS void AS $$
   BEGIN
     REFRESH MATERIALIZED VIEW CONCURRENTLY stock_total_by_product_warehouse;
   END;
   $$ LANGUAGE plpgsql;
   ```

3. **Crear trigger para actualizar la vista cuando cambia el stock:**
   - Actualizar la vista después de insertar/actualizar/eliminar en `stock_lots`
   - Usar `REFRESH MATERIALIZED VIEW CONCURRENTLY` para no bloquear consultas

4. **Modificar código TypeScript para usar la vista:**
   - Consultar `stock_total_by_product_warehouse` en lugar de calcular en JavaScript
   - Usar la vista para mostrar stock total en tablas

**Archivos a crear:**
- `init/migrations/006_create_stock_total_view.sql`
- `init/functions/refresh_stock_total_view.sql`

**Archivos a modificar:**
- `services/api.ts` (modificar funciones de stock)
- `types.ts` (agregar tipo para vista)

**Criterios de éxito:**
- ✅ La vista materializada está creada
- ✅ La vista se actualiza automáticamente cuando cambia el stock
- ✅ Las consultas de stock son más rápidas
- ✅ El código TypeScript usa la vista

---

### ✅ PASO 3.3: Implementar Caché con React Query

**Problema:** Se hacen consultas redundantes a la base de datos.

**Acciones:**

1. **Optimizar configuración de React Query:**
   - Ajustar tiempos de cache según el tipo de dato
   - Configurar invalidación de cache cuando se modifica stock
   - Usar `staleTime` y `cacheTime` apropiados

2. **Implementar invalidación de cache:**
   - Invalidar cache de stock cuando se crea/actualiza una donación
   - Invalidar cache de stock cuando se completa una transacción
   - Invalidar cache de productos cuando se crea/actualiza un producto

3. **Usar optimistic updates:**
   - Actualizar cache optimísticamente cuando sea seguro
   - Revertir cambios si la operación falla

**Archivos a modificar:**
- `contexts/QueryProvider.tsx` (optimizar configuración)
- `services/api.ts` (agregar invalidación de cache)
- Páginas que usan React Query (actualizar para usar cache correctamente)

**Criterios de éxito:**
- ✅ El cache funciona correctamente
- ✅ La invalidación de cache funciona cuando se modifican datos
- ✅ Se reducen las consultas redundantes
- ✅ La experiencia de usuario mejora (menos carga)

---

### ✅ PASO 3.4: Agregar Tests Unitarios

**Problema:** No hay tests para verificar que el código funciona correctamente.

**Acciones:**

1. **Configurar entorno de testing:**
   - Instalar Jest y React Testing Library
   - Configurar Jest para TypeScript
   - Crear archivos de configuración

2. **Crear tests para funciones críticas:**
   - Tests para funciones de API (mocks de Supabase)
   - Tests para funciones de validación
   - Tests para funciones de cálculo

3. **Crear tests para componentes:**
   - Tests para componentes de formularios
   - Tests para componentes de tablas
   - Tests para componentes de UI

**Archivos a crear:**
- `jest.config.js`
- `setupTests.ts`
- Tests en `__tests__/` o junto a los archivos

**Criterios de éxito:**
- ✅ Los tests están configurados
- ✅ Hay tests para funciones críticas
- ✅ Hay tests para componentes importantes
- ✅ Los tests pasan correctamente
- ✅ La cobertura de tests es razonable (>60%)

---

### ✅ PASO 3.5: Agregar Tests de Integración

**Problema:** No hay tests para verificar flujos completos.

**Acciones:**

1. **Configurar tests de integración:**
   - Usar base de datos de prueba
   - Configurar entorno de testing
   - Crear funciones de utilidad para tests

2. **Crear tests para flujos principales:**
   - Test de flujo de donación completo
   - Test de flujo de transacción de cocina completo
   - Test de flujo de gestión de productos completo

3. **Crear tests de carga:**
   - Test de múltiples transacciones simultáneas
   - Test de rendimiento con muchos datos
   - Test de condiciones de carrera

**Archivos a crear:**
- Tests de integración en `__tests__/integration/`
- Configuración de base de datos de prueba

**Criterios de éxito:**
- ✅ Los tests de integración están configurados
- ✅ Hay tests para flujos principales
- ✅ Los tests de carga pasan
- ✅ No hay condiciones de carrera

---

### ✅ PASO 3.6: Mejorar Documentación

**Problema:** La documentación es insuficiente.

**Acciones:**

1. **Documentar funciones de API:**
   - Agregar JSDoc a todas las funciones de API
   - Documentar parámetros, retornos y errores
   - Agregar ejemplos de uso

2. **Documentar componentes:**
   - Agregar JSDoc a componentes
   - Documentar props y ejemplos de uso
   - Crear Storybook si es posible

3. **Actualizar README:**
   - Agregar instrucciones de instalación
   - Agregar instrucciones de desarrollo
   - Agregar instrucciones de despliegue
   - Agregar guía de contribución

4. **Crear documentación de arquitectura:**
   - Actualizar `PROJECT_CONTEXT.md` con cambios recientes
   - Documentar decisiones de diseño
   - Documentar flujos de datos

**Archivos a modificar:**
- `README.md`
- `PROJECT_CONTEXT.md`
- `services/api.ts` (agregar JSDoc)
- Componentes (agregar JSDoc)

**Criterios de éxito:**
- ✅ Todas las funciones de API están documentadas
- ✅ Los componentes importantes están documentados
- ✅ El README está completo y actualizado
- ✅ La documentación de arquitectura está actualizada

---

### ✅ PASO 3.7: Optimizaciones Finales

**Problema:** Hay oportunidades de optimización adicionales.

**Acciones:**

1. **Optimizar bundle size:**
   - Analizar bundle con `vite-bundle-visualizer`
   - Eliminar dependencias no utilizadas
   - Usar code splitting donde sea posible

2. **Optimizar imágenes:**
   - Comprimir imágenes
   - Usar formatos modernos (WebP)
   - Implementar lazy loading de imágenes

3. **Optimizar rendimiento de frontend:**
   - Usar `React.memo` donde sea apropiado
   - Usar `useMemo` y `useCallback` donde sea necesario
   - Optimizar re-renders

4. **Implementar service worker para PWA:**
   - Mejorar `public/sw.js`
   - Implementar cache de recursos
   - Implementar actualizaciones offline

**Archivos a modificar:**
- `public/sw.js`
- Componentes (optimizar re-renders)
- `vite.config.ts` (optimizaciones de build)

**Criterios de éxito:**
- ✅ El bundle size se reduce
- ✅ Las imágenes están optimizadas
- ✅ El rendimiento del frontend mejora
- ✅ El service worker funciona correctamente

---

### ✅ PASO 3.8: Probar y Verificar Fase 3

**Acciones:**

1. **Probar paginación:**
   - Verificar que la paginación funciona en todas las tablas
   - Verificar que el rendimiento mejora con muchos datos

2. **Probar vista materializada:**
   - Verificar que la vista se actualiza correctamente
   - Verificar que las consultas son más rápidas

3. **Probar cache:**
   - Verificar que el cache funciona correctamente
   - Verificar que la invalidación funciona

4. **Ejecutar tests:**
   - Ejecutar tests unitarios
   - Ejecutar tests de integración
   - Verificar que todos pasan

5. **Revisar documentación:**
   - Verificar que la documentación está completa
   - Verificar que los ejemplos funcionan

6. **Probar optimizaciones:**
   - Verificar que el bundle size se reduce
   - Verificar que el rendimiento mejora
   - Verificar que el service worker funciona

**Criterios de éxito:**
- ✅ Todas las pruebas pasan
- ✅ La paginación funciona correctamente
- ✅ La vista materializada funciona correctamente
- ✅ El cache funciona correctamente
- ✅ Los tests pasan
- ✅ La documentación está completa
- ✅ Las optimizaciones funcionan

---

## 📝 NOTAS IMPORTANTES

### Antes de Empezar Cada Fase

1. **Hacer backup de la base de datos:**
   - Crear backup antes de aplicar migraciones
   - Probar restauración del backup

2. **Revisar cambios en branch separado:**
   - Crear branch para cada fase
   - Hacer commits frecuentes
   - Hacer pull request para revisión

3. **Probar en entorno de desarrollo:**
   - Probar todos los cambios en desarrollo
   - Verificar que no se rompe funcionalidad existente
   - Probar casos edge

### Durante la Implementación

1. **Seguir el orden de los pasos:**
   - Los pasos están ordenados por dependencias
   - No saltar pasos
   - Completar cada paso antes de pasar al siguiente

2. **Documentar cambios:**
   - Documentar cambios en código
   - Actualizar documentación cuando sea necesario
   - Comentar decisiones importantes

3. **Probar frecuentemente:**
   - Probar después de cada cambio importante
   - Verificar que las pruebas pasan
   - Verificar que no se introducen regresiones

### Después de Completar Cada Fase

1. **Revisar cambios:**
   - Revisar todos los cambios realizados
   - Verificar que cumplen con los criterios de éxito
   - Verificar que no hay problemas

2. **Probar exhaustivamente:**
   - Probar todos los flujos principales
   - Probar casos edge
   - Probar rendimiento

3. **Documentar resultados:**
   - Documentar lo que se hizo
   - Documentar problemas encontrados
   - Documentar decisiones tomadas

---

## 🎯 RESUMEN FINAL

Al completar las 3 fases, el sistema habrá mejorado significativamente en:

- ✅ **Integridad de datos:** Transacciones atómicas, validación de stock, reserva de stock
- ✅ **Rendimiento:** Índices, optimización de consultas, vista materializada, cache
- ✅ **Auditoría:** Campos de auditoría, soft deletes, logging
- ✅ **Calidad:** Tests, documentación, manejo de errores
- ✅ **Escalabilidad:** Paginación, optimizaciones, mejor arquitectura

**El sistema estará listo para producción después de completar las 3 fases.**

---

**Última actualización:** Diciembre 2024  
**Versión del plan:** 1.0

