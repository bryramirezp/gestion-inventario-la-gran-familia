# Row Level Security (RLS) - Permisos por Rol

Este documento describe los permisos detallados de cada rol en el sistema de gestión de inventario "La Gran Familia".

## Roles del Sistema

El sistema tiene 3 roles principales:
1. **Administrador** - Acceso completo al sistema
2. **Operador** - Gestión de inventario y donaciones
3. **Consultor** - Acceso de solo lectura y creación de solicitudes de cocina

---

## Permisos por Rol

### 🔴 ADMINISTRADOR

**Descripción:** Acceso completo a todas las funcionalidades del sistema.

#### Permisos de Lectura (SELECT)
- ✅ **Todas las tablas** sin restricciones
- ✅ Puede ver todos los usuarios, productos, donaciones, almacenes, etc.
- ✅ Acceso completo a reportes y análisis

#### Permisos de Escritura (INSERT/UPDATE/DELETE)

##### Tablas de Administración
- ✅ **users**: CRUD completo (crear, leer, actualizar, eliminar usuarios)
- ✅ **roles**: Solo lectura (gestión manual o por seed)
- ✅ **user_warehouse_access**: CRUD completo (asignar almacenes a usuarios)
- ✅ **categories**: CRUD completo
- ✅ **brands**: CRUD completo

##### Tablas de Inventario
- ✅ **products**: CRUD completo
- ✅ **warehouses**: CRUD completo
- ✅ **stock_lots**: CRUD completo (todos los almacenes)
- ✅ **units**: Solo lectura (gestión manual o por seed)
- ✅ **donor_types**: Solo lectura (gestión manual o por seed)

##### Tablas de Donaciones
- ✅ **donors**: CRUD completo
- ✅ **donation_transactions**: CRUD completo
- ✅ **donation_items**: CRUD completo

##### Tablas de Cocina
- ✅ **transactions**: CRUD completo (crear, aprobar, completar, rechazar, ver todas)
- ✅ **transaction_details**: CRUD completo

#### Funcionalidades Especiales
- ✅ Gestión de usuarios y permisos
- ✅ Configuración de categorías y marcas
- ✅ Respaldo y restauración de datos
- ✅ Acceso a todas las rutas del sistema

---

### 🟡 OPERADOR

**Descripción:** Gestión de inventario, donaciones y solicitudes de cocina. No puede gestionar usuarios ni configuraciones.

#### Permisos de Lectura (SELECT)
- ✅ **Todas las tablas** (puede ver todo el sistema)
- ✅ Puede ver usuarios, productos, donaciones, almacenes, etc.
- ✅ Acceso a reportes y análisis

#### Permisos de Escritura (INSERT/UPDATE/DELETE)

##### Tablas de Administración
- ❌ **users**: Solo lectura (NO puede crear, modificar ni eliminar)
- ❌ **roles**: Solo lectura
- ❌ **user_warehouse_access**: Solo lectura
- ❌ **categories**: Solo lectura (NO puede crear, modificar ni eliminar)
- ❌ **brands**: Solo lectura (NO puede crear, modificar ni eliminar)

##### Tablas de Inventario
- ✅ **products**: CRUD completo
- ✅ **warehouses**: CRUD completo (gestión de almacenes)
- ✅ **stock_lots**: CRUD completo **SOLO en sus almacenes asignados**
  - Solo puede modificar stock en almacenes donde tiene acceso
  - Filtrado automático por `user_warehouse_access`
- ✅ **units**: Solo lectura
- ✅ **donor_types**: Solo lectura

##### Tablas de Donaciones
- ✅ **donors**: CRUD completo
- ✅ **donation_transactions**: CRUD completo (crear donaciones)
- ✅ **donation_items**: CRUD completo (vía función `create_donation_atomic`)

##### Tablas de Cocina
- ✅ **transactions**: 
  - Crear solicitudes (INSERT)
  - Aprobar solicitudes (UPDATE status = 'Approved')
  - Completar solicitudes (UPDATE status = 'Completed')
  - Rechazar solicitudes (UPDATE status = 'Rejected')
  - Ver todas las solicitudes
- ✅ **transaction_details**: CRUD completo (vía transacciones)

