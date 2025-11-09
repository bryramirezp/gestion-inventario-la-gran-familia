# Guía de Separación de Tipos por Dominio

## 📋 Resumen

Este documento explica cómo separar el archivo `types.ts` en múltiples archivos organizados por dominio de negocio.

## 🎯 Objetivo

Separar los tipos en archivos específicos según el dominio:
- **Product**: Tipos relacionados con productos, categorías, marcas, unidades
- **Donation**: Tipos relacionados con donaciones y donantes
- **Donor**: Tipos relacionados con donantes
- **Warehouse**: Tipos relacionados con almacenes
- **User**: Tipos relacionados con usuarios, roles, autenticación
- **Kitchen**: Tipos relacionados con cocina y transacciones
- **Common**: Tipos compartidos y genéricos

## 📁 Estructura de Archivos

```
src/domain/types/
├── common.types.ts          # Tipos compartidos (Json, Database, etc.)
├── product.types.ts         # Product, Category, Brand, Unit
├── donation.types.ts        # Donation, DonationItem, DonationTransaction
├── donor.types.ts           # Donor, DonorType, DonorAnalysisData
├── warehouse.types.ts       # Warehouse, StockLot
├── user.types.ts            # User, Role, UserWarehouseAccess
├── kitchen.types.ts         # Transaction, TransactionDetail, KitchenRequestNotification
└── index.ts                 # Re-exports de todos los tipos
```

## 🔍 Mapeo de Tipos

### `common.types.ts`
**Tipos compartidos y genéricos:**
```typescript
export type Json = ...
export type Database = { ... }  // Toda la definición de Database
```

### `product.types.ts`
**Tipos relacionados con productos:**
```typescript
export type Product = Database['public']['Tables']['products']['Row'];
export type NewProduct = Database['public']['Tables']['products']['Insert'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type NewCategory = Database['public']['Tables']['categories']['Insert'];
export type Brand = Database['public']['Tables']['brands']['Row'];
export type NewBrand = Database['public']['Tables']['brands']['Insert'];
export type Unit = Database['public']['Tables']['units']['Row'];
```

### `donation.types.ts`
**Tipos relacionados con donaciones:**
```typescript
export type DonationTransaction = Database['public']['Tables']['donation_transactions']['Row'];
export interface DonationItem extends NewStockLot { ... }
export interface Donation { ... }
export interface NewDonation { ... }
```

### `donor.types.ts`
**Tipos relacionados con donantes:**
```typescript
export type Donor = Database['public']['Tables']['donors']['Row'];
export type NewDonor = Database['public']['Tables']['donors']['Insert'];
export type DonorType = Database['public']['Tables']['donor_types']['Row'];
export interface DonorAnalysisData extends Donor { ... }
```

### `warehouse.types.ts`
**Tipos relacionados con almacenes:**
```typescript
export type Warehouse = Database['public']['Tables']['warehouses']['Row'];
export type NewWarehouse = Database['public']['Tables']['warehouses']['Insert'];
export type StockLot = Database['public']['Tables']['stock_lots']['Row'];
export type NewStockLot = Database['public']['Tables']['stock_lots']['Insert'];
```

### `user.types.ts`
**Tipos relacionados con usuarios:**
```typescript
export type User = Database['public']['Tables']['users']['Row'];
export type Role = Database['public']['Tables']['roles']['Row'];
export type UserWarehouseAccess = Database['public']['Tables']['user_warehouse_access']['Row'];
```

### `kitchen.types.ts`
**Tipos relacionados con cocina y transacciones:**
```typescript
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type NewTransaction = Database['public']['Tables']['transactions']['Insert'];
export type TransactionDetail = Database['public']['Tables']['transaction_details']['Row'];
export type NewTransactionDetail = Database['public']['Tables']['transaction_details']['Insert'];
export interface KitchenRequestNotification { ... }
```

## 📝 Pasos para Separar

### Paso 1: Crear archivos de tipos por dominio

Ya están creados los archivos placeholder. Ahora necesitas:

1. **Copiar el tipo `Database` completo a `common.types.ts`**
   - Este tipo es grande pero es la base de todos los demás
   - Todos los archivos de tipos lo necesitarán

2. **Separar tipos según el mapeo anterior**
   - Copiar cada tipo a su archivo correspondiente
   - Mantener los imports de `Database` desde `common.types.ts`

3. **Crear `index.ts` con re-exports**
   - Esto permite importar todos los tipos desde un solo lugar
   - Ejemplo: `import { Product, Donor } from '@/domain/types'`

### Paso 2: Actualizar imports en el código

Después de separar, necesitas actualizar todos los imports en:
- `services/api.ts` (ya separado en fases anteriores)
- Páginas y componentes
- Hooks

### Paso 3: Verificar que todo compile

Ejecuta `npm run build` o `npm run type-check` para verificar que no haya errores.

## 🔧 Script de Ayuda

Puedes usar el script `scripts_migration/separar_tipos.py` para ayudarte con la separación automática.

## ⚠️ Consideraciones Importantes

1. **El tipo `Database` debe estar en `common.types.ts`** porque todos los demás tipos dependen de él.

2. **Los tipos que extienden otros tipos** (como `DonationItem extends NewStockLot`) deben importar el tipo base:
   ```typescript
   import { NewStockLot } from './warehouse.types';
   ```

3. **Tipos compartidos** (como `Json`) van en `common.types.ts`.

4. **Después de separar**, puedes eliminar el archivo `types.ts` original (pero hazlo solo después de verificar que todo funciona).

## 📚 Ejemplo de Archivo Separado

### `src/domain/types/product.types.ts`

```typescript
import { Database } from './common.types';

export type Product = Database['public']['Tables']['products']['Row'];
export type NewProduct = Database['public']['Tables']['products']['Insert'];

export type Category = Database['public']['Tables']['categories']['Row'];
export type NewCategory = Database['public']['Tables']['categories']['Insert'];

export type Brand = Database['public']['Tables']['brands']['Row'];
export type NewBrand = Database['public']['Tables']['brands']['Insert'];

export type Unit = Database['public']['Tables']['units']['Row'];
```

### `src/domain/types/index.ts`

```typescript
// Re-export all types
export * from './common.types';
export * from './product.types';
export * from './donation.types';
export * from './donor.types';
export * from './warehouse.types';
export * from './user.types';
export * from './kitchen.types';
```

## ✅ Checklist

- [ ] Crear `common.types.ts` con `Json` y `Database`
- [ ] Crear `product.types.ts` con tipos de productos
- [ ] Crear `donation.types.ts` con tipos de donaciones
- [ ] Crear `donor.types.ts` con tipos de donantes
- [ ] Crear `warehouse.types.ts` con tipos de almacenes
- [ ] Crear `user.types.ts` con tipos de usuarios
- [ ] Crear `kitchen.types.ts` con tipos de cocina
- [ ] Crear `index.ts` con re-exports
- [ ] Actualizar imports en `services/api.ts`
- [ ] Actualizar imports en páginas y componentes
- [ ] Verificar que todo compile
- [ ] Eliminar `types.ts` original (después de verificar)

