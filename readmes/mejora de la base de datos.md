Plan de Mejora del Sistema de Base de Datos
Objetivo
Implementar las funcionalidades críticas identificadas en la auditoría: sistema de movimientos de stock (Kardex) con tipos personalizables, traspasos entre almacenes con aprobación obligatoria, ajustes de inventario con aprobación obligatoria, y clarificación de política de rotación FEFO/FIFO.

Fase 0: Análisis de Base de Datos Existente
Objetivo: Analizar y documentar el estado actual del esquema antes de realizar cambios.

0.1 Análisis del esquema actual
Archivos a revisar:
init/database-schema-synced-with-code.sql - Estructura completa de tablas, triggers, índices
init/grant_permissions.sql - Permisos otorgados a roles
init/rls_policies.sql - Políticas de Row Level Security
init/functions/validate_stock_available.sql - Función de validación de stock
init/functions/create_donation_atomic.sql - Función de creación de donaciones
0.2 Identificar dependencias y referencias
Verificar todas las referencias a transaction_types en el código
Verificar todas las referencias a total_market_value y total_actual_value en:
Funciones PostgreSQL (create_donation_atomic.sql)
Código TypeScript (donation.types.ts, donation.api.ts, donor.types.ts, donor.api.ts, system.api.ts)
Componentes React (Donations.tsx, Donors.tsx, DonorDetail.tsx, DonorAnalysis.tsx, Dashboard.tsx, Backup.tsx)
Documentación (DATABASE_README.md)
Seed data (seed_data.sql)
Políticas RLS (rls_policies.sql)
0.3 Documentar impacto de cambios
Listar todas las funciones que usan total_market_value y total_actual_value
Listar todas las queries que referencian transaction_types
Identificar código TypeScript que necesitará actualización
Crear checklist de archivos a modificar
Fase 1: Sistema de Movimientos de Stock (Kardex) con Tipos Personalizables
Objetivo: Crear tabla central de movimientos con catálogo extensible de tipos.

1.1 Crear tabla movement_types (catálogo extensible)
Archivo: init/database-schema-synced-with-code.sql
Tabla maestra: type_id, type_code (UNIQUE), type_name, category (ENTRADA, SALIDA, TRASPASO, AJUSTE), is_active, description
Permite agregar tipos personalizados sin modificar esquema
1.2 Crear tabla stock_movements
Archivo: init/database-schema-synced-with-code.sql
Tabla con campos: movement_id, lot_id, movement_type_id (FK a movement_types), quantity, notes, requesting_department, recipient_organization, reference_id, created_by, created_at
Índices: idx_stock_movements_lot, idx_stock_movements_type, idx_stock_movements_created_at
1.3 Seed data inicial para tipos de movimiento
Archivo: init/seed_data.sql
INSERT de tipos base: ENTRADA, CONSUMO, MERMA, BAZAR, DONACION_ONG, TRASPASO_SALIDA, TRASPASO_ENTRADA, AJUSTE
1.4 Función register_stock_movement
Archivo: init/functions/register_stock_movement.sql (nuevo)
Registra movimiento y actualiza stock_lots.current_quantity de forma atómica
Validaciones: existencia de lote, cantidad disponible, permisos de usuario
Retorna JSON con resultado del movimiento
1.5 Trigger para prevenir actualizaciones directas
Archivo: init/database-schema-synced-with-code.sql
Trigger prevent_direct_stock_update en stock_lots que previene UPDATE directo de current_quantity (solo permite cambios vía register_stock_movement)
Fase 2: Traspasos entre Almacenes con Aprobación Obligatoria
Objetivo: Implementar traspasos con flujo de aprobación obligatorio por administrador.

2.1 Crear tabla stock_transfers
Archivo: init/database-schema-synced-with-code.sql
Tabla para solicitudes: transfer_id, lot_id, from_warehouse_id, to_warehouse_id, quantity, status (PENDING, APPROVED, REJECTED, COMPLETED), requested_by, approved_by, rejection_reason, notes, created_at, updated_at
Constraint: status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')
2.2 Función request_stock_transfer
Archivo: init/functions/request_stock_transfer.sql (nuevo)
Crea solicitud de traspaso con status = 'PENDING'
Validaciones: permisos de acceso a almacén origen, stock disponible
Retorna transfer_id para seguimiento
2.3 Función approve_stock_transfer (solo Admin)
Archivo: init/functions/approve_stock_transfer.sql (nuevo)
Solo ejecutable por administrador (verifica is_admin())
Cambia status a 'APPROVED' y registra approved_by
Ejecuta traspaso atómico: crea movimiento TRASPASO_SALIDA, decrementa stock, crea movimiento TRASPASO_ENTRADA, crea nuevo lote en destino
Mantiene expiry_date y trazabilidad del lote original
Cambia status a 'COMPLETED' al finalizar
2.4 Función reject_stock_transfer (solo Admin)
Archivo: init/functions/reject_stock_transfer.sql (nuevo)
Solo ejecutable por administrador
Cambia status a 'REJECTED' con motivo opcional
Fase 3: Ajustes de Inventario con Aprobación Obligatoria
Objetivo: Sistema formal para ajustes que SIEMPRE requieren aprobación de administrador.

