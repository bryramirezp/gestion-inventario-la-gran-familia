# 🔍 AUDITORÍA TÉCNICA: Sistema de Gestión de Inventario "La Gran Familia"

**Fecha de Auditoría:** Diciembre 2024  
**Auditor:** Ingeniero de Software Senior - Especialista en PostgreSQL y Sistemas de Gestión de Inventario  
**Versión del Sistema:** 0.0.0

---

## 1. RESUMEN DE ARQUITECTURA Y LÓGICA

### 1.1. Propósito de la Aplicación

El sistema es una aplicación web para gestionar el inventario de donaciones de la ONG "La Gran Familia". Su propósito principal es:

- **Registrar donaciones** de productos con información detallada (donante, almacén, productos, precios, descuentos)
- **Gestionar solicitudes de cocina** mediante un flujo de aprobación (Pending → Approved → Completed)
- **Controlar el inventario** por almacén, categorías, marcas y productos
- **Realizar análisis** de donantes y reportes de productos próximos a caducar
- **Administrar usuarios** con roles y permisos por almacén

### 1.2. Arquitectura Técnica

**Stack Tecnológico:**
- **Frontend:** React 18.3.1 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Estado:** TanStack React Query + Context API
- **Routing:** React Router DOM 6.30.1
- **UI:** Tailwind CSS + componentes personalizados

**Arquitectura de Datos:**
- Base de datos PostgreSQL en Supabase
- Autenticación mediante Supabase Auth
- API REST generada automáticamente por Supabase
- Cliente de Supabase en el frontend para operaciones CRUD

### 1.3. Flujo de Datos Principal

#### Flujo de Donaciones:
1. Usuario selecciona donante y almacén
2. Agrega productos con cantidad, precio, descuento y fecha de caducidad
3. Al enviar, se crean `stock_lots` para cada producto y un registro en `donation_transactions`
4. Los lotes se crean con `current_quantity` igual a la cantidad donada

#### Flujo de Solicitudes de Cocina:
1. Personal de cocina crea una solicitud (`transactions` con status 'Pending')
2. Se agregan detalles en `transaction_details` (productos y cantidades)
3. Administrador/Operador aprueba (status → 'Approved')
4. Al marcar como 'Completed', se deducen los productos de los lotes usando FIFO (First In, First Out)
5. Se actualiza `current_quantity` en `stock_lots`

#### Flujo de Consulta de Inventario:
1. Se consultan todos los `stock_lots` filtrados por almacén
2. Se agregan datos de productos, categorías, marcas y unidades
3. Se calcula `total_stock` sumando `current_quantity` de lotes no vencidos
4. Se determina la fecha de caducidad más próxima

### 1.4. Lógica de Negocio Inferida

1. **Gestión de Lotes (FIFO):** Los productos se deducen de los lotes más antiguos primero
2. **Productos Vencidos:** Se mueven a un "almacén virtual" con ID 999 (EXPIRED_WAREHOUSE_ID)
3. **Validación de Stock:** Se valida stock disponible antes de crear solicitudes (solo en frontend)
4. **Aprobación de Solicitudes:** Requiere dos pasos: Aprobar → Completar
5. **Cálculo de Valores:** Se calcula valor total antes y después de descuentos para donaciones

---

## 2. ANÁLISIS CRÍTICO: LO QUE NO FUNCIONA (Puntos de Falla)

### 2.1. Errores Lógicos/Bugs Críticos

#### ❌ **CRÍTICO: Discrepancia entre Esquema SQL y Código TypeScript**

**Ubicación:** `init/database-normalization-ngo-inventory-system-1762408899807.sql` vs `types.ts` y `services/api.ts`

**Problema:**
- El esquema SQL define `stock_lots.quantity` pero el código TypeScript usa `current_quantity`
- El esquema SQL define `transactions` con estructura diferente (transaction_type_id, product_id directo) pero el código usa `transactions` + `transaction_details` con estructura de solicitudes de cocina
- El esquema SQL no tiene las tablas `donation_transactions` ni `donation_items` que el código requiere

**Impacto:** 
- **El sistema NO puede funcionar** con el esquema SQL proporcionado
- Las migraciones fallarán o el código fallará al ejecutarse
- Indica que el esquema SQL está desactualizado o es de una versión anterior

