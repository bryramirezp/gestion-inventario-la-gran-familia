# Scripts de Base de Datos - Sistema de Gestión de Inventario

Este directorio contiene todos los scripts necesarios para configurar la base de datos del sistema.

**📋 ¿Qué archivos necesitas?** Ver `ESSENTIAL_FILES.md` para una lista rápida de archivos esenciales.

## 📋 Orden de Ejecución

### Para una base de datos nueva:

1. **Esquema principal** → `database-schema-synced-with-code.sql`
   - Crea todas las tablas, funciones auxiliares, triggers e índices
   - Ejecutar primero

2. **Permisos** → `grant_permissions.sql`
   - Otorga permisos necesarios a los roles `anon` y `authenticated` en el esquema `public`
   - **⚠️ CRÍTICO**: Debe ejecutarse después del esquema para que las tablas existan
   - **⚠️ CRÍTICO**: Sin estos permisos, las políticas RLS no funcionarán (error 403)
   - Ejecutar después del esquema

3. **Datos básicos** → `seed_data.sql`
   - Inserta roles, almacenes, categorías, unidades, tipos de donantes, marcas
   - Ejecutar después de los permisos

4. **Políticas de seguridad** → `rls_policies.sql`
   - Configura Row Level Security (RLS) para todos los roles
   - Define permisos completos para Administrador, Operador y Consultor
   - **⚠️ CRÍTICO**: Debe ejecutarse después de seed_data para que existan los roles
   - **⚠️ CRÍTICO**: Este script elimina y recrea todas las políticas (idempotente)
   - Ejecutar después de los datos básicos

5. **Funciones de negocio** → `functions/*.sql` (en este orden):
   - `validate_stock_available.sql` - Validación de stock
   - `complete_kitchen_transaction.sql` - Completar transacciones atómicamente
   - `create_donation_atomic.sql` - Crear donaciones atómicamente (✅ CORREGIDO: FIFO usa fecha de donación)
   - Ejecutar después de las políticas RLS

### Para una base de datos existente:

1. **Migración** → `migrations/001_sync_schema_with_code.sql`
   - ⚠️ **Hacer backup primero** - Esta migración puede ser destructiva
   - Sincroniza el esquema existente con el código TypeScript

2. **Políticas de seguridad** → `rls_policies.sql`
   - ⚠️ **IMPORTANTE**: Verificar que los roles existan antes de ejecutar
   - Si no existen, ejecutar `seed_data.sql` primero para crear los roles
   - Configura RLS para todos los roles del sistema

3. **Funciones de negocio** → `functions/*.sql`
   - Ejecutar las 3 funciones como en el caso de base de datos nueva
   - ✅ `create_donation_atomic.sql` ha sido corregido para usar fecha de donación en FIFO

## 📁 Estructura de Archivos

```
init/
├── database-schema-synced-with-code.sql  # ⭐ Esquema completo (ESENCIAL)
├── grant_permissions.sql                  # ⭐ Permisos (ESENCIAL - nuevo)
├── seed_data.sql                          # ⭐ Datos básicos (ESENCIAL)
├── rls_policies.sql                       # ⭐ Políticas RLS (ESENCIAL)
├── functions/
│   ├── validate_stock_available.sql      # ⭐ Validar stock (ESENCIAL)
│   ├── complete_kitchen_transaction.sql  # ⭐ Completar transacciones (ESENCIAL)
│   └── create_donation_atomic.sql        # ⭐ Crear donaciones (ESENCIAL)
├── migrations/
│   └── 001_sync_schema_with_code.sql     # ⚠️ Migración (solo si DB existente)
├── rls_policies_optimized.sql            # ⚡ Optimización opcional (JWT)
├── ESSENTIAL_FILES.md                     # 📋 Lista de archivos esenciales
├── README.md                              # 📖 Este archivo
├── RLS_PERMISSIONS.md                     # 📚 Documentación de permisos
├── JWT_CUSTOM_CLAIMS.md                   # 📚 Guía JWT (opcional)
└── AUTH_USERS_EXPLANATION.md              # 📚 Explicación auth.users
```

