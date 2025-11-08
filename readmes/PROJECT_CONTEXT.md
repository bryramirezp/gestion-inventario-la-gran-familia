# 🧠 Contexto del Proyecto: Sistema de Gestión de Inventario - La Gran Familia

Este documento sirve como el "cerebro" del proyecto para los asistentes de IA. Úsalo como referencia principal para todas las tareas de generación y modificación de código.

---

## 1. Propósito Principal y Usuario Objetivo

* **Propósito:** Sistema web de gestión de inventario para donaciones (entradas y salidas) de la ONG "La Gran Familia". Permite centralizar la información del almacén, gestionar productos, donaciones, donantes, transacciones de cocina, y generar reportes para control y trazabilidad.

* **Usuario Objetivo:** Personal de la ONG "La Gran Familia" con roles específicos:
  - **Administrador:** Acceso completo al sistema (gestión de productos, donaciones, usuarios, categorías, marcas, reportes, respaldos)
  - **Operador:** Gestión de inventario y donaciones (productos, donaciones, donantes, almacenes, cocina, reportes)
  - **Consultor:** Acceso de solo lectura a dashboard y cocina

* **Contexto de la Organización:** ONG que acoge a niños privados de cuidados parentales. El sistema reemplaza procesos manuales (Excel y apuntes a mano) para profesionalizar la gestión del almacén de manera sencilla, intuitiva y gratuita.

---

## 2. Stack Tecnológico Detallado

### Frontend Core
* **Framework:** React 18.3.1 (Usando **componentes funcionales** y **Hooks** exclusivamente. NO se usan componentes de clase).
* **Lenguaje:** TypeScript ~5.9.3 (target: ES2022, module: ESNext, jsx: react-jsx).
* **Build Tool:** Vite 7.1.12 (puerto dev: 3000, host: 0.0.0.0, base: './').
* **Routing:** React Router DOM 6.30.1 (BrowserRouter con rutas protegidas basadas en roles).

### Backend (BaaS)
* **Plataforma:** Supabase 2.76.1
  - **Base de Datos:** PostgreSQL (tipado completo en `types.ts`)
  - **Autenticación:** Supabase Auth (persistSession: true, autoRefreshToken: true)
  - **Seguridad:** Row Level Security (RLS) implementado
  - **Cliente:** Instancia única exportada desde `services/supabase.ts`

### Estilos
* **Framework CSS:** Tailwind CSS 3.4.18
  - Modo oscuro: `class` (darkMode: 'class')
  - Sistema de colores personalizado (HSL) con variables CSS
  - Temas: light/dark con colores para inventory (high, medium, low, expired)
  - Animaciones personalizadas (content-show, slide-up, slide-in-right)
* **Iconos:** Componentes SVG personalizados en `components/icons/Icons.tsx` (NO usar librerías de iconos externas, todos los iconos son SVG custom)

### Gestión de Estado
* **Server State:** TanStack React Query 5.59.16
  - Provider: `contexts/QueryProvider.tsx`
  - Hooks personalizados: `hooks/useApiQuery.ts`, `hooks/useUserProfile.ts`
  - Configuración centralizada en QueryProvider
* **Global State (UI/Auth):** Context API de React
  - `contexts/AuthContext.tsx`: Autenticación y sesión
  - `contexts/ThemeContext.tsx`: Tema claro/oscuro
  - `contexts/AlertContext.tsx`: Alertas y notificaciones
  - `contexts/NotificationContext.tsx`: Notificaciones de cocina

### Librerías Adicionales
* **Gráficos:** Recharts 2.15.4 (usado en Dashboard y reportes)
* **Validación:** DOMPurify 3.3.0 (sanitización de inputs)
* **Utilidades:** Lucide React 0.548.0 (solo si es necesario, preferir iconos SVG custom)

### Desarrollo
* **Linting:** ESLint 8.57.1 + @typescript-eslint
* **Formateo:** Prettier 3.6.2
* **Git Hooks:** Husky 8.0.3 + lint-staged
* **PWA:** Service Worker (`public/sw.js`) para funcionalidad offline

---

## 3. Arquitectura del Proyecto

### Estructura de Directorios