**Evidencia:**
```sql
-- SQL define:
CREATE TABLE stock_lots (
  quantity numeric(10, 2) not null check (quantity >= 0),
  ...
);

-- Pero el código usa:
await supabase.from('stock_lots').update({ current_quantity: ... })
```

```typescript
// types.ts define transactions como:
transactions: {
  requester_id: string;
  approver_id: string | null;
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected';
  ...
}

// Pero SQL define transactions como:
transaction_type_id bigint not null;
product_id bigint not null;
quantity numeric(10, 2);
```

#### ❌ **CRÍTICO: Falta de Validación de Stock Antes de Completar Transacciones**

**Ubicación:** `services/api.ts:840-867` (función `updateRequestStatus`)

**Problema:**
- Cuando se marca una transacción como 'Completed', NO se valida si hay suficiente stock disponible
- Se lee el stock actual, pero si otro usuario completó una transacción simultáneamente, puede haber stock insuficiente
- No hay verificación de que `quantityToDeduct` pueda ser satisfecho completamente

**Código Problemático:**
```typescript
if (newStatus === 'Completed' && updated) {
  const { data: transactionDetails } = await supabase...;
  
  for (const detail of transactionDetails || []) {
    const { data: lots } = await supabase
      .from('stock_lots')
      .select('*')
      .eq('product_id', detail.product_id)
      .gt('current_quantity', 0)
      .order('received_date', { ascending: true });
    
    let quantityToDeduct = detail.quantity;
    for (const lot of lots || []) {
      // ❌ NO verifica si hay suficiente stock total
      // ❌ Puede dejar quantityToDeduct > 0 sin error
      const deductAmount = Math.min(Number(lot.current_quantity), quantityToDeduct);
      await supabase.from('stock_lots').update({ current_quantity: ... });
      quantityToDeduct -= deductAmount;
    }
    // ❌ Si quantityToDeduct > 0, la transacción se marca como completada 
    //    pero no se dedujo todo el stock solicitado
  }
}
```

**Impacto:**
- Transacciones marcadas como "Completadas" sin haber deducido todo el stock
- Stock negativo potencial (aunque hay constraint, puede fallar en condiciones de carrera)
- Datos inconsistentes entre lo solicitado y lo realmente deducido

#### ❌ **CRÍTICO: Condiciones de Carrera (Race Conditions) en Actualización de Stock**

**Ubicación:** `services/api.ts:857-866`

**Problema:**
- Múltiples usuarios pueden completar transacciones simultáneamente para el mismo producto
- No hay bloqueos (locks) ni transacciones atómicas
- Dos transacciones pueden leer el mismo stock, ambas pensar que hay suficiente, y ambas deducir, resultando en stock negativo

**Escenario de Falla:**
```
Usuario A: Lee stock = 100 unidades
Usuario B: Lee stock = 100 unidades (simultáneamente)
Usuario A: Deducir 60 unidades → stock = 40
Usuario B: Deducir 60 unidades → stock = -20 (❌ STOCK NEGATIVO)
```

**Impacto:**
- Stock negativo en la base de datos (viola constraint pero puede pasar en condiciones de carrera)
- Pérdida de integridad de datos
- Imposibilidad de rastrear qué transacciones causaron el problema

#### ❌ **CRÍTICO: Falta de Transacciones Atómicas en Operaciones Críticas**

**Ubicación:** `services/api.ts:874-895` (createDonation) y `services/api.ts:840-867` (updateRequestStatus)

**Problema:**
- Las operaciones que modifican múltiples tablas NO están dentro de transacciones de base de datos
- Si falla una parte, las otras pueden quedar ejecutadas, causando inconsistencias

**Ejemplo en createDonation:**
```typescript
// ❌ Si falla la inserción en donation_transactions después de crear stock_lots,
//    los lotes quedan creados sin registro de donación
for (const item of donationData.items) {
  await stockLotApi.create(_token, { ... }); // Operación 1
}
const { data: newDonationRecord } = await supabase
  .from('donation_transactions')
  .insert({ ... }); // Operación 2 - Si falla, los lotes ya están creados
```

**Ejemplo en updateRequestStatus:**
```typescript
// ❌ Si falla una actualización de lote, algunos lotes quedan actualizados
//    y otros no, pero la transacción ya está marcada como 'Completed'
for (const lot of lots || []) {
  await supabase.from('stock_lots').update({ ... }); // Múltiples operaciones sin transacción
}
```

