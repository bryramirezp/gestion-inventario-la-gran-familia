# 📋 Plan de Reorganización por Capas

## 🎯 Objetivo

Reorganizar el proyecto siguiendo una arquitectura por capas (Layered Architecture) que separe claramente:
- **Presentación** (UI Components, Pages)
- **Lógica de Negocio** (Business Logic, Domain)
- **Acceso a Datos** (Data Access, Services)
- **Infraestructura** (Configuration, Utilities)

## 📐 Arquitectura Propuesta: Capas Técnicas

### Estructura Propuesta

```
src/
├── app/                          # Configuración de la aplicación
│   ├── App.tsx                   # Componente raíz
│   ├── router.tsx                # Configuración de rutas
│   └── providers/                # Providers globales
│       ├── AuthProvider.tsx
│       ├── QueryProvider.tsx
│       ├── ThemeProvider.tsx
│       ├── NotificationProvider.tsx
│       └── AlertProvider.tsx
│
├── presentation/                 # Capa de Presentación
│   ├── components/               # Componentes UI reutilizables
│   │   ├── ui/                   # Componentes base del Design System
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── AlertDialog.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── Table.tsx
│   │   ├── forms/                # Componentes de formulario
│   │   │   ├── FormField.tsx
│   │   │   ├── FormError.tsx
│   │   │   └── index.ts
│   │   ├── layout/               # Componentes de layout
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── Layout.tsx
│   │   ├── icons/                # Iconos
│   │   │   └── Icons.tsx
│   │   └── animated/             # Componentes animados
│   │       └── Animated.tsx
│   │
│   ├── pages/                    # Páginas/Vistas
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── ConfirmEmail.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── products/
│   │   │   └── Products.tsx
│   │   ├── donations/
│   │   │   ├── Donations.tsx
│   │   │   └── DonationDetail.tsx
│   │   ├── donors/
│   │   │   ├── Donors.tsx
│   │   │   ├── DonorDetail.tsx
│   │   │   └── DonorAnalysis.tsx
│   │   ├── warehouses/
│   │   │   ├── Warehouses.tsx
│   │   │   └── WarehouseDetail.tsx
│   │   ├── kitchen/
│   │   │   ├── Kitchen.tsx
│   │   │   ├── KitchenStaffView.tsx
│   │   │   └── ManagerView.tsx
│   │   ├── users/
│   │   │   └── Users.tsx
│   │   ├── profile/
│   │   │   └── Profile.tsx
│   │   ├── categories/
│   │   │   └── Categories.tsx
│   │   ├── brands/
│   │   │   └── Brands.tsx
│   │   ├── reports/
│   │   │   └── ExpiryReport.tsx
│   │   ├── backup/
│   │   │   └── Backup.tsx
│   │   └── landing/
│   │       └── Landing.tsx
│   │
│   └── features/                 # Componentes específicos de features
│       ├── donations/
│       │   └── DonorForm.tsx
│       ├── products/
│       │   └── StockLotsModal.tsx
│       └── shared/
│           ├── NotificationBell.tsx
│           ├── ThemeToggle.tsx
│           ├── Combobox.tsx
│           ├── CreatableCombobox.tsx
│           └── DatePicker.tsx
│
├── domain/                       # Capa de Dominio (Lógica de Negocio)
│   ├── entities/                 # Entidades de dominio
│   │   ├── Product.ts
│   │   ├── Donation.ts
│   │   ├── Donor.ts
│   │   ├── Warehouse.ts
│   │   ├── User.ts
│   │   └── KitchenTransaction.ts
│   │
│   ├── services/                 # Servicios de dominio
│   │   ├── donation.service.ts
│   │   ├── product.service.ts
│   │   ├── warehouse.service.ts
│   │   ├── user.service.ts
│   │   └── kitchen.service.ts
│   │
│   └── types/                    # Tipos de dominio
│       ├── product.types.ts
│       ├── donation.types.ts
│       ├── donor.types.ts
│       ├── warehouse.types.ts
│       ├── user.types.ts
│       ├── kitchen.types.ts
│       └── common.types.ts
│
├── data/                         # Capa de Acceso a Datos
│   ├── repositories/             # Repositorios
│   │   ├── product.repository.ts
│   │   ├── donation.repository.ts
│   │   ├── donor.repository.ts
│   │   ├── warehouse.repository.ts
│   │   ├── user.repository.ts
│   │   └── kitchen.repository.ts
│   │
│   ├── api/                      # Cliente API
│   │   ├── client.ts             # Cliente base (Supabase)
│   │   ├── product.api.ts
│   │   ├── donation.api.ts
│   │   ├── donor.api.ts
│   │   ├── warehouse.api.ts
│   │   ├── user.api.ts
│   │   └── kitchen.api.ts
│   │
│   └── validation/               # Validaciones de datos
│       ├── product.validation.ts
│       ├── donation.validation.ts
│       ├── donor.validation.ts
│       └── common.validation.ts
│
├── infrastructure/               # Capa de Infraestructura
│   ├── config/                   # Configuraciones
│   │   ├── supabase.config.ts
│   │   ├── query.config.ts
│   │   └── app.config.ts
│   │
│   ├── utils/                    # Utilidades
│   │   ├── theme.util.ts
│   │   ├── date.util.ts
│   │   ├── format.util.ts
│   │   └── validation.util.ts
│   │
│   └── hooks/                    # Custom Hooks (infraestructura)
│       ├── useApiQuery.ts
│       ├── useForm.ts
│       ├── useTableState.ts
│       ├── useUserProfile.ts
│       └── charts/
│           ├── useChartColors.ts
│           ├── useChartTheme.ts
│           └── useRecharts.ts
│
└── shared/                       # Código compartido
    ├── constants/                # Constantes
    │   ├── routes.constants.ts
    │   ├── roles.constants.ts
    │   └── app.constants.ts
    │
    └── types/                    # Tipos compartidos
        └── common.types.ts
```