```
gestion-inventario-la-gran-familia/
├── components/          # Componentes reutilizables de UI
│   ├── icons/          # Iconos SVG personalizados (Icons.tsx)
│   ├── AlertDialog.tsx
│   ├── Alerts.tsx
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Combobox.tsx
│   ├── CreatableCombobox.tsx
│   ├── DatePicker.tsx
│   ├── Dialog.tsx
│   ├── DonorForm.tsx
│   ├── forms.tsx
│   ├── Header.tsx
│   ├── LoadingSpinner.tsx
│   ├── NotificationBell.tsx
│   ├── Pagination.tsx
│   ├── Sidebar.tsx
│   ├── StockLotsModal.tsx
│   ├── Table.tsx
│   ├── ThemeToggle.tsx
│   └── TopBar.tsx
├── contexts/           # Context Providers de React
│   ├── AlertContext.tsx
│   ├── AuthContext.tsx
│   ├── NotificationContext.tsx
│   ├── QueryProvider.tsx
│   └── ThemeContext.tsx
├── hooks/              # Custom Hooks
│   ├── useApiQuery.ts
│   ├── useForm.ts
│   ├── useRecharts.ts
│   ├── useTableState.ts
│   └── useUserProfile.ts
├── pages/              # Páginas/Vistas de la aplicación
│   ├── kitchen/        # Vistas específicas de cocina
│   │   ├── KitchenStaffView.tsx
│   │   └── ManagerView.tsx
│   ├── Backup.tsx
│   ├── Brands.tsx
│   ├── Categories.tsx
│   ├── ConfirmEmail.tsx
│   ├── Dashboard.tsx
│   ├── Donations.tsx
│   ├── DonorAnalysis.tsx
│   ├── DonorDetail.tsx
│   ├── Donors.tsx
│   ├── ExpiryReport.tsx
│   ├── Kitchen.tsx
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Products.tsx
│   ├── Profile.tsx
│   ├── Users.tsx
│   └── WarehouseDetail.tsx
├── services/           # Servicios y APIs
│   ├── api.ts          # Funciones de API centralizadas (warehouseApi, productApi, etc.)
│   ├── supabase.ts     # Cliente de Supabase (única instancia)
│   └── validation.ts   # Funciones de validación
├── src/                # Archivos de entrada
│   ├── index.css       # Estilos globales y variables CSS
│   └── main.tsx        # Punto de entrada de React
├── init/               # Scripts de inicialización de BD
│   └── database-normalization-ngo-inventory-system-*.sql
├── public/             # Archivos estáticos
│   ├── favicon.ico
│   ├── logo-lagranfamilia.png
│   └── sw.js           # Service Worker para PWA
├── App.tsx             # Componente raíz con routing
├── types.ts            # Tipos TypeScript (Database types de Supabase + tipos adicionales)
├── vite.config.ts      # Configuración de Vite
├── tsconfig.json       # Configuración de TypeScript
├── tailwind.config.js  # Configuración de Tailwind CSS
├── package.json        # Dependencias y scripts
└── PROJECT_CONTEXT.md  # Este archivo
```

### Patrones Arquitectónicos

#### 1. **Separación de Concerns**
- **Presentación:** Componentes en `components/` y `pages/`
- **Lógica de Negocio:** Hooks personalizados en `hooks/`
- **Acceso a Datos:** Servicios en `services/api.ts`
- **Estado Global:** Contexts en `contexts/`

#### 2. **Rutas Protegidas**
- Implementado en `App.tsx` con componente `ProtectedRoute`
- Basado en roles: `['Administrador']`, `['Administrador', 'Operador']`, etc.
- Verificación de autenticación y perfil de usuario antes de renderizar

#### 3. **Lazy Loading**
- Todas las páginas usan `React.lazy()` para code splitting
- Suspense con `LoadingFallback` para estados de carga

#### 4. **API Layer**
- Funciones centralizadas en `services/api.ts` organizadas por dominio:
  - `warehouseApi`: CRUD de almacenes
  - `productApi`: CRUD de productos
  - `donationApi`: Gestión de donaciones
  - `donorApi`: CRUD de donantes
  - `transactionApi`: Transacciones de cocina
  - `userApi`: Gestión de usuarios
  - `categoryApi`, `brandApi`, `unitApi`: Catálogos
- Todas las funciones reciben `token` como primer parámetro (aunque se usa Supabase auth internamente)