**Impacto:**
- Datos inconsistentes
- Imposibilidad de hacer rollback en caso de error
- Pérdida de trazabilidad

#### ❌ **ALTO: Constraint de Fecha de Caducidad Impide Insertar Productos Ya Vencidos**

**Ubicación:** `init/database-normalization-ngo-inventory-system-1762408899807.sql:299-302`

**Problema:**
```sql
constraint chk_expiry_date check (
  expiry_date is null
  or expiry_date >= current_date  -- ❌ No permite fechas pasadas
)
```

**Impacto:**
- No se pueden registrar donaciones de productos que ya están vencidos al momento de la donación
- En la realidad, es común recibir productos con fecha de caducidad pasada que aún son utilizables
- El sistema debería permitir registrar estos productos pero marcarlos como vencidos

#### ❌ **ALTO: Validación de Stock Solo en Frontend**

**Ubicación:** `pages/kitchen/KitchenStaffView.tsx:80-99`

**Problema:**
- La validación de stock disponible se hace solo en el frontend antes de crear la solicitud
- Entre el momento de validación y la creación de la solicitud, otro usuario puede consumir stock
- No hay validación en el backend al completar la transacción

**Código:**
```typescript
// Validación solo en frontend
todayMenu?.items.forEach((item) => {
  const product = productMap.get(item.product_id);
  const requiredQty = item.quantity * servings;
  if (product && product.total_stock < requiredQty) {
    errors.items = `Not enough stock...`;
  }
});
// ❌ No hay validación en el backend
```

**Impacto:**
- Solicitudes creadas con stock insuficiente
- Usuarios frustrados cuando su solicitud no se puede completar después de ser aprobada

#### ❌ **MEDIO: Falta Validación de Cantidad Total Disponible al Completar**

**Ubicación:** `services/api.ts:847-867`

**Problema:**
- No se suma el stock total disponible antes de empezar a deducir
- Si el stock total es insuficiente, se deducen parcialmente los lotes sin informar el error

**Impacto:**
- Transacciones parcialmente completadas sin notificación
- Stock inconsistente

### 2.2. Problemas de Rendimiento

#### ⚠️ **ALTO: Consultas N+1 en Múltiples Operaciones**

**Ubicación:** `services/api.ts:847-866` (updateRequestStatus)

**Problema:**
- Por cada detalle de transacción, se hace una consulta separada a `stock_lots`
- Por cada lote, se hace una actualización separada
- Si una transacción tiene 10 productos y cada producto tiene 3 lotes, son 30 actualizaciones individuales

**Código Problemático:**
```typescript
for (const detail of transactionDetails || []) {
  const { data: lots } = await supabase...; // Consulta 1 por producto
  for (const lot of lots || []) {
    await supabase.from('stock_lots').update(...); // Actualización 1 por lote
  }
}
```

**Impacto:**
- Rendimiento muy lento con muchas transacciones
- Mayor probabilidad de condiciones de carrera
- Alto consumo de recursos de base de datos

**Solución Recomendada:**
- Usar una función PostgreSQL que maneje toda la deducción en una sola transacción
- O hacer un batch update con todas las actualizaciones

#### ⚠️ **MEDIO: Falta de Índices en Campos Críticos**

**Ubicación:** `init/database-normalization-ngo-inventory-system-1762408899807.sql`

**Problema:**
- No hay índice en `stock_lots.current_quantity` (aunque el código lo usa, el SQL no lo tiene)
- No hay índice en `stock_lots.received_date` (usado para ordenar en FIFO)
- No hay índice compuesto en `(product_id, warehouse_id, current_quantity > 0)` para consultas frecuentes

**Impacto:**
- Consultas lentas al buscar lotes disponibles
- Escalabilidad limitada con muchos lotes

#### ⚠️ **MEDIO: Consulta de Todos los Productos Sin Paginación**

**Ubicación:** `services/api.ts:700-754` (getFullProductDetails)

**Problema:**
- La función `getFullProductDetails` carga TODOS los productos, categorías, unidades, marcas y lotes en memoria
- No hay paginación ni límites
- Con muchos productos, puede causar problemas de rendimiento