3.1 Crear tabla inventory_adjustments
Archivo: init/database-schema-synced-with-code.sql
Tabla con campos: adjustment_id, lot_id, quantity_before, quantity_after, reason (CHECK: LENGTH > 10), status (PENDING, APPROVED, REJECTED), approved_by (NULLABLE), rejected_by, rejection_reason, created_by, created_at, updated_at
Constraints: quantity_before != quantity_after, status IN ('PENDING', 'APPROVED', 'REJECTED')
3.2 Función create_inventory_adjustment
Archivo: init/functions/create_inventory_adjustment.sql (nuevo)
Crea registro con status = 'PENDING'
approved_by siempre NULL inicialmente (aprobación obligatoria)
NO actualiza stock_lots.current_quantity hasta aprobación
3.3 Función approve_inventory_adjustment (solo Admin)
Archivo: init/functions/approve_inventory_adjustment.sql (nuevo)
Solo ejecutable por administrador
Valida que status = 'PENDING'
Actualiza status = 'APPROVED' y registra approved_by
Actualiza stock_lots.current_quantity y crea movimiento AJUSTE en stock_movements
Operación atómica (ROLLBACK si falla)
3.4 Función reject_inventory_adjustment (solo Admin)
Archivo: init/functions/reject_inventory_adjustment.sql (nuevo)
Solo ejecutable por administrador
Cambia status a 'REJECTED' con motivo de rechazo
NO modifica stock
Fase 4: Clarificación Política FEFO/FIFO
Objetivo: Documentar y estandarizar política de rotación de inventario.

4.1 Función get_lots_for_consumption
Archivo: init/functions/get_lots_for_consumption.sql (nuevo)
Retorna lotes ordenados por política FEFO/FIFO:
Primero: expiry_date ASC NULLS LAST (FEFO - productos que vencen antes)
Segundo: received_date ASC (FIFO - desempate o productos sin caducidad)
Filtros: is_expired = FALSE, current_quantity > 0
4.2 Actualizar documentación
Archivo: init/DATABASE_README.md
Sección nueva: "Política de Rotación de Inventario (FEFO/FIFO)"
Documentar que FEFO es primario para productos con expiry_date, FIFO como secundario
4.3 Actualizar comentarios en código
Archivo: init/functions/create_donation_atomic.sql
Actualizar comentario sobre received_date para mencionar que se usa para FIFO como criterio secundario
Fase 5: Actualizar RLS y Permisos
Objetivo: Extender políticas de seguridad para nuevas tablas y funciones.

5.1 Políticas RLS para movement_types
Archivo: init/rls_policies.sql
SELECT: Todos los usuarios autenticados pueden leer tipos activos
INSERT/UPDATE/DELETE: Solo Admin (gestión de catálogo)
5.2 Políticas RLS para stock_movements
Archivo: init/rls_policies.sql
SELECT: Admin ve todos, Operador/Consultor solo movimientos de sus almacenes asignados
INSERT: Admin y Operador pueden crear movimientos en sus almacenes
UPDATE/DELETE: Solo Admin
5.3 Políticas RLS para stock_transfers
Archivo: init/rls_policies.sql
SELECT: Admin ve todos, Operador solo sus solicitudes de traspaso
INSERT: Operador puede crear solicitudes (PENDING), Admin puede crear con cualquier status
UPDATE: Solo Admin (para aprobar/rechazar traspasos)
DELETE: Solo Admin
5.4 Políticas RLS para inventory_adjustments
Archivo: init/rls_policies.sql
SELECT: Admin ve todos, Operador solo ajustes de sus almacenes asignados
INSERT: Admin y Operador pueden crear ajustes (siempre con status PENDING)
UPDATE: Solo Admin (para aprobar/rechazar ajustes)
DELETE: Solo Admin
5.5 Actualizar permisos de funciones
Archivo: init/grant_permissions.sql
GRANT EXECUTE para: register_stock_movement, request_stock_transfer, approve_stock_transfer, reject_stock_transfer, create_inventory_adjustment, approve_inventory_adjustment, reject_inventory_adjustment, get_lots_for_consumption
Fase 6: Limpieza y Refactorización del Esquema
Objetivo: Eliminar tablas no utilizadas y renombrar campos para consistencia.

