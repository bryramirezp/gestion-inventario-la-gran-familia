# 📊 Resumen: Reorganización por Capas

## 🎯 Objetivo

Reorganizar el proyecto de una estructura **por tipo de archivo** a una estructura **por capas técnicas** que mejore:
- ✅ Separación de responsabilidades
- ✅ Escalabilidad
- ✅ Mantenibilidad
- ✅ Testabilidad
- ✅ Reutilización de código

## 📐 Comparación: Estructura Actual vs Propuesta

### Estructura Actual (por tipo de archivo)

```
proyecto/
├── components/          # Todos los componentes mezclados
├── pages/              # Todas las páginas mezcladas
├── contexts/           # Todos los contextos
├── hooks/              # Todos los hooks
├── services/           # Todos los servicios
└── types.ts            # Todos los tipos en un archivo
```

**Problemas:**
- ❌ No hay separación entre UI base y componentes de dominio
- ❌ Lógica de negocio mezclada con presentación
- ❌ Difícil encontrar código relacionado
- ❌ Difícil escalar y mantener

### Estructura Propuesta (por capas técnicas)

```
src/
├── app/                # Configuración de la aplicación
├── presentation/       # Capa de Presentación (UI)
├── domain/             # Capa de Dominio (Lógica de Negocio)
├── data/               # Capa de Acceso a Datos
├── infrastructure/     # Capa de Infraestructura
└── shared/             # Código compartido
```

**Beneficios:**
- ✅ Separación clara de responsabilidades
- ✅ Fácil encontrar código por capa
- ✅ Fácil testear cada capa independientemente
- ✅ Fácil escalar y mantener

## 🗺️ Mapa de Migración

### Capa 1: App (Configuración)
**Origen:** `App.tsx`, `contexts/`
**Destino:** `src/app/`
**Archivos:**
- `App.tsx` → `src/app/App.tsx`
- `contexts/AuthContext.tsx` → `src/app/providers/AuthProvider.tsx`
- `contexts/ThemeContext.tsx` → `src/app/providers/ThemeProvider.tsx`
- `contexts/NotificationContext.tsx` → `src/app/providers/NotificationProvider.tsx`
- `contexts/AlertContext.tsx` → `src/app/providers/AlertProvider.tsx`
- `contexts/QueryProvider.tsx` → `src/app/providers/QueryProvider.tsx`

### Capa 2: Presentation (UI)
**Origen:** `components/`, `pages/`
**Destino:** `src/presentation/`
**Subdivisiones:**
- **UI Base:** `components/Button.tsx` → `src/presentation/components/ui/Button.tsx`
- **Layout:** `components/Sidebar.tsx` → `src/presentation/components/layout/Sidebar.tsx`
- **Forms:** `components/forms.tsx` → `src/presentation/components/forms/index.tsx`
- **Icons:** `components/icons/` → `src/presentation/components/icons/`
- **Pages:** `pages/Login.tsx` → `src/presentation/pages/auth/Login.tsx`
- **Features:** `components/DonorForm.tsx` → `src/presentation/features/donations/DonorForm.tsx`

### Capa 3: Domain (Lógica de Negocio)
**Origen:** Lógica en `pages/`, `types.ts`
**Destino:** `src/domain/`
**Archivos:**
- `types.ts` → Separar en `src/domain/types/*.types.ts`
- Crear `src/domain/services/*.service.ts` (lógica de negocio)
- Crear `src/domain/entities/*.ts` (entidades de dominio)

### Capa 4: Data (Acceso a Datos)
**Origen:** `services/`
**Destino:** `src/data/`
**Archivos:**
- `services/supabase.ts` → `src/data/api/client.ts`
- `services/api.ts` → Separar en `src/data/api/*.api.ts`
- `services/validation.ts` → `src/data/validation/*.validation.ts`

### Capa 5: Infrastructure (Infraestructura)
**Origen:** `hooks/`, `src/utils/`
**Destino:** `src/infrastructure/`
**Archivos:**
- `hooks/useApiQuery.ts` → `src/infrastructure/hooks/useApiQuery.ts`
- `hooks/useChartColors.ts` → `src/infrastructure/hooks/charts/useChartColors.ts`
- `src/utils/theme-init.ts` → `src/infrastructure/utils/theme.util.ts`

### Capa 6: Shared (Compartido)
**Origen:** Constantes y tipos compartidos
**Destino:** `src/shared/`
**Archivos:**
- Crear `src/shared/constants/*.constants.ts`
- Crear `src/shared/types/common.types.ts`

## 📋 Plan de Ejecución

### Fase 1: Preparación (1 día)
- [x] Crear estructura de carpetas
- [ ] Configurar path aliases
- [ ] Actualizar configuraciones

### Fase 2: Migrar App (1 día)
- [ ] Mover App.tsx
- [ ] Mover providers
- [ ] Actualizar imports

### Fase 3: Migrar Presentation (2 días)
- [ ] Mover componentes UI
- [ ] Mover páginas
- [ ] Mover features
- [ ] Actualizar imports

### Fase 4: Migrar Domain (1 día)
- [ ] Separar tipos
- [ ] Crear servicios de dominio
- [ ] Mover lógica de negocio

### Fase 5: Migrar Data (1 día)
- [ ] Mover API
- [ ] Mover validaciones
- [ ] Crear repositorios (opcional)

### Fase 6: Migrar Infrastructure (1 día)
- [ ] Mover hooks
- [ ] Mover utilidades
- [ ] Crear configuraciones

### Fase 7: Migrar Shared (1 día)
- [ ] Crear constantes
- [ ] Mover tipos compartidos

### Fase 8: Limpieza (1 día)
- [ ] Actualizar todos los imports
- [ ] Eliminar archivos antiguos
- [ ] Actualizar documentación

### Fase 9: Testing (1 día)
- [ ] Probar todas las funcionalidades
- [ ] Verificar build
- [ ] Verificar que no hay errores

**Total estimado: 10 días**

## 🔍 Ejemplos de Cambios

### Antes (Estructura Actual)
```typescript
// pages/Products.tsx
import Button from '../components/Button'
import { useAuth } from '../contexts/AuthContext'
import { useApiQuery } from '../hooks/useApiQuery'
import { productApi } from '../services/api'
import { Product } from '../types'
```

### Después (Estructura por Capas)
```typescript
// src/presentation/pages/products/Products.tsx
import { Button } from '@/presentation/components/ui/Button'
import { useAuth } from '@/app/providers/AuthProvider'
import { useApiQuery } from '@/infrastructure/hooks/useApiQuery'
import { productApi } from '@/data/api/product.api'
import { Product } from '@/domain/types/product.types'
```

## 📚 Documentación Relacionada

- `ESTRUCTURA_PROYECTO_ACTUAL.md` - Estructura actual detallada
- `PLAN_REORGANIZACION_CAPAS.md` - Plan completo de reorganización
- `GUIA_MIGRACION_CAPAS.md` - Guía paso a paso de migración

## ⚠️ Consideraciones Importantes

1. **Migración Gradual:** Hacer módulo por módulo, no todo de una vez
2. **Testing Continuo:** Probar después de cada fase
3. **Commits Frecuentes:** Hacer commits después de cada fase
4. **Documentación:** Actualizar documentación durante la migración
5. **Path Aliases:** Configurar correctamente para imports limpios

## 🎯 Resultado Esperado

Después de la migración:
- ✅ Código organizado por capas técnicas
- ✅ Fácil de entender y mantener
- ✅ Fácil de escalar
- ✅ Fácil de testear
- ✅ Separación clara de responsabilidades