#### Funcionalidades Especiales
- ✅ Gestión completa de inventario
- ✅ Crear y gestionar donaciones
- ✅ Gestionar solicitudes de cocina (aprobar, completar, rechazar)
- ✅ Acceso a reportes de inventario y donaciones
- ❌ NO puede gestionar usuarios
- ❌ NO puede modificar categorías ni marcas

#### Restricciones Importantes
- 🔒 **Stock Lots**: Solo puede modificar stock en almacenes donde tiene acceso (`user_warehouse_access`)
- 🔒 **Transactions**: Puede gestionar todas las solicitudes (no solo las propias)

---

### 🟢 CONSULTOR

**Descripción:** Acceso de solo lectura para consulta. Puede crear solicitudes de cocina pero no aprobarlas.

#### Permisos de Lectura (SELECT)
- ✅ **Todas las tablas** (solo lectura para visualización)
- ✅ Puede ver productos, donaciones, almacenes, etc.
- ✅ Acceso a dashboard y reportes (solo visualización)
- ✅ Puede ver todas las solicitudes de cocina

#### Permisos de Escritura (INSERT/UPDATE/DELETE)

##### Tablas de Administración
- ❌ **users**: Solo lectura
- ❌ **roles**: Solo lectura
- ❌ **user_warehouse_access**: Solo lectura
- ❌ **categories**: Solo lectura
- ❌ **brands**: Solo lectura

##### Tablas de Inventario
- ❌ **products**: Solo lectura (NO puede crear, modificar ni eliminar)
- ❌ **warehouses**: Solo lectura
- ❌ **stock_lots**: Solo lectura (NO puede modificar stock)
- ❌ **units**: Solo lectura
- ❌ **donor_types**: Solo lectura

##### Tablas de Donaciones
- ❌ **donors**: Solo lectura
- ❌ **donation_transactions**: Solo lectura
- ❌ **donation_items**: Solo lectura

##### Tablas de Cocina
- ✅ **transactions**: 
  - **CREAR solicitudes** (INSERT con status = 'Pending')
  - ❌ **NO puede aprobar** (NO puede UPDATE status = 'Approved')
  - ❌ **NO puede completar** (NO puede UPDATE status = 'Completed')
  - ❌ **NO puede rechazar** (NO puede UPDATE status = 'Rejected')
  - ❌ **NO puede modificar** solicitudes existentes
  - ✅ Puede ver sus propias solicitudes y todas las demás (solo lectura)
- ✅ **transaction_details**: 
  - INSERT (solo cuando crea una transacción nueva)
  - ❌ NO puede modificar ni eliminar detalles

#### Funcionalidades Especiales
- ✅ Ver dashboard y reportes (solo visualización)
- ✅ Crear solicitudes de ingredientes para cocina
- ✅ Ver historial de solicitudes
- ❌ NO puede gestionar inventario
- ❌ NO puede crear donaciones
- ❌ NO puede aprobar/completar/rechazar solicitudes

#### Restricciones Importantes
- 🔒 **Solo Lectura**: No puede modificar ningún dato excepto crear solicitudes de cocina
- 🔒 **Solicitudes**: Solo puede crear nuevas solicitudes (status='Pending'), no puede modificarlas
- 🔒 **Stock**: Solo puede consultar stock, no puede modificarlo

---

## Matriz de Permisos por Tabla

| Tabla | Administrador | Operador | Consultor |
|-------|--------------|----------|-----------|
| **users** | CRUD | R | R |
| **roles** | R | R | R |
| **user_warehouse_access** | CRUD | R | R |
| **categories** | CRUD | R | R |
| **brands** | CRUD | R | R |
| **units** | R | R | R |
| **donor_types** | R | R | R |
| **warehouses** | CRUD | CRUD | R |
| **products** | CRUD | CRUD | R |
| **stock_lots** | CRUD (todos) | CRUD (solo sus almacenes) | R |
| **donors** | CRUD | CRUD | R |
| **donation_transactions** | CRUD | CRUD | R |
| **donation_items** | CRUD | CRUD | R |
| **transactions** | CRUD | CRUD* | C, R** |
| **transaction_details** | CRUD | CRUD | C, R** |

