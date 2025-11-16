# Plan de Implementación Frontend - Nuevas Funcionalidades de Inventario

## Objetivo
Analizar las páginas existentes del frontend y determinar qué funcionalidades están disponibles, qué falta implementar, y qué nuevas páginas son necesarias para operar completamente el sistema mejorado de base de datos.

---

## Análisis de Páginas Existentes

### 1. Dashboard (`/dashboard`)
**Estado Actual:**
- ✅ Visualiza estadísticas generales (productos, almacenes, donantes, donaciones)
- ✅ Muestra gráficos de tendencias de donaciones
- ✅ Muestra stock total y lotes
- ✅ Muestra análisis de donantes

**Funcionalidades Faltantes:**
- ❌ No muestra movimientos de stock recientes
- ❌ No muestra traspasos pendientes de aprobación
- ❌ No muestra ajustes pendientes de aprobación
- ❌ No muestra estadísticas de movimientos por tipo

**Recomendación:** Actualizar para incluir widgets de nuevas funcionalidades

---

### 2. Productos (`/products`)
**Estado Actual:**
- ✅ CRUD completo de productos
- ✅ Visualización de stock por almacén
- ✅ Formulario de "Restock" (agregar stock manualmente)
- ✅ Visualización de lotes de stock
- ✅ Filtros por categoría, marca, estado de stock

**Funcionalidades Faltantes:**
- ❌ **CRÍTICO:** El formulario "Restock" actualiza `current_quantity` directamente (viola el trigger `prevent_direct_stock_update`)
- ❌ No permite registrar movimientos de salida (consumo, merma, bazar, donación a ONG)
- ❌ No muestra historial de movimientos por lote
- ❌ No usa `get_lots_for_consumption` para seleccionar lotes según FEFO/FIFO
- ❌ No permite crear ajustes de inventario
- ❌ No muestra tipos de movimiento disponibles

**Recomendación:** Refactorizar completamente para usar el nuevo sistema de movimientos

---

### 3. Almacenes (`/warehouses`)
**Estado Actual:**
- ✅ CRUD completo de almacenes
- ✅ Visualización de almacenes activos/inactivos
- ✅ Navegación a detalle de almacén

**Funcionalidades Faltantes:**
- ❌ No muestra traspasos pendientes relacionados con el almacén
- ❌ No muestra movimientos recientes del almacén
- ❌ No permite solicitar traspasos desde esta página

**Recomendación:** Agregar sección de traspasos y movimientos

---

### 4. Detalle de Almacén (`/warehouses/:id`)
**Estado Actual:**
- ✅ Visualiza productos en el almacén
- ✅ Muestra stock por producto
- ✅ Permite ver lotes de stock por producto
- ✅ Filtros por categoría y búsqueda

**Funcionalidades Faltantes:**
- ❌ No permite registrar movimientos de salida
- ❌ No permite solicitar traspasos
- ❌ No muestra historial de movimientos del almacén
- ❌ No muestra traspasos pendientes
- ❌ No permite crear ajustes de inventario

**Recomendación:** Agregar funcionalidades de movimientos y traspasos

---

### 5. Donaciones (`/donations`)
**Estado Actual:**
- ✅ Crear donaciones (usa `create_donation_atomic`)
- ✅ Visualizar historial de donaciones
- ✅ Editar items de donación
- ✅ Eliminar donaciones
- ✅ Filtros y paginación

**Estado Post-Implementación:**
- ✅ **CORRECTO:** `create_donation_atomic` ahora crea movimiento ENTRADA automáticamente
- ✅ Los campos `market_value` y `actual_value` están actualizados

**Funcionalidades Faltantes:**
- ❌ No muestra los movimientos ENTRADA generados automáticamente
- ❌ No permite ver el historial de movimientos relacionados con una donación

**Recomendación:** Agregar visualización de movimientos relacionados

---

### 6. Donantes (`/donors`)
**Estado Actual:**
- ✅ CRUD completo de donantes
- ✅ Visualización de donantes
- ✅ Navegación a detalle de donante

**Estado Post-Implementación:**
- ✅ Los campos `market_value` están actualizados

