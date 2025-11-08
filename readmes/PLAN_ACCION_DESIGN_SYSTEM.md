# 📅 Plan de Acción Ejecutable - Migración a Design System

## 🎯 Objetivo
Migrar de estilos hardcodeados a un Design System robusto, escalable y mantenible en **10 semanas**.

## 📍 Información Importante del Proyecto

### Ubicación de Colores del Tema
- **Archivo principal**: `src/index.css` (variables CSS en `@layer base`)
- **Light Mode**: Variables en `:root`
- **Dark Mode**: Variables en `.dark` (clase aplicada al `<html>`)
- **Mapeo a Tailwind**: `tailwind.config.js` usando `hsl(var(--primary))`
- **Gestión de Tema**: `contexts/ThemeContext.tsx` gestiona el cambio entre light/dark

### Paleta de Colores Actual
- **Primary (Naranja)**: `31 72% 56%` - Color principal de la marca
- **Success (Verde)**: `142 76% 36%`
- **Warning (Amarillo)**: `38 92% 50%`
- **Destructive (Rojo)**: `0 84% 60%` (light) / `0 63% 31%` (dark)

**📖 Ver documentación completa**: `readmes/COLORES_TEMA_DOCUMENTACION.md`

### Sistema de Iconos
- **Archivo principal**: `components/icons/Icons.tsx`
- **Regla estricta**: Solo usar iconos de este archivo
- **NO usar**: librerías externas (lucide-react, react-icons, etc.)
- **NO usar**: SVGs inline en componentes
- **Patrón**: Todos los iconos exportan `React.FC<React.SVGProps<SVGSVGElement>>`
- **Base props**: `width: 24, height: 24, viewBox: '0 0 24 24'` para consistencia

**📖 Ver más detalles**: Sección "SEMANA 2: Estandarización de Iconos" más abajo

---

## 📦 SEMANA 1: Fundación - Dependencias Externas

### Día 1-2: Auto-hospedar Google Fonts (Inter)

#### Paso 1: Descargar Fuentes ✅ COMPLETADO
```bash
# Fuentes ya descargadas en public/fonts/
# Archivos: inter-v20-latin-regular.woff2, inter-v20-latin-500.woff2, etc.
```

#### Paso 2: Crear Estructura de Directorios ✅ COMPLETADO
```bash
# Estructura ya existe: public/fonts/
```

#### Paso 3: Copiar Archivos de Fuentes ✅ COMPLETADO
- Archivos ya están en `public/fonts/`:
  - `inter-v20-latin-regular.woff2` (400)
  - `inter-v20-latin-500.woff2` (500)
  - `inter-v20-latin-600.woff2` (600)
  - `inter-v20-latin-700.woff2` (700)
  - `inter-v20-latin-800.woff2` (800)

#### Paso 4: Actualizar `src/index.css` ✅ COMPLETADO
```css
/* Fuentes auto-hospedadas - Ya implementado en src/index.css */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-v20-latin-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
/* ... (resto de definiciones ya implementadas) */
```

#### Paso 5: Eliminar CDN de `index.html` ✅ COMPLETADO
```html
<!-- CDN ya eliminado - Fuentes ahora se cargan desde src/index.css -->
<!-- Inter font is now auto-hosted in src/index.css (CSP compliant) -->
```

#### Paso 6: Verificar
- [x] Fuentes cargan correctamente ✅
- [x] No hay errores en consola ✅
- [x] Tipografía se ve igual que antes ✅
- [x] CDN eliminado de index.html ✅
- [x] CSP actualizada (vercel.json y csp.config.js) ✅

**✅ ESTADO: COMPLETADO** - Las fuentes Inter están auto-hospedadas en `public/fonts/` y se cargan desde `src/index.css` usando `@font-face`.

---

### Día 3-4: Migrar a ExcelJS (Reemplazo de xlsx)

