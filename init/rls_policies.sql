-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Sistema de Gestión de Inventario "La Gran Familia"
-- ============================================================================
-- Versión: 2.0 - FINAL
-- Fecha: Diciembre 2024
-- 
-- Este script configura las políticas RLS para todos los roles del sistema:
-- - Administrador: Acceso completo
-- - Operador: Gestión de inventario (limitado a sus almacenes)
-- - Consultor: Solo lectura + creación de solicitudes de cocina
-- 
-- IMPORTANTE: Ejecutar después de seed_data.sql (los roles deben existir)
-- 
-- NOTA: Este script es IDEMPOTENTE:
--       - Usa DROP POLICY IF EXISTS antes de crear políticas
--       - Usa CREATE OR REPLACE FUNCTION para funciones helper
--       - ALTER TABLE ... ENABLE ROW LEVEL SECURITY es idempotente
--       Puede ejecutarse múltiples veces sin errores.
-- ============================================================================

-- ============================================================================
-- FUNCIONES HELPER
-- ============================================================================

-- Función para obtener el role_name del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_role_name()
RETURNS TEXT AS $$
DECLARE
  v_role_name TEXT;
BEGIN
  SELECT r.role_name INTO v_role_name
  FROM public.users u
  LEFT JOIN public.roles r ON u.role_id = r.role_id
  WHERE u.user_id = auth.uid()
  AND u.is_active = TRUE;
  
  RETURN v_role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(public.get_user_role_name(), '') = 'Administrador';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es operador
CREATE OR REPLACE FUNCTION public.is_operator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(public.get_user_role_name(), '') = 'Operador';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es consultor
CREATE OR REPLACE FUNCTION public.is_consultor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(public.get_user_role_name(), '') = 'Consultor';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario tiene acceso a un almacén
CREATE OR REPLACE FUNCTION public.has_warehouse_access(p_warehouse_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Administrador tiene acceso a todos los almacenes
  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar acceso en user_warehouse_access
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_warehouse_access uwa
    WHERE uwa.user_id = auth.uid()
    AND uwa.warehouse_id = p_warehouse_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_warehouse_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_items ENABLE ROW LEVEL SECURITY;
-- Módulo de cocina removido - transactions y transaction_details ya no se usan
-- ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transaction_details ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS PARA: public.users
-- ============================================================================

-- SELECT: Usuario puede leer su propio perfil, Admin puede leer todos
DROP POLICY IF EXISTS "users_select_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_select_admin_all" ON public.users;

CREATE POLICY "users_select_own"
ON public.users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "users_select_admin_all"
ON public.users FOR SELECT
TO authenticated
USING (public.is_admin());

-- UPDATE: Usuario puede actualizar su propio perfil, Admin puede actualizar todos
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_admin_all" ON public.users;

CREATE POLICY "users_update_own"
ON public.users FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_admin"
ON public.users FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- INSERT: Solo Admin (el trigger create_profile_for_new_user usa SECURITY DEFINER)
DROP POLICY IF EXISTS "users_insert_admin_or_trigger" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin" ON public.users;

CREATE POLICY "users_insert_admin"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- DELETE: Solo Admin
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;

CREATE POLICY "users_delete_admin"
ON public.users FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- POLÍTICAS PARA: public.roles
-- ============================================================================

DROP POLICY IF EXISTS "roles_select_authenticated" ON public.roles;

CREATE POLICY "roles_select_authenticated"
ON public.roles FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- POLÍTICAS PARA: public.user_warehouse_access
-- ============================================================================

DROP POLICY IF EXISTS "user_warehouse_access_select" ON public.user_warehouse_access;
DROP POLICY IF EXISTS "user_warehouse_access_modify_admin" ON public.user_warehouse_access;

CREATE POLICY "user_warehouse_access_select"
ON public.user_warehouse_access FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "user_warehouse_access_modify_admin"
ON public.user_warehouse_access FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- POLÍTICAS PARA: public.warehouses
-- ============================================================================

DROP POLICY IF EXISTS "warehouses_select_authenticated" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_insert_admin" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_update_admin_operator" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_delete_admin" ON public.warehouses;
DROP POLICY IF EXISTS "warehouses_modify_admin_operator" ON public.warehouses;

-- SELECT: Admin ven todos, Operador y Consultor solo sus almacenes asignados
CREATE POLICY "warehouses_select_authenticated"
ON public.warehouses FOR SELECT
TO authenticated
USING (
  -- Admin puede ver todo
  public.is_admin()
  OR
  -- Operador solo puede ver sus almacenes asignados
  (public.is_operator() AND public.has_warehouse_access(warehouse_id))
  OR
  -- Consultor solo puede ver sus almacenes asignados
  (public.is_consultor() AND public.has_warehouse_access(warehouse_id))
);

-- INSERT: Solo Admin puede crear almacenes
CREATE POLICY "warehouses_insert_admin"
ON public.warehouses FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- UPDATE: Admin puede actualizar cualquier almacén, Operador solo sus almacenes asignados
CREATE POLICY "warehouses_update_admin_operator"
ON public.warehouses FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR (public.is_operator() AND public.has_warehouse_access(warehouse_id))
)
WITH CHECK (
  public.is_admin()
  OR (public.is_operator() AND public.has_warehouse_access(warehouse_id))
);