**Funcionalidades Faltantes:**
- Ninguna crítica (página funcional)

---

### 7. Detalle de Donante (`/donors/:id`)
**Estado Actual:**
- ✅ Visualiza información del donante
- ✅ Muestra análisis de donaciones
- ✅ Lista historial de donaciones
- ✅ Muestra estadísticas (total donado, frecuencia, etc.)

**Estado Post-Implementación:**
- ✅ Los campos `market_value` están actualizados

**Funcionalidades Faltantes:**
- Ninguna crítica (página funcional)

---

### 8. Análisis de Donantes (`/donor-analysis`)
**Estado Actual:**
- ✅ Visualiza análisis completo de donantes
- ✅ Gráficos de tendencias
- ✅ Rankings y métricas

**Estado Post-Implementación:**
- ✅ Los campos `market_value` están actualizados

**Funcionalidades Faltantes:**
- Ninguna crítica (página funcional)

---

### 9. Reporte de Caducidad (`/expiry-report`)
**Estado Actual:**
- ✅ Visualiza lotes próximos a caducar
- ✅ Filtros por almacén y estado
- ✅ Ordenamiento por fecha de caducidad

**Funcionalidades Faltantes:**
- ❌ No usa `get_lots_for_consumption` para mostrar orden FEFO/FIFO
- ❌ No permite registrar movimientos de salida desde el reporte

**Recomendación:** Integrar con sistema de movimientos

---

### 10. Categorías, Marcas, Usuarios, Backup
**Estado Actual:**
- ✅ CRUD completo de cada entidad
- ✅ Funcionalidades básicas operativas

**Funcionalidades Faltantes:**
- Ninguna crítica (páginas funcionales)

---

## Funcionalidades Críticas Faltantes

### 1. Sistema de Movimientos de Stock
**Estado:** ❌ NO IMPLEMENTADO EN FRONTEND

**APIs Disponibles:**
- ✅ `movementTypeApi` - Gestión de tipos de movimiento
- ✅ `stockMovementApi` - Crear y consultar movimientos
- ✅ `getLotsForConsumption` - Obtener lotes por FEFO/FIFO

**Necesita:**
- Página o sección para registrar movimientos de salida (consumo, merma, bazar, donación a ONG)
- Visualización de historial de movimientos (Kardex)
- Selector de lotes usando FEFO/FIFO
- Gestión de tipos de movimiento (solo Admin)

---

### 2. Traspasos entre Almacenes
**Estado:** ❌ NO IMPLEMENTADO EN FRONTEND

**APIs Disponibles:**
- ✅ `transferApi.request` - Solicitar traspaso
- ✅ `transferApi.approve` - Aprobar traspaso (solo Admin)
- ✅ `transferApi.reject` - Rechazar traspaso (solo Admin)
- ✅ `transferApi.getPending` - Obtener traspasos pendientes
- ✅ `transferApi.getHistory` - Historial de traspasos

**Necesita:**
- Página para solicitar traspasos
- Página para aprobar/rechazar traspasos (solo Admin)
- Visualización de traspasos pendientes en Dashboard
- Integración en páginas de almacenes

---

### 3. Ajustes de Inventario
**Estado:** ❌ NO IMPLEMENTADO EN FRONTEND

**APIs Disponibles:**
- ✅ `adjustmentApi.create` - Crear ajuste
- ✅ `adjustmentApi.approve` - Aprobar ajuste (solo Admin)
- ✅ `adjustmentApi.reject` - Rechazar ajuste (solo Admin)
- ✅ `adjustmentApi.getPending` - Obtener ajustes pendientes
- ✅ `adjustmentApi.getHistory` - Historial de ajustes

**Necesita:**
- Página o modal para crear ajustes
- Página para aprobar/rechazar ajustes (solo Admin)
- Visualización de ajustes pendientes en Dashboard
- Integración en páginas de productos/almacenes

---

### 4. Problema Crítico: Formulario "Restock"
**Estado:** ⚠️ **ROMPE EL SISTEMA**

