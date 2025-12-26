-- ============================================================================
-- 0. LIMPIEZA (OPCIONAL - DESCOMENTAR PARA REINICIAR DB)
-- ============================================================================

DROP TABLE IF EXISTS public.inventory_adjustments CASCADE;
DROP TABLE IF EXISTS public.stock_transfers CASCADE;
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.stock_lots CASCADE;
DROP TABLE IF EXISTS public.donation_items CASCADE;
DROP TABLE IF EXISTS public.donation_transactions CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.donors CASCADE;
DROP TABLE IF EXISTS public.user_warehouse_access CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.movement_types CASCADE;
DROP TABLE IF EXISTS public.donor_types CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- ============================================================================
-- 1. FUNCIONES UTILITARIAS (Generales)
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
-- Función para calcular totales de donación automáticamente (Nueva corrección lógica)
CREATE OR REPLACE FUNCTION public.update_donation_totals()
RETURNS TRIGGER AS $$
DECLARE
v_donation_id BIGINT;
BEGIN
IF (TG_OP = 'DELETE') THEN
v_donation_id := OLD.donation_id;
ELSE
v_donation_id := NEW.donation_id;
END IF;

UPDATE public.donation_transactions
SET 
    market_value = (
        SELECT COALESCE(SUM(quantity * market_unit_price), 0)
        FROM public.donation_items
        WHERE donation_id = v_donation_id
    ),
    actual_value = (
        SELECT COALESCE(SUM(quantity * actual_unit_price), 0)
        FROM public.donation_items
        WHERE donation_id = v_donation_id
    ),
    updated_at = NOW()
WHERE donation_id = v_donation_id;