**Impacto:**
- Tiempos de carga largos
- Alto consumo de memoria
- Experiencia de usuario pobre

### 2.3. Malas Prácticas

#### ⚠️ **ALTO: Autenticación Débil en authApi.login**

**Ubicación:** `services/api.ts:475-503`

**Problema:**
```typescript
export const authApi = {
  login: async (email: string, _password?: string) => {
    // ❌ NO valida la contraseña
    // ❌ Solo verifica que el usuario exista y esté activo
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    // TODO: Add password verification here when authentication is properly implemented
    // For now, accept any password for demo purposes
    return { accessToken: 'managed-by-supabase', refreshToken: 'managed-by-supabase' };
  },
};
```

**Impacto:**
- **Cualquier contraseña es aceptada** si el usuario existe
- Riesgo de seguridad crítico
- Nota: Aunque hay un `AuthContext` que usa `supabase.auth.signInWithPassword`, este `authApi.login` parece ser código legacy no utilizado

#### ⚠️ **MEDIO: Manejo de Errores Inconsistente**

**Ubicación:** Múltiples archivos

**Problema:**
- Algunos errores se lanzan con `throw new Error()`
- Otros se capturan pero no se registran
- No hay logging centralizado
- Los mensajes de error no son informativos para el usuario

**Ejemplos:**
```typescript
// En algunos lugares:
catch (error) {
  // Error al cargar datos - manejado por el sistema de alertas
  // ❌ No se registra el error, no se sabe qué falló
}

// En otros:
if (error) throw new Error(error.message);
// ❌ El mensaje de error de Supabase puede no ser user-friendly
```

#### ⚠️ **MEDIO: Uso de Token Desperdiciado**

**Ubicación:** `services/api.ts` (todas las funciones)

**Problema:**
- Todas las funciones de API reciben un parámetro `token` pero la mayoría no lo usan (`_token`)
- Supabase maneja la autenticación mediante la sesión, no mediante tokens en las consultas
- Código innecesario y confuso

**Impacto:**
- Código confuso
- Mantenimiento difícil

#### ⚠️ **BAJO: Magic Numbers**

**Ubicación:** `services/api.ts:28`

**Problema:**
```typescript
const EXPIRED_WAREHOUSE_ID = 999; // ❌ Magic number
```

**Impacto:**
- Si el ID 999 se usa para otro almacén, hay conflicto
- Debería ser una constante configurable o un campo en la tabla de warehouses

### 2.4. Riesgos Futuros

#### 🔴 **CRÍTICO: Escalabilidad Limitada**

**Problema:**
- El sistema no está diseñado para manejar alto volumen de transacciones simultáneas
- Las condiciones de carrera se agravarán con más usuarios
- La falta de transacciones atómicas causará más problemas con mayor carga

**Impacto Futuro:**
- El sistema fallará bajo carga real
- Pérdida de confianza de los usuarios
- Necesidad de refactorización completa

#### 🟡 **ALTO: Mantenibilidad Dificultada por Discrepancias**

**Problema:**
- La discrepancia entre el esquema SQL y el código TypeScript hace difícil mantener el sistema
- No está claro cuál es la "fuente de verdad"
- Las migraciones futuras pueden romper el código

**Impacto Futuro:**
- Errores difíciles de rastrear
- Tiempo de desarrollo aumentado
- Riesgo de introducir bugs

#### 🟡 **MEDIO: Falta de Auditoría y Trazabilidad**

**Problema:**
- No hay registro de quién hizo qué cambios y cuándo (excepto `created_at` y `updated_at`)
- No hay log de transacciones fallidas
- No hay manera de rastrear cambios históricos en el stock

**Impacto Futuro:**
- Imposibilidad de auditar operaciones
- Dificultad para resolver disputas
- Cumplimiento regulatorio problemático

---

## 3. ANÁLISIS ESPECÍFICO: BASE DE DATOS (PostgreSQL)

### 3.1. Diseño del Esquema

#### ❌ **CRÍTICO: Esquema SQL No Coincide con Código TypeScript**

**Problema:**
El esquema SQL en `init/database-normalization-ngo-inventory-system-1762408899807.sql` define tablas que NO existen en el código TypeScript, y viceversa:

**Tablas en SQL que NO se usan en el código:**
- `transactions` (con estructura diferente)
- `transaction_types`