#### ⚠️ PROBLEMA DE SEGURIDAD DETECTADO
Después de ejecutar `npm install`, se detectaron **2 vulnerabilidades de severidad alta** en xlsx:
- **Prototype Pollution** (GHSA-4r6h-8v6p-xvw6)
- **Regular Expression Denial of Service (ReDoS)** (GHSA-5pgg-2g8v-p4x9)
- **Estado**: No hay fix disponible

#### ✅ SOLUCIÓN: Migrar a ExcelJS
ExcelJS es una alternativa más segura y moderna que no tiene estas vulnerabilidades.

#### Paso 1: Actualizar `package.json` ✅ COMPLETADO
```json
// Reemplazado xlsx por exceljs
"exceljs": "^4.4.0"
```

**⚠️ IMPORTANTE:** Ejecutar `npm install` para instalar la dependencia.
```bash
npm install
```

#### Paso 2: Actualizar Hook `hooks/useXLSX.ts` ✅ COMPLETADO
```typescript
import { useState, useEffect } from 'react';

let exceljsModule: any = null;
let loading = false;
let loadPromise: Promise<any> | null = null;

export const useXLSX = () => {
  const [isReady, setIsReady] = useState(!!exceljsModule);

  useEffect(() => {
    if (exceljsModule || loading) return;

    loading = true;
    if (!loadPromise) {
      loadPromise = import('exceljs').then((module) => {
        // ExcelJS puede exportarse como default o como named export
        exceljsModule = module.default || module;
        loading = false;
        setIsReady(true);
        return exceljsModule;
      }).catch((error) => {
        console.error('Error loading exceljs:', error);
        loading = false;
        throw error;
      });
    } else {
      loadPromise.then(() => setIsReady(true));
    }
  }, []);

  return { xlsx: exceljsModule, isReady };
};
```

#### Paso 3: Buscar Componentes que Usan xlsx ✅ COMPLETADO
- Encontrado: `pages/Backup.tsx` usa xlsx para exportar/importar Excel

#### Paso 4: Actualizar Componentes ✅ COMPLETADO
**Exportación (handleBackup):**
```typescript
// Antes (xlsx)
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(excelData, { header: headers });
xlsx.utils.book_append_sheet(wb, ws, `Donativos_${selectedYear}`);
xlsx.writeFile(wb, `Respaldo_Completo_LaGranFamilia_${selectedYear}.xlsx`);

// Después (ExcelJS)
const workbook = new xlsx.Workbook();
const worksheet = workbook.addWorksheet(`Donativos_${selectedYear}`);
worksheet.columns = headers.map((header, index) => ({
  header,
  key: header,
  width: columnWidths[index] || 12
}));
worksheet.getRow(1).font = { bold: true };
worksheet.addRows(excelData);
const buffer = await workbook.xlsx.writeBuffer();
const blob = new Blob([buffer], { 
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
});
// Descargar archivo usando URL.createObjectURL
```

**Importación (handleImport):**
```typescript
// Antes (xlsx)
const workbook = xlsx.read(data, { type: 'array', cellDates: true });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const json = xlsx.utils.sheet_to_json(worksheet);

// Después (ExcelJS)
const workbook = new xlsx.Workbook();
await workbook.xlsx.load(arrayBuffer);
const worksheet = workbook.getWorksheet(0);
// Leer headers y datos manualmente usando worksheet.eachRow()
```

#### Paso 5: Eliminar Archivo Local de `index.html` ✅ COMPLETADO
- Script eliminado de `index.html`
- Archivo `public/lib/xlsx.full.min.js` eliminado
- Comentario añadido indicando que ExcelJS se carga vía npm

