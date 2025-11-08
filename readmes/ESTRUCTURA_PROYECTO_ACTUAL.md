# 📁 Estructura Actual del Proyecto

## Árbol de Directorios (sin node_modules)

```
gestion-inventario-la-gran-familia/
├── src/                          # Código fuente principal
│   ├── main.tsx                  # Punto de entrada
│   ├── index.css                 # Estilos globales
│   └── utils/
│       └── theme-init.ts         # Utilidades de tema
│
├── components/                   # Componentes React
│   ├── icons/
│   │   └── Icons.tsx            # Iconos SVG
│   ├── AlertDialog.tsx
│   ├── Alerts.tsx
│   ├── Animated.tsx
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
│
├── pages/                        # Páginas/Vistas
│   ├── kitchen/
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
│   ├── WarehouseDetail.tsx
│   └── Warehouses.tsx
│
├── contexts/                     # Contextos React
│   ├── AlertContext.tsx
│   ├── AuthContext.tsx
│   ├── NotificationContext.tsx
│   ├── QueryProvider.tsx
│   └── ThemeContext.tsx
│
├── hooks/                        # Custom Hooks
│   ├── useApiQuery.ts
│   ├── useChartColors.ts
│   ├── useChartTheme.ts
│   ├── useForm.ts
│   ├── useRecharts.ts
│   ├── useTableState.ts
│   ├── useUserProfile.ts
│   └── useXLSX.ts
│
├── services/                     # Servicios/API
│   ├── api.ts
│   ├── supabase.ts
│   └── validation.ts
│
├── init/                         # Inicialización BD
│   ├── functions/
│   │   ├── complete_kitchen_transaction.sql
│   │   ├── create_donation_atomic.sql
│   │   └── validate_stock_available.sql
│   ├── AUTH_USERS_EXPLANATION.md
│   ├── database-schema-synced-with-code.sql
│   ├── ESSENTIAL_FILES.md
│   ├── grant_permissions.sql
│   ├── README.md
│   ├── RLS_PERMISSIONS.md
│   ├── rls_policies.sql
│   └── seed_data.sql
│
├── public/                       # Archivos estáticos
│   ├── fonts/
│   │   ├── inter-v20-latin-500.woff2
│   │   ├── inter-v20-latin-600.woff2
│   │   ├── inter-v20-latin-700.woff2
│   │   ├── inter-v20-latin-800.woff2
│   │   └── inter-v20-latin-regular.woff2
│   ├── lib/
│   ├── favicon.ico
│   ├── logo-lagranfamilia.png
│   └── sw.js
│
├── readmes/                      # Documentación
│   ├── AUDITORIA_DESIGN_SYSTEM.md
│   ├── AUDITORIA_SEGURIDAD_CONSOLIDADA.md
│   ├── AUDITORIA_TECNICA.md
│   ├── CAMBIOS_IMPLEMENTADOS_SEGURIDAD.md
│   ├── COLORES_TEMA_DOCUMENTACION.md
│   ├── CSP_ACTUALIZADA_COMPLETADA.md
│   ├── DESIGN_SYSTEM_QUICK_REFERENCE.md
│   ├── LOADING_SPINNER_CENTRADO.md
│   ├── MIGRACION_FUENTES_COMPLETADA.md
│   ├── MIGRACION_XLSX_COMPLETADA.md
│   ├── PLAN_ACCION_DESIGN_SYSTEM.md
│   ├── PLAN_MEJORAS.md
│   ├── PROJECT_CONTEXT.md
│   └── VULNERABILIDAD_XLSX_SOLUCION.md
│
├── auditoria_security/           # Auditorías de seguridad
│   └── auditoria.txt
│
├── App.tsx                       # Componente raíz
├── types.ts                      # Tipos TypeScript
├── index.html                    # HTML principal
├── vite.config.ts                # Configuración Vite
├── tsconfig.json                 # Configuración TypeScript
├── tailwind.config.js            # Configuración Tailwind
├── postcss.config.js             # Configuración PostCSS
├── csp.config.js                 # Configuración CSP
├── vercel.json                   # Configuración Vercel
├── package.json                  # Dependencias
└── package-lock.json             # Lock de dependencias
```

## 📊 Análisis de la Estructura Actual

### ✅ Puntos Fuertes
- Separación básica entre componentes, páginas, hooks, y servicios
- Organización clara de archivos de inicialización de BD
- Documentación centralizada en `readmes/`

### ⚠️ Problemas Identificados
1. **Mezcla de niveles de abstracción:**
   - `components/` contiene tanto componentes UI base como componentes de dominio (DonorForm)
   - `pages/` contiene lógica de negocio mezclada con presentación

2. **Falta de separación por capas:**
   - No hay separación clara entre Presentación, Lógica de Negocio, y Datos
   - Los servicios están mezclados con la lógica de acceso a datos

3. **Falta de organización por dominio:**
   - No hay agrupación por módulos de negocio (Products, Donations, Users, etc.)
   - Los tipos están todos en un solo archivo `types.ts`

4. **Utilidades dispersas:**
   - `src/utils/` solo tiene `theme-init.ts`
   - Otras utilidades podrían estar en diferentes lugares

5. **Configuración en raíz:**
   - Archivos de configuración mezclados con código fuente
   - `App.tsx` en raíz en lugar de `src/`

## 🎯 Propuesta de Reorganización por Capas

Ver el documento `PLAN_REORGANIZACION_CAPAS.md` para el plan detallado.

