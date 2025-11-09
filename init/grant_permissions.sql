-- ============================================================================
-- PERMISOS DE BASE DE DATOS: Sistema de Gestión de Inventario "La Gran Familia"
-- ============================================================================
-- Versión: 1.0
-- Fecha: Diciembre 2024
-- 
-- Este script otorga los permisos necesarios a los roles anon y authenticated
-- en el esquema public y todas sus tablas, funciones y secuencias.
-- 
-- IMPORTANTE: Ejecutar DESPUÉS de todas las funciones:
--             - database-schema-synced-with-code.sql (funciones auxiliares)
--             - rls_policies.sql (funciones helper de RLS)
--             - functions/*.sql (funciones de negocio)
-- 
-- ⚠️ CRÍTICO: Este script debe ejecutarse AL FINAL, después de que todas las funciones existan.
--             Si se ejecuta antes, fallará porque intentará otorgar permisos a funciones que no existen.
-- 
-- NOTA: Este script es IDEMPOTENTE (usa IF NOT EXISTS y GRANT sin errores)
--       Puede ejecutarse múltiples veces sin errores.
-- ============================================================================

-- ============================================================================
-- PERMISOS EN EL ESQUEMA PUBLIC
-- ============================================================================

-- Otorgar uso del esquema public a los roles de Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Otorgar uso del esquema public al rol service_role (para funciones SECURITY DEFINER)
GRANT USAGE ON SCHEMA public TO service_role;

-- ============================================================================
-- PERMISOS EN TODAS LAS TABLAS
-- ============================================================================

-- Otorgar permisos en todas las tablas existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Otorgar permisos en todas las tablas futuras (default)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

-- ============================================================================
-- PERMISOS EN TODAS LAS SECUENCIAS (para IDENTITY columns)
-- ============================================================================

-- Otorgar permisos en todas las secuencias existentes
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Otorgar permisos en todas las secuencias futuras (default)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;

-- ============================================================================
-- PERMISOS EN TODAS LAS FUNCIONES
-- ============================================================================

-- Otorgar permisos de ejecución en todas las funciones existentes
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Otorgar permisos de ejecución en todas las funciones futuras (default)
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

-- Otorgar permisos a service_role para funciones SECURITY DEFINER
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ============================================================================
-- PERMISOS ESPECÍFICOS PARA FUNCIONES SECURITY DEFINER
-- ============================================================================

-- Las funciones SECURITY DEFINER necesitan permisos especiales
-- Estas funciones ya tienen SECURITY DEFINER, pero necesitamos asegurarnos
-- de que los roles puedan ejecutarlas

-- Función create_profile_for_new_user (ejecutada por trigger en auth.users)
GRANT EXECUTE ON FUNCTION public.create_profile_for_new_user() TO postgres, anon, authenticated, service_role;

-- Función delete_user_complete (elimina usuario de auth.users y public.users)
GRANT EXECUTE ON FUNCTION public.delete_user_complete(TEXT) TO authenticated, service_role;

-- Función get_user_email (obtiene email desde auth.users)
GRANT EXECUTE ON FUNCTION public.get_user_email(TEXT) TO authenticated, service_role;

-- Función update_user_password_direct (actualiza contraseña directamente en auth.users)
GRANT EXECUTE ON FUNCTION public.update_user_password_direct(TEXT, TEXT) TO authenticated, service_role;

-- Funciones helper de RLS (creadas en rls_policies.sql)
-- NOTA: Estas funciones ya tienen permisos otorgados en rls_policies.sql,
-- pero los otorgamos aquí también para asegurar consistencia
GRANT EXECUTE ON FUNCTION public.get_user_role_name() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_operator() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_consultor() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_warehouse_access(BIGINT) TO anon, authenticated, service_role;

-- Funciones de negocio (creadas en functions/*.sql)
-- NOTA: Estas funciones también tienen permisos otorgados en sus archivos respectivos,
-- pero los otorgamos aquí también para asegurar consistencia y como respaldo
GRANT EXECUTE ON FUNCTION public.validate_stock_available(BIGINT, BIGINT, NUMERIC) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_donation_atomic(BIGINT, BIGINT, JSONB, DATE) TO anon, authenticated, service_role;
-- Módulo de cocina removido - funciones de cocina ya no se usan
-- GRANT EXECUTE ON FUNCTION public.create_kitchen_request_atomic(TEXT, BIGINT, JSONB, TEXT, TEXT) TO anon, authenticated, service_role;
-- GRANT EXECUTE ON FUNCTION public.complete_kitchen_transaction(BIGINT, TEXT) TO anon, authenticated, service_role;

-- Funciones de triggers
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_expired_lots() TO anon, authenticated, service_role;

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON SCHEMA public IS 
'Esquema público del sistema de inventario. Los roles anon y authenticated tienen permisos básicos, pero el acceso real se controla mediante RLS.';

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 
-- 1. Los permisos GRANT no requieren IF EXISTS, son idempotentes por naturaleza.
--    Si ya existen, PostgreSQL simplemente los ignora sin error.
--
-- 2. Los permisos en el esquema public son necesarios para que las políticas
--    RLS funcionen correctamente. Sin estos permisos, incluso las políticas
--    RLS no podrán permitir el acceso.
--
-- 3. El rol service_role tiene permisos adicionales para funciones SECURITY
--    DEFINER que necesitan ejecutarse con privilegios elevados.
--
-- 4. Los permisos ALTER DEFAULT PRIVILEGES aseguran que cualquier tabla,
--    secuencia o función creada en el futuro tenga automáticamente los
--    permisos correctos.
--
-- 5. Las funciones SECURITY DEFINER se ejecutan con los privilegios del
--    usuario que las creó (normalmente postgres), por lo que pueden acceder
--    a tablas incluso si RLS está habilitado.
--
-- ============================================================================
-- FIN DEL SCRIPT DE PERMISOS
-- ============================================================================