**Problema:**
- El formulario "Restock" en `/products` actualiza `current_quantity` directamente
- Esto viola el trigger `prevent_direct_stock_update`
- Causará errores al intentar usar el formulario

**Solución Requerida:**
- Eliminar formulario "Restock" actual
- Reemplazar con registro de movimiento ENTRADA usando `stockMovementApi.create`
- O usar `create_donation_atomic` si es una donación

---

## Plan de Implementación

### Fase 1: Correcciones Críticas (PRIORIDAD ALTA)

#### 1.1 Eliminar/Refactorizar Formulario "Restock"
**Archivo:** `src/presentation/pages/products/Products.tsx`
- Eliminar componente `RestockForm`
- Eliminar función que actualiza `current_quantity` directamente
- Reemplazar con opción de crear donación o movimiento ENTRADA

**Tiempo estimado:** 2-3 horas

---

### Fase 2: Sistema de Movimientos (PRIORIDAD ALTA)

#### 2.1 Página de Movimientos de Stock
**Nueva Página:** `src/presentation/pages/movements/StockMovements.tsx`
**Ruta:** `/movements`

**Funcionalidades:**
- Lista de movimientos con filtros (tipo, almacén, fecha, lote)
- Formulario para registrar movimiento de salida:
  - Selector de lote (usando `getLotsForConsumption` para FEFO/FIFO)
  - Selector de tipo de movimiento (CONSUMO, MERMA, BAZAR, DONACION_ONG)
  - Campos: cantidad, notas, departamento solicitante, organización receptora
- Visualización de historial (Kardex) por lote
- Integración con APIs: `stockMovementApi`, `getLotsForConsumption`

**Tiempo estimado:** 6-8 horas

#### 2.2 Gestión de Tipos de Movimiento (Solo Admin)
**Nueva Página:** `src/presentation/pages/movements/MovementTypes.tsx`
**Ruta:** `/movement-types`

**Funcionalidades:**
- CRUD de tipos de movimiento
- Activar/desactivar tipos
- Integración con API: `movementTypeApi`

**Tiempo estimado:** 3-4 horas

#### 2.3 Integrar Movimientos en Páginas Existentes
**Estado:** ✅ **COMPLETADO**

**Archivos modificados:**
- `src/presentation/pages/products/Products.tsx`
  - ✅ Agregado botón "Registrar Salida" en cada lote del expanded row
  - ✅ Agregado botón "Historial" para ver movimientos por lote
  - ✅ Modal de historial de movimientos (Kardex) implementado
- `src/presentation/pages/warehouses/WarehouseDetail.tsx`
  - ✅ Agregada sección de movimientos recientes del almacén
  - ✅ Agregado botón "Registrar Salida" en modal de lotes
  - ✅ Agregado botón "Historial" en modal de lotes
- `src/presentation/features/inventory/MovementHistoryModal.tsx`
  - ✅ Nuevo componente para mostrar historial completo de movimientos por lote
- `src/presentation/features/products/StockLotsModal.tsx`
  - ✅ Actualizado para incluir botones de movimiento e historial

**Tiempo estimado:** 4-5 horas

---

### Fase 3: Traspasos entre Almacenes (PRIORIDAD MEDIA)

#### 3.1 Página de Solicitud de Traspasos
**Nueva Página:** `src/presentation/pages/transfers/RequestTransfer.tsx`
**Ruta:** `/transfers/request`

**Funcionalidades:**
- Formulario para solicitar traspaso:
  - Selector de lote origen
  - Selector de almacén destino
  - Cantidad a traspasar
  - Notas opcionales
- Validación de stock disponible
- Integración con API: `transferApi.request`

**Tiempo estimado:** 4-5 horas

#### 3.2 Página de Aprobación de Traspasos (Solo Admin)
**Nueva Página:** `src/presentation/pages/transfers/ApproveTransfers.tsx`
**Ruta:** `/transfers/approve`

**Funcionalidades:**
- Lista de traspasos pendientes
- Detalles de cada traspaso (origen, destino, cantidad, solicitante)
- Botones para aprobar/rechazar
- Campo de motivo de rechazo
- Integración con APIs: `transferApi.getPending`, `transferApi.approve`, `transferApi.reject`

