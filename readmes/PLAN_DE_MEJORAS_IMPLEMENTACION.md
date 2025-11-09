# 🚀 Plan de Implementación de Mejoras SGI

**Fecha de Inicio:** Diciembre 2024  
**Estado:** Base de datos configurada ✅  
**Próximos Pasos:** Optimización de Frontend y APIs

---

## ✅ Estado Actual (Completado)

### Funciones PostgreSQL (✅ COMPLETADO)
- ✅ `create_donation_atomic` - Funciona correctamente
- ✅ `complete_kitchen_transaction` - Funciona correctamente (mejorada)
- ✅ `validate_stock_available` - Mejorada (índice optimizado, validación de parámetros)
- ✅ `create_kitchen_request_atomic` - Creada e integrada en frontend
- ✅ Permisos configurados correctamente
- ✅ RLS configurado

### Frontend (✅ PARCIALMENTE COMPLETADO)
- ✅ `kitchen.api.ts` - Ya usa `create_kitchen_request_atomic`
- ✅ `kitchen.api.ts` - Ya usa `complete_kitchen_transaction`
- ✅ `kitchen.api.ts` - `getTransactions` optimizado con JOINs y filtros
- ✅ `product.api.ts` - `getFullProductDetails` optimizado con JOINs y filtros
- ✅ `donation.api.ts` - `getHistory` optimizado con JOINs y filtros
- ✅ `Products.tsx` - Optimizado para usar filtros del backend
- ✅ `Donations.tsx` - Optimizado para usar filtros del backend
- ✅ `Products.tsx` - Migrado a React Query con cache y invalidación automática
- ✅ `Donations.tsx` - Migrado a React Query con cache y invalidación automática
- ✅ `ManagerView.tsx` - Migrado a React Query con cache y invalidación automática
- ✅ `KitchenStaffView.tsx` - Migrado a React Query con cache y invalidación automática
- ✅ Tipos enriquecidos centralizados en `domain/types/enriched.types.ts`
- ✅ Tipos de respuesta de Supabase en `domain/types/supabase-response.types.ts`
- ✅ Esquemas de validación Zod creados (product, donation, kitchen)
- ✅ Hook `useZodForm` disponible para validación type-safe
- ✅ Eliminado uso de `any` en archivos críticos (APIs, hooks, componentes principales)
- ✅ Optimizaciones de rendimiento: cálculos costosos memoizados, warehouseMap optimizado
- ✅ Code splitting configurado con React.lazy y manual chunks en Vite
- ✅ Componente VirtualizedTable creado para listas grandes (listo para uso cuando sea necesario)
- ✅ Estrategia de caching configurada (STATIC, SEMI_STATIC, DYNAMIC, REALTIME)
- ✅ Soporte de optimistic updates en `useApiMutation` con rollback automático

---

## 📋 Plan de Implementación (Priorizado)

### FASE 1: Optimización de Consultas (Prioridad: ALTA) ⚡

#### Tarea 1.1: Optimizar `kitchen.api.ts` - `getTransactions`
**Ubicación:** `src/data/api/kitchen.api.ts:91-121`  
**Esfuerzo:** 2-3 horas  
**Impacto:** ALTO - Reduce carga de datos en página de cocina

**Problema Actual:**
```typescript
// Carga TODAS las transacciones, detalles, usuarios y productos
const [transactionsRes, detailsRes, usersRes, productsRes] = await Promise.all([
  supabase.from('transactions').select('*'),
  supabase.from('transaction_details').select('*'),
  supabase.from('users').select('*'),
  supabase.from('products').select('*'),
]);
```

**Solución:**
- Usar JOINs de Supabase para cargar solo datos necesarios
- Agregar filtrado por status, fecha, etc.
- Implementar paginación
- Cargar solo campos necesarios

**Pasos:**
1. Modificar `getTransactions` para aceptar filtros opcionales
2. Usar `.select()` con JOINs de Supabase
3. Agregar paginación (limit/offset)
4. Probar con datos reales
5. Actualizar componentes que usan esta función

---

#### Tarea 1.2: Optimizar `product.api.ts` - `getFullProductDetails`
**Ubicación:** `src/data/api/product.api.ts:130-187`  
**Esfuerzo:** 4-6 horas  
**Impacto:** ALTO - Mejora significativa en página de productos