#### 5. **Type Safety**
- Tipos generados desde Supabase en `types.ts`
- Tipos adicionales para enriquecer datos (ej: `Donation`, `DonorAnalysisData`)
- Uso estricto de TypeScript (no `any` a menos que sea absolutamente necesario)

---

## 4. Base de Datos (Supabase PostgreSQL)

### Esquema Principal

#### Tablas de Usuarios y Permisos
* **`users`**: Usuarios del sistema (relacionado con `auth.users` de Supabase)
  - `user_id` (string, FK a auth.users)
  - `full_name`, `role_id`, `is_active`
* **`roles`**: Roles del sistema
  - `role_id`, `role_name` ('Administrador', 'Operador', 'Consultor')
* **`user_warehouse_access`**: Acceso de usuarios a almacenes específicos
  - `user_id`, `warehouse_id`

#### Tablas de Inventario
* **`warehouses`**: Almacenes/bodegas
  - `warehouse_id`, `warehouse_name`, `location_description`, `is_active`
* **`categories`**: Categorías de productos
  - `category_id`, `category_name`, `is_active`
* **`brands`**: Marcas de productos
  - `brand_id`, `brand_name`, `is_active`
* **`units`**: Unidades de medida
  - `unit_id`, `unit_name`, `abbreviation`, `is_active`
* **`products`**: Productos del inventario
  - `product_id`, `product_name`, `sku`, `description`
  - `category_id`, `brand_id`, `official_unit_id`, `low_stock_threshold`
* **`stock_lots`**: Lotes de inventario por almacén
  - `lot_id`, `product_id`, `warehouse_id`, `current_quantity`
  - `received_date`, `expiry_date`, `unit_price`

#### Tablas de Donaciones
* **`donor_types`**: Tipos de donantes
  - `donor_type_id`, `type_name`, `description`, `is_active`
* **`donors`**: Donantes
  - `donor_id`, `donor_name`, `donor_type_id`
  - `contact_person`, `phone`, `email`, `address`
* **`donation_transactions`**: Transacciones de donación
  - `donation_id`, `donor_id`, `warehouse_id`, `donation_date`
  - `total_value_before_discount`, `total_value_after_discount`
* **`donation_items`**: Items de cada donación
  - `item_id`, `donation_id`, `product_id`, `quantity`
  - `unit_price`, `discount_percentage`, `expiry_date`

#### Tablas de Transacciones (Cocina)
* **`transaction_types`**: Tipos de transacción
  - `type_id`, `type_name`, `is_active`
* **`transactions`**: Transacciones de cocina (solicitudes)
  - `transaction_id`, `requester_id`, `approver_id`, `transaction_date`
  - `status` ('Pending', 'Approved', 'Completed', 'Rejected')
  - `notes`, `source_warehouse_id`, `requester_signature`
* **`transaction_details`**: Detalles de cada transacción
  - `detail_id`, `transaction_id`, `product_id`, `quantity`

### Convenciones de Nombres
* **Tablas:** snake_case plural (`products`, `stock_lots`)
* **Columnas:** snake_case (`product_id`, `created_at`)
* **Foreign Keys:** `{tabla}_id` (ej: `warehouse_id`, `product_id`)
* **Timestamps:** `created_at`, `updated_at` (string/ISO format)
* **Soft Delete:** Campo `is_active` (boolean) en lugar de eliminar registros

### Seguridad (RLS)
* Row Level Security (RLS) habilitado en todas las tablas
* Políticas basadas en roles y acceso a almacenes
* Verificación de autenticación en todas las consultas

### Constantes Importantes
* `EXPIRED_WAREHOUSE_ID = 999`: ID especial para productos vencidos (definido en `services/api.ts`)

---

## 5. Sistema de Autenticación y Autorización

### Flujo de Autenticación
1. **Login:** `AuthContext.login(email, password)` → Supabase Auth
2. **Sesión:** Persistida automáticamente (localStorage)
3. **Perfil de Usuario:** Cargado mediante `useUserProfile()` hook
4. **Protección de Rutas:** `ProtectedRoute` verifica autenticación y roles

### Roles y Permisos