## 📦 Estructura de Archivos de Configuración (Raíz)

```
gestion-inventario-la-gran-familia/
├── src/                          # Todo el código fuente (nuevo)
├── public/                       # Archivos estáticos
│   ├── fonts/
│   ├── favicon.ico
│   └── logo-lagranfamilia.png
├── init/                         # Scripts de inicialización BD
├── docs/                         # Documentación (renombrado de readmes/)
├── config/                       # Archivos de configuración
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── csp.config.js
│   └── vercel.json
├── index.html
├── package.json
└── package-lock.json
```

## 🔄 Plan de Migración por Fases

### Fase 1: Preparación (Día 1)
- [ ] Crear estructura de carpetas nueva en `src/`
- [ ] Actualizar `vite.config.ts` para apuntar a nueva estructura
- [ ] Actualizar `tsconfig.json` con nuevos paths
- [ ] Crear archivos `index.ts` para exports centralizados

### Fase 2: Mover App y Configuración (Día 2)
- [ ] Mover `App.tsx` a `src/app/App.tsx`
- [ ] Mover `src/main.tsx` y actualizar imports
- [ ] Mover contextos a `src/app/providers/`
- [ ] Crear `src/app/router.tsx` si es necesario

### Fase 3: Reorganizar Presentación (Día 3-4)
- [ ] Mover componentes UI base a `src/presentation/components/ui/`
- [ ] Mover componentes de layout a `src/presentation/components/layout/`
- [ ] Mover iconos a `src/presentation/components/icons/`
- [ ] Mover páginas a `src/presentation/pages/` organizadas por dominio
- [ ] Mover componentes de features a `src/presentation/features/`

### Fase 4: Reorganizar Dominio (Día 5)
- [ ] Crear entidades en `src/domain/entities/`
- [ ] Separar tipos de `types.ts` a `src/domain/types/`
- [ ] Crear servicios de dominio en `src/domain/services/`
- [ ] Mover lógica de negocio de páginas a servicios

### Fase 5: Reorganizar Acceso a Datos (Día 6)
- [ ] Mover `services/api.ts` a `src/data/api/`
- [ ] Mover `services/supabase.ts` a `src/data/api/client.ts`
- [ ] Crear repositorios en `src/data/repositories/`
- [ ] Mover validaciones a `src/data/validation/`

### Fase 6: Reorganizar Infraestructura (Día 7)
- [ ] Mover hooks a `src/infrastructure/hooks/`
- [ ] Mover utilidades a `src/infrastructure/utils/`
- [ ] Crear configuraciones en `src/infrastructure/config/`

### Fase 7: Reorganizar Compartido (Día 8)
- [ ] Crear constantes en `src/shared/constants/`
- [ ] Mover tipos compartidos a `src/shared/types/`

### Fase 8: Limpieza y Actualización (Día 9)
- [ ] Actualizar todos los imports en el proyecto
- [ ] Eliminar archivos antiguos
- [ ] Actualizar documentación
- [ ] Verificar que todo compila correctamente

### Fase 9: Testing y Validación (Día 10)
- [ ] Probar todas las funcionalidades
- [ ] Verificar que no hay imports rotos
- [ ] Verificar que el build funciona
- [ ] Actualizar README con nueva estructura

## 📝 Beneficios de esta Estructura

1. **Separación de Responsabilidades:**
   - Cada capa tiene una responsabilidad clara
   - Fácil de entender y mantener

2. **Escalabilidad:**
   - Fácil añadir nuevas features
   - Fácil añadir nuevas capas si es necesario

3. **Testabilidad:**
   - Cada capa se puede testear independientemente
   - Fácil mockear dependencias

4. **Mantenibilidad:**
   - Código organizado por tipo técnico
   - Fácil encontrar archivos

5. **Reutilización:**
   - Componentes UI claramente separados
   - Servicios de dominio reutilizables

## 🚨 Consideraciones Importantes

1. **Imports:**
   - Configurar path aliases en `tsconfig.json` para imports más limpios
   - Ejemplo: `@/presentation/components`, `@/domain/services`, etc.

2. **Migración Gradual:**
   - Se puede hacer de forma gradual, módulo por módulo
   - No es necesario mover todo de una vez

3. **Testing:**
   - Verificar después de cada fase que todo funciona
   - No avanzar hasta que la fase anterior esté completa

4. **Documentación:**
   - Actualizar README con nueva estructura
   - Documentar convenciones de la nueva arquitectura

## 📚 Referencias

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Layered Architecture](https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/ch01.html)
- [Feature-Sliced Design](https://feature-sliced.design/)