**Problema Actual:**
```typescript
// Carga TODOS los productos, categorías, unidades, marcas y lotes
const [products, categories, units, brands, stockLots] = await Promise.all([
  productApi.getAll(_token),
  categoryApi.getAll(_token),
  getUnits(_token),
  brandApi.getAll(_token),
  getStockLots(_token),
]);
```

**Solución:**
- Crear función optimizada con JOINs
- Agregar filtrado por categoría, marca, búsqueda
- Implementar paginación
- Calcular total_stock en PostgreSQL (opcional, puede ser en memoria)

**Pasos:**
1. Crear nueva función `getFullProductDetailsOptimized`
2. Usar JOINs de Supabase para relacionar datos
3. Agregar filtros opcionales (category_id, brand_id, search, etc.)
4. Implementar paginación
5. Migrar `Products.tsx` para usar la nueva función
6. Mantener función antigua como fallback (opcional)

---

#### Tarea 1.3: Optimizar `donation.api.ts` - `getHistory`
**Ubicación:** `src/data/api/donation.api.ts:58`  
**Esfuerzo:** 2-3 horas  
**Impacto:** MEDIO - Mejora en página de donaciones

**Problema Actual:**
- Carga todas las donaciones e items, luego agrupa en memoria

**Solución:**
- Usar JOINs de Supabase
- Agregar filtrado por fecha
- Implementar paginación

**Pasos:**
1. Modificar `getHistory` para usar JOINs
2. Agregar filtros de fecha opcionales
3. Implementar paginación
4. Probar con datos reales

---

### FASE 2: Migración a React Query (Prioridad: ALTA) ⚡

#### Tarea 2.1: Migrar `Products.tsx` a React Query
**Ubicación:** `src/presentation/pages/products/Products.tsx`  
**Esfuerzo:** 4-6 horas  
**Impacto:** ALTO - Mejor UX, cache automático, menos recargas

**Problema Actual:**
- Usa `useState` y `useEffect` para datos
- No aprovecha cache de React Query
- Recargas innecesarias

**Solución:**
- Reemplazar `useState` por `useApiQuery`
- Usar `useApiMutation` para crear/actualizar/eliminar
- Configurar invalidación de queries
- Agregar estados de loading/error

**Pasos:**
1. Identificar todos los `useState` de datos
2. Reemplazar por `useApiQuery` con keys apropiadas
3. Migrar mutaciones a `useApiMutation`
4. Configurar invalidación de queries en mutaciones
5. Agregar estados de loading y error
6. Probar que el cache funciona correctamente
7. Eliminar código obsoleto (`useState`, `useEffect` de datos)

---

#### Tarea 2.2: Verificar uso de React Query en otras páginas
**Ubicación:** Todas las páginas principales  
**Esfuerzo:** 2-3 horas  
**Impacto:** MEDIO - Consistencia en el código

**Páginas a revisar:**
- `Dashboard.tsx` - Ya usa React Query ✅
- `Donations.tsx` - Verificar
- `Kitchen.tsx` - Verificar
- `Warehouses.tsx` - Verificar
- Otras páginas

**Pasos:**
1. Auditar cada página para uso de React Query
2. Identificar páginas que aún usan `useState`/`useEffect`
3. Migrar páginas críticas a React Query
4. Documentar páginas que ya están optimizadas

---

### FASE 3: Mejoras de Tipado (Prioridad: MEDIA) 📝

#### Tarea 3.1: Eliminar uso de `any`
**Ubicación:** Múltiples archivos  
**Esfuerzo:** 3-4 horas  
**Impacto:** MEDIO - Mejor seguridad de tipos

**Archivos a revisar:**
- `src/data/api/client.ts:5-6` - Variables de entorno
- `src/data/api/kitchen.api.ts` - Tipos de retorno
- Otros archivos con `any`

**Pasos:**
1. Buscar todos los usos de `any` en el código
2. Crear tipos apropiados para cada caso
3. Crear tipos para `import.meta.env`
4. Tipar respuestas de API explícitamente
5. Eliminar casts a `any` innecesarios

---

#### Tarea 3.2: Crear tipos enriquecidos para APIs
**Ubicación:** `src/domain/types/`  
**Esfuerzo:** 2-3 horas  
**Impacto:** MEDIO - Mejor IntelliSense y detección de errores