6.1 Eliminar tabla transaction_types
Archivo: init/database-schema-synced-with-code.sql
Eliminar tabla public.transaction_types (módulo de cocina removido, tabla no se usa)
Verificar que no hay referencias en otras tablas antes de eliminar
Eliminar seed data relacionado en seed_data.sql si existe
Eliminar políticas RLS relacionadas en rls_policies.sql si existen
6.2 Renombrar campos en donation_transactions
Archivo: init/database-schema-synced-with-code.sql
Cambiar total_market_value → market_value
Cambiar total_actual_value → actual_value
Actualizar constraints y comentarios relacionados
6.3 Actualizar función create_donation_atomic
Archivo: init/functions/create_donation_atomic.sql
Actualizar variables internas: v_total_market_value → v_market_value, v_total_actual_value → v_actual_value
Actualizar INSERT: total_market_value → market_value, total_actual_value → actual_value
Actualizar UPDATE: total_market_value → market_value, total_actual_value → actual_value
Actualizar JSON de retorno: total_market_value → market_value, total_actual_value → actual_value
Después de crear lote en stock_lots, crear movimiento ENTRADA en stock_movements usando tipo de catálogo
Mantener compatibilidad con código existente
6.4 Actualizar políticas RLS si referencian campos renombrados
Archivo: init/rls_policies.sql
Verificar si hay políticas que usen los campos renombrados (probablemente no, pero verificar)
6.5 Actualizar código TypeScript
Archivos: src/domain/types/donation.types.ts, src/data/api/donation.api.ts, src/domain/types/donor.types.ts, src/data/api/donor.api.ts, src/data/api/system.api.ts
Actualizar tipos y APIs que usen total_market_value y total_actual_value
Cambiar a market_value y actual_value
6.6 Actualizar componentes React
Archivos: src/presentation/pages/donations/Donations.tsx, src/presentation/pages/donors/Donors.tsx, src/presentation/pages/donors/DonorDetail.tsx, src/presentation/pages/donors/DonorAnalysis.tsx, src/presentation/pages/dashboard/Dashboard.tsx, src/presentation/pages/backup/Backup.tsx
Actualizar referencias a total_market_value y total_actual_value por market_value y actual_value
6.7 Actualizar seed data y documentación
Archivo: init/seed_data.sql - Verificar si hay referencias a campos renombrados
Archivo: init/DATABASE_README.md - Actualizar documentación con nuevos nombres de campos
6.8 Actualizar validate_stock_available
Archivo: init/functions/validate_stock_available.sql
Mantener funcionalidad actual (ya usa índice parcial optimizado)
Agregar comentario sobre uso con get_lots_for_consumption
Fase 7: Actualizar Código TypeScript y APIs
Objetivo: Integrar nuevas funcionalidades en la capa de aplicación.

7.1 Tipos TypeScript
Archivo: src/domain/types/warehouse.types.ts
Agregar tipos: MovementType, StockMovement, NewStockMovement, InventoryAdjustment, NewInventoryAdjustment, StockTransfer, NewStockTransfer, TransferStatus, AdjustmentStatus
Archivo: src/domain/types/index.ts - Exportar nuevos tipos
7.2 API de Tipos de Movimiento
Archivo: src/data/api/movement-type.api.ts (nuevo)
Funciones: getMovementTypes, getMovementTypesByCategory, createMovementType (solo Admin)
7.3 API de Movimientos
Archivo: src/data/api/stock-movement.api.ts (nuevo)
Funciones: createStockMovement, getStockMovements, getMovementsByLot, getMovementsByType
7.4 API de Traspasos
Archivo: src/data/api/transfer.api.ts (nuevo)
Funciones: requestStockTransfer, approveStockTransfer (solo Admin), rejectStockTransfer (solo Admin), getPendingTransfers, getTransferHistory
7.5 API de Ajustes
Archivo: src/data/api/adjustment.api.ts (nuevo)
Funciones: createInventoryAdjustment, approveInventoryAdjustment (solo Admin), rejectInventoryAdjustment (solo Admin), getPendingAdjustments, getAdjustmentHistory
7.6 Actualizar API de Productos
Archivo: src/data/api/product.api.ts
Función: getLotsForConsumption (usa función PostgreSQL get_lots_for_consumption)
Orden de Ejecución
Fase 0 (Análisis) - Revisar y documentar estado actual antes de cambios
Fase 6 (Limpieza y Refactorización) - Eliminar transaction_types y renombrar campos (debe hacerse primero para evitar conflictos)
Fase 1 (Movimientos con tipos personalizables) - Base del sistema
Fase 4 (FEFO/FIFO) - Documentación y función de consulta
Fase 2 (Traspasos con aprobación) - Depende de Fase 1
Fase 3 (Ajustes con aprobación obligatoria) - Depende de Fase 1
Fase 5 (RLS) - Seguridad para todas las nuevas tablas
Fase 7 (TypeScript) - Capa de aplicación
Notas Importantes
Todas las fases son incrementales y no rompen funcionalidad existente
Las funciones usan transacciones atómicas (ROLLBACK automático en error)
Se mantiene compatibilidad con código existente que usa create_donation_atomic
Los triggers previenen actualizaciones directas de current_quantity para garantizar auditoría
Todas las nuevas funciones tienen permisos otorgados a roles apropiados
Traspasos y ajustes SIEMPRE requieren aprobación de administrador (no hay auto-aprobación)
El catálogo de movement_types permite agregar tipos personalizados sin modificar esquema
Los traspasos tienen flujo de aprobación: PENDING → APPROVED → COMPLETED (o REJECTED)
Los ajustes tienen flujo de aprobación: PENDING → APPROVED (o REJECTED)
IMPORTANTE: La Fase 6 debe ejecutarse ANTES de la Fase 1 para evitar conflictos con referencias a campos renombrados