#### **Administrador**
- Acceso completo:
  - Gestión de productos, donaciones, donantes, almacenes
  - Gestión de usuarios, categorías, marcas
  - Cocina (solicitudes y aprobaciones)
  - Reportes (expiración, análisis de donantes)
  - Respaldo y reseteo del sistema

#### **Operador**
- Gestión de inventario:
  - Productos, donaciones, donantes, almacenes
  - Cocina (solicitudes y aprobaciones)
  - Reportes (expiración, análisis de donantes)
- **NO** puede: Gestionar usuarios, categorías, marcas, respaldos

#### **Consultor**
- Solo lectura:
  - Dashboard (vista de métricas)
  - Cocina (solo visualización)
- **NO** puede: Modificar datos, crear transacciones

### Contextos de Autenticación
* **`AuthContext`:** Proporciona `user`, `session`, `loading`, `login`, `logout`, `signUp`, `getToken`
* **`useUserProfile`:** Hook que carga el perfil del usuario desde la tabla `users` (incluye `role_name`)

---

## 6. Convenciones de Código

### Nomenclatura
* **Componentes:** PascalCase (`ProductCard.tsx`, `DonationForm.tsx`)
* **Hooks:** camelCase con prefijo `use` (`useUserProfile`, `useApiQuery`)
* **Funciones/Constantes:** camelCase (`getAllProducts`, `EXPIRED_WAREHOUSE_ID`)
* **Tipos/Interfaces:** PascalCase (`Product`, `NewDonation`, `Database`)
* **Archivos:** PascalCase para componentes (`Button.tsx`), camelCase para utilidades (`api.ts`)

### Estructura de Componentes
```typescript
// 1. Imports (React, librerías, componentes, hooks, tipos)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';

// 2. Props Interface
interface ProductCardProps {
  product: Product;
  onEdit: (id: number) => void;
}

// 3. Componente (Functional Component con Hooks)
export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit }) => {
  // Hooks
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Handlers
  const handleEdit = () => {
    onEdit(product.product_id);
  };

  // Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
};
```

### Hooks Personalizados
* **Patrón:** Retornan `{ data, isLoading, error, refetch }` (similar a React Query)
* **Ubicación:** `hooks/use*.ts`
* **Ejemplos:**
  - `useUserProfile()`: Carga perfil de usuario
  - `useApiQuery()`: Wrapper para React Query
  - `useTableState()`: Estado de tablas (paginación, filtros, ordenamiento)
  - `useForm()`: Manejo de formularios
  - `useRecharts()`: Configuración de gráficos

### Manejo de Errores
* **Try-Catch:** En funciones async dentro de componentes
* **Alertas:** Usar `AlertContext` para mostrar errores al usuario
* **Validación:** Funciones en `services/validation.ts`
* **Sanitización:** DOMPurify para inputs de usuario

### Estilos con Tailwind
* **Clases utilitarias:** Preferir clases de Tailwind sobre CSS custom
* **Modo oscuro:** Usar prefijo `dark:` para estilos oscuros
* **Variables CSS:** Usar variables HSL definidas en `src/index.css` para colores temáticos
* **Responsive:** Usar breakpoints de Tailwind (`sm:`, `md:`, `lg:`, `xl:`)

### Imports y Path Aliases
* **Alias configurado:** `@/` apunta a la raíz del proyecto
* **Ejemplo:** `import { Button } from '@/components/Button'`
* **Preferencia:** Imports relativos para archivos cercanos, absolutos para archivos lejanos

---

## 7. Flujos de Usuario Principales

### 1. Flujo de Donación
1. Usuario (Administrador/Operador) navega a `/donations`
2. Click en "Nueva Donación"
3. Selecciona donante (o crea uno nuevo)
4. Selecciona almacén de destino
5. Agrega items (producto, cantidad, precio unitario, descuento, fecha de expiración)
6. Sistema calcula totales (antes y después de descuento)
7. Guarda donación → Crea `donation_transaction` + `donation_items` + `stock_lots`

### 2. Flujo de Transacción de Cocina
1. Usuario (Administrador/Operador) navega a `/kitchen`
2. Crea solicitud de productos (selecciona productos y cantidades)
3. Estado inicial: `Pending`
4. Aprobador (Administrador/Operador) revisa y aprueba
5. Estado: `Approved` → `Completed`
6. Sistema reduce `current_quantity` en `stock_lots`
7. Notificaciones en tiempo real para aprobadores

