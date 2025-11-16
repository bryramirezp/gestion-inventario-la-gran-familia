# Sistema de Gestión de Inventario - La Gran Familia

Sistema web para la gestión integral de inventario de donaciones, diseñado para la ONG "La Gran Familia". Permite registrar productos, gestionar donaciones, controlar almacenes y generar reportes, optimizando la administración de recursos donados.

## Descripción

Solución full-stack que centraliza la gestión de inventario mediante un frontend React moderno y un backend serverless con Supabase. El sistema gestiona productos, donaciones, donantes, almacenes y usuarios con control de acceso basado en roles. Incluye funcionalidades de trazabilidad, reportes de expiración, análisis de donantes y exportación de datos.

## Stack Tecnológico

### Frontend
- **React 18.3.1** - Biblioteca para interfaces de usuario
- **TypeScript 5.9.3** - Tipado estático
- **Vite 7.1.12** - Build tool y dev server
- **Tailwind CSS 3.4.18** - Framework CSS utilitario
- **React Router DOM 6.30.1** - Enrutamiento
- **TanStack React Query 5.59.16** - Gestión de estado del servidor y caché
- **Recharts 2.15.4** - Gráficos y visualizaciones
- **Zod 4.1.12** - Validación de esquemas
- **ExcelJS 4.4.0** - Exportación a Excel
- **React Window 2.2.3** - Virtualización de listas

### Backend
- **Supabase 2.76.1** - Backend-as-a-Service
  - PostgreSQL - Base de datos relacional
  - Supabase Auth - Autenticación y autorización
  - Row Level Security (RLS) - Seguridad a nivel de fila
  - Funciones PostgreSQL - Lógica de negocio en base de datos

### Desarrollo
- **ESLint** - Linter de código
- **Prettier** - Formateo automático
- **Husky** - Git hooks
- **Vitest 4.0.8** - Framework de testing
- **Testing Library** - Utilidades para testing de componentes

## Instalación

### Prerrequisitos
- Node.js 18+ y npm
- Cuenta de Supabase (para base de datos)

### Pasos

1. **Clonar el repositorio:**
```bash
git clone <url-del-repositorio>
cd gestion-inventario-la-gran-familia
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
Crear archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
```

4. **Configurar la base de datos:**
Ejecutar los scripts SQL en el orden indicado (ubicados en `init/`):
- `database-schema-synced-with-code.sql` - Estructura de tablas
- `auth.sql` - Configuración de autenticación
- `rls_policies.sql` - Políticas de seguridad
- `grant_permissions.sql` - Permisos de usuarios
- `functions/create_donation_atomic.sql` - Función para donaciones
- `functions/validate_stock_available.sql` - Validación de stock
- `seed_data.sql` - Datos iniciales (opcional)

5. **Iniciar el servidor de desarrollo:**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Uso

### Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor de desarrollo (puerto 3000)

# Construcción
npm run build            # Genera build de producción
npm run build:analyze    # Build con análisis de bundle

# Preview
npm run preview          # Preview del build de producción

# Calidad de código
npm run lint             # Ejecuta ESLint
npm run lint:fix         # Corrige errores de ESLint automáticamente
npm run format           # Formatea código con Prettier
npm run format:check     # Verifica formato sin modificar