**Tablas en código que NO existen en SQL:**
- `donation_transactions`
- `donation_items`
- `transaction_details` (con la estructura usada en el código)
- `transactions` (con la estructura de solicitudes de cocina)

**Campos que no coinciden:**
- SQL: `stock_lots.quantity` → Código: `stock_lots.current_quantity`
- SQL: `stock_lots.unit_cost` → Código: `stock_lots.unit_price`
- SQL: `stock_lots.lot_number` → Código: No se usa
- SQL: `users.email` → Código: `users.user_id` (string, parece ser UUID de Supabase Auth)

**Impacto:**
- **El sistema NO puede funcionar** con este esquema SQL
- Indica que el esquema está desactualizado o es de otra versión del sistema

#### ⚠️ **ALTO: Falta de Constraints de Integridad Referencial en Código**

**Problema:**
Aunque el SQL tiene foreign keys, el código no valida referencias antes de insertar:

- No se valida que `donor_id` exista antes de crear donación
- No se valida que `product_id` exista antes de crear lote
- No se valida que `warehouse_id` exista antes de crear lote

**Impacto:**
- Errores de foreign key en runtime
- Mensajes de error poco claros para el usuario

#### ⚠️ **MEDIO: Falta de Campos de Auditoría**

**Problema:**
- No hay campos `created_by` o `updated_by` en las tablas
- No hay campos `deleted_at` para soft deletes
- Solo hay `created_at` y `updated_at`

**Impacto:**
- Imposibilidad de auditar quién hizo cambios
- No se puede hacer soft delete

### 3.2. Eficiencia de Consultas

#### ❌ **ALTO: Consultas N+1**

**Problema:**
Múltiples lugares hacen consultas N+1:

1. **getDonorAnalysisData:** Carga todos los productos y categorías, luego itera sobre transacciones
2. **updateRequestStatus:** Consulta lotes por cada producto en la transacción
3. **getFullProductDetails:** Carga todos los datos sin filtros

#### ⚠️ **MEDIO: Índices Faltantes**

**Problema:**
Faltan índices para consultas frecuentes:

- `stock_lots.current_quantity` (si existe en la BD real)
- `stock_lots.received_date` (usado para FIFO)
- `transaction_details.transaction_id` (ya debería tener índice por FK, pero verificar)
- `donation_items.donation_id` (ya debería tener índice por FK)

#### ⚠️ **BAJO: Consultas Sin Optimización**

**Problema:**
- `getFullProductDetails` carga TODOS los productos sin filtros
- No usa JOINs cuando podría reducir round-trips
- Cálculos en JavaScript en lugar de en PostgreSQL

### 3.3. Integridad de Datos

#### ❌ **CRÍTICO: Falta de Transacciones Atómicas**

**Problema:**
Operaciones que modifican múltiples tablas no están en transacciones:

1. **createDonation:** Crea múltiples `stock_lots` y luego `donation_transactions`
2. **updateRequestStatus:** Actualiza múltiples `stock_lots` después de marcar transacción como completada
3. **createRequest:** Crea `transactions` y luego múltiples `transaction_details`

**Impacto:**
- Datos inconsistentes si falla una parte
- Imposibilidad de rollback

#### ❌ **ALTO: Falta de Validación de Stock en Base de Datos**

**Problema:**
- No hay triggers ni funciones que validen stock antes de deducir
- El constraint `check (quantity >= 0)` previene stock negativo, pero no valida disponibilidad antes de deducir

**Solución Recomendada:**
Crear una función PostgreSQL que:
1. Valide stock disponible
2. Deduzca de lotes usando FIFO
3. Todo en una transacción atómica

#### ⚠️ **MEDIO: Constraint de Fecha de Caducidad Restrictivo**

**Problema:**
```sql
constraint chk_expiry_date check (
  expiry_date is null
  or expiry_date >= current_date  -- No permite productos ya vencidos
)
```

**Impacto:**
- No se pueden registrar productos vencidos (aunque en la realidad se reciben)

---

## 4. ANÁLISIS ESPECÍFICO: LÓGICA DE INVENTARIOS

### 4.1. Precisión del Stock

#### ❌ **CRÍTICO: Stock Puede Volverse Negativo por Condiciones de Carrera**

