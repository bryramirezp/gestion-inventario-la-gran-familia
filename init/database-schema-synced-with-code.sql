-- ============================================================================
-- ESQUEMA DE BASE DE DATOS: Sistema de Gestión de Inventario "La Gran Familia"
-- ============================================================================
-- Versión: 2.0 (Sincronizado con código TypeScript)
-- Fecha: Diciembre 2024
-- 
-- Este esquema está sincronizado con el código TypeScript del proyecto.
-- Reemplaza el esquema anterior que tenía discrepancias.
-- ============================================================================

-- Eliminar tablas existentes si es necesario (para desarrollo)
-- Módulo de cocina removido - transactions y transaction_details ya no se usan
-- DROP TABLE IF EXISTS public.transaction_details CASCADE;
-- DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.donation_items CASCADE;
DROP TABLE IF EXISTS public.donation_transactions CASCADE;
DROP TABLE IF EXISTS public.stock_lots CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.donors CASCADE;
DROP TABLE IF EXISTS public.user_warehouse_access CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.donor_types CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.transaction_types CASCADE;

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar productos vencidos automáticamente
CREATE OR REPLACE FUNCTION public.check_expired_lots()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
        NEW.is_expired := TRUE;
    ELSE
        NEW.is_expired := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para crear perfil de usuario automáticamente cuando se crea un usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear perfil con full_name NULL si no se proporciona (requiere onboarding)
    INSERT INTO public.users (user_id, full_name, role_id)
    VALUES (
        NEW.id, 
        NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),  -- NULL si está vacío
        NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el email de un usuario desde auth.users