**Tipos a crear:**
- `EnrichedTransaction` - Transaction con `requester_name`, `approver_name`, `details`
- `EnrichedProduct` - Product con información calculada
- `EnrichedDonation` - Donation con información calculada

**Pasos:**
1. Crear tipos enriquecidos en `src/domain/types/`
2. Actualizar funciones de API para retornar tipos enriquecidos
3. Actualizar componentes para usar tipos enriquecidos
4. Eliminar tipos inferidos

---

#### Tarea 3.3: Integrar Zod para validación de formularios
**Ubicación:** Formularios en páginas  
**Esfuerzo:** 4-6 horas  
**Impacto:** MEDIO - Validación tipada y consistente

**Pasos:**
1. Instalar Zod: `npm install zod`
2. Crear schemas de validación para cada formulario
3. Integrar con `useForm` hook
4. Reemplazar validación manual por Zod
5. Agregar mensajes de error tipados

---

### FASE 4: Optimizaciones de Rendimiento (Prioridad: MEDIA) ⚡

#### Tarea 4.1: Implementar virtualización en listas grandes
**Ubicación:** `src/presentation/components/ui/VirtualizedTable.tsx`  
**Esfuerzo:** 3-4 horas  
**Impacto:** MEDIO - Mejor rendimiento con listas largas
**Estado:** ✅ COMPLETADO

**Nota:** Debido a que ya tenemos paginación en el backend (ITEMS_PER_PAGE = 10), la virtualización no es crítica para el caso actual. Sin embargo, se ha creado el componente `VirtualizedTable` que puede usarse cuando:
- Se aumente el límite de items por página
- Se necesite renderizar listas grandes sin paginación
- Se requiera mejor rendimiento con 100+ items en pantalla

**Pasos completados:**
1. ✅ Instalado `react-window` y `@types/react-window`
2. ✅ Creado componente `VirtualizedTable` en `src/presentation/components/ui/VirtualizedTable.tsx`
3. ⚠️ No reemplazado `ResponsiveTable` en Products (no es necesario con paginación actual)
4. ✅ Componente listo para usar cuando sea necesario
5. ⏳ Puede aplicarse a otras páginas con listas largas cuando sea necesario

---

#### Tarea 4.2: Optimizar cálculos costosos en render
**Ubicación:** `src/presentation/pages/products/Products.tsx:541-593`  
**Esfuerzo:** 1-2 horas  
**Impacto:** BAJO - Mejora micro-interacciones

**Pasos:**
1. Identificar cálculos costosos en render
2. Memoizar con `useMemo`
3. Mover cálculos a funciones memoizadas
4. Probar que no hay regresiones

---

#### Tarea 4.3: Implementar code splitting por ruta
**Ubicación:** `src/app/App.tsx`  
**Esfuerzo:** 1-2 horas  
**Impacto:** MEDIO - Bundle inicial más pequeño

**Pasos:**
1. Verificar que todas las rutas usen `React.lazy()`
2. Agregar `Suspense` con loading states
3. Verificar que el code splitting funciona
4. Medir tamaño de bundle antes/después

---

### FASE 5: Estrategia de Caching (Prioridad: MEDIA) 💾

#### Tarea 5.1: Configurar estrategia de caching en React Query
**Ubicación:** `src/infrastructure/config/query.config.ts`  
**Esfuerzo:** 2-3 horas  
**Impacto:** MEDIO - Menos llamadas a API
**Estado:** ✅ COMPLETADO

**Pasos completados:**
1. ✅ Creado archivo `src/infrastructure/config/query.config.ts`
2. ✅ Definidas configuraciones por tipo de dato (STATIC, SEMI_STATIC, DYNAMIC, REALTIME)
3. ✅ Integrado `getCacheConfig` en `useApiQuery` para aplicar configuraciones automáticamente
4. ✅ Mejorado `QueryProvider.tsx` con retry logic y configuración de mutaciones
5. ✅ Configuración de caching automática basada en queryKey

**Estrategias de caching implementadas:**
- **STATIC** (categorías, marcas, unidades): 30 min staleTime, 1 hora gcTime
- **SEMI_STATIC** (almacenes, donantes): 10 min staleTime, 30 min gcTime
- **DYNAMIC** (productos, transacciones, donaciones): 2 min staleTime, 10 min gcTime
- **REALTIME** (notificaciones, stock): 1 min staleTime, 5 min gcTime

---