### 3. Flujo de Gestión de Productos
1. Usuario (Administrador/Operador) navega a `/products`
2. Lista de productos con filtros (categoría, marca, búsqueda)
3. Crear/Editar producto: nombre, SKU, categoría, marca, unidad, umbral de stock bajo
4. Ver detalle: stocks por almacén, lotes, fechas de expiración
5. Alertas de stock bajo y productos próximos a vencer

### 4. Flujo de Reportes
1. **Reporte de Expiración** (`/expiry-report`): Productos próximos a vencer por almacén
2. **Análisis de Donantes** (`/donor-analysis`): Métricas de donantes (total donado, frecuencia, categorías más donadas)
3. **Dashboard** (`/dashboard`): Métricas generales (stock total, donaciones recientes, transacciones pendientes)

---

## 8. Componentes Clave y sus Ubicaciones

### Componentes de UI Reutilizables
* **`Button.tsx`:** Botón con variantes (primary, secondary, destructive) y tamaños
* **`Card.tsx`:** Tarjeta contenedora con sombras y bordes
* **`Table.tsx`:** Tabla con paginación, ordenamiento, filtros
* **`Dialog.tsx`:** Modal/Dialog reutilizable
* **`AlertDialog.tsx`:** Dialog de confirmación (eliminar, acciones destructivas)
* **`Badge.tsx`:** Badge para estados (Pending, Approved, etc.)
* **`LoadingSpinner.tsx`:** Spinner de carga con mensaje opcional
* **`Pagination.tsx`:** Paginación de tablas
* **`Combobox.tsx`:** Select con búsqueda
* **`CreatableCombobox.tsx`:** Select con opción de crear nuevo item
* **`DatePicker.tsx`:** Selector de fechas

### Componentes de Layout
* **`Sidebar.tsx`:** Barra lateral con navegación (colapsable en móvil)
* **`TopBar.tsx`:** Barra superior con usuario, notificaciones, tema
* **`Header.tsx`:** Header de página (título, acciones)
* **`Alerts.tsx`:** Contenedor de alertas globales (`AlertContainer`)

### Componentes de Dominio
* **`DonorForm.tsx`:** Formulario de donante
* **`StockLotsModal.tsx`:** Modal para ver/editar lotes de stock
* **`NotificationBell.tsx`:** Campana de notificaciones (cocina)
* **`ThemeToggle.tsx`:** Toggle de tema claro/oscuro

### Iconos
* **`components/icons/Icons.tsx`:** Todos los iconos SVG personalizados
* **Convención:** Todos los iconos exportan un componente React con props `React.SVGProps<SVGSVGElement>`
* **Base props:** `width: '24'`, `height: '24'`, `viewBox: '0 0 24 24'`, `fill: 'currentColor'`
* **Ejemplos:** `CubeIcon`, `ArchiveBoxIcon`, `TagIcon`, `BuildingStorefrontIcon`, `UserGroupIcon`, `ChartPieIcon`, `BellIcon`, `ChefHatIcon`, etc.

---

## 9. Servicios y APIs

### Estructura de `services/api.ts`
Funciones organizadas por dominio, todas con patrón similar:

```typescript
export const productApi = {
  getAll: async (token: string, filters?: {...}): Promise<Product[]> => {...},
  getById: async (token: string, id: number): Promise<Product | undefined> => {...},
  create: async (token: string, newItem: NewProduct): Promise<Product> => {...},
  update: async (token: string, id: number, updates: Partial<Product>): Promise<Product> => {...},
  delete: async (token: string, id: number): Promise<void> => {...},
  // Métodos específicos del dominio
  getStockByWarehouse: async (token: string, productId: number): Promise<StockLot[]> => {...},
};
```

### Servicios Disponibles
* **`warehouseApi`:** CRUD de almacenes, stock por almacén
* **`productApi`:** CRUD de productos, stock por producto, productos con stock bajo
* **`categoryApi`:** CRUD de categorías
* **`brandApi`:** CRUD de marcas
* **`unitApi`:** CRUD de unidades
* **`donorApi`:** CRUD de donantes, análisis de donantes
* **`donationApi`:** Crear donación, listar donaciones, obtener donación por ID
* **`transactionApi`:** CRUD de transacciones, aprobar/rechazar, completar
* **`userApi`:** CRUD de usuarios, acceso a almacenes
* **`roleApi`:** Listar roles