**Problema:**
Como se mencionó en la sección 2.1, múltiples usuarios pueden deducir stock simultáneamente sin validación atómica.

#### ❌ **CRÍTICO: No se Valida Stock Disponible al Completar Transacciones**

**Problema:**
El código no verifica si hay suficiente stock antes de empezar a deducir.

#### ⚠️ **ALTO: Cálculo de Stock Total en Memoria**

**Problema:**
El stock total se calcula en JavaScript sumando `current_quantity` de todos los lotes:

```typescript
const totalStock = usableLots.reduce((sum, lot) => sum + Number(lot.current_quantity), 0);
```

**Problemas:**
- Si hay muchos lotes, es ineficiente
- El cálculo puede estar desactualizado si otro usuario modifica lotes simultáneamente
- Debería calcularse en la base de datos con una vista o función

#### ⚠️ **MEDIO: Manejo de Productos Vencidos**

**Problema:**
- Los productos vencidos se mueven a un "almacén virtual" (ID 999)
- Esto es una solución temporal que puede causar problemas:
  - ¿Qué pasa si se necesita un almacén real con ID 999?
  - No hay manera de "reactivar" productos vencidos si se decide que aún son utilizables
  - El proceso `processExpired` no es atómico (puede fallar a medio camino)

### 4.2. Coherencia

#### ❌ **CRÍTICO: El Sistema Puede Mostrar Stock Incorrecto**

**Problema:**
- El stock se calcula en tiempo real pero puede cambiar entre la consulta y la acción
- No hay "reserva" de stock cuando se crea una solicitud
- Dos usuarios pueden ver el mismo stock disponible y ambos crear solicitudes para ese stock

#### ⚠️ **ALTO: Falta de Reserva de Stock**

**Problema:**
- Cuando se crea una solicitud (status 'Pending'), el stock no se reserva
- El stock sigue mostrándose como disponible hasta que se completa la transacción
- Esto puede causar sobreventa (más solicitudes que stock disponible)

#### ⚠️ **MEDIO: FIFO No Garantizado**

**Problema:**
- El código intenta usar FIFO ordenando por `received_date`, pero:
  - No hay garantía de que el orden sea correcto si hay múltiples transacciones simultáneas
  - No se usa `SELECT FOR UPDATE` para bloquear lotes durante la deducción

### 4.3. Manejo de Concurrencia

#### ❌ **CRÍTICO: Sin Manejo de Concurrencia**

**Problema:**
- No hay locks (SELECT FOR UPDATE)
- No hay transacciones atómicas
- No hay validación optimista (versionado)
- No hay validación pesimista (locks)

**Impacto:**
- Condiciones de carrera
- Stock negativo
- Datos inconsistentes

---

## 5. RECOMENDACIONES DE MEJORA

### 5.1. Acciones Críticas (Prioridad Alta - Implementar Inmediatamente)

#### 1. **Corregir Discrepancia entre Esquema SQL y Código**

**Acción:**
- Decidir cuál es la "fuente de verdad": el código TypeScript o el esquema SQL
- Si el código es correcto, actualizar el esquema SQL para que coincida
- Si el SQL es correcto, refactorizar el código
- Crear migraciones para sincronizar la base de datos real

**Archivos a Modificar:**
- `init/database-normalization-ngo-inventory-system-1762408899807.sql`
- `types.ts` (si se actualiza el SQL)
- `services/api.ts` (si se actualiza el código)

#### 2. **Implementar Transacciones Atómicas en Operaciones Críticas**

**Acción:**
Crear funciones PostgreSQL que manejen operaciones completas:

```sql
-- Función para completar transacción con validación de stock
CREATE OR REPLACE FUNCTION complete_kitchen_transaction(
  p_transaction_id BIGINT,
  p_approver_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_detail RECORD;
  v_lot RECORD;
  v_quantity_to_deduct NUMERIC;
  v_available_stock NUMERIC;
  v_deducted_amount NUMERIC;
  v_result JSON;
BEGIN
  -- Iniciar transacción implícita
  BEGIN
    -- Validar que la transacción existe y está aprobada
    IF NOT EXISTS (
      SELECT 1 FROM transactions 
      WHERE transaction_id = p_transaction_id 
      AND status = 'Approved'
    ) THEN
      RAISE EXCEPTION 'Transaction not found or not approved';
    END IF;

    -- Para cada detalle de la transacción
    FOR v_detail IN 
      SELECT * FROM transaction_details 
      WHERE transaction_id = p_transaction_id
    LOOP
      -- Calcular stock disponible
      SELECT COALESCE(SUM(current_quantity), 0) INTO v_available_stock
      FROM stock_lots
      WHERE product_id = v_detail.product_id
      AND warehouse_id = (SELECT source_warehouse_id FROM transactions WHERE transaction_id = p_transaction_id)
      AND warehouse_id != 999  -- Excluir vencidos
      AND current_quantity > 0;

      -- Validar stock suficiente
      IF v_available_stock < v_detail.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for product %: required %, available %', 
          v_detail.product_id, v_detail.quantity, v_available_stock;
      END IF;

      -- Deducir stock usando FIFO con SELECT FOR UPDATE
      v_quantity_to_deduct := v_detail.quantity;
      
      FOR v_lot IN
        SELECT lot_id, current_quantity
        FROM stock_lots
        WHERE product_id = v_detail.product_id
        AND warehouse_id = (SELECT source_warehouse_id FROM transactions WHERE transaction_id = p_transaction_id)
        AND warehouse_id != 999
        AND current_quantity > 0
        ORDER BY received_date ASC
        FOR UPDATE SKIP LOCKED  -- Evitar deadlocks
      LOOP
        EXIT WHEN v_quantity_to_deduct <= 0;
        
        v_deducted_amount := LEAST(v_lot.current_quantity, v_quantity_to_deduct);
        
        UPDATE stock_lots
        SET current_quantity = current_quantity - v_deducted_amount
        WHERE lot_id = v_lot.lot_id;
        
        v_quantity_to_deduct := v_quantity_to_deduct - v_deducted_amount;
      END LOOP;

      -- Validar que se dedujo todo
      IF v_quantity_to_deduct > 0 THEN
        RAISE EXCEPTION 'Failed to deduct full quantity for product %', v_detail.product_id;
      END IF;
    END LOOP;

    -- Marcar transacción como completada
    UPDATE transactions
    SET status = 'Completed',
        approver_id = p_approver_id,
        updated_at = NOW()
    WHERE transaction_id = p_transaction_id;

    -- Retornar éxito
    v_result := json_build_object('success', true, 'transaction_id', p_transaction_id);
    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback automático en caso de error
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;
```

**Archivos a Modificar:**
- Crear nuevo archivo: `init/functions/complete_kitchen_transaction.sql`
- Modificar: `services/api.ts` para usar esta función

#### 3. **Implementar Validación de Stock en Backend**

**Acción:**
- Crear función PostgreSQL que valide stock antes de permitir crear solicitudes
- O implementar validación en el backend antes de completar transacciones

#### 4. **Corregir Manejo de Productos Vencidos**

**Acción:**
- Cambiar el constraint de `expiry_date` para permitir fechas pasadas
- Usar el campo `is_expired` para marcar productos vencidos
- Crear una vista o función que filtre productos vencidos en lugar de moverlos a otro almacén

```sql
-- Eliminar constraint restrictivo
ALTER TABLE stock_lots DROP CONSTRAINT IF EXISTS chk_expiry_date;

-- Actualizar trigger para marcar como vencido
CREATE OR REPLACE FUNCTION public.check_expired_lots() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
        NEW.is_expired := TRUE;
    ELSE
        NEW.is_expired := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5.2. Acciones Importantes (Prioridad Media - Implementar Próximamente)

#### 5. **Optimizar Consultas N+1**

**Acción:**
- Usar JOINs en lugar de múltiples consultas
- Crear vistas materializadas para datos frecuentemente consultados
- Implementar paginación en consultas de listados

#### 6. **Agregar Índices Faltantes**

**Acción:**
```sql
-- Índice para consultas de stock disponible
CREATE INDEX IF NOT EXISTS idx_stock_lots_available 
ON stock_lots(product_id, warehouse_id, current_quantity) 
WHERE current_quantity > 0 AND warehouse_id != 999;

-- Índice para ordenamiento FIFO
CREATE INDEX IF NOT EXISTS idx_stock_lots_fifo 
ON stock_lots(product_id, warehouse_id, received_date) 
WHERE current_quantity > 0;