#### Tarea 5.2: Implementar optimistic updates
**Ubicación:** `src/infrastructure/hooks/useApiQuery.ts`  
**Esfuerzo:** 3-4 horas  
**Impacto:** MEDIO - Mejor UX con actualizaciones instantáneas
**Estado:** ✅ COMPLETADO

**Pasos completados:**
1. ✅ Agregado soporte de optimistic updates en `useApiMutation`
2. ✅ Implementado rollback automático en caso de error
3. ✅ Aplicado optimistic update a eliminación de productos (ejemplo)
4. ✅ Documentado patrón de uso con `optimisticUpdate` option
5. ✅ Configurado `onMutate`, `onError`, y `onSettled` para manejo completo

**Características implementadas:**
- **Optimistic updates**: Actualización inmediata de la UI antes de que la mutación complete
- **Rollback automático**: Restauración de datos anteriores en caso de error
- **Cancelación de queries**: Evita sobrescribir actualizaciones optimistas
- **Invalidación inteligente**: Sincronización con servidor después de éxito/error

**Ejemplo de uso:**
```typescript
optimisticUpdate: {
  queryKey: ['products', 'list', filters],
  updateFn: (oldData, variables) => {
    // Actualizar datos optimísticamente
    return updatedData;
  },
}
```

---

### FASE 6: Pruebas Unitarias (Prioridad: BAJA) 🧪

#### Tarea 6.1: Configurar ambiente de pruebas
**Ubicación:** Raíz del proyecto  
**Esfuerzo:** 2-3 horas  
**Impacto:** BAJO - Base para pruebas futuras
**Estado:** ✅ COMPLETADO

**Pasos completados:**
1. ✅ Instalado Vitest, Testing Library y coverage provider
2. ✅ Configurado Vitest con jsdom y aliases
3. ✅ Creado archivo de configuración `vitest.config.ts`
4. ✅ Creados primeros tests de ejemplo (validaciones Zod, hooks)
5. ✅ Configurado sistema de reportes (HTML, JSON, LCOV, JUnit XML)

**Configuración de reportes:**
- ✅ Reportes de cobertura (HTML, JSON, LCOV)
- ✅ Reportes de resultados (JSON, JUnit XML)
- ✅ Umbrales de cobertura configurados (60% mínimo)
- ✅ Scripts NPM para ejecutar tests con reportes
- ✅ Documentación de reportes (`tests/TEST_REPORT_GUIDE.md`)

---

#### Tarea 6.2: Implementar pruebas críticas de lógica de negocio
**Ubicación:** `tests/`  
**Esfuerzo:** 4-6 horas  
**Impacto:** MEDIO - Validación de lógica crítica
**Estado:** ✅ COMPLETADO (Pruebas de validación implementadas)

**Pruebas implementadas:**
1. ✅ Validación de esquemas Zod (productos, donaciones, cocina)
2. ✅ Pruebas de hooks personalizados (useZodForm)
3. ⏳ Pruebas de lógica de negocio (pendiente - requiere mocks de Supabase)

**Estructura de tests creada:**
- ✅ `tests/validations/` - Pruebas de esquemas Zod
- ✅ `tests/hooks/` - Pruebas de hooks personalizados
- ✅ `tests/setup.ts` - Configuración global
- ✅ `tests/README.md` - Documentación de tests
- ✅ `tests/TEST_REPORT_GUIDE.md` - Guía de reportes

**Nota:** Las pruebas de lógica de negocio que requieren funciones PostgreSQL (FIFO, donaciones atómicas) se prueban directamente en la base de datos. Las pruebas del frontend se enfocan en validación de datos y hooks.

---

## 🎯 Orden Recomendado de Implementación

### Semana 1: Optimización de Consultas (ALTA PRIORIDAD)
1. ✅ Tarea 1.1: Optimizar `kitchen.api.ts` - `getTransactions`
2. ✅ Tarea 1.2: Optimizar `product.api.ts` - `getFullProductDetails`
3. ✅ Tarea 1.3: Optimizar `donation.api.ts` - `getHistory`

**Resultado Esperado:** 
- Reducción del 70% en datos transferidos
- Consultas 10x más rápidas
- Mejor escalabilidad

---

### Semana 2: Migración a React Query (ALTA PRIORIDAD)
1. ✅ Tarea 2.1: Migrar `Products.tsx` a React Query
2. ✅ Tarea 2.2: Verificar uso de React Query en otras páginas

