# Auth Users vs Public Users - Explicación

## 📋 Resumen

Este documento explica la diferencia entre `auth.users` (tabla del sistema de Supabase) y `public.users` (nuestra tabla de aplicación), y cómo interactúan.

## 🔐 `auth.users` - Tabla del Sistema (Solo Lectura)

### Características

- **Tabla del sistema:** Creada y gestionada por Supabase Auth
- **No modificable:** No puedes modificar su estructura (columnas, constraints, etc.)
- **Solo lectura:** Solo puedes leer desde `auth.users`, no escribir directamente
- **Ubicación:** Schema `auth` (no `public`)
- **Propósito:** Gestiona la autenticación (email, password, tokens, sesiones, etc.)

### Columnas Principales

```sql
-- Estructura aproximada de auth.users (no modificable)
auth.users (
  id UUID PRIMARY KEY,                    -- UUID del usuario
  email TEXT,                             -- Email del usuario
  encrypted_password TEXT,                -- Password encriptado
  raw_user_meta_data JSONB,              -- Metadata del usuario (desde signup)
  raw_app_meta_data JSONB,               -- Metadata de la aplicación
  created_at TIMESTAMPTZ,                -- Fecha de creación
  updated_at TIMESTAMPTZ,                -- Fecha de actualización
  ...
)
```

### Limitaciones

1. **No puedes agregar columnas:** No puedes hacer `ALTER TABLE auth.users ADD COLUMN ...`
2. **No puedes modificar constraints:** No puedes cambiar las restricciones existentes
3. **No puedes crear triggers directamente:** Los triggers deben ser creados con permisos especiales
4. **Solo lectura:** No puedes hacer `INSERT/UPDATE/DELETE` directo en `auth.users`

## 📊 `public.users` - Tabla de Aplicación (Nuestra)

### Características

- **Tabla de aplicación:** Creada y gestionada por nosotros
- **Totalmente modificable:** Podemos modificar estructura, agregar columnas, etc.
- **Lectura/escritura:** Podemos leer y escribir normalmente
- **Ubicación:** Schema `public`
- **Propósito:** Gestiona los datos de negocio del usuario (rol, almacenes, nombre, etc.)

### Columnas Principales

```sql
-- Estructura de public.users (modificable)
public.users (
  user_id TEXT PRIMARY KEY,              -- UUID de auth.users (FK lógica)
  full_name VARCHAR(100),                -- Nombre completo (nullable)
  role_id BIGINT REFERENCES roles,       -- Rol del usuario
  is_active BOOLEAN DEFAULT TRUE,        -- Estado activo/inactivo
  created_at TIMESTAMPTZ,                -- Fecha de creación
  updated_at TIMESTAMPTZ                 -- Fecha de actualización
)
```

### Ventajas

1. **Flexible:** Podemos agregar columnas según nuestras necesidades
2. **Relaciones:** Podemos crear foreign keys a otras tablas de nuestra aplicación
3. **Datos de negocio:** Almacenamos información específica de la aplicación (roles, almacenes, etc.)

## 🔄 Integración: Trigger Automático

### Cómo Funciona

Cuando un usuario se registra en Supabase Auth, se crea un registro en `auth.users`. Nuestro trigger `create_profile_for_new_user` crea automáticamente un registro correspondiente en `public.users`.

```sql
-- Trigger en auth.users (requiere SECURITY DEFINER)
CREATE TRIGGER trigger_create_profile_for_new_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_new_user();
```

### Función del Trigger

```sql
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear perfil en public.users cuando se crea usuario en auth.users
    INSERT INTO public.users (user_id, full_name, role_id)
    VALUES (
        NEW.id,                                    -- UUID de auth.users
        NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),  -- Nombre (nullable)
        NULL                                       -- Rol (se asigna después)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Por qué `SECURITY DEFINER`

- **Permisos elevados:** Necesita permisos para insertar en `public.users` desde un trigger en `auth.users`
- **Bypass RLS:** Puede insertar en `public.users` incluso si RLS está habilitado
- **Seguridad:** Solo se ejecuta cuando Supabase Auth crea un usuario (no puede ser llamado directamente)

## 📝 Flujo de Registro

### 1. Usuario se Registra

```typescript
// Frontend: Signup
const { data, error } = await supabase.auth.signUp({
  email: 'usuario@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'Juan Pérez'  // Metadata opcional
    }
  }
});
```

### 2. Supabase Auth Crea Usuario

- Se crea registro en `auth.users`
- `id` = UUID generado
- `email` = 'usuario@example.com'
- `raw_user_meta_data` = `{"full_name": "Juan Pérez"}`

### 3. Trigger se Ejecuta Automáticamente

- Se ejecuta `create_profile_for_new_user()`
- Se crea registro en `public.users`
- `user_id` = UUID de `auth.users.id`
- `full_name` = 'Juan Pérez' (si se proporcionó) o NULL
- `role_id` = NULL (se asigna después por Admin)

### 4. Usuario Completa Onboarding

```typescript
// Frontend: Actualizar perfil después de registro
await supabase
  .from('users')
  .update({ full_name: 'Juan Pérez' })  // Si no se proporcionó en signup
  .eq('user_id', user.id);