**Tiempo estimado:** 5-6 horas

#### 3.3 Historial de Traspasos
**Nueva Página:** `src/presentation/pages/transfers/TransferHistory.tsx`
**Ruta:** `/transfers/history`

**Funcionalidades:**
- Lista completa de traspasos (todos los estados)
- Filtros por estado, almacén, fecha
- Detalles de cada traspaso
- Integración con API: `transferApi.getHistory`

**Tiempo estimado:** 3-4 horas

#### 3.4 Integrar Traspasos en Páginas Existentes
**Estado:** ✅ **COMPLETADO**

**Archivos modificados:**
- `src/presentation/pages/warehouses/WarehouseDetail.tsx`
  - ✅ Agregado botón "Solicitar Traspaso" en modal de lotes
  - ✅ Agregada sección de traspasos pendientes relacionados con el almacén
  - ✅ Modal de solicitud de traspaso implementado
- `src/presentation/pages/dashboard/Dashboard.tsx`
  - ✅ Agregada tarjeta de estadística "Traspasos Pendientes" (solo Admin)
  - ✅ Agregado widget de traspasos pendientes con lista de los últimos 5 (solo Admin)
  - ✅ Enlaces a página de aprobación de traspasos
- `src/presentation/features/inventory/TransferRequestForm.tsx`
  - ✅ Nuevo componente reutilizable para solicitar traspasos
- `src/presentation/features/products/StockLotsModal.tsx`
  - ✅ Actualizado para incluir botón de solicitar traspaso

**Tiempo estimado:** 3-4 horas

---

### Fase 4: Ajustes de Inventario (PRIORIDAD MEDIA)

#### 4.1 Modal/Formulario de Ajuste
**Componente:** `src/presentation/features/inventory/AdjustmentForm.tsx`

**Funcionalidades:**
- Formulario para crear ajuste:
  - Selector de lote
  - Cantidad actual (readonly)
  - Cantidad después del ajuste
  - Motivo (mínimo 10 caracteres)
- Validación de que cantidad cambió
- Integración con API: `adjustmentApi.create`

**Tiempo estimado:** 3-4 horas

#### 4.2 Página de Aprobación de Ajustes (Solo Admin)
**Nueva Página:** `src/presentation/pages/adjustments/ApproveAdjustments.tsx`
**Ruta:** `/adjustments/approve`

**Funcionalidades:**
- Lista de ajustes pendientes
- Detalles de cada ajuste (lote, cantidad antes/después, motivo, creador)
- Botones para aprobar/rechazar
- Campo de motivo de rechazo
- Integración con APIs: `adjustmentApi.getPending`, `adjustmentApi.approve`, `adjustmentApi.reject`

**Tiempo estimado:** 5-6 horas

#### 4.3 Historial de Ajustes
**Nueva Página:** `src/presentation/pages/adjustments/AdjustmentHistory.tsx`
**Ruta:** `/adjustments/history`

**Funcionalidades:**
- Lista completa de ajustes (todos los estados)
- Filtros por estado, almacén, fecha
- Detalles de cada ajuste
- Integración con API: `adjustmentApi.getHistory`

**Tiempo estimado:** 3-4 horas

#### 4.4 Integrar Ajustes en Páginas Existentes
**Archivos a modificar:**
- `src/presentation/pages/products/Products.tsx`
  - Agregar botón "Ajustar Inventario" en cada producto
  - Mostrar ajustes pendientes relacionados
- `src/presentation/pages/warehouses/WarehouseDetail.tsx`
  - Agregar opción de crear ajuste desde detalle de lote
- `src/presentation/pages/dashboard/Dashboard.tsx`
  - Widget de ajustes pendientes (solo Admin)

**Tiempo estimado:** 3-4 horas

---

### Fase 5: Mejoras y Optimizaciones (PRIORIDAD BAJA)

#### 5.1 Actualizar Dashboard
**Estado:** ✅ **COMPLETADO**

**Archivo:** `src/presentation/pages/dashboard/Dashboard.tsx`