### Cliente de Supabase
* **Ubicación:** `services/supabase.ts`
* **Exportación:** `export const supabase` (única instancia)
* **Configuración:** Auto-refresh de tokens, persistencia de sesión
* **Variables de entorno:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Validación
* **Ubicación:** `services/validation.ts`
* Funciones de validación para formularios (email, teléfono, requeridos, etc.)

---

## 10. Estado Global y Contextos

### AuthContext (`contexts/AuthContext.tsx`)
* **Provee:** `user`, `session`, `loading`, `login`, `logout`, `signUp`, `getToken`
* **Uso:** `const { user, logout } = useAuth()`
* **Manejo de sesión:** Sincronizado con Supabase Auth

### ThemeContext (`contexts/ThemeContext.tsx`)
* **Provee:** `theme`, `toggleTheme`, `isDark`
* **Uso:** `const { theme, toggleTheme } = useTheme()`
* **Persistencia:** localStorage

### AlertContext (`contexts/AlertContext.tsx`)
* **Provee:** `showAlert`, `showSuccess`, `showError`, `showWarning`
* **Uso:** `const { showError } = useAlert()`
* **Render:** `<AlertContainer />` en `App.tsx`

### NotificationContext (`contexts/NotificationContext.tsx`)
* **Provee:** Notificaciones de transacciones de cocina
* **Uso:** Para notificaciones en tiempo real de solicitudes pendientes

### QueryProvider (`contexts/QueryProvider.tsx`)
* **Provee:** React Query Client configurado
* **Configuración:** Tiempos de cache, retry, refetch on window focus
* **Wrapper:** Envuelve toda la aplicación en `App.tsx`

---

## 11. Hooks Personalizados

### `useUserProfile()`
* **Ubicación:** `hooks/useUserProfile.ts`
* **Propósito:** Cargar perfil de usuario desde tabla `users`
* **Retorna:** `{ data: UserProfile, isLoading, error }`
* **Uso:** En componentes que necesitan información del usuario (rol, nombre)

### `useApiQuery()`
* **Ubicación:** `hooks/useApiQuery.ts`
* **Propósito:** Wrapper para React Query con configuración común
* **Uso:** Simplificar llamadas a API con cache y refetch automático

### `useTableState()`
* **Ubicación:** `hooks/useTableState.ts`
* **Propósito:** Manejo de estado de tablas (paginación, filtros, ordenamiento, búsqueda)
* **Retorna:** Estado y funciones para manipular tabla

### `useForm()`
* **Ubicación:** `hooks/useForm.ts`
* **Propósito:** Manejo de formularios con validación
* **Retorna:** Valores, errores, handlers

### `useRecharts()`
* **Ubicación:** `hooks/useRecharts.ts`
* **Propósito:** Configuración común para gráficos de Recharts
* **Uso:** En Dashboard y reportes

---

## 12. Páginas y Rutas

### Rutas Públicas
* **`/landing`:** Página de inicio (antes de login)
* **`/login`:** Página de inicio de sesión
* **`/ConfirmEmail`:** Confirmación de email (después de registro)

### Rutas Protegidas (requieren autenticación)
* **`/dashboard`:** Dashboard principal (todos los roles)
* **`/profile`:** Perfil de usuario (todos los roles)

### Rutas de Inventario (Administrador, Operador)
* **`/products`:** Gestión de productos
* **`/donations`:** Gestión de donaciones
* **`/donors`:** Gestión de donantes
* **`/donors/:id`:** Detalle de donante
* **`/warehouses`:** Lista de almacenes
* **`/warehouses/:id`:** Detalle de almacén (stock por producto)
* **`/expiry-report`:** Reporte de productos próximos a vencer
* **`/donor-analysis`:** Análisis de donantes

### Rutas de Administración (solo Administrador)
* **`/categories`:** Gestión de categorías
* **`/brands`:** Gestión de marcas
* **`/users`:** Gestión de usuarios
* **`/backup`:** Respaldo y reseteo del sistema