RETURN NULL;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- 2. FUNCIONES DE USUARIO Y AUTH (Supabase Integration)
-- ============================================================================
-- Función para crear perfil de usuario automáticamente
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
INSERT INTO public.users (user_id, full_name, role_id)
VALUES (
NEW.id,
NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
NULL
)
ON CONFLICT (user_id) DO NOTHING; -- Idempotencia
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Función para obtener email (Helper)
CREATE OR REPLACE FUNCTION public.get_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
v_email TEXT;
BEGIN
SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
IF v_email IS NULL THEN
RAISE EXCEPTION 'Usuario no encontrado en auth.users: %', p_user_id;
END IF;
RETURN v_email;
END;
$$;
-- Función para actualizar contraseña directamente
CREATE OR REPLACE FUNCTION public.update_user_password_direct(p_user_id UUID, p_new_password TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
v_encrypted_password TEXT;
BEGIN
IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
RAISE EXCEPTION 'Usuario no encontrado';
END IF;
IF LENGTH(TRIM(p_new_password)) < 8 THEN
RAISE EXCEPTION 'La contraseña debe tener al menos 8 caracteres';
END IF;
v_encrypted_password := crypt(p_new_password, gen_salt('bf', 10));
UPDATE auth.users
SET encrypted_password = v_encrypted_password, updated_at = NOW()
WHERE id = p_user_id;
END;
$$;
-- ============================================================================
-- 3. TABLAS DE CATÁLOGOS (Sin Dependencias de FK)
-- ============================================================================
-- Roles
CREATE TABLE IF NOT EXISTS public.roles (
role_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
role_name VARCHAR(50) UNIQUE NOT NULL,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
CONSTRAINT chk_role_name CHECK (LENGTH(TRIM(role_name)) > 0)
);
-- Almacenes
CREATE TABLE IF NOT EXISTS public.warehouses (
warehouse_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
warehouse_name VARCHAR(100) UNIQUE NOT NULL,
location_description TEXT,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
CONSTRAINT chk_warehouse_name CHECK (LENGTH(TRIM(warehouse_name)) > 0)
);
-- Categorías
CREATE TABLE IF NOT EXISTS public.categories (
category_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
category_name VARCHAR(100) UNIQUE NOT NULL,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
CONSTRAINT chk_category_name CHECK (LENGTH(TRIM(category_name)) > 0)
);
-- Unidades de Medida
CREATE TABLE IF NOT EXISTS public.units (
unit_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
unit_name VARCHAR(50) UNIQUE NOT NULL,
abbreviation VARCHAR(10) UNIQUE NOT NULL,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Marcas
CREATE TABLE IF NOT EXISTS public.brands (
brand_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
brand_name VARCHAR(100) UNIQUE NOT NULL,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tipos de Donantes
CREATE TABLE IF NOT EXISTS public.donor_types (
donor_type_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
type_name VARCHAR(100) UNIQUE NOT NULL,
description TEXT,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Tipos de Movimiento
CREATE TABLE IF NOT EXISTS public.movement_types (
type_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
type_code VARCHAR(50) UNIQUE NOT NULL,
type_name VARCHAR(100) NOT NULL,
category VARCHAR(20) NOT NULL CHECK (category IN ('ENTRADA', 'SALIDA', 'TRASPASO', 'AJUSTE')),
is_active BOOLEAN DEFAULT TRUE,
description TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 4. TABLAS DE USUARIOS Y SEGURIDAD (Dependen de Roles y Warehouses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
user_id UUID PRIMARY KEY, -- Referencia a auth.users
full_name VARCHAR(100),
role_id BIGINT REFERENCES public.roles(role_id),
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.user_warehouse_access (
user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
warehouse_id BIGINT NOT NULL REFERENCES public.warehouses(warehouse_id) ON DELETE CASCADE,
PRIMARY KEY (user_id, warehouse_id)
);
-- ============================================================================
-- 5. TABLAS DE PRODUCTOS (Dependen de Catálogos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
product_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
product_name VARCHAR(200) NOT NULL,
sku VARCHAR(100),
description TEXT,
category_id BIGINT NOT NULL REFERENCES public.categories(category_id),
brand_id BIGINT REFERENCES public.brands(brand_id),
official_unit_id BIGINT NOT NULL REFERENCES public.units(unit_id),
low_stock_threshold NUMERIC(10, 2) DEFAULT 5 CHECK (low_stock_threshold >= 0),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
-- Corrección: SKU debe ser único para evitar duplicados en escaneo
CONSTRAINT uq_products_sku UNIQUE (sku)
);
-- ============================================================================
-- 6. TABLAS DE DONANTES Y TRANSACCIONES (Dependen de Products, Donors, Warehouses)
-- ============================================================================
-- Donantes
CREATE TABLE IF NOT EXISTS public.donors (
donor_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
donor_name VARCHAR(255) NOT NULL,
donor_type_id BIGINT NOT NULL REFERENCES public.donor_types(donor_type_id),
contact_person VARCHAR(255),
phone VARCHAR(50),
email VARCHAR(255),
address TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
CONSTRAINT chk_donor_email CHECK (email IS NULL OR email ~* E'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
-- Cabecera de Donaciones
CREATE TABLE IF NOT EXISTS public.donation_transactions (
donation_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
donor_id BIGINT NOT NULL REFERENCES public.donors(donor_id),
warehouse_id BIGINT NOT NULL REFERENCES public.warehouses(warehouse_id),
donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
-- Estos campos serán calculados automáticamente por trigger
market_value NUMERIC(10, 2) DEFAULT 0.00,
actual_value NUMERIC(10, 2) DEFAULT 0.00,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Items de Donación (Detalle)
CREATE TABLE IF NOT EXISTS public.donation_items (
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
-- 7. TABLAS DE INVENTARIO (Dependen de Products, Warehouses, DonationItems)
-- ============================================================================
-- Lotes de Stock (Núcleo del inventario)
CREATE TABLE IF NOT EXISTS public.stock_lots (
lot_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
product_id BIGINT NOT NULL REFERENCES public.products(product_id),
warehouse_id BIGINT NOT NULL REFERENCES public.warehouses(warehouse_id),
current_quantity NUMERIC(10, 2) NOT NULL CHECK (current_quantity >= 0),
received_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
expiry_date DATE,
is_expired BOOLEAN DEFAULT FALSE,
unit_price NUMERIC(10, 2) DEFAULT 0.00 CHECK (unit_price >= 0),
-- Referencia opcional: Un lote puede venir de una donación o ser una carga inicial/compra
donation_item_id BIGINT REFERENCES public.donation_items(item_id) ON DELETE SET NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================================================
-- 8. TABLAS DE MOVIMIENTOS (Dependen de StockLots, Users, MovementTypes)
-- ============================================================================
-- Kardex de Movimientos
CREATE TABLE IF NOT EXISTS public.stock_movements (
movement_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
lot_id BIGINT NOT NULL REFERENCES public.stock_lots(lot_id) ON DELETE CASCADE,
movement_type_id BIGINT NOT NULL REFERENCES public.movement_types(type_id),
quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
notes TEXT,
requesting_department VARCHAR(100),
recipient_organization VARCHAR(255),
reference_id VARCHAR(100),
created_by UUID NOT NULL REFERENCES public.users(user_id),
created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Traspasos entre almacenes
-- NOTA DE DISEÑO: Al completar un traspaso, el backend debe encargarse de
-- restar cantidad del 'lot_id' origen y crear un NUEVO lote en el 'to_warehouse_id'.
CREATE TABLE IF NOT EXISTS public.stock_transfers (
transfer_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
lot_id BIGINT NOT NULL REFERENCES public.stock_lots(lot_id) ON DELETE CASCADE,
from_warehouse_id BIGINT NOT NULL REFERENCES public.warehouses(warehouse_id),
to_warehouse_id BIGINT NOT NULL REFERENCES public.warehouses(warehouse_id),
quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')),
requested_by UUID NOT NULL REFERENCES public.users(user_id),
approved_by UUID REFERENCES public.users(user_id),
rejection_reason TEXT,
notes TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
CONSTRAINT chk_different_warehouses CHECK (from_warehouse_id != to_warehouse_id)
);
-- Ajustes de Inventario (Mermas, Conteo cíclico)
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
adjustment_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
lot_id BIGINT NOT NULL REFERENCES public.stock_lots(lot_id) ON DELETE CASCADE,
quantity_before NUMERIC(10, 2) NOT NULL CHECK (quantity_before >= 0),
quantity_after NUMERIC(10, 2) NOT NULL CHECK (quantity_after >= 0),
reason TEXT NOT NULL CHECK (LENGTH(TRIM(reason)) > 10),
status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
approved_by UUID REFERENCES public.users(user_id),
rejected_by UUID REFERENCES public.users(user_id),
rejection_reason TEXT,
created_by UUID NOT NULL REFERENCES public.users(user_id),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
CONSTRAINT chk_quantity_change CHECK (quantity_before != quantity_after)
);
-- ============================================================================
-- 9. ÍNDICES DE RENDIMIENTO (Optimizados)
-- ============================================================================
-- Productos
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_unit ON public.products(official_unit_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;
-- Usuarios
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role_id);
-- Donaciones
CREATE INDEX IF NOT EXISTS idx_donors_type ON public.donors(donor_type_id);
CREATE INDEX IF NOT EXISTS idx_donation_trx_donor ON public.donation_transactions(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_trx_wh ON public.donation_transactions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_donation_items_trx ON public.donation_items(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_items_prod ON public.donation_items(product_id);
-- Inventario y Lotes
CREATE INDEX IF NOT EXISTS idx_stock_lots_product ON public.stock_lots(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_warehouse ON public.stock_lots(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_donation ON public.stock_lots(donation_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_expiry ON public.stock_lots(expiry_date);
-- Índice parcial compuesto (CRÍTICO para consultas de stock disponible)
CREATE INDEX IF NOT EXISTS idx_stock_lots_available
ON public.stock_lots(product_id, warehouse_id, current_quantity)
WHERE is_expired = FALSE AND current_quantity > 0;
-- Movimientos
CREATE INDEX IF NOT EXISTS idx_stock_movements_lot ON public.stock_movements(lot_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(movement_type_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user ON public.stock_movements(created_by);
-- Traspasos
CREATE INDEX IF NOT EXISTS idx_transfers_lot ON public.stock_transfers(lot_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_wh ON public.stock_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_wh ON public.stock_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.stock_transfers(status);
-- Ajustes
CREATE INDEX IF NOT EXISTS idx_adjustments_lot ON public.inventory_adjustments(lot_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_status ON public.inventory_adjustments(status);
-- ============================================================================
-- 10. TRIGGERS (Lógica Automática)
-- ============================================================================
-- 1. Auto-update 'updated_at'
-- Se aplica a todas las tablas que tienen la columna
DO $$
DECLARE
t text;
BEGIN
FOR t IN
SELECT table_name FROM information_schema.columns
WHERE column_name = 'updated_at' AND table_schema = 'public'
LOOP
EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_%I_updated_at ON public.%I;', t, t);
EXECUTE format('CREATE TRIGGER trigger_update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
END LOOP;
END;
$$ LANGUAGE plpgsql;
-- 2. Verificación de caducidad automática en lotes
DROP TRIGGER IF EXISTS trigger_check_expired_lots ON public.stock_lots;
CREATE TRIGGER trigger_check_expired_lots
BEFORE INSERT OR UPDATE ON public.stock_lots
FOR EACH ROW
EXECUTE FUNCTION public.check_expired_lots();
-- 3. Cálculo automático de valores de donación (Evita inconsistencias)
DROP TRIGGER IF EXISTS trigger_update_donation_values ON public.donation_items;
CREATE TRIGGER trigger_update_donation_values
AFTER INSERT OR UPDATE OR DELETE ON public.donation_items
FOR EACH ROW
EXECUTE FUNCTION public.update_donation_totals();
-- 4. Creación de perfil de usuario al registrarse en Supabase
DROP TRIGGER IF EXISTS trigger_create_profile_for_new_user ON auth.users;
CREATE TRIGGER trigger_create_profile_for_new_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_for_new_user();
-- 5. Protección del Almacén de Caducados (ID 999)
-- Función inline para proteger el almacén
CREATE OR REPLACE FUNCTION public.prevent_delete_expired_warehouse()
RETURNS TRIGGER AS $$
BEGIN
IF OLD.warehouse_id = 999 THEN
RAISE EXCEPTION 'No se puede eliminar el Almacén de Caducados (ID: 999)';
END IF;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_prevent_delete_expired_warehouse ON public.warehouses;
CREATE TRIGGER trigger_prevent_delete_expired_warehouse
BEFORE DELETE ON public.warehouses
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_expired_warehouse();
-- 6. Prevención de actualización directa de stock (Integridad de Kardex)
-- Función inline para proteger consistencia
CREATE OR REPLACE FUNCTION public.prevent_direct_stock_update()
RETURNS TRIGGER AS $$
BEGIN
-- Permitir cambios si current_quantity no cambió
IF OLD.current_quantity = NEW.current_quantity THEN
RETURN NEW;
END IF;
-- Validar que exista un movimiento registrado en los últimos segundos
IF NOT EXISTS (
SELECT 1 FROM public.stock_movements
WHERE lot_id = NEW.lot_id AND created_at > NOW() - INTERVAL '5 seconds'
) THEN
-- Nota: En producción real, a veces se prefiere un campo "last_movement_id" en stock_lots
-- para validar esto más estrictamente, pero este check temporal funciona para este alcance.
RAISE EXCEPTION 'No se puede actualizar current_quantity directamente. Use register_stock_movement()';
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_prevent_direct_stock_update ON public.stock_lots;
CREATE TRIGGER trigger_prevent_direct_stock_update
BEFORE UPDATE ON public.stock_lots
FOR EACH ROW
EXECUTE FUNCTION public.prevent_direct_stock_update();
-- ============================================================================
-- FIN DEL ESQUEMA
-- ============================================================================