-- Índice para búsqueda de productos vencidos
CREATE INDEX IF NOT EXISTS idx_stock_lots_expired 
ON stock_lots(expiry_date, is_expired) 
WHERE is_expired = TRUE;
```

#### 7. **Implementar Reserva de Stock**

**Acción:**
- Crear tabla `stock_reservations` para reservar stock cuando se crea una solicitud
- Actualizar consultas de stock para excluir stock reservado
- Liberar reservas cuando se completa o rechaza una transacción

```sql
CREATE TABLE stock_reservations (
  reservation_id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL REFERENCES transactions(transaction_id),
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

#### 8. **Agregar Campos de Auditoría**

**Acción:**
```sql
-- Agregar campos de auditoría a tablas críticas
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

#### 9. **Mejorar Manejo de Errores**

**Acción:**
- Implementar logging centralizado
- Crear códigos de error estándar
- Proporcionar mensajes de error user-friendly
- Registrar todos los errores para debugging

#### 10. **Implementar Soft Deletes**

**Acción:**
```sql
-- Agregar campo deleted_at a tablas
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE donors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Crear índices
CREATE INDEX idx_products_deleted ON products(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_deleted ON warehouses(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_donors_deleted ON donors(deleted_at) WHERE deleted_at IS NULL;
```

### 5.3. Mejoras Adicionales (Prioridad Baja - Implementar cuando sea posible)

#### 11. **Implementar Paginación**

**Acción:**
- Agregar paginación a todas las consultas de listados
- Usar cursor-based pagination para mejor rendimiento

#### 12. **Optimizar Cálculo de Stock Total**

**Acción:**
- Crear vista materializada para stock total por producto/almacén
- Actualizar la vista periódicamente o con triggers

#### 13. **Implementar Caché**

**Acción:**
- Usar React Query para cachear consultas frecuentes
- Implementar invalidación de caché cuando se modifica stock

#### 14. **Agregar Tests**

**Acción:**
- Crear tests unitarios para funciones críticas
- Crear tests de integración para flujos completos
- Crear tests de carga para verificar rendimiento bajo concurrencia

#### 15. **Documentar API**

**Acción:**
- Documentar todas las funciones de API
- Crear ejemplos de uso
- Documentar errores posibles

---

## 6. RESUMEN EJECUTIVO

### Problemas Críticos Encontrados:

1. **❌ CRÍTICO: Discrepancia entre Esquema SQL y Código TypeScript**
   - El sistema NO puede funcionar con el esquema SQL actual
   - Requiere sincronización inmediata

2. **❌ CRÍTICO: Falta de Transacciones Atómicas**
   - Operaciones críticas no son atómicas
   - Riesgo de datos inconsistentes

3. **❌ CRÍTICO: Condiciones de Carrera en Actualización de Stock**
   - Stock puede volverse negativo
   - Múltiples usuarios pueden deducir el mismo stock

4. **❌ CRÍTICO: Falta de Validación de Stock en Backend**
   - No se valida stock antes de completar transacciones
   - Transacciones pueden completarse sin stock suficiente

### Problemas de Rendimiento:

1. **⚠️ Consultas N+1** en múltiples operaciones
2. **⚠️ Falta de índices** en campos críticos
3. **⚠️ Carga de todos los datos** sin paginación

### Riesgos de Seguridad:

1. **⚠️ Autenticación débil** en `authApi.login` (aunque parece no usarse)
2. **⚠️ Falta de auditoría** de cambios

### Recomendación Final:

**El sistema requiere refactorización significativa antes de ser usado en producción.** Los problemas críticos relacionados con la integridad de datos y las condiciones de carrera deben resolverse inmediatamente. Se recomienda:

1. **Fase 1 (Urgente - 1-2 semanas):**
   - Corregir discrepancia entre SQL y código
   - Implementar transacciones atómicas
   - Agregar validación de stock en backend

2. **Fase 2 (Importante - 1 mes):**
   - Optimizar consultas N+1
   - Agregar índices faltantes
   - Implementar reserva de stock
   - Mejorar manejo de errores

3. **Fase 3 (Mejoras - 2-3 meses):**
   - Implementar paginación
   - Agregar tests
   - Mejorar documentación
   - Optimizar rendimiento

---

**Fin del Documento de Auditoría Técnica**