## 🔧 Funciones PostgreSQL

### `validate_stock_available`
Valida si hay suficiente stock disponible para un producto en un almacén.

**Uso en código:**
```typescript
await supabase.rpc('validate_stock_available', {
  p_product_id: number,
  p_warehouse_id: number,
  p_required_quantity: number
});
```

### `complete_kitchen_transaction`
Completa una transacción de cocina con validación atómica de stock y deducción FIFO.

**Uso en código:**
```typescript
await supabase.rpc('complete_kitchen_transaction', {
  p_transaction_id: number,
  p_approver_id: string
});
```

### `create_donation_atomic`
Crea una donación con múltiples items de forma atómica.

**Uso en código:**
```typescript
await supabase.rpc('create_donation_atomic', {
  p_donor_id: number,
  p_warehouse_id: number,
  p_items: Array<{...}>,
  p_donation_date?: string // opcional
});
```

## 🔐 Seguridad y Permisos

### Documentación de Permisos
Ver `RLS_PERMISSIONS.md` para una descripción detallada de los permisos de cada rol:
- **Administrador**: Acceso completo
- **Operador**: Gestión de inventario (limitado a sus almacenes)
- **Consultor**: Solo lectura + creación de solicitudes de cocina

### Políticas RLS
El archivo `rls_policies.sql` configura:
- Row Level Security (RLS) en todas las tablas
- Funciones helper para verificar roles
- Políticas de SELECT, INSERT, UPDATE, DELETE según el rol
- Restricciones especiales para Operadores (almacenes) y Consultores (solo lectura)

### Optimización de RLS (Opcional)
El archivo `rls_policies_optimized.sql` contiene funciones optimizadas que usan JWT custom claims:
- **Performance:** 10-100x más rápido (sin JOINs en cada evaluación)
- **Compatibilidad:** Funciones `_hybrid()` funcionan con o sin JWT
- **Recomendado:** Para aplicaciones en producción con alto tráfico
- Ver `JWT_CUSTOM_CLAIMS.md` para implementación completa

## ⚠️ Advertencias

1. **Backup obligatorio**: Siempre hacer backup antes de ejecutar migraciones en producción
2. **Orden de ejecución**: Respetar el orden indicado arriba
3. **Permisos críticos**: `grant_permissions.sql` DEBE ejecutarse después del esquema. Sin estos permisos, obtendrás error 403 (permission denied)
4. **RLS crítico**: `rls_policies.sql` DEBE ejecutarse después de `seed_data.sql` para que existan los roles
5. **Permisos de funciones**: Algunas funciones requieren permisos de administrador (especialmente el trigger en `auth.users`)
6. **Idempotencia**: Todos los scripts son idempotentes (pueden ejecutarse múltiples veces)
7. **Políticas RLS**: Una vez aplicadas, los usuarios solo podrán acceder según su rol. Asegúrate de tener un usuario administrador configurado
8. **FIFO corregido**: `create_donation_atomic.sql` ahora usa `p_donation_date` en lugar de `NOW()` para el FIFO correcto
9. **full_name nullable**: El esquema `database-schema-synced-with-code.sql` ya incluye `full_name` como nullable (requiere onboarding)

## 🧪 Testing

Después de ejecutar todos los scripts, verificar:

1. ✅ Todas las tablas están creadas
2. ✅ Los triggers funcionan (especialmente el de creación de usuarios)
3. ✅ Las funciones PostgreSQL se pueden llamar desde el código
4. ✅ Los datos básicos están insertados

## 📝 Notas

- El esquema está sincronizado con `types.ts` del proyecto
- Las funciones usan transacciones atómicas para garantizar consistencia
- El trigger `create_profile_for_new_user` crea automáticamente usuarios en `public.users` cuando se crean en Supabase Auth
- **`auth.users` es una tabla del sistema de Supabase** (no modificable). Ver `AUTH_USERS_EXPLANATION.md` para detalles
- La relación entre `auth.users.id` y `public.users.user_id` es lógica (no hay foreign key física)

