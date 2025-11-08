# 📋 Archivos Esenciales para Ejecutar el Sistema

## 🚀 Para una Base de Datos Nueva (Instalación Completa)

### Orden de Ejecución:

1. **`database-schema-synced-with-code.sql`** ⭐ ESENCIAL
   - Crea todas las tablas, funciones, triggers e índices
   - **Ejecutar primero**

2. **`grant_permissions.sql`** ⭐ ESENCIAL
   - Otorga permisos a los roles `anon` y `authenticated` en el esquema `public`
   - **⚠️ CRÍTICO:** Debe ejecutarse después del esquema
   - **⚠️ CRÍTICO:** Sin estos permisos, obtendrás error 403 (permission denied)
   - **Ejecutar después del esquema**

3. **`seed_data.sql`** ⭐ ESENCIAL
   - Inserta roles, almacenes, categorías, unidades, tipos de donantes, marcas
   - **Ejecutar después de los permisos**

4. **`rls_policies.sql`** ⭐ ESENCIAL
   - Configura Row Level Security (RLS) para todos los roles
   - **⚠️ CRÍTICO:** Debe ejecutarse después de `seed_data.sql` (los roles deben existir)
   - **Ejecutar después de los datos básicos**

5. **`functions/validate_stock_available.sql`** ⭐ ESENCIAL
   - Función para validar stock disponible
   - **Ejecutar después de RLS**

6. **`functions/complete_kitchen_transaction.sql`** ⭐ ESENCIAL
   - Función para completar transacciones de cocina (FIFO)
   - **Ejecutar después de RLS**

7. **`functions/create_donation_atomic.sql`** ⭐ ESENCIAL
   - Función para crear donaciones atómicamente
   - **Ejecutar después de RLS**

---

## 🔄 Para una Base de Datos Existente (Migración)

Si ya tienes una base de datos y necesitas sincronizarla:

1. **`migrations/001_sync_schema_with_code.sql`** ⚠️ OPCIONAL
   - Sincroniza el esquema existente con el código TypeScript
   - **⚠️ Hacer backup primero** - Esta migración puede ser destructiva
   - **Solo ejecutar si es necesario**

2. Luego seguir con los pasos 2-6 de "Base de Datos Nueva"

---

## 📚 Archivos de Documentación (No Esenciales para Ejecutar)

- `README.md` - Guía general del directorio
- `RLS_PERMISSIONS.md` - Documentación de permisos por rol
- `JWT_CUSTOM_CLAIMS.md` - Guía para optimización con JWT (opcional)
- `AUTH_USERS_EXPLANATION.md` - Explicación de auth.users vs public.users

---

## ⚡ Archivos Opcionales (Optimización)

- `rls_policies_optimized.sql` - Funciones RLS optimizadas con JWT custom claims
  - **Solo usar si implementas JWT custom claims**
  - Ver `JWT_CUSTOM_CLAIMS.md` para más detalles

---

## ✅ Resumen de Archivos Esenciales

### Mínimo Absoluto (7 archivos):

```
init/
├── database-schema-synced-with-code.sql  ⭐
├── grant_permissions.sql                  ⭐ (nuevo)
├── seed_data.sql                          ⭐
├── rls_policies.sql                       ⭐
└── functions/
    ├── validate_stock_available.sql      ⭐
    ├── complete_kitchen_transaction.sql  ⭐
    └── create_donation_atomic.sql        ⭐
```

### Con Migración (8 archivos):

```
init/
├── database-schema-synced-with-code.sql  ⭐
├── grant_permissions.sql                  ⭐ (nuevo)
├── seed_data.sql                          ⭐
├── rls_policies.sql                       ⭐
├── migrations/
│   └── 001_sync_schema_with_code.sql     ⚠️ (solo si es necesario)
└── functions/
    ├── validate_stock_available.sql      ⭐
    ├── complete_kitchen_transaction.sql  ⭐
    └── create_donation_atomic.sql        ⭐
```

---

## 🎯 Comando Rápido de Ejecución

```bash
# Base de datos nueva
psql -h tu-host -U tu-usuario -d tu-database -f database-schema-synced-with-code.sql
psql -h tu-host -U tu-usuario -d tu-database -f grant_permissions.sql
psql -h tu-host -U tu-usuario -d tu-database -f seed_data.sql
psql -h tu-host -U tu-usuario -d tu-database -f rls_policies.sql
psql -h tu-host -U tu-usuario -d tu-database -f functions/validate_stock_available.sql
psql -h tu-host -U tu-usuario -d tu-database -f functions/complete_kitchen_transaction.sql
psql -h tu-host -U tu-usuario -d tu-database -f functions/create_donation_atomic.sql
```

---

## ⚠️ Advertencias Importantes

1. **Orden de ejecución:** Respetar el orden indicado arriba
2. **Backup:** Siempre hacer backup antes de ejecutar en producción
3. **Permisos críticos:** `grant_permissions.sql` DEBE ejecutarse después del esquema. Sin estos permisos, obtendrás error 403 (permission denied)
4. **RLS crítico:** `rls_policies.sql` DEBE ejecutarse después de `seed_data.sql`
5. **Permisos de funciones:** Algunas funciones requieren permisos de administrador (especialmente el trigger en `auth.users`)

---

**Última actualización:** Diciembre 2024