**Resultado Esperado:**
- Cache automático
- Menos recargas
- Mejor UX

---

### Semana 3: Mejoras de Tipado y Optimizaciones (MEDIA PRIORIDAD)
1. ✅ Tarea 3.1: Eliminar uso de `any`
2. ✅ Tarea 3.2: Crear tipos enriquecidos
3. ✅ Tarea 4.1: Implementar virtualización
4. ✅ Tarea 4.2: Optimizar cálculos costosos

**Resultado Esperado:**
- Mejor seguridad de tipos
- Mejor rendimiento
- Mejor IntelliSense

---

### Semana 4: Caching y Pruebas (MEDIA/BAJA PRIORIDAD)
1. ✅ Tarea 5.1: Configurar estrategia de caching
2. ✅ Tarea 5.2: Implementar optimistic updates
3. ✅ Tarea 6.1: Configurar ambiente de pruebas
4. ✅ Tarea 6.2: Implementar pruebas críticas

**Resultado Esperado:**
- Menos llamadas a API
- Mejor UX con actualizaciones instantáneas
- Base para pruebas futuras

---

## 📊 Métricas de Éxito

### Antes de las Mejoras:
- Tiempo de carga de página de productos: ~3-5 segundos (1000+ productos)
- Datos transferidos: ~5-10 MB por página
- Llamadas a API: 5-10 por página
- Re-renders innecesarios: Múltiples

### Después de las Mejoras (Objetivo):
- Tiempo de carga de página de productos: <1 segundo
- Datos transferidos: <500 KB por página
- Llamadas a API: 1-2 por página
- Re-renders innecesarios: Mínimos

---

## 🚨 Notas Importantes

1. **Testing:** Probar cada cambio en desarrollo antes de merge a main
2. **Backup:** Hacer backup de base de datos antes de cambios importantes
3. **Incremental:** Implementar mejoras de forma incremental, no todo de una vez
4. **Documentación:** Documentar cambios importantes en código
5. **Performance:** Medir performance antes/después de cada mejora

---

## 📝 Checklist de Implementación

### Fase 1: Optimización de Consultas
- [x] Tarea 1.1: Optimizar `kitchen.api.ts` - `getTransactions` ✅ COMPLETADO
- [x] Tarea 1.2: Optimizar `product.api.ts` - `getFullProductDetails` ✅ COMPLETADO
- [x] Tarea 1.3: Optimizar `donation.api.ts` - `getHistory` ✅ COMPLETADO

### Fase 2: Migración a React Query
- [x] Tarea 2.1: Migrar `Products.tsx` a React Query ✅ COMPLETADO
- [x] Tarea 2.2: Migrar `Donations.tsx` a React Query ✅ COMPLETADO
- [x] Tarea 2.3: Migrar `ManagerView.tsx` a React Query ✅ COMPLETADO
- [x] Tarea 2.4: Migrar `KitchenStaffView.tsx` a React Query ✅ COMPLETADO

### Fase 3: Mejoras de Tipado
- [x] Tarea 3.1: Eliminar uso de `any` en archivos críticos (APIs, hooks, componentes principales) ✅ COMPLETADO
- [x] Tarea 3.2: Crear tipos enriquecidos (centralizados en domain/types) ✅ COMPLETADO
- [x] Tarea 3.3: Integrar Zod para validación (esquemas creados, hook useZodForm disponible) ✅ COMPLETADO

### Fase 4: Optimizaciones de Rendimiento
- [x] Tarea 4.1: Implementar virtualización (componente creado, listo para uso) ✅ COMPLETADO
- [x] Tarea 4.2: Optimizar cálculos costosos ✅ COMPLETADO
- [x] Tarea 4.3: Implementar code splitting ✅ COMPLETADO

### Fase 5: Estrategia de Caching
- [x] Tarea 5.1: Configurar estrategia de caching ✅ COMPLETADO
- [x] Tarea 5.2: Implementar optimistic updates ✅ COMPLETADO

### Fase 6: Pruebas Unitarias
- [x] Tarea 6.1: Configurar ambiente de pruebas ✅ COMPLETADO
- [x] Tarea 6.2: Implementar pruebas críticas (validaciones Zod y hooks) ✅ COMPLETADO

---

**Última actualización:** Diciembre 2024  
**Próxima revisión:** Después de completar Fase 1