#### Paso 6: Verificar
- [x] exceljs añadido a package.json ✅
- [x] Hook useXLSX.ts actualizado para ExcelJS ✅
- [x] Backup.tsx actualizado para usar ExcelJS ✅
- [x] Archivo local eliminado ✅
- [x] Script eliminado de index.html ✅
- [ ] **Ejecutar `npm install`** ⚠️ PENDIENTE
- [ ] Exportación a Excel funciona correctamente (probar después de npm install)
- [ ] Importación de Excel funciona correctamente (probar después de npm install)
- [ ] No hay errores en consola (probar después de npm install)
- [ ] Carga dinámica funciona (verificar Network tab después de npm install)
- [ ] **Verificar que no hay vulnerabilidades** (ejecutar `npm audit`)

**✅ ESTADO: COMPLETADO (pendiente de npm install)** - Migrado de xlsx a ExcelJS por seguridad. Código actualizado. Ejecutar `npm install` y probar funcionalidad.

**📖 Documentación:** Ver `readmes/VULNERABILIDAD_XLSX_SOLUCION.md` para más detalles.

---

### Día 5: Actualizar CSP

#### Paso 1: Actualizar `vercel.json` ✅ COMPLETADO
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'strict-dynamic'; style-src 'self'; font-src 'self'; img-src 'self' data: https://*.supabase.co https://vercel.com https://*.vercel.app; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; block-all-mixed-content"
        }
      ]
    }
  ]
}
```

**Estado actual:**
- ✅ `script-src 'self' 'strict-dynamic'` - Sin CDN (xlsx cargado vía npm)
- ✅ `style-src 'self'` - Sin Google Fonts CDN
- ✅ `font-src 'self'` - Fuentes auto-hospedadas
- ✅ Comentarios añadidos documentando la configuración

#### Paso 2: Actualizar `csp.config.js` ✅ COMPLETADO
```javascript
// Estado actual:
// - ✅ Eliminadas referencias a https://cdnjs.cloudflare.com
// - ✅ Eliminadas referencias a https://fonts.googleapis.com
// - ✅ Eliminadas referencias a https://fonts.gstatic.com
// - ✅ Comentarios añadidos documentando la configuración
```

**Configuración actual:**
- **Development**: Permite `unsafe-inline` para debugging, pero sin CDN externos
- **Production**: CSP estricta sin CDN externos
- **Fonts**: Auto-hospedadas (`font-src 'self'`)
- **Scripts**: Carga dinámica vía npm (`script-src 'self' 'strict-dynamic'`)

#### Paso 3: Verificar
- [x] CSP permite cargar fuentes locales (`font-src 'self'`) ✅
- [x] CSP permite scripts locales (`script-src 'self' 'strict-dynamic'`) ✅
- [x] No hay referencias a CDN externos en CSP ✅
- [x] Comentarios añadidos documentando la configuración ✅
- [ ] No hay errores de CSP en consola (probar en desarrollo y producción)
- [ ] Aplicación funciona correctamente (probar en desarrollo y producción)

**✅ ESTADO: COMPLETADO** - CSP actualizada, todas las dependencias externas eliminadas. Comentarios añadidos para documentación. Pendiente de pruebas en desarrollo y producción.

---

## 📦 SEMANA 2: Design Tokens

### Día 1-2: Añadir Tokens de Gráficos

#### 📍 Ubicación de Colores del Tema
Los colores del tema están definidos en **`src/index.css`** en las variables CSS dentro de `@layer base`:
- **Light mode**: Variables en `:root`
- **Dark mode**: Variables en `.dark`
- **Color primario (naranja)**: `--primary: 31 72% 56%` (HSL)
- **Mapeo a Tailwind**: Los colores se mapean en `tailwind.config.js` usando `hsl(var(--primary))`

#### Paso 1: Actualizar `src/index.css` - Añadir Tokens de Gráficos
```css
@layer base {
  :root {
    /* ... colores existentes ... */
    
    /* Colores para gráficos - Basados en la paleta existente del proyecto */
    --chart-color-1: 31 72% 56%;   /* Primary (naranja) - mismo que --primary */
    --chart-color-2: 31 72% 45%;   /* Naranja más oscuro (variación del primary) */
    --chart-color-3: 31 72% 67%;   /* Naranja más claro (variación del primary) */
    --chart-color-4: 142 76% 36%;  /* Success (verde) - mismo que --success */
    --chart-color-5: 38 92% 50%;   /* Warning (amarillo) - mismo que --warning */
  }

  .dark {
    /* ... colores existentes ... */
    
    /* Colores para gráficos en modo oscuro - Más claros para mejor contraste */
    --chart-color-1: 31 72% 62%;   /* Primary más claro (mismo que --primary-hover en dark) */
    --chart-color-2: 31 72% 52%;   /* Naranja medio */
    --chart-color-3: 31 72% 72%;   /* Naranja más claro */
    --chart-color-4: 142 76% 42%;  /* Success más claro */
    --chart-color-5: 38 92% 56%;   /* Warning más claro */
  }
}
```

**Nota:** Los colores de gráficos están basados en tu paleta existente:
- **Naranja (Primary)**: `31 72% 56%` - Color principal de tu marca (ya definido en `--primary`)
- **Verde (Success)**: `142 76% 36%` - Ya definido en `--success`
- **Amarillo (Warning)**: `38 92% 50%` - Ya definido en `--warning`
- **Variaciones de naranja**: Para crear una paleta coherente con tu marca

#### Paso 2: Actualizar `tailwind.config.js` - Añadir Colores de Gráficos
```javascript
colors: {
  // ... colores existentes (primary, secondary, success, etc.) ...
  
  // Añadir después de inventory:
  chart: {
    1: "hsl(var(--chart-color-1))",  // Naranja principal (primary)
    2: "hsl(var(--chart-color-2))",  // Naranja oscuro (variación)
    3: "hsl(var(--chart-color-3))",  // Naranja claro (variación)
    4: "hsl(var(--chart-color-4))",  // Verde (success)
    5: "hsl(var(--chart-color-5))",  // Amarillo (warning)
  },
},
```

**Ubicación:** Los colores se añaden en `theme.extend.colors` después de `inventory`.

#### Paso 3: Crear Hook `hooks/useChartColors.ts`
```typescript
export const useChartColors = () => {
  return [
    'hsl(var(--chart-color-1))',
    'hsl(var(--chart-color-2))',
    'hsl(var(--chart-color-3))',
    'hsl(var(--chart-color-4))',
    'hsl(var(--chart-color-5))',
  ];
};
```

#### Paso 4: Crear Hook `hooks/useChartTheme.ts`
```typescript
import { useTheme } from '../contexts/ThemeContext';

