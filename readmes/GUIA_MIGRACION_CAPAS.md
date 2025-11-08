# 🚀 Guía de Migración a Arquitectura por Capas

## 📋 Checklist de Migración

### ✅ Fase 1: Preparación de Estructura

#### Paso 1.1: Crear estructura de carpetas
```bash
# Crear estructura base
mkdir -p src/app/providers
mkdir -p src/presentation/components/{ui,forms,layout,icons,animated}
mkdir -p src/presentation/pages/{auth,dashboard,products,donations,donors,warehouses,kitchen,users,profile,categories,brands,reports,backup,landing}
mkdir -p src/presentation/features/{donations,products,shared}
mkdir -p src/domain/{entities,services,types}
mkdir -p src/data/{repositories,api,validation}
mkdir -p src/infrastructure/{config,utils,hooks/charts}
mkdir -p src/shared/{constants,types}
```

#### Paso 1.2: Actualizar tsconfig.json con path aliases
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/app/*": ["./src/app/*"],
      "@/presentation/*": ["./src/presentation/*"],
      "@/domain/*": ["./src/domain/*"],
      "@/data/*": ["./src/data/*"],
      "@/infrastructure/*": ["./src/infrastructure/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

#### Paso 1.3: Actualizar vite.config.ts
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/app': path.resolve(__dirname, './src/app'),
    '@/presentation': path.resolve(__dirname, './src/presentation'),
    '@/domain': path.resolve(__dirname, './src/domain'),
    '@/data': path.resolve(__dirname, './src/data'),
    '@/infrastructure': path.resolve(__dirname, './src/infrastructure'),
    '@/shared': path.resolve(__dirname, './src/shared'),
  },
}
```

### ✅ Fase 2: Mover App y Providers

#### Paso 2.1: Mover App.tsx
```bash
# Mover App.tsx
mv App.tsx src/app/App.tsx
```

#### Paso 2.2: Actualizar src/main.tsx
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import '@/presentation/styles/index.css'
import '@/infrastructure/utils/theme-init'
```

#### Paso 2.3: Mover Contextos a Providers
```bash
# Mover contextos
mv contexts/AuthContext.tsx src/app/providers/AuthProvider.tsx
mv contexts/ThemeContext.tsx src/app/providers/ThemeProvider.tsx
mv contexts/NotificationContext.tsx src/app/providers/NotificationProvider.tsx
mv contexts/AlertContext.tsx src/app/providers/AlertProvider.tsx
mv contexts/QueryProvider.tsx src/app/providers/QueryProvider.tsx
```

#### Paso 2.4: Actualizar App.tsx con nuevos imports
```typescript
import { AuthProvider } from '@/app/providers/AuthProvider'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
// ... etc
```

### ✅ Fase 3: Reorganizar Presentación

#### Paso 3.1: Mover Componentes UI Base
```bash
# Componentes UI
mv components/Button.tsx src/presentation/components/ui/Button.tsx
mv components/Badge.tsx src/presentation/components/ui/Badge.tsx
mv components/Card.tsx src/presentation/components/ui/Card.tsx
mv components/Dialog.tsx src/presentation/components/ui/Dialog.tsx
mv components/AlertDialog.tsx src/presentation/components/ui/AlertDialog.tsx
mv components/LoadingSpinner.tsx src/presentation/components/ui/LoadingSpinner.tsx
mv components/Pagination.tsx src/presentation/components/ui/Pagination.tsx
mv components/Table.tsx src/presentation/components/ui/Table.tsx
```

#### Paso 3.2: Mover Componentes de Formulario
```bash
# Componentes de formulario
mv components/forms.tsx src/presentation/components/forms/index.tsx
# Separar Input, Label, FormError en archivos individuales si es necesario
```

#### Paso 3.3: Mover Componentes de Layout
```bash
# Layout
mv components/Header.tsx src/presentation/components/layout/Header.tsx
mv components/Sidebar.tsx src/presentation/components/layout/Sidebar.tsx
mv components/TopBar.tsx src/presentation/components/layout/TopBar.tsx
```

#### Paso 3.4: Mover Iconos y Animaciones
```bash
# Iconos
mv components/icons src/presentation/components/icons

# Animaciones
mv components/Animated.tsx src/presentation/components/animated/Animated.tsx
```

#### Paso 3.5: Mover Páginas
```bash
# Páginas organizadas por dominio
mv pages/Login.tsx src/presentation/pages/auth/Login.tsx
mv pages/ConfirmEmail.tsx src/presentation/pages/auth/ConfirmEmail.tsx
mv pages/Dashboard.tsx src/presentation/pages/dashboard/Dashboard.tsx
mv pages/Products.tsx src/presentation/pages/products/Products.tsx
mv pages/Donations.tsx src/presentation/pages/donations/Donations.tsx
mv pages/Donors.tsx src/presentation/pages/donors/Donors.tsx
mv pages/DonorDetail.tsx src/presentation/pages/donors/DonorDetail.tsx
mv pages/DonorAnalysis.tsx src/presentation/pages/donors/DonorAnalysis.tsx
mv pages/Warehouses.tsx src/presentation/pages/warehouses/Warehouses.tsx
mv pages/WarehouseDetail.tsx src/presentation/pages/warehouses/WarehouseDetail.tsx
mv pages/Kitchen.tsx src/presentation/pages/kitchen/Kitchen.tsx
mv pages/kitchen/* src/presentation/pages/kitchen/
mv pages/Users.tsx src/presentation/pages/users/Users.tsx
mv pages/Profile.tsx src/presentation/pages/profile/Profile.tsx
mv pages/Categories.tsx src/presentation/pages/categories/Categories.tsx
mv pages/Brands.tsx src/presentation/pages/brands/Brands.tsx
mv pages/ExpiryReport.tsx src/presentation/pages/reports/ExpiryReport.tsx
mv pages/Backup.tsx src/presentation/pages/backup/Backup.tsx
mv pages/Landing.tsx src/presentation/pages/landing/Landing.tsx
```

#### Paso 3.6: Mover Componentes de Features
```bash
# Features
mv components/DonorForm.tsx src/presentation/features/donations/DonorForm.tsx
mv components/StockLotsModal.tsx src/presentation/features/products/StockLotsModal.tsx
mv components/NotificationBell.tsx src/presentation/features/shared/NotificationBell.tsx
mv components/ThemeToggle.tsx src/presentation/features/shared/ThemeToggle.tsx
mv components/Combobox.tsx src/presentation/features/shared/Combobox.tsx
mv components/CreatableCombobox.tsx src/presentation/features/shared/CreatableCombobox.tsx
mv components/DatePicker.tsx src/presentation/features/shared/DatePicker.tsx
```

#### Paso 3.7: Mover Estilos
```bash
# Estilos
mv src/index.css src/presentation/styles/index.css
```

### ✅ Fase 4: Reorganizar Dominio

#### Paso 4.1: Separar Tipos
```bash
# Crear archivos de tipos por dominio
# Extraer tipos de types.ts y separarlos en:
# - src/domain/types/product.types.ts
# - src/domain/types/donation.types.ts
# - src/domain/types/donor.types.ts
# - src/domain/types/warehouse.types.ts
# - src/domain/types/user.types.ts
# - src/domain/types/kitchen.types.ts
# - src/domain/types/common.types.ts
```

#### Paso 4.2: Crear Entidades
```bash
# Crear entidades de dominio (opcional, si se quiere separar lógica)
# src/domain/entities/Product.ts
# src/domain/entities/Donation.ts
# etc.
```

#### Paso 4.3: Crear Servicios de Dominio
```bash
# Mover lógica de negocio de páginas a servicios
# src/domain/services/donation.service.ts
# src/domain/services/product.service.ts
# etc.
```

### ✅ Fase 5: Reorganizar Acceso a Datos

#### Paso 5.1: Mover Servicios API
```bash
# API
mv services/supabase.ts src/data/api/client.ts
mv services/api.ts src/data/api/index.ts

# Separar api.ts en múltiples archivos:
# - src/data/api/product.api.ts
# - src/data/api/donation.api.ts
# - src/data/api/donor.api.ts
# - src/data/api/warehouse.api.ts
# - src/data/api/user.api.ts
# - src/data/api/kitchen.api.ts
```

#### Paso 5.2: Crear Repositorios (Opcional)
```bash
# Repositorios (abstracción sobre API)
# src/data/repositories/product.repository.ts
# src/data/repositories/donation.repository.ts
# etc.
```

#### Paso 5.3: Mover Validaciones
```bash
# Validaciones
mv services/validation.ts src/data/validation/index.ts

# Separar en:
# - src/data/validation/product.validation.ts
# - src/data/validation/donation.validation.ts
# etc.
```

### ✅ Fase 6: Reorganizar Infraestructura

#### Paso 6.1: Mover Hooks
```bash
# Hooks
mv hooks/useApiQuery.ts src/infrastructure/hooks/useApiQuery.ts
mv hooks/useForm.ts src/infrastructure/hooks/useForm.ts
mv hooks/useTableState.ts src/infrastructure/hooks/useTableState.ts
mv hooks/useUserProfile.ts src/infrastructure/hooks/useUserProfile.ts
mv hooks/useChartColors.ts src/infrastructure/hooks/charts/useChartColors.ts
mv hooks/useChartTheme.ts src/infrastructure/hooks/charts/useChartTheme.ts
mv hooks/useRecharts.ts src/infrastructure/hooks/charts/useRecharts.ts
mv hooks/useXLSX.ts src/infrastructure/hooks/useXLSX.ts
```

#### Paso 6.2: Mover Utilidades
```bash
# Utilidades
mv src/utils/theme-init.ts src/infrastructure/utils/theme.util.ts
# Crear otras utilidades según necesidad:
# - src/infrastructure/utils/date.util.ts
# - src/infrastructure/utils/format.util.ts
# - src/infrastructure/utils/validation.util.ts
```

#### Paso 6.3: Crear Configuraciones
```bash
# Configuraciones
# src/infrastructure/config/supabase.config.ts
# src/infrastructure/config/query.config.ts
# src/infrastructure/config/app.config.ts
```

### ✅ Fase 7: Reorganizar Compartido

#### Paso 7.1: Crear Constantes
```bash
# Constantes
# src/shared/constants/routes.constants.ts
# src/shared/constants/roles.constants.ts
# src/shared/constants/app.constants.ts
```

#### Paso 7.2: Mover Tipos Compartidos
```bash
# Tipos compartidos
# src/shared/types/common.types.ts
```

### ✅ Fase 8: Actualizar Imports

#### Paso 8.1: Crear Script de Actualización
```bash
# Usar find-and-replace para actualizar imports
# Buscar y reemplazar:
# - './components/Button' -> '@/presentation/components/ui/Button'
# - './pages/Login' -> '@/presentation/pages/auth/Login'
# - './contexts/AuthContext' -> '@/app/providers/AuthProvider'
# - './hooks/useApiQuery' -> '@/infrastructure/hooks/useApiQuery'
# - './services/api' -> '@/data/api'
# etc.
```

#### Paso 8.2: Actualizar Exports
```bash
# Crear archivos index.ts para exports centralizados
# src/presentation/components/ui/index.ts
# src/presentation/components/layout/index.ts
# src/presentation/pages/auth/index.ts
# etc.
```

### ✅ Fase 9: Limpieza

#### Paso 9.1: Eliminar Archivos Antiguos
```bash
# Eliminar carpetas vacías
rmdir components
rmdir pages
rmdir contexts
rmdir hooks
rmdir services
```

#### Paso 9.2: Actualizar Documentación
```bash
# Actualizar README.md
# Actualizar documentación en readmes/
```

## 🔧 Configuración de Path Aliases

### tsconfig.json
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/presentation/*": ["./src/presentation/*"],
      "@/domain/*": ["./src/domain/*"],
      "@/data/*": ["./src/data/*"],
      "@/infrastructure/*": ["./src/infrastructure/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

### vite.config.ts
```typescript
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/presentation': path.resolve(__dirname, './src/presentation'),
      '@/domain': path.resolve(__dirname, './src/domain'),
      '@/data': path.resolve(__dirname, './src/data'),
      '@/infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
```

## 📝 Ejemplos de Imports Actualizados

### Antes
```typescript
import Button from './components/Button'
import { useAuth } from './contexts/AuthContext'
import { useApiQuery } from './hooks/useApiQuery'
import { productApi } from './services/api'
import Login from './pages/Login'
```

### Después
```typescript
import { Button } from '@/presentation/components/ui/Button'
import { useAuth } from '@/app/providers/AuthProvider'
import { useApiQuery } from '@/infrastructure/hooks/useApiQuery'
import { productApi } from '@/data/api/product.api'
import Login from '@/presentation/pages/auth/Login'
```

## ⚠️ Consideraciones

1. **Migración Gradual:**
   - Hacer la migración módulo por módulo
   - Verificar que cada módulo funciona antes de continuar

2. **Testing:**
   - Probar después de cada fase
   - Verificar que no hay imports rotos
   - Verificar que el build funciona

3. **Git:**
   - Hacer commits frecuentes
   - Crear una rama para la migración
   - Revisar cambios antes de mergear

4. **Documentación:**
   - Actualizar README con nueva estructura
   - Documentar convenciones
   - Actualizar guías de desarrollo

## 🎯 Siguiente Paso

Una vez completada la migración, considerar:
- Implementar tests unitarios para cada capa
- Documentar las convenciones de la arquitectura
- Crear templates para nuevas features
- Establecer guías de desarrollo