**Mejoras implementadas:**
- ✅ Widget de movimientos recientes (últimos 10 movimientos)
- ✅ Widget de traspasos pendientes (solo Admin, últimos 5)
- ✅ Widget de ajustes pendientes (solo Admin, últimos 5)
- ✅ Tarjeta de estadística "Traspasos Pendientes" (solo Admin)
- ✅ Enlaces directos a páginas de aprobación y listado completo

**Tiempo estimado:** 4-5 horas

#### 5.2 Actualizar Reporte de Caducidad
**Estado:** ✅ **COMPLETADO**

**Archivo:** `src/presentation/pages/reports/ExpiryReport.tsx`

**Mejoras implementadas:**
- ✅ Ordenamiento FEFO/FIFO: primero por fecha de caducidad, luego por fecha de recepción
- ✅ Botón "Registrar Salida" en cada lote del reporte
- ✅ Columna de "Fecha de Recepción" agregada para visualizar orden FIFO
- ✅ Modal de registro de salida integrado con MovementForm
- ✅ Filtrado y ordenamiento mejorados

**Tiempo estimado:** 3-4 horas

#### 5.3 Mejorar Visualización de Lotes
**Estado:** ✅ **COMPLETADO**

**Archivos:**
- `src/presentation/features/products/StockLotsModal.tsx`
- `src/presentation/features/inventory/MovementHistoryModal.tsx`

**Mejoras implementadas:**
- ✅ Historial de movimientos por lote (MovementHistoryModal)
- ✅ Acciones rápidas en StockLotsModal: "Registrar Salida", "Solicitar Traspaso", "Historial", "Ajustar"
- ✅ Integración completa en Products y WarehouseDetail
- ✅ Visualización clara de fechas de caducidad y recepción

**Tiempo estimado:** 4-5 horas

---

## Nuevas Rutas Necesarias

```typescript
// Agregar a src/shared/constants/routes.constants.ts
MOVEMENTS: '/movements',
MOVEMENT_TYPES: '/movement-types',
TRANSFERS_REQUEST: '/transfers/request',
TRANSFERS_APPROVE: '/transfers/approve',
TRANSFERS_HISTORY: '/transfers/history',
ADJUSTMENTS_APPROVE: '/adjustments/approve',
ADJUSTMENTS_HISTORY: '/adjustments/history',
```

---

## Nuevos Componentes Necesarios

### Componentes de Formularios
1. `MovementForm.tsx` - Formulario para registrar movimiento
2. `TransferRequestForm.tsx` - Formulario para solicitar traspaso
3. `AdjustmentForm.tsx` - Formulario para crear ajuste
4. `LotSelector.tsx` - Selector de lotes con FEFO/FIFO

### Componentes de Lista/Tabla
1. `MovementsTable.tsx` - Tabla de movimientos con filtros
2. `TransfersTable.tsx` - Tabla de traspasos
3. `AdjustmentsTable.tsx` - Tabla de ajustes

### Componentes de Detalle
1. `MovementDetail.tsx` - Detalle de movimiento
2. `TransferDetail.tsx` - Detalle de traspaso
3. `AdjustmentDetail.tsx` - Detalle de ajuste

---

## Actualización de Navegación

### Sidebar (`src/presentation/components/layout/Sidebar.tsx`)

**Agregar nueva sección:**
```typescript
{
  title: 'Movimientos y Traspasos',
  items: [
    {
      name: 'Movimientos',
      href: ROUTES.MOVEMENTS,
      icon: ArrowPathIcon,
      roles: ROLE_PERMISSIONS.INVENTORY_ACCESS,
    },
    {
      name: 'Traspasos',
      href: ROUTES.TRANSFERS_REQUEST,
      icon: ArrowsRightLeftIcon,
      roles: ROLE_PERMISSIONS.INVENTORY_ACCESS,
    },
    {
      name: 'Ajustes',
      href: ROUTES.ADJUSTMENTS_APPROVE,
      icon: AdjustmentsHorizontalIcon,
      roles: ROLE_PERMISSIONS.ADMIN_ACCESS,
    },
    {
      name: 'Tipos de Movimiento',
      href: ROUTES.MOVEMENT_TYPES,
      icon: TagIcon,
      roles: ROLE_PERMISSIONS.ADMIN_ACCESS,
    },
  ],
}
```