export const useChartTheme = () => {
  const { theme } = useTheme();
  
  return {
    axis: {
      stroke: 'hsl(var(--muted-foreground))',
      tick: { fill: 'hsl(var(--muted-foreground))' },
    },
    grid: {
      stroke: 'hsl(var(--border))',
    },
    tooltip: {
      background: 'hsl(var(--card))',
      border: 'hsl(var(--border))',
    },
  };
};
```

#### Paso 5: Verificar
- [x] Tokens se definen correctamente en `src/index.css` ✅
- [x] Colores se añaden a `tailwind.config.js` ✅
- [x] Hook `useChartColors.ts` creado ✅
- [x] Hook `useChartTheme.ts` creado ✅
- [x] Refactorizar `DonorAnalysis.tsx` para usar los hooks ✅
- [ ] Probar gráficos en light y dark mode
- [ ] Verificar que los colores se ven correctamente

**✅ ESTADO: COMPLETADO** - Tokens de gráficos añadidos, hooks creados, y DonorAnalysis.tsx refactorizado para usar los tokens del sistema de diseño.

---

### Día 3-4: Refactorizar Badge

#### Paso 1: Actualizar `components/Badge.tsx`
```typescript
// ELIMINAR prefijos dark-* duplicados
const variantClasses = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  'inventory-low': 'bg-inventory-low text-white',
  'inventory-medium': 'bg-inventory-medium text-white',
  'inventory-high': 'bg-inventory-high text-white',
};
```

#### Paso 2: Buscar y Reemplazar Uso de Badge
```bash
# Buscar uso de Badge con dark:bg-dark-*
grep -r "dark:bg-dark-" components/ pages/ --include="*.tsx"
```

#### Paso 3: Verificar
- [x] Prefijos dark-* eliminados de Badge.tsx ✅
- [x] Badge usa solo tokens del sistema de diseño ✅
- [x] No hay uso de dark:bg-dark-* en el componente ✅
- [ ] Badge se ve bien en light mode (probar en aplicación)
- [ ] Badge se ve bien en dark mode (probar en aplicación)
- [ ] No hay inconsistencias visuales (verificar visualmente)

**✅ ESTADO: COMPLETADO** - Badge refactorizado para eliminar prefijos dark-* duplicados. El componente ahora usa solo tokens del sistema de diseño que se adaptan automáticamente al modo oscuro.

---

### Día 5: Refactorizar DonorAnalysis.tsx

#### Paso 1: Actualizar `pages/DonorAnalysis.tsx` ✅ COMPLETADO
```typescript
// ANTES - Valores hardcodeados
const chartTheme = {
  axis: {
    stroke: theme === 'dark' ? 'hsl(215 20% 65%)' : 'hsl(215 16% 46%)',
    tick: { fill: theme === 'dark' ? 'hsl(215 20% 65%)' : 'hsl(215 16% 46%)' },
  },
  grid: {
    stroke: theme === 'dark' ? 'hsl(215 28% 18%)' : 'hsl(215 20% 92%)',
  },
  tooltip: {
    background: theme === 'dark' ? 'hsl(222 47% 11%)' : 'hsl(0 0% 100%)',
    border: theme === 'dark' ? 'hsl(215 28% 18%)' : 'hsl(215 20% 88%)',
  },
};