-- DELETE: Solo Admin puede eliminar almacenes
CREATE POLICY "warehouses_delete_admin"
ON public.warehouses FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- POLÍTICAS PARA: public.categories
-- ============================================================================

DROP POLICY IF EXISTS "categories_select_authenticated" ON public.categories;
DROP POLICY IF EXISTS "categories_modify_admin" ON public.categories;

CREATE POLICY "categories_select_authenticated"
ON public.categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "categories_modify_admin"
ON public.categories FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- POLÍTICAS PARA: public.brands
-- ============================================================================

DROP POLICY IF EXISTS "brands_select_authenticated" ON public.brands;
DROP POLICY IF EXISTS "brands_modify_admin" ON public.brands;

CREATE POLICY "brands_select_authenticated"
ON public.brands FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "brands_modify_admin"
ON public.brands FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- POLÍTICAS PARA: public.units
-- ============================================================================

DROP POLICY IF EXISTS "units_select_authenticated" ON public.units;

CREATE POLICY "units_select_authenticated"
ON public.units FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- POLÍTICAS PARA: public.donor_types
-- ============================================================================

DROP POLICY IF EXISTS "donor_types_select_authenticated" ON public.donor_types;

CREATE POLICY "donor_types_select_authenticated"
ON public.donor_types FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- POLÍTICAS PARA: public.transaction_types
-- ============================================================================

DROP POLICY IF EXISTS "transaction_types_select_authenticated" ON public.transaction_types;

CREATE POLICY "transaction_types_select_authenticated"
ON public.transaction_types FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- POLÍTICAS PARA: public.products
-- ============================================================================

DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
DROP POLICY IF EXISTS "products_modify_admin_operator" ON public.products;

CREATE POLICY "products_select_authenticated"
ON public.products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "products_modify_admin_operator"
ON public.products FOR ALL
TO authenticated
USING (public.is_admin() OR public.is_operator())
WITH CHECK (public.is_admin() OR public.is_operator());

-- ============================================================================
-- POLÍTICAS PARA: public.stock_lots
-- ============================================================================

DROP POLICY IF EXISTS "stock_lots_select" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_insert" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_update" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_delete" ON public.stock_lots;

-- SELECT: Admin ven todos, Operador y Consultor solo sus almacenes asignados
CREATE POLICY "stock_lots_select"
ON public.stock_lots FOR SELECT
TO authenticated
USING (
  -- Admin puede ver todo
  public.is_admin()
  OR
  -- Operador solo puede ver sus almacenes asignados
  (public.is_operator() AND public.has_warehouse_access(warehouse_id))
  OR
  -- Consultor solo puede ver sus almacenes asignados
  (public.is_consultor() AND public.has_warehouse_access(warehouse_id))
);

-- INSERT: Admin puede insertar en cualquier almacén, Operador solo en sus almacenes
CREATE POLICY "stock_lots_insert"
ON public.stock_lots FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR (public.is_operator() AND public.has_warehouse_access(warehouse_id))
);

-- UPDATE: Admin puede actualizar cualquier almacén, Operador solo en sus almacenes
CREATE POLICY "stock_lots_update"
ON public.stock_lots FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR (public.is_operator() AND public.has_warehouse_access(warehouse_id))
)
WITH CHECK (
  public.is_admin()
  OR (public.is_operator() AND public.has_warehouse_access(warehouse_id))
);

-- DELETE: Admin puede eliminar cualquier almacén, Operador solo en sus almacenes
CREATE POLICY "stock_lots_delete"
ON public.stock_lots FOR DELETE
TO authenticated
USING (
  public.is_admin()
  OR (public.is_operator() AND public.has_warehouse_access(warehouse_id))
);

-- ============================================================================
-- POLÍTICAS PARA: public.donors
-- ============================================================================