---

## Resumen de Prioridades

### 🔴 CRÍTICO (Hacer primero)
1. Eliminar/Refactorizar formulario "Restock" en Products
2. Implementar página de Movimientos de Stock
3. Integrar movimientos en páginas existentes

### 🟡 IMPORTANTE (Hacer después)
4. Implementar sistema de Traspasos
5. Implementar sistema de Ajustes
6. Actualizar Dashboard con nuevas funcionalidades

### 🟢 MEJORAS (Hacer al final)
7. Mejorar Reporte de Caducidad
8. Mejorar visualización de lotes
9. Optimizaciones y refinamientos

---

## Estimación Total de Tiempo

- **Fase 1 (Críticas):** 2-3 horas
- **Fase 2 (Movimientos):** 13-17 horas
- **Fase 3 (Traspasos):** 15-19 horas
- **Fase 4 (Ajustes):** 14-18 horas
- **Fase 5 (Mejoras):** 11-14 horas

**Total estimado:** 55-71 horas de desarrollo

---

## Notas Importantes

1. **Compatibilidad:** Todas las nuevas funcionalidades deben mantener compatibilidad con el código existente
2. **Permisos:** Respetar roles (Admin, Operador, Consultor) en todas las nuevas páginas
3. **Validaciones:** Implementar validaciones del lado del cliente antes de llamar a las APIs
4. **Manejo de Errores:** Mostrar mensajes claros cuando las operaciones fallan
5. **UX:** Mantener consistencia con el diseño existente
6. **Testing:** Probar todas las funcionalidades con diferentes roles de usuario

---

## Checklist de Implementación

### Fase 1: Correcciones Críticas
- [x] Eliminar formulario "Restock" actual
- [x] Reemplazar con registro de movimiento ENTRADA (usando donaciones que crean movimientos automáticamente)
- [x] Probar que no se puede actualizar `current_quantity` directamente (trigger implementado en BD)

### Fase 2: Movimientos
- [x] Crear página de Movimientos
- [x] Crear componente MovementForm
- [x] Crear componente LotSelector con FEFO/FIFO
- [x] Integrar en Products y WarehouseDetail (agregar botones "Registrar Salida" y mostrar historial)
- [x] Crear página de Tipos de Movimiento (Admin)
- [x] Agregar rutas y navegación

### Fase 3: Traspasos
- [x] Crear página de Solicitud de Traspasos
- [x] Crear página de Aprobación de Traspasos (Admin)
- [x] Crear página de Historial de Traspasos
- [x] Integrar en WarehouseDetail (agregar botón "Solicitar Traspaso" y mostrar traspasos pendientes)
- [x] Integrar en Dashboard (agregar widget de traspasos pendientes para Admin)
- [x] Agregar rutas y navegación

### Fase 4: Ajustes
- [x] Crear componente AdjustmentForm
- [x] Crear página de Aprobación de Ajustes (Admin)
- [x] Crear página de Historial de Ajustes
- [x] Integrar en Products y WarehouseDetail (botones "Ajustar" agregados)
- [x] Agregar rutas y navegación

### Fase 5: Mejoras
- [x] Actualizar Dashboard con widgets (movimientos recientes, traspasos pendientes, ajustes pendientes)
- [x] Mejorar Reporte de Caducidad (usar FEFO/FIFO, agregar botón para registrar salida)
- [x] Mejorar visualización de lotes (mostrar historial de movimientos, acciones rápidas)
- [ ] Optimizaciones finales

---

## Conclusión

El frontend actual **NO tiene las funcionalidades necesarias** para operar completamente el sistema mejorado. Se requieren:

- **3 nuevas páginas principales:** Movimientos, Traspasos, Ajustes
- **1 página de administración:** Tipos de Movimiento
- **Múltiples integraciones** en páginas existentes
- **Corrección crítica** del formulario "Restock"

La implementación completa estimada es de **55-71 horas** de desarrollo, priorizando primero las correcciones críticas y luego las nuevas funcionalidades.