const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#AF19FF']; // Colores hexadecimales hardcodeados

// DESPUÉS - Usar tokens del sistema
import { useChartTheme } from '../hooks/useChartTheme';
import { useChartColors } from '../hooks/useChartColors';

const chartColors = useChartColors(); // Usa tokens: --chart-color-1 a --chart-color-5 (basados en naranja, verde, amarillo)
const chartTheme = useChartTheme(); // Usa tokens: --muted-foreground, --border, --card
```

**Beneficios:**
- ✅ Colores coherentes con la marca (naranja principal)
- ✅ Se adaptan automáticamente al modo oscuro
- ✅ No hay valores hardcodeados
- ✅ Mantenimiento centralizado

#### Paso 2: Verificar
- [x] DonorAnalysis.tsx refactorizado para usar hooks ✅
- [x] Valores hardcodeados eliminados ✅
- [x] Colores y tema usan tokens del sistema ✅
- [ ] Gráficos se ven correctamente (probar en aplicación)
- [ ] Colores se adaptan al tema (probar en aplicación)
- [ ] No hay errores en consola (probar en aplicación)

**✅ ESTADO: COMPLETADO** - DonorAnalysis.tsx refactorizado para usar los hooks `useChartColors` y `useChartTheme`. Todos los valores hardcodeados han sido eliminados y reemplazados por tokens del sistema de diseño.

---

## 📦 SEMANA 2 (Continuación): Estandarización de Iconos

### Día 5-6: Auditar y Estandarizar Iconos ✅ COMPLETADO

#### Paso 1: Auditar Uso de Iconos ✅ COMPLETADO
- ✅ Verificado que todos los iconos usan `components/icons/Icons.tsx`
- ✅ No hay SVGs hardcodeados en componentes
- ✅ No hay uso de librerías externas de iconos
- ✅ Todos los iconos siguen el mismo patrón de diseño

#### Paso 2: Eliminar Dependencias Innecesarias ✅ COMPLETADO
- ✅ Eliminado `lucide-react` de `package.json` (no se estaba usando)

#### Paso 3: Reglas Estrictas para Iconos ✅ COMPLETADO

**Reglas establecidas:**
1. ✅ **Solo usar iconos de `components/icons/Icons.tsx`**
   - NO usar librerías externas (lucide-react, react-icons, etc.)
   - NO crear SVGs inline en componentes
   - NO usar iconos de CDN

2. ✅ **Patrón consistente:**
   - Todos los iconos exportan `React.FC<React.SVGProps<SVGSVGElement>>`
   - Todos usan `baseProps` para consistencia (width: 24, height: 24, viewBox: '0 0 24 24')
   - Todos aceptan props para personalización (className, size, etc.)

3. ✅ **Añadir nuevos iconos:**
   - Si necesitas un icono nuevo, añádelo a `components/icons/Icons.tsx`
   - Sigue el patrón existente
   - Usa SVG optimizado y accesible

4. ✅ **Importación:**
   ```tsx
   // ✅ CORRECTO
   import { PlusIcon, EditIcon } from './icons/Icons';
   
   // ❌ INCORRECTO
   import { Plus } from 'lucide-react';
   import { FaPlus } from 'react-icons/fa';
   ```

#### Paso 4: Verificar ✅ COMPLETADO
- [x] Todos los iconos usan el sistema centralizado ✅
- [x] No hay dependencias innecesarias ✅
- [x] Reglas documentadas ✅
- [x] `lucide-react` eliminado de package.json ✅

**✅ ESTADO: COMPLETADO** - Sistema de iconos estandarizado. Todos los iconos vienen de `components/icons/Icons.tsx`. Dependencia `lucide-react` eliminada.

---

## 📦 SEMANA 3-4: Componentes Base

### Día 1-2: Crear FormField

#### Paso 1: Crear `components/FormField.tsx`
```typescript
import React from 'react';
import { Label } from './forms';
import { FormError } from './forms';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
  className,
  htmlFor,
}) => {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && <FormError message={error} />}
    </div>
  );
};
```

#### Paso 2: Exportar en `components/index.ts` (si existe)
```typescript
export { FormField } from './FormField';
```

#### Paso 3: Buscar Formularios para Refactorizar
```bash
# Buscar patrones de Label + Input + Error
grep -r "Label\|label" pages/ --include="*.tsx" | head -20
```

#### Paso 4: Refactorizar un Formulario de Ejemplo
```tsx
// Antes
<Label htmlFor="name">Nombre</Label>
<Input id="name" {...register('name')} />
{errors.name && <FormError message={errors.name.message} />}