DROP POLICY IF EXISTS "donors_select_authenticated" ON public.donors;
DROP POLICY IF EXISTS "donors_modify_admin_operator" ON public.donors;

CREATE POLICY "donors_select_authenticated"
ON public.donors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "donors_modify_admin_operator"
ON public.donors FOR ALL
TO authenticated
USING (public.is_admin() OR public.is_operator())
WITH CHECK (public.is_admin() OR public.is_operator());

-- ============================================================================
-- POLÍTICAS PARA: public.donation_transactions
-- ============================================================================

DROP POLICY IF EXISTS "donation_transactions_select_authenticated" ON public.donation_transactions;
DROP POLICY IF EXISTS "donation_transactions_insert_admin_operator" ON public.donation_transactions;
DROP POLICY IF EXISTS "donation_transactions_update_admin_operator" ON public.donation_transactions;
DROP POLICY IF EXISTS "donation_transactions_delete_admin" ON public.donation_transactions;

CREATE POLICY "donation_transactions_select_authenticated"
ON public.donation_transactions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "donation_transactions_insert_admin_operator"
ON public.donation_transactions FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() OR public.is_operator());

CREATE POLICY "donation_transactions_update_admin_operator"
ON public.donation_transactions FOR UPDATE
TO authenticated
USING (public.is_admin() OR public.is_operator())
WITH CHECK (public.is_admin() OR public.is_operator());

CREATE POLICY "donation_transactions_delete_admin"
ON public.donation_transactions FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- POLÍTICAS PARA: public.donation_items
-- ============================================================================

DROP POLICY IF EXISTS "donation_items_select_authenticated" ON public.donation_items;
DROP POLICY IF EXISTS "donation_items_insert_admin_operator" ON public.donation_items;
DROP POLICY IF EXISTS "donation_items_update_admin_operator" ON public.donation_items;
DROP POLICY IF EXISTS "donation_items_delete_admin" ON public.donation_items;

CREATE POLICY "donation_items_select_authenticated"
ON public.donation_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "donation_items_insert_admin_operator"
ON public.donation_items FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() OR public.is_operator());

CREATE POLICY "donation_items_update_admin_operator"
ON public.donation_items FOR UPDATE
TO authenticated
USING (public.is_admin() OR public.is_operator())
WITH CHECK (public.is_admin() OR public.is_operator());

CREATE POLICY "donation_items_delete_admin"
ON public.donation_items FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- POLÍTICAS PARA: public.transactions (MÓDULO REMOVIDO)
-- ============================================================================
-- NOTA: El módulo de cocina fue removido del sistema.
-- Las políticas RLS para transactions y transaction_details ya no son necesarias.
-- Si deseas restaurar el módulo de cocina, descomenta estas políticas.

-- DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
-- DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
-- DROP POLICY IF EXISTS "transactions_update_admin_operator" ON public.transactions;
-- DROP POLICY IF EXISTS "transactions_delete_admin" ON public.transactions;

-- CREATE POLICY "transactions_select"
-- ON public.transactions FOR SELECT
-- TO authenticated
-- USING (
--   requester_id = auth.uid()::TEXT
--   OR public.is_admin()
--   OR public.is_operator()
--   OR public.is_consultor()
-- );

-- CREATE POLICY "transactions_insert"
-- ON public.transactions FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   (public.is_consultor() AND status = 'Pending')
--   OR
--   (public.is_admin() OR public.is_operator())
-- );

-- CREATE POLICY "transactions_update_admin_operator"
-- ON public.transactions FOR UPDATE
-- TO authenticated
-- USING (public.is_admin() OR public.is_operator())
-- WITH CHECK (public.is_admin() OR public.is_operator());

-- CREATE POLICY "transactions_delete_admin"
-- ON public.transactions FOR DELETE
-- TO authenticated
-- USING (public.is_admin());

-- ============================================================================
-- POLÍTICAS PARA: public.transaction_details (MÓDULO REMOVIDO)
-- ============================================================================
-- NOTA: El módulo de cocina fue removido del sistema.
-- Las políticas RLS para transaction_details ya no son necesarias.

-- DROP POLICY IF EXISTS "transaction_details_select" ON public.transaction_details;
-- DROP POLICY IF EXISTS "transaction_details_insert" ON public.transaction_details;
-- DROP POLICY IF EXISTS "transaction_details_update_admin_operator" ON public.transaction_details;
-- DROP POLICY IF EXISTS "transaction_details_delete_admin" ON public.transaction_details;