```

## 🔒 Seguridad y RLS

### RLS en `public.users`

Las políticas RLS en `public.users` controlan el acceso a los datos de la aplicación:

```sql
-- Usuario puede leer su propio perfil
CREATE POLICY "users_select_own"
ON public.users FOR SELECT
TO authenticated
USING (user_id = auth.uid()::TEXT);
```

### Relación con `auth.users`

- `auth.uid()` retorna el `id` de `auth.users` del usuario autenticado
- `public.users.user_id` debe coincidir con `auth.users.id`
- Las políticas RLS usan `auth.uid()` para verificar permisos

## ⚠️ Limitaciones y Consideraciones

### 1. No Hay Foreign Key Real

```sql
-- ❌ NO PUEDES HACER ESTO:
ALTER TABLE public.users
ADD CONSTRAINT fk_auth_user
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Razón: auth.users está en otro schema y no permite foreign keys
```

**Solución:** Mantener la relación lógica (no física) entre `user_id` y `auth.users.id`

### 2. Sincronización Manual

- Si eliminas un usuario en `auth.users`, debes eliminar manualmente en `public.users`
- Supabase no elimina automáticamente registros relacionados

**Solución:** Usar trigger `ON DELETE CASCADE` o función que limpie datos relacionados

### 3. Metadata en `auth.users`

- `raw_user_meta_data`: Datos proporcionados por el usuario durante signup
- `raw_app_meta_data`: Datos establecidos por la aplicación (custom claims, etc.)

**Mejor práctica:** Usar `raw_user_meta_data` solo para datos iniciales, almacenar datos de negocio en `public.users`

## 🔄 Actualizar Datos del Usuario

### Actualizar en `auth.users`

```typescript
// Actualizar email (requiere reautenticación)
await supabase.auth.updateUser({
  email: 'nuevo@example.com'
});

// Actualizar metadata
await supabase.auth.updateUser({
  data: { full_name: 'Nuevo Nombre' }
});
```

### Actualizar en `public.users`

```typescript
// Actualizar datos de negocio
await supabase
  .from('users')
  .update({ 
    full_name: 'Nuevo Nombre',
    role_id: 2  // Asignar rol
  })
  .eq('user_id', user.id);
```

## 📚 Mejores Prácticas

### 1. Separación de Responsabilidades

- **`auth.users`:** Solo autenticación (email, password, tokens)
- **`public.users`:** Solo datos de negocio (rol, almacenes, preferencias)

### 2. Onboarding

- Crear usuario en `auth.users` con signup
- Trigger crea perfil en `public.users` automáticamente
- Usuario completa onboarding (establece nombre, preferencias, etc.)

### 3. Eliminación de Usuarios

```sql
-- Función para eliminar usuario completamente
CREATE OR REPLACE FUNCTION public.delete_user_complete(p_user_id TEXT)
RETURNS void AS $$
BEGIN
  -- Eliminar de public.users (cascada elimina user_warehouse_access)
  DELETE FROM public.users WHERE user_id = p_user_id;
  
  -- Eliminar de auth.users (requiere permisos de admin)
  -- NOTA: Esto debe hacerse desde el dashboard de Supabase o con API admin
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Sincronización

- Usar triggers para sincronizar datos iniciales
- Usar funciones para actualizar datos relacionados
- Mantener `user_id` sincronizado con `auth.users.id`

## 🔍 Verificación

### Verificar que el Trigger Funciona

```sql
-- Ver usuarios en auth.users
SELECT id, email, raw_user_meta_data 
FROM auth.users 
LIMIT 10;

-- Ver usuarios en public.users
SELECT user_id, full_name, role_id 
FROM public.users 
LIMIT 10;

-- Verificar que coinciden
SELECT 
  au.id as auth_id,
  pu.user_id as public_id,
  au.email,
  pu.full_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id::TEXT = pu.user_id
WHERE pu.user_id IS NULL;  -- Usuarios sin perfil en public.users
```

## 📖 Referencias

- [Supabase Auth: Users Table](https://supabase.com/docs/guides/auth/users)
- [Supabase Auth: User Management](https://supabase.com/docs/guides/auth/user-management)
- [PostgreSQL: SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

---

**Nota:** Esta arquitectura (separar `auth.users` y `public.users`) es un patrón común en aplicaciones que usan Supabase Auth y necesitan datos de negocio adicionales para los usuarios.