// Después
<FormField label="Nombre" error={errors.name?.message} required htmlFor="name">
  <Input id="name" {...register('name')} />
</FormField>
```

#### Paso 5: Verificar
- [ ] FormField funciona correctamente
- [ ] Validación visual funciona
- [ ] Accesibilidad correcta (htmlFor, labels)

---

### Día 3-4: Mejorar Button

#### Paso 1: Actualizar `components/Button.tsx`
```typescript
// Añadir props
interface ButtonOwnProps {
  // ... props existentes ...
  loading?: boolean;
  loadingText?: string;
}

// Añadir en el componente
import LoadingSpinner from './LoadingSpinner';

// En el render
const isLoading = loading;
const content = isLoading ? (
  <>
    <LoadingSpinner size="sm" className="mr-2" />
    {loadingText || children}
  </>
) : (
  children
);

return React.createElement(
  Component,
  {
    className: `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`,
    disabled: props.disabled || isLoading,
    ...props,
  },
  content
);
```

#### Paso 2: Buscar Botones para Actualizar ✅ COMPLETADO
- Encontrados botones con estados de loading manuales en:
  - `pages/Login.tsx` - Botón de login
  - `pages/Backup.tsx` - Botones de backup y reset

#### Paso 3: Refactorizar Botones ✅ COMPLETADO
```tsx
// Antes
<Button disabled={authLoading || !values.email}>
  {authLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
</Button>

// Después
<Button 
  disabled={!values.email}
  loading={authLoading}
  loadingText="Iniciando sesión..."
>
  Iniciar Sesión
</Button>
```

**Archivos refactorizados:**
- ✅ `pages/Login.tsx` - Botón de login con loading
- ✅ `pages/Backup.tsx` - Botón de backup y reset con loading

#### Paso 4: Verificar
- [x] Props `loading` y `loadingText` añadidas a Button ✅
- [x] Spinner integrado en Button ✅
- [x] Spinner se adapta al tamaño del botón (sm, default, lg) ✅
- [x] Spinner usa color correcto según la variante ✅
- [x] Botón se deshabilita automáticamente durante loading ✅
- [x] Botones refactorizados en Login.tsx y Backup.tsx ✅
- [ ] Loading state funciona correctamente (probar en aplicación)
- [ ] Spinner se muestra correctamente (probar en aplicación)

**✅ ESTADO: COMPLETADO** - Button mejorado con soporte para estados de loading. Spinner integrado que se adapta al tamaño y variante del botón. Botones refactorizados para usar la nueva prop `loading`.

---

### Día 5: Crear Avatar

#### Paso 1: Crear `components/Avatar.tsx`
```typescript
import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  initials,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <div
      className={`rounded-full bg-accent flex items-center justify-center flex-shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="rounded-full w-full h-full object-cover"
        />
      ) : (
        <span className="font-semibold text-accent-foreground">
          {initials || '?'}
        </span>
      )}
    </div>
  );
};
```

#### Paso 2: Buscar Uso de Avatares Manuales
```bash
# Buscar divs con iniciales o avatares
grep -r "getInitials\|rounded-full.*bg-accent" pages/ components/ --include="*.tsx"
```

#### Paso 3: Refactorizar en Donors.tsx
```tsx
// Antes
<div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center">
  <span className="text-xl font-bold text-accent-foreground">
    {getInitials(donor.donor_name)}
  </span>
</div>

// Después
<Avatar initials={getInitials(donor.donor_name)} size="lg" />
```

#### Paso 4: Verificar
- [ ] Avatar se ve correctamente
- [ ] Iniciales se muestran bien
- [ ] Tamaños funcionan correctamente

---

## 📦 SEMANA 5-6: Componentes de Utilidad

### Día 1-2: Refactorizar Table

#### Paso 1: Eliminar Estilos Inline de `components/Table.tsx`
```typescript
// Reemplazar
style={{ tableLayout: 'fixed' }}

// Con
className="table-fixed"

// Reemplazar
style={{ width: '150px' }}

// Con
className="w-[150px]" // O mejor: usar colgroup con clases

// Reemplazar
style={{ cursor: isSortable ? 'pointer' : 'move' }}

// Con
className={isSortable ? 'cursor-pointer' : 'cursor-move'}
```

#### Paso 2: Verificar
- [ ] Tabla funciona correctamente
- [ ] Redimensionamiento funciona
- [ ] Ordenamiento funciona
- [ ] No hay estilos inline restantes

---

### Día 3-4: Refactorizar Alerts

#### Paso 1: Actualizar `components/Alerts.tsx`
```typescript
// Reemplazar valores opacos hardcodeados
const alertConfig = {
  success: {
    icon: CheckCircleIcon,
    bgClass: 'bg-success/10 border-success/50 text-success',
  },
  error: {
    icon: XCircleIcon,
    bgClass: 'bg-destructive/10 border-destructive/50 text-destructive',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    bgClass: 'bg-warning/10 border-warning/50 text-warning',
  },
  info: {
    icon: InformationCircleIcon,
    bgClass: 'bg-primary/10 border-primary/50 text-primary',
  },
};
```

#### Paso 2: Verificar
- [ ] Alertas se ven correctamente
- [ ] Colores usan tokens
- [ ] Dark mode funciona

---

### Día 5: Crear Progress

#### Paso 1: Crear `components/Progress.tsx`
```typescript
import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className = '',
  showLabel = false,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>Progreso</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};
```

#### Paso 2: Verificar
- [ ] Progress funciona correctamente
- [ ] Accesibilidad correcta
- [ ] Animación suave

---

## 📦 SEMANA 7-8: Refactorización de Páginas

### Prioridad de Páginas
1. **Dashboard.tsx** - Usar variantes de Card
2. **Donors.tsx** - Usar Avatar component
3. **Products.tsx** - Refactorizar formularios con FormField
4. **Warehouses.tsx** - Estandarizar espaciado
5. **Otras páginas** - Refactorizar progresivamente

### Estrategia por Página
1. Identificar patrones repetitivos
2. Crear variantes de componentes o clases de utilidad
3. Refactorizar sección por sección
4. Verificar visualmente
5. Probar funcionalidad

---

## 📦 SEMANA 9-10: Limpieza Final y Documentación

### Día 1-3: Limpieza Final
- [ ] Buscar y eliminar estilos inline restantes
- [ ] Estandarizar uso de espaciado
- [ ] Revisar y unificar dark mode
- [ ] Optimizar rendimiento (lazy loading, code splitting)

### Día 4-5: Documentación
- [ ] Crear `DESIGN_SYSTEM.md` completo
- [ ] Documentar todos los componentes
- [ ] Crear ejemplos de uso
- [ ] Establecer reglas del equipo

### Día 6-7: Testing y Revisión
- [ ] Revisar toda la aplicación visualmente
- [ ] Probar en light y dark mode
- [ ] Verificar accesibilidad
- [ ] Revisar rendimiento

### Día 8-10: Ajustes Finales
- [ ] Corregir inconsistencias encontradas
- [ ] Optimizar componentes lentos
- [ ] Actualizar documentación
- [ ] Preparar presentación para el equipo

---

## ✅ Checklist Final

### Dependencias
- [ ] Google Fonts auto-hospedadas
- [ ] xlsx migrado a npm
- [ ] CSP actualizada (sin dominios externos)

### Design Tokens
- [ ] Tokens de gráficos añadidos
- [ ] Tokens documentados
- [ ] Dark mode unificado

### Componentes
- [ ] FormField creado
- [ ] Button mejorado (loading state)
- [ ] Avatar creado
- [ ] Badge refactorizado
- [ ] Table refactorizado
- [ ] Alerts refactorizado
- [ ] Progress creado
- [ ] Otros componentes creados

### Refactorización
- [ ] DonorAnalysis.tsx refactorizado
- [ ] Dashboard.tsx refactorizado
- [ ] Donors.tsx refactorizado
- [ ] Otras páginas refactorizadas

### Documentación
- [ ] DESIGN_SYSTEM.md creado
- [ ] Reglas del equipo establecidas
- [ ] Checklist de revisión creado

### Calidad
- [ ] No hay estilos inline (excepto justificados)
- [ ] No hay valores mágicos
- [ ] No hay dependencias CDN
- [ ] Dark mode funciona correctamente
- [ ] Accesibilidad verificada
- [ ] Rendimiento optimizado

---

## 🎯 Métricas de Éxito

### Antes de la Migración
- Dependencias CDN: 2 (Google Fonts, xlsx)
- Valores hardcodeados: ~15 instancias
- Estilos inline: ~10 instancias
- Inconsistencias dark mode: ~20 instancias
- Componentes no reutilizados: ~30 patrones

### Después de la Migración
- Dependencias CDN: 0 ✅
- Valores hardcodeados: 0 ✅
- Estilos inline: <3 (solo justificados) ✅
- Inconsistencias dark mode: 0 ✅
- Componentes no reutilizados: <5 ✅

---

**Última actualización:** 2024  
**Versión:** 1.0