-- CREATE POLICY "transaction_details_select"
-- ON public.transaction_details FOR SELECT
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.transactions t
--     WHERE t.transaction_id = transaction_details.transaction_id
--     AND (
--       t.requester_id = auth.uid()::TEXT
--       OR
--       public.is_admin()
--       OR public.is_operator()
--       OR public.is_consultor()
--     )
--   )
-- );

-- CREATE POLICY "transaction_details_insert"
-- ON public.transaction_details FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM public.transactions t
--     WHERE t.transaction_id = transaction_details.transaction_id
--     AND (
--       t.requester_id = auth.uid()::TEXT
--       OR
--       public.is_admin()
--       OR public.is_operator()
--     )
--   )
-- );

-- CREATE POLICY "transaction_details_update_admin_operator"
-- ON public.transaction_details FOR UPDATE
-- TO authenticated
-- USING (public.is_admin() OR public.is_operator())
-- WITH CHECK (public.is_admin() OR public.is_operator());

-- CREATE POLICY "transaction_details_delete_admin"
-- ON public.transaction_details FOR DELETE
-- TO authenticated
-- USING (public.is_admin());

-- ============================================================================
-- PERMISOS DE FUNCIONES HELPER
-- ============================================================================

-- Otorgar permisos de ejecución a las funciones helper de RLS
-- NOTA: Estos permisos se otorgan aquí porque estas funciones se crean en este archivo
-- Los permisos generales se otorgan en grant_permissions.sql al final
GRANT EXECUTE ON FUNCTION public.get_user_role_name() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_operator() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_consultor() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_warehouse_access(BIGINT) TO anon, authenticated, service_role;

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON FUNCTION public.get_user_role_name() IS 'Retorna el role_name del usuario autenticado. Retorna NULL si el usuario no tiene role_id asignado.';
COMMENT ON FUNCTION public.is_admin() IS 'Verifica si el usuario actual es Administrador';
COMMENT ON FUNCTION public.is_operator() IS 'Verifica si el usuario actual es Operador';
COMMENT ON FUNCTION public.is_consultor() IS 'Verifica si el usuario actual es Consultor';
COMMENT ON FUNCTION public.has_warehouse_access(BIGINT) IS 'Verifica si el usuario tiene acceso a un almacén específico. Admin tiene acceso a todos.';

COMMENT ON POLICY "users_select_own" ON public.users IS 
'Permite que cualquier usuario autenticado lea su propio perfil. Esta política debe funcionar siempre, incluso si el usuario no tiene role_id.';

COMMENT ON POLICY "users_select_admin_all" ON public.users IS 
'Permite que usuarios con rol Administrador lean todos los perfiles.';

COMMENT ON POLICY "warehouses_select_authenticated" ON public.warehouses IS 
'Admin puede ver todos los almacenes. Operador y Consultor solo pueden ver sus almacenes asignados.';

COMMENT ON POLICY "stock_lots_select" ON public.stock_lots IS 
'Admin puede ver todos los stock_lots. Operador y Consultor solo pueden ver los de sus almacenes asignados.';

-- Comentarios de políticas de cocina - DESHABILITADOS (módulo removido)
-- COMMENT ON POLICY "transactions_insert" ON public.transactions IS 
-- 'Todos pueden crear solicitudes. Consultor solo puede crear con status=''Pending''. Admin y Operador pueden crear con cualquier status.';

-- COMMENT ON POLICY "transactions_update_admin_operator" ON public.transactions IS 
-- 'Solo Admin y Operador pueden actualizar transacciones (aprobar, completar, rechazar). Consultor NO puede modificar.';

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 
-- 1. Las funciones helper tienen SECURITY DEFINER para poder acceder a las
--    tablas sin restricciones RLS durante la verificación de permisos.
--
-- 2. Las políticas de warehouses y stock_lots filtran por user_warehouse_access
--    para Operadores y Consultores, permitiendo que solo vean y modifiquen almacenes asignados.
--
-- 3. El módulo de cocina fue removido. Las políticas de transactions y transaction_details
--    están comentadas pero pueden restaurarse si se necesita el módulo en el futuro.
--
-- 4. Las funciones PostgreSQL (create_donation_atomic)
--    deben ejecutarse con permisos del usuario autenticado, no con SECURITY DEFINER,
--    para que las políticas RLS se apliquen correctamente.
--
-- 5. El trigger create_profile_for_new_user tiene SECURITY DEFINER y puede
--    insertar en public.users desde auth.users sin necesidad de política RLS.
--
-- 6. La política users_select_own es CRÍTICA y debe funcionar siempre para
--    que los usuarios puedan leer su propio perfil, incluso sin role_id.
--
-- ============================================================================
-- FIN DEL SCRIPT RLS
-- ============================================================================