# Testing
npm run test             # Ejecuta tests en modo watch
npm run test:ui          # Interfaz visual de tests
npm run test:coverage    # Tests con cobertura
npm run test:run         # Ejecuta tests una vez
npm run test:report      # Genera reporte completo de tests
```

## Lógica y Funcionamiento

### Frontend

**Arquitectura:**
El proyecto sigue una arquitectura limpia (Clean Architecture) con separación de capas:

- **`/app`** - Configuración de la aplicación, providers y componentes de inicialización
- **`/presentation`** - Componentes UI, páginas y features
- **`/domain`** - Tipos TypeScript y esquemas de validación (Zod)
- **`/data`** - Capa de acceso a datos (APIs de Supabase)
- **`/infrastructure`** - Hooks personalizados, utilidades y configuración
- **`/shared`** - Constantes y tipos compartidos

**Gestión de Estado:**
- **TanStack React Query**: Caché de datos del servidor, sincronización automática y gestión de estados de carga/error
- **Context API**: Estado global para autenticación, tema, alertas y notificaciones
- **React Router**: Navegación con rutas protegidas basadas en roles

**Componentes Principales:**
- **Layout**: Sidebar colapsable, TopBar con notificaciones y tema
- **Formularios**: Validación con Zod y React Hook Form
- **Tablas**: Virtualización para grandes volúmenes de datos
- **Gráficos**: Visualizaciones responsivas con Recharts

**Control de Acceso:**
- Rutas protegidas con componente `ProtectedRoute`
- Tres roles: Administrador, Operador, Consultor
- Permisos granulares por funcionalidad

### Backend

**Base de Datos (PostgreSQL):**
- **Tablas principales**: `products`, `donation_transactions`, `donation_items`, `stock_lots`, `donors`, `warehouses`, `categories`, `brands`, `users`
- **Relaciones**: Foreign keys con integridad referencial
- **Triggers**: Cálculo automático de totales en donaciones

**Seguridad (RLS):**
- Políticas Row Level Security por tabla
- Acceso basado en roles de usuario
- Validación de permisos en cada operación

**Funciones PostgreSQL:**
- `create_donation_atomic`: Crea donación y lotes de stock de forma transaccional
- `validate_stock_available`: Valida disponibilidad de stock antes de operaciones

**Flujos de Datos:**
1. **Registro de Donación:**
   - Usuario completa formulario con items
   - Se llama a `create_donation_atomic` (función PostgreSQL)
   - Se crea registro en `donation_transactions`
   - Se crean registros en `donation_items`
   - Se generan `stock_lots` automáticamente
   - Se calculan totales (market_value, actual_value)

2. **Consulta de Productos:**
   - Query optimizado con JOINs a categorías, marcas, unidades
   - Carga de `stock_lots` filtrados por almacén
   - Cálculo de `total_stock` y `days_to_expiry` en memoria
   - Soporte para filtros, búsqueda y paginación

3. **Gestión de Stock:**
   - Cada producto puede tener múltiples lotes (`stock_lots`)
   - Lotes vinculados a donaciones mediante `donation_item_id`
   - Control de fechas de expiración y estado `is_expired`
   - Cálculo de stock disponible excluyendo lotes vencidos

## Endpoints de la API

El sistema utiliza Supabase como backend, accediendo directamente a las tablas mediante el cliente JavaScript. Las operaciones se realizan mediante queries de Supabase:

### Productos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `products` | Obtiene todos los productos |
| `GET` | `products?product_id=eq.{id}` | Obtiene producto por ID |
| `POST` | `products` | Crea nuevo producto |
| `PATCH` | `products?product_id=eq.{id}` | Actualiza producto |
| `DELETE` | `products?product_id=eq.{id}` | Elimina producto |
| `RPC` | `get_full_product_details` | Obtiene productos con información relacionada (JOINs) |

### Donaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| `RPC` | `create_donation_atomic` | Crea donación con items y lotes de forma atómica |
| `GET` | `donation_transactions` | Obtiene historial de donaciones con filtros |
| `PATCH` | `donation_items?item_id=eq.{id}` | Actualiza item de donación |
| `DELETE` | `donation_transactions?donation_id=eq.{id}` | Elimina donación |

### Donantes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `donors` | Obtiene todos los donantes |
| `GET` | `donors?donor_id=eq.{id}` | Obtiene donante por ID |
| `POST` | `donors` | Crea nuevo donante |
| `PATCH` | `donors?donor_id=eq.{id}` | Actualiza donante |
| `DELETE` | `donors?donor_id=eq.{id}` | Elimina donante |

### Almacenes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `warehouses` | Obtiene todos los almacenes |
| `GET` | `warehouses?warehouse_id=eq.{id}` | Obtiene almacén por ID |
| `POST` | `warehouses` | Crea nuevo almacén |
| `PATCH` | `warehouses?warehouse_id=eq.{id}` | Actualiza almacén |
| `DELETE` | `warehouses?warehouse_id=eq.{id}` | Elimina almacén |

### Categorías y Marcas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `categories` | Obtiene todas las categorías |
| `POST` | `categories` | Crea nueva categoría |
| `PATCH` | `categories?category_id=eq.{id}` | Actualiza categoría |
| `DELETE` | `categories?category_id=eq.{id}` | Elimina categoría |
| `GET` | `brands` | Obtiene todas las marcas |
| `POST` | `brands` | Crea nueva marca |
| `PATCH` | `brands?brand_id=eq.{id}` | Actualiza marca |
| `DELETE` | `brands?brand_id=eq.{id}` | Elimina marca |

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `users` | Obtiene todos los usuarios (solo Administrador) |
| `POST` | `users` | Crea nuevo usuario |
| `PATCH` | `users?user_id=eq.{id}` | Actualiza usuario |
| `DELETE` | `users?user_id=eq.{id}` | Elimina usuario |

### Autenticación (Supabase Auth)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `auth/v1/signup` | Registro de usuario |
| `POST` | `auth/v1/token` | Inicio de sesión |
| `POST` | `auth/v1/logout` | Cerrar sesión |
| `POST` | `auth/v1/recover` | Recuperación de contraseña |
| `GET` | `auth/v1/user` | Obtiene usuario actual |

**Nota:** Todas las operaciones requieren autenticación mediante token JWT y están sujetas a políticas RLS según el rol del usuario.

## Estructura del Proyecto

```
gestion-inventario-la-gran-familia/
├── src/
│   ├── app/                    # Configuración de aplicación
│   │   ├── components/         # ErrorBoundary, EnvChecker, AppInitializer
│   │   └── providers/          # AuthProvider, QueryProvider, ThemeProvider, etc.
│   ├── data/                   # Capa de acceso a datos
│   │   ├── api/                # Clientes de API (Supabase)
│   │   └── validation/         # Validaciones de datos
│   ├── domain/                 # Lógica de dominio
│   │   ├── types/              # Tipos TypeScript
│   │   └── validations/         # Esquemas Zod
│   ├── infrastructure/         # Infraestructura
│   │   ├── config/              # Configuraciones (Supabase, Query, App)
│   │   ├── hooks/               # Hooks personalizados
│   │   └── utils/               # Utilidades (fechas, formato, tema)
│   ├── presentation/           # Capa de presentación
│   │   ├── components/          # Componentes UI reutilizables
│   │   ├── features/            # Features específicos (formularios)
│   │   ├── pages/               # Páginas de la aplicación
│   │   └── styles/              # Estilos globales
│   └── shared/                 # Código compartido
│       ├── constants/           # Constantes (rutas, roles)
│       └── types/               # Tipos compartidos
├── init/                       # Scripts SQL de inicialización
│   ├── database-schema-synced-with-code.sql
│   ├── auth.sql
│   ├── rls_policies.sql
│   └── functions/              # Funciones PostgreSQL
├── tests/                      # Tests unitarios e integración
├── public/                     # Assets estáticos
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Características Principales