CREATE OR REPLACE FUNCTION public.get_user_email(p_user_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Obtener el email desde auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id::TEXT = p_user_id;
  
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado en auth.users: %', p_user_id;
  END IF;
  
  RETURN v_email;
END;
$$;

-- Habilitar la extensión pgcrypto si no está habilitada
-- Nota: Esta extensión debe estar habilitada en el proyecto de Supabase
-- Puedes habilitarla desde el SQL Editor de Supabase si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función para actualizar la contraseña de un usuario directamente
-- IMPORTANTE: Esta función actualiza la contraseña en auth.users usando bcrypt
-- Supabase almacena las contraseñas usando bcrypt con el formato: $2a$10$...
-- Esta función genera el hash correcto usando pgcrypto con el mismo formato que Supabase
-- 
-- NOTA: Si esta función no funciona (por ejemplo, si Supabase tiene restricciones
-- que impiden actualizar encrypted_password directamente), necesitarás crear una
-- Edge Function de Supabase que use supabase.auth.admin.updateUserById con el
-- service_role key.
CREATE OR REPLACE FUNCTION public.update_user_password_direct(p_user_id TEXT, p_new_password TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_exists BOOLEAN;
  v_encrypted_password TEXT;
  v_updated_rows INTEGER;
BEGIN
  -- Verificar que el usuario existe en auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id::TEXT = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Usuario no encontrado en auth.users: %', p_user_id;
  END IF;
  
  -- Validar que la contraseña no esté vacía y tenga al menos 8 caracteres
  IF p_new_password IS NULL OR LENGTH(TRIM(p_new_password)) < 8 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 8 caracteres';
  END IF;
  
  -- Validar que la contraseña contenga al menos un dígito
  IF NOT (p_new_password ~ '[0-9]') THEN
    RAISE EXCEPTION 'La contraseña debe contener al menos un dígito';
  END IF;
  
  -- Validar que la contraseña contenga al menos una letra minúscula
  IF NOT (p_new_password ~ '[a-z]') THEN
    RAISE EXCEPTION 'La contraseña debe contener al menos una letra minúscula';
  END IF;
  
  -- Validar que la contraseña contenga al menos una letra mayúscula
  IF NOT (p_new_password ~ '[A-Z]') THEN
    RAISE EXCEPTION 'La contraseña debe contener al menos una letra mayúscula';
  END IF;
  
  -- Validar que la contraseña contenga al menos un símbolo
  IF NOT (p_new_password ~ '[!@#$%^&*()_+\-=\[\]{};'':"\\|,.<>\/?]') THEN
    RAISE EXCEPTION 'La contraseña debe contener al menos un símbolo (caracteres especiales)';
  END IF;
  
  -- Hashear la contraseña usando bcrypt (blowfish)
  -- 'bf' = blowfish (bcrypt), 10 = número de rounds (mismo que usa Supabase por defecto)
  -- Esto genera un hash en el formato: $2a$10$... (compatible con Supabase)
  v_encrypted_password := crypt(p_new_password, gen_salt('bf', 10));
  
  -- Verificar que el hash se generó correctamente
  IF v_encrypted_password IS NULL OR v_encrypted_password = '' THEN
    RAISE EXCEPTION 'Error al generar el hash de la contraseña';
  END IF;
  
  -- Actualizar la contraseña en auth.users
  -- Nota: Supabase puede tener triggers o validaciones que impidan esta actualización
  -- Si falla, considera usar una Edge Function con supabase.auth.admin.updateUserById
  UPDATE auth.users
  SET 
    encrypted_password = v_encrypted_password,
    updated_at = NOW()
  WHERE id::TEXT = p_user_id;
  
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  
  IF v_updated_rows = 0 THEN
    RAISE EXCEPTION 'Error al actualizar la contraseña del usuario: %. Verifica que el usuario existe y que tienes permisos para actualizar auth.users', p_user_id;
  END IF;
END;
$$;

-- Función para eliminar usuario completamente (de auth.users y public.users)
CREATE OR REPLACE FUNCTION public.delete_user_complete(p_user_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_exists BOOLEAN;
  v_auth_user_deleted INTEGER;
BEGIN
  -- Verificar que el usuario existe en public.users
  SELECT EXISTS(SELECT 1 FROM public.users WHERE user_id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Usuario no encontrado en public.users: %', p_user_id;
  END IF;
  
  -- 1. Eliminar acceso a almacenes (si existe)
  DELETE FROM public.user_warehouse_access WHERE user_id = p_user_id;
  
  -- 2. Eliminar de public.users
  DELETE FROM public.users WHERE user_id = p_user_id;
  
  -- 3. Eliminar de auth.users (requiere permisos especiales)
  DELETE FROM auth.users WHERE id::TEXT = p_user_id;
  GET DIAGNOSTICS v_auth_user_deleted = ROW_COUNT;
  
  -- Verificar que se eliminó de auth.users
  IF v_auth_user_deleted = 0 THEN
    RAISE WARNING 'Usuario eliminado de public.users pero no de auth.users. Puede requerir permisos adicionales.';
  END IF;
END;
$$;

-- ============================================================================
-- TABLAS DE CONFIGURACIÓN
-- ============================================================================

-- Tabla de roles
CREATE TABLE public.roles (
  role_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  role_name VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_role_name CHECK (
    LENGTH(TRIM(BOTH FROM role_name)) > 0
  )
);

-- Tabla de almacenes
CREATE TABLE public.warehouses (
  warehouse_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  warehouse_name VARCHAR(100) UNIQUE NOT NULL,
  location_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_warehouse_name CHECK (
    LENGTH(TRIM(BOTH FROM warehouse_name)) > 0
  )
);

-- Tabla de categorías
CREATE TABLE public.categories (
  category_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  category_name VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_category_name CHECK (
    LENGTH(TRIM(BOTH FROM category_name)) > 0
  )
);

-- Tabla de unidades de medida
CREATE TABLE public.units (
  unit_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  unit_name VARCHAR(50) UNIQUE NOT NULL,
  abbreviation VARCHAR(10) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_unit_name CHECK (
    LENGTH(TRIM(BOTH FROM unit_name)) > 0
  ),
  CONSTRAINT chk_abbreviation CHECK (
    LENGTH(TRIM(BOTH FROM abbreviation)) > 0
  )
);

-- Tabla de tipos de donantes
CREATE TABLE public.donor_types (
  donor_type_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_type_name CHECK (
    LENGTH(TRIM(BOTH FROM type_name)) > 0
  )
);

-- Tabla de marcas
CREATE TABLE public.brands (
  brand_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  brand_name VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_brand_name CHECK (
    LENGTH(TRIM(BOTH FROM brand_name)) > 0
  )
);

-- Tabla de tipos de transacción (mantenida por compatibilidad, pero no se usa en el código actual)
CREATE TABLE public.transaction_types (
  type_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type_name VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_type_name_tx CHECK (
    LENGTH(TRIM(BOTH FROM type_name)) > 0
  )
);

-- ============================================================================
-- TABLAS DE USUARIOS
-- ============================================================================

-- Tabla de usuarios (user_id es TEXT/UUID de Supabase Auth)
CREATE TABLE public.users (
  user_id TEXT PRIMARY KEY, -- UUID de Supabase Auth
  full_name VARCHAR(100), -- Nullable: se establece durante onboarding
  role_id BIGINT REFERENCES public.roles(role_id), -- Nullable: se asigna después de crear el usuario
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_full_name_if_not_null CHECK (
    full_name IS NULL OR LENGTH(TRIM(BOTH FROM full_name)) > 0
  )
);

-- Tabla de acceso de usuarios a almacenes
CREATE TABLE public.user_warehouse_access (
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  warehouse_id BIGINT NOT NULL REFERENCES public.warehouses(warehouse_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, warehouse_id)
);

-- ============================================================================
-- TABLAS DE DONANTES
-- ============================================================================

-- Tabla de donantes
CREATE TABLE public.donors (
  donor_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  donor_name VARCHAR(255) NOT NULL,
  donor_type_id BIGINT NOT NULL REFERENCES public.donor_types(donor_type_id),
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_donor_name CHECK (
    LENGTH(TRIM(BOTH FROM donor_name)) > 0
  ),
  CONSTRAINT chk_donor_email CHECK (
    email IS NULL OR email ~* E'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
  )
);

-- ============================================================================
-- TABLAS DE PRODUCTOS
-- ============================================================================

-- Tabla de productos
CREATE TABLE public.products (
  product_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_name VARCHAR(200) NOT NULL,
  sku VARCHAR(100), -- Nullable, único cuando no es NULL
  description TEXT,
  category_id BIGINT NOT NULL REFERENCES public.categories(category_id),
  brand_id BIGINT REFERENCES public.brands(brand_id),
  official_unit_id BIGINT NOT NULL REFERENCES public.units(unit_id),
  low_stock_threshold NUMERIC(10, 2) DEFAULT 5 CHECK (low_stock_threshold >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_product_name CHECK (
    LENGTH(TRIM(BOTH FROM product_name)) > 0
  )
);

-- Índice único para SKU (solo cuando no es NULL)
DROP INDEX IF EXISTS products_sku_unique;
CREATE UNIQUE INDEX products_sku_unique ON public.products(sku) WHERE sku IS NOT NULL;

-- ============================================================================
-- TABLAS DE DONACIONES
-- ============================================================================

-- Tabla de transacciones de donación
CREATE TABLE public.donation_transactions (
  donation_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  donor_id BIGINT NOT NULL REFERENCES public.donors(donor_id),
  warehouse_id BIGINT NOT NULL REFERENCES public.warehouses(warehouse_id),
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_market_value NUMERIC(10, 2) DEFAULT 0.00,
  total_actual_value NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de donación
CREATE TABLE public.donation_items (
  item_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  donation_id BIGINT NOT NULL REFERENCES public.donation_transactions(donation_id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(product_id),
  quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
  market_unit_price NUMERIC(10, 2) NOT NULL CHECK (market_unit_price >= 0),
  actual_unit_price NUMERIC(10, 2) NOT NULL CHECK (actual_unit_price >= 0),
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLAS DE INVENTARIO
-- ============================================================================

-- Tabla de lotes de stock
CREATE TABLE public.stock_lots (
  lot_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  product_id BIGINT NOT NULL REFERENCES public.products(product_id),
  warehouse_id BIGINT NOT NULL REFERENCES public.warehouses(warehouse_id),
  current_quantity NUMERIC(10, 2) NOT NULL CHECK (current_quantity >= 0),
  received_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date DATE,
  is_expired BOOLEAN DEFAULT FALSE,
  unit_price NUMERIC(10, 2) DEFAULT 0.00 CHECK (unit_price >= 0),
  donation_item_id BIGINT REFERENCES public.donation_items(item_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTA: No hay constraint restrictivo en expiry_date para permitir productos ya vencidos
-- El campo is_expired se actualiza automáticamente por trigger

-- ============================================================================
-- TABLAS DE TRANSACCIONES DE COCINA (MÓDULO REMOVIDO)
-- ============================================================================
-- NOTA: El módulo de cocina fue removido del sistema.
-- Las tablas se mantienen en la base de datos pero ya no se utilizan.
-- Si deseas eliminarlas completamente, ejecuta:
--   DROP TABLE IF EXISTS public.transaction_details CASCADE;
--   DROP TABLE IF EXISTS public.transactions CASCADE;

-- Tabla de transacciones (solicitudes de cocina) - DESHABILITADA
-- CREATE TABLE public.transactions (
--   transaction_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--   requester_id TEXT NOT NULL REFERENCES public.users(user_id),
--   approver_id TEXT REFERENCES public.users(user_id),
--   transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   status VARCHAR(20) NOT NULL DEFAULT 'Pending' 
--     CHECK (status IN ('Pending', 'Approved', 'Completed', 'Rejected')),
--   notes TEXT,
--   source_warehouse_id BIGINT NOT NULL REFERENCES public.warehouses(warehouse_id),
--   requester_signature TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Tabla de detalles de transacciones - DESHABILITADA
-- CREATE TABLE public.transaction_details (
--   detail_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--   transaction_id BIGINT NOT NULL REFERENCES public.transactions(transaction_id) ON DELETE CASCADE,
--   product_id BIGINT NOT NULL REFERENCES public.products(product_id),
--   quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at en users
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar updated_at en products
DROP TRIGGER IF EXISTS trigger_update_products_updated_at ON public.products;
CREATE TRIGGER trigger_update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar updated_at en stock_lots
DROP TRIGGER IF EXISTS trigger_update_stock_lots_updated_at ON public.stock_lots;
CREATE TRIGGER trigger_update_stock_lots_updated_at
BEFORE UPDATE ON public.stock_lots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar updated_at en transactions - DESHABILITADO (módulo de cocina removido)
-- DROP TRIGGER IF EXISTS trigger_update_transactions_updated_at ON public.transactions;
-- CREATE TRIGGER trigger_update_transactions_updated_at
-- BEFORE UPDATE ON public.transactions
-- FOR EACH ROW
-- EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar updated_at en donation_transactions
DROP TRIGGER IF EXISTS trigger_update_donation_transactions_updated_at ON public.donation_transactions;
CREATE TRIGGER trigger_update_donation_transactions_updated_at
BEFORE UPDATE ON public.donation_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para marcar productos vencidos
DROP TRIGGER IF EXISTS trigger_check_expired_lots ON public.stock_lots;
CREATE TRIGGER trigger_check_expired_lots
BEFORE INSERT OR UPDATE ON public.stock_lots
FOR EACH ROW
EXECUTE FUNCTION public.check_expired_lots();

-- Trigger para crear perfil de usuario automáticamente cuando se crea un usuario en Supabase Auth
-- Este trigger se ejecuta en la tabla auth.users de Supabase
-- NOTA: Eliminar el trigger si ya existe (para que el script sea idempotente)
DROP TRIGGER IF EXISTS trigger_create_profile_for_new_user ON auth.users;

CREATE TRIGGER trigger_create_profile_for_new_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_new_user();

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_official_unit ON public.products(official_unit_id);

-- Índices para stock_lots
CREATE INDEX IF NOT EXISTS idx_stock_lots_product_warehouse ON public.stock_lots(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_received_date ON public.stock_lots(received_date);
CREATE INDEX IF NOT EXISTS idx_stock_lots_expiry ON public.stock_lots(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_lots_expired ON public.stock_lots(is_expired) WHERE is_expired = TRUE;
CREATE INDEX IF NOT EXISTS idx_stock_lots_donation_item ON public.stock_lots(donation_item_id) WHERE donation_item_id IS NOT NULL;

-- Índices para transactions - DESHABILITADOS (módulo de cocina removido)
-- CREATE INDEX IF NOT EXISTS idx_transactions_requester ON public.transactions(requester_id);
-- CREATE INDEX IF NOT EXISTS idx_transactions_approver ON public.transactions(approver_id);
-- CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
-- CREATE INDEX IF NOT EXISTS idx_transactions_warehouse ON public.transactions(source_warehouse_id);
-- CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);

-- Índices para transaction_details - DESHABILITADOS (módulo de cocina removido)
-- CREATE INDEX IF NOT EXISTS idx_transaction_details_transaction ON public.transaction_details(transaction_id);
-- CREATE INDEX IF NOT EXISTS idx_transaction_details_product ON public.transaction_details(product_id);

-- Índices para donation_transactions
CREATE INDEX IF NOT EXISTS idx_donation_transactions_donor ON public.donation_transactions(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_warehouse ON public.donation_transactions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_date ON public.donation_transactions(donation_date);

-- Índices para donation_items
CREATE INDEX IF NOT EXISTS idx_donation_items_donation ON public.donation_items(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_items_product ON public.donation_items(product_id);

-- Índices para donors
CREATE INDEX IF NOT EXISTS idx_donors_type ON public.donors(donor_type_id);

-- Índice optimizado para validate_stock_available
-- Índice parcial compuesto que optimiza las consultas de stock disponible
-- que filtran por product_id, warehouse_id, is_expired = FALSE y current_quantity > 0
CREATE INDEX IF NOT EXISTS idx_stock_lots_available_stock 
ON public.stock_lots(product_id, warehouse_id, current_quantity)
WHERE is_expired = FALSE AND current_quantity > 0;

-- ============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE public.stock_lots IS 'Lotes de inventario por almacén. Usa current_quantity (no quantity) y unit_price (no unit_cost).';
COMMENT ON COLUMN public.stock_lots.current_quantity IS 'Cantidad actual del lote (puede disminuir con el uso)';
COMMENT ON COLUMN public.stock_lots.received_date IS 'Fecha y hora de recepción del lote';
COMMENT ON COLUMN public.stock_lots.is_expired IS 'Indica si el producto está vencido (calculado automáticamente por trigger)';
COMMENT ON COLUMN public.stock_lots.expiry_date IS 'Fecha de caducidad (puede ser en el pasado - no hay constraint restrictivo)';
COMMENT ON COLUMN public.stock_lots.donation_item_id IS 'ID del item de donación que originó este lote (NULL si el lote fue creado manualmente). Se establece en NULL automáticamente si se elimina el item de donación (ON DELETE SET NULL).';

-- Comentarios de tablas de cocina - DESHABILITADOS (módulo removido)
-- COMMENT ON TABLE public.transactions IS 'Transacciones de cocina (solicitudes). Estructura diferente a versiones anteriores.';
-- COMMENT ON COLUMN public.transactions.requester_id IS 'ID del usuario que solicita (TEXT/UUID de Supabase Auth)';
-- COMMENT ON COLUMN public.transactions.status IS 'Estado de la transacción: Pending, Approved, Completed, Rejected';

-- COMMENT ON TABLE public.transaction_details IS 'Detalles de cada transacción de cocina (productos y cantidades)';
COMMENT ON TABLE public.donation_transactions IS 'Transacciones de donación';
COMMENT ON TABLE public.donation_items IS 'Items de cada donación';

COMMENT ON TABLE public.users IS 'Usuarios del sistema. user_id es TEXT (UUID de Supabase Auth), no bigint.';
COMMENT ON COLUMN public.users.user_id IS 'UUID de Supabase Auth (TEXT)';

COMMENT ON TABLE public.products IS 'Productos del inventario. Usa official_unit_id (no unit_id).';
COMMENT ON COLUMN public.products.official_unit_id IS 'ID de la unidad oficial del producto (antes unit_id)';
COMMENT ON COLUMN public.products.sku IS 'SKU del producto (nullable, único cuando no es NULL)';

COMMENT ON INDEX idx_stock_lots_available_stock IS 
'Índice parcial compuesto optimizado para validate_stock_available. Filtra lotes no vencidos con stock disponible.';

COMMENT ON FUNCTION public.create_profile_for_new_user IS 
'Crea automáticamente un perfil en la tabla public.users cuando se crea un nuevo usuario en auth.users (Supabase Auth). 
Requiere SECURITY DEFINER para poder insertar desde el trigger. 
full_name será NULL si no se proporciona en raw_user_meta_data (requiere onboarding).';

COMMENT ON FUNCTION public.delete_user_complete IS 
'Elimina un usuario completamente del sistema: primero elimina el acceso a almacenes, luego de public.users y finalmente de auth.users. 
Requiere SECURITY DEFINER para poder eliminar de auth.users. 
Esta función debe ser ejecutada solo por administradores con los permisos adecuados.';

COMMENT ON FUNCTION public.get_user_email IS 
'Obtiene el email de un usuario desde auth.users usando el user_id. 
Requiere SECURITY DEFINER para acceder a auth.users.';

COMMENT ON FUNCTION public.update_user_password_direct IS 
'Actualiza la contraseña de un usuario directamente en auth.users sin enviar email.
Usa crypt de pgcrypto para hashear la contraseña con bcrypt (igual que Supabase).
Valida que la contraseña tenga mínimo 8 caracteres e incluya: dígitos, letras minúsculas, letras mayúsculas y símbolos.
Requiere SECURITY DEFINER para poder actualizar auth.users.
Esta función debe ser ejecutada solo por administradores.';

-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================