**Leyenda:**
- **C** = Create (INSERT)
- **R** = Read (SELECT)
- **U** = Update
- **D** = Delete
- **CRUD** = Create, Read, Update, Delete
- **CRUD*** = Operador puede crear, aprobar, completar y rechazar transacciones
- **C, R**** = Consultor solo puede crear nuevas transacciones (status='Pending') y leer

---

## Políticas Especiales

### 1. Stock Lots por Almacén
- **Operador**: Solo puede modificar `stock_lots` donde `warehouse_id IN (SELECT warehouse_id FROM user_warehouse_access WHERE user_id = auth.uid())`
- **Administrador**: Puede modificar todos los `stock_lots` sin restricciones
- **Consultor**: Solo lectura de todos los `stock_lots`

### 2. Transacciones de Cocina
- **Consultor**: 
  - Puede INSERT nuevas transacciones con `status = 'Pending'`
  - NO puede UPDATE transacciones (no puede cambiar el status)
  - Puede SELECT todas las transacciones (lectura)
- **Operador/Administrador**: 
  - Pueden INSERT, UPDATE (cambiar status a 'Approved', 'Completed', 'Rejected')
  - Pueden SELECT todas las transacciones

### 3. Funciones PostgreSQL
- Las funciones `create_donation_atomic` y `complete_kitchen_transaction` ejecutan con permisos del usuario autenticado
- El trigger `create_profile_for_new_user` necesita `SECURITY DEFINER` para insertar en `public.users` desde `auth.users`

### 4. Perfil de Usuario
- Todos los usuarios pueden leer su propio perfil
- Todos los usuarios pueden actualizar su propio `full_name`
- Solo Administrador puede actualizar `role_id` y `is_active` de otros usuarios

---

## Implementación Técnica

### Función Helper para Verificar Roles
```sql
CREATE OR REPLACE FUNCTION get_user_role_name()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT r.role_name 
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.role_id
    WHERE u.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Políticas RLS
- Todas las tablas tienen RLS habilitado
- Las políticas verifican el rol del usuario usando `get_user_role_name()`
- Las políticas de `stock_lots` verifican `user_warehouse_access`
- Las políticas de `transactions` verifican el status y el rol

---

## Notas de Seguridad

1. **Principio de Menor Privilegio**: Cada rol tiene solo los permisos necesarios para su función
2. **Validación en Backend**: Las políticas RLS son una capa adicional de seguridad, pero la validación principal debe estar en el backend
3. **Funciones PostgreSQL**: Las funciones críticas deben validar permisos antes de ejecutar
4. **Auditoría**: Todas las operaciones quedan registradas en `created_at` y `updated_at`

---

## Flujo de Permisos

### Crear Donación
1. **Operador/Administrador** llama a `create_donation_atomic()`
2. La función valida que el usuario tenga permisos (rol correcto)
3. Crea `donation_transaction` y `donation_items`
4. Crea `stock_lots` en el almacén especificado
5. Operador solo puede crear en sus almacenes asignados

### Crear Solicitud de Cocina
1. **Cualquier usuario** puede crear una transacción con `status = 'Pending'`
2. **Consultor** solo puede crear, no puede modificar
3. **Operador/Administrador** pueden aprobar, completar o rechazar
4. Al completar, se ejecuta `complete_kitchen_transaction()` que deduce stock

### Gestionar Stock
1. **Operador** solo puede modificar stock en sus almacenes asignados
2. **Administrador** puede modificar stock en cualquier almacén
3. **Consultor** solo puede ver stock, no modificarlo

---

## Resumen Ejecutivo

| Rol | Crear/Modificar Inventario | Gestionar Donaciones | Gestionar Solicitudes | Gestionar Usuarios | Configuración |
|-----|---------------------------|---------------------|----------------------|-------------------|---------------|
| **Administrador** | ✅ Completo | ✅ Completo | ✅ Completo | ✅ Completo | ✅ Completo |
| **Operador** | ✅ En sus almacenes | ✅ Completo | ✅ Completo | ❌ Solo lectura | ❌ Solo lectura |
| **Consultor** | ❌ Solo lectura | ❌ Solo lectura | ⚠️ Solo crear | ❌ Solo lectura | ❌ Solo lectura |

---

**Última actualización:** Diciembre 2024  
**Versión:** 2.0