- **Gestión de Inventario**: Productos con categorías, marcas, unidades y control de stock por lotes
- **Sistema de Donaciones**: Registro de donaciones con trazabilidad completa
- **Gestión de Donantes**: Base de datos de donantes con análisis de contribuciones
- **Control de Almacenes**: Múltiples almacenes con stock independiente
- **Reportes**: Reporte de productos próximos a expirar y análisis de donantes
- **Exportación**: Exportación de datos a Excel
- **Backup**: Funcionalidad de respaldo de datos
- **Autenticación**: Sistema de usuarios con roles y permisos
- **Tema**: Modo claro/oscuro con persistencia
- **Responsive**: Diseño adaptativo para móviles y tablets

## Despliegue

El proyecto está configurado para desplegarse en **Vercel**:

1. Conectar repositorio a Vercel
2. Configurar variables de entorno en el dashboard de Vercel
3. El build se ejecuta automáticamente con `npm run build`
4. La aplicación se despliega en la URL proporcionada por Vercel

**Configuración de Vercel** (`vercel.json`):
- Headers de seguridad (CSP, HSTS, X-Frame-Options)
- Rewrites para SPA (Single Page Application)
- Configuración de caché para assets estáticos

## Contribución

Este proyecto fue desarrollado como parte de un servicio social para la ONG "La Gran Familia". Para contribuciones:

1. Crear una rama desde `main`
2. Realizar cambios y commits descriptivos
3. Ejecutar `npm run lint` y `npm run test` antes de commitear
4. Crear Pull Request con descripción detallada

## Licencia

Este proyecto es de uso interno para la ONG "La Gran Familia".