### Rutas de Cocina (Administrador, Operador, Consultor)
* **`/kitchen`:** Gestión de solicitudes de cocina
  - **Vista de Staff:** Crear solicitudes, ver propias
  - **Vista de Manager:** Aprobar/rechazar solicitudes, ver todas

---

## 13. Estilos y Temas

### Sistema de Colores (HSL)
Variables CSS definidas en `src/index.css`:

```css
--background, --foreground
--primary, --primary-foreground, --primary-hover, --primary-light
--secondary, --secondary-foreground
--destructive, --destructive-foreground
--success, --success-foreground
--warning, --warning-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--card, --card-foreground, --card-hover
--border, --input, --ring
--inventory-high, --inventory-medium, --inventory-low, --inventory-expired
```

### Modo Oscuro
* Activado con clase `dark` en elemento raíz
* Toggle mediante `ThemeToggle` component
* Persistido en localStorage

### Responsive Design
* **Breakpoints Tailwind:** `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
* **Sidebar:** Colapsable en móvil, siempre visible en desktop
* **Tablas:** Scroll horizontal en móvil
* **Formularios:** Stack vertical en móvil, grid en desktop

### Animaciones
* **`content-show`:** Aparición de modales/dialogs
* **`slide-up`:** Elementos que aparecen desde abajo
* **`slide-in-right`:** Sidebar móvil

---

## 14. Configuración de Vite

### Archivo: `vite.config.ts`
* **Puerto:** 3000
* **Host:** 0.0.0.0 (accesible desde red local)
* **Base:** `./` (rutas relativas)
* **Alias:** `@/` → raíz del proyecto
* **Plugins:** React plugin, bundle analyzer (dev)
* **Optimizaciones:** Source maps, chunk size limits, optimizeDeps

### Variables de Entorno
* **`VITE_SUPABASE_URL`:** URL del proyecto Supabase
* **`VITE_SUPABASE_ANON_KEY`:** Clave anónima de Supabase
* **Uso:** `(import.meta as any).env?.VITE_SUPABASE_URL`

---

## 15. TypeScript y Tipado

### Configuración (`tsconfig.json`)
* **Target:** ES2022
* **Module:** ESNext
* **JSX:** react-jsx
* **Module Resolution:** bundler
* **Paths:** `@/*` → `./*`

### Tipos Generados
* **`types.ts`:** Tipos generados desde Supabase (Database type)
* **Tipos adicionales:**
  - `Product`, `NewProduct`, `Warehouse`, `NewWarehouse`, etc.
  - `Donation`, `NewDonation`, `DonorAnalysisData`
  - `KitchenRequestNotification`
  - `Transaction`, `NewTransaction`, `TransactionDetail`

### Convenciones de Tipado
* **Interfaces para Props:** `ComponentNameProps`
* **Tipos de Database:** Usar tipos de `Database['public']['Tables']['table_name']['Row']`
* **Tipos de Insert:** `Database['public']['Tables']['table_name']['Insert']`
* **Evitar `any`:** Usar `unknown` o tipos específicos

---

## 16. Testing y Calidad de Código

### Linting
* **ESLint:** Configurado con reglas de TypeScript y React
* **Script:** `npm run lint`, `npm run lint:fix`

### Formateo
* **Prettier:** Formateo automático
* **Script:** `npm run format`, `npm run format:check`

### Git Hooks
* **Husky:** Hooks de pre-commit
* **lint-staged:** Ejecuta ESLint y Prettier en archivos staged
* **Configuración:** En `package.json` → `lint-staged`

---

## 17. Despliegue

### Plataforma de Despliegue
* **Vercel:** Configurado en `vercel.json`
* **Build Command:** `vite build`
* **Output Directory:** `dist`

### Service Worker (PWA)
* **Ubicación:** `public/sw.js`
* **Propósito:** Funcionalidad offline, cache de recursos

### Variables de Entorno en Producción
* Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel

---

## 18. Decisiones de Diseño Importantes

### 1. **BaaS en lugar de Backend Propio**
- **Razón:** Reducir complejidad y costos de mantenimiento
- **Beneficio:** Escalabilidad, autenticación, base de datos gestionada

### 2. **React Query para Server State**
- **Razón:** Cache automático, refetch, optimistic updates
- **Beneficio:** Mejor UX, menos llamadas a API

### 3. **Context API para UI State**
- **Razón:** Simplicidad, sin necesidad de librerías adicionales
- **Beneficio:** Menos dependencias, más control

### 4. **Tailwind CSS en lugar de CSS Modules**
- **Razón:** Desarrollo más rápido, consistencia, tema fácil
- **Beneficio:** Menos CSS custom, mejor mantenibilidad

### 5. **Iconos SVG Custom**
- **Razón:** Control total, sin dependencias, mejor rendimiento
- **Beneficio:** Bundle más pequeño, personalización fácil

### 6. **Lazy Loading de Páginas**
- **Razón:** Mejor rendimiento inicial, code splitting automático
- **Beneficio:** Carga más rápida, mejor experiencia

### 7. **Soft Delete (is_active)**
- **Razón:** Preservar historial, auditoría
- **Beneficio:** Datos completos, posibilidad de recuperación

---

## 19. Próximos Pasos y Mejoras Futuras

### Funcionalidades Pendientes
* Internacionalización (i18n)
* Exportación de reportes a PDF/Excel
* Notificaciones por email
* Dashboard con más métricas y gráficos
* Historial de cambios (auditoría completa)

### Mejoras Técnicas
* Tests unitarios (Jest + React Testing Library)
* Tests E2E (Playwright o Cypress)
* Mejor manejo de errores (Error Boundaries)
* Optimización de imágenes
* Mejora de accesibilidad (ARIA labels, keyboard navigation)

---

## 20. Referencias y Recursos

### Documentación Oficial
* [React Documentation](https://react.dev/)
* [TypeScript Documentation](https://www.typescriptlang.org/docs/)
* [Vite Documentation](https://vitejs.dev/)
* [Supabase Documentation](https://supabase.com/docs)
* [TanStack Query Documentation](https://tanstack.com/query/latest)
* [Tailwind CSS Documentation](https://tailwindcss.com/docs)
* [React Router Documentation](https://reactrouter.com/)

### Archivos Clave para Referencia
* **`App.tsx`:** Estructura de rutas y providers
* **`types.ts`:** Todos los tipos de la aplicación
* **`services/api.ts`:** Todas las funciones de API
* **`services/supabase.ts`:** Configuración de Supabase
* **`contexts/AuthContext.tsx`:** Autenticación
* **`components/icons/Icons.tsx`:** Todos los iconos disponibles

---

## 21. Comandos Útiles

### Desarrollo
```bash
npm run dev          # Iniciar servidor de desarrollo (puerto 3000)
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Ejecutar ESLint y auto-fix
npm run format       # Formatear código con Prettier
npm run format:check # Verificar formato
```

### Git
```bash
git commit           # Pre-commit hook ejecuta lint-staged automáticamente
```

---

## 22. Notas Importantes para IA

### Al Generar Código
1. **Siempre usar componentes funcionales y Hooks** (NO clases)
2. **Usar TypeScript** con tipos apropiados (NO `any`)
3. **Seguir la estructura de directorios** existente
4. **Usar iconos de `components/icons/Icons.tsx`** (NO librerías externas)
5. **Usar Tailwind CSS** para estilos (NO CSS modules o styled-components)
6. **Usar React Query** para datos del servidor (NO fetch directo)
7. **Usar Context API** para estado global de UI (NO Redux/Zustand)
8. **Validar inputs** con funciones de `services/validation.ts`
9. **Manejar errores** con `AlertContext`
10. **Seguir convenciones de nomenclatura** definidas

### Al Modificar Código Existente
1. **Mantener la estructura** y patrones existentes
2. **No romper la tipación** TypeScript
3. **Actualizar tipos** en `types.ts` si se modifica la base de datos
4. **Probar en modo claro y oscuro** si se modifica UI
5. **Verificar responsive** en móvil y desktop
6. **Actualizar este documento** si se hacen cambios arquitectónicos importantes

### Al Agregar Nuevas Funcionalidades
1. **Crear tipos** en `types.ts` si es necesario
2. **Agregar funciones de API** en `services/api.ts`
3. **Crear hooks personalizados** si la lógica es reutilizable
4. **Agregar rutas** en `App.tsx` con protección apropiada
5. **Documentar** en este archivo si es una funcionalidad importante

---

**Última actualización:** [Fecha de última modificación]  
**Versión del documento:** 1.0

