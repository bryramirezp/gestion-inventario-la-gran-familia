# 🎨 Auditoría de Diseño y Plan de Migración a Design System

**Proyecto:** Gestión de Inventario - La Gran Familia  
**Fecha:** 2024  
**Arquitecto Front-End:** Especialista en Design Systems

---

## 📊 RESUMEN EJECUTIVO

Esta auditoría identifica los problemas actuales en el sistema de estilos y propone un plan estructurado para migrar a un Design System robusto, escalable y mantenible basado en componentes y tokens de diseño centralizados.

### Estado Actual
- ✅ Tailwind CSS configurado con variables CSS básicas
- ✅ Componentes base existentes (Button, Card, Badge, Input, etc.)
- ⚠️ Dependencias externas vía CDN (Google Fonts, xlsx library)
- ⚠️ Valores hardcodeados en componentes (colores HSL, valores mágicos)
- ⚠️ Inconsistencias en el uso de variantes dark mode
- ⚠️ Clases de utilidad repetitivas en páginas
- ⚠️ Estilos inline en algunos componentes

### Objetivo
Crear un Design System unificado que elimine dependencias externas, centralice todos los tokens de diseño, y establezca componentes reutilizables como la única forma de construir la UI.

---

## 📋 FASE 1: AUDITORÍA Y DIAGNÓSTICO

### 1.1 Análisis de Código - Patrones de Diseño Hardcodeado

#### 🔴 Problemas Críticos Identificados

**1. Valores HSL Hardcodeados en Componentes**
- **Ubicación:** `pages/DonorAnalysis.tsx` (líneas 80-92)
- **Problema:** Valores HSL directamente en código JavaScript
```typescript
const chartTheme = {
  axis: {
    stroke: theme === 'dark' ? 'hsl(215 20% 65%)' : 'hsl(215 16% 46%)',
    tick: { fill: theme === 'dark' ? 'hsl(215 20% 65%)' : 'hsl(215 16% 46%)' },
  },
  grid: {
    stroke: theme === 'dark' ? 'hsl(215 28% 18%)' : 'hsl(215 20% 92%)',
  },
  // ...
};
```
- **Impacto:** Valores duplicados, difícil mantenimiento, inconsistencias visuales
- **Solución:** Extraer a tokens de diseño en `tailwind.config.js`

**2. Colores Hexadecimales Hardcodeados**
- **Ubicación:** `pages/DonorAnalysis.tsx` (línea 94)
- **Problema:** Array de colores hardcodeados para gráficos
```typescript
const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#AF19FF'];
```
- **Impacto:** No siguen la paleta del sistema, no se adaptan al tema
- **Solución:** Crear paleta de colores para gráficos basada en tokens del sistema

**3. Estilos Inline en Componentes**
- **Ubicaciones:**
  - `components/Table.tsx` (líneas 128, 134, 139, 166): `style={{ tableLayout: 'fixed' }}`, `style={{ width: '150px' }}`, `style={{ cursor: ... }}`
  - `components/DatePicker.tsx` (línea 145): `style={calculatePosition()}`
  - `components/Animated.tsx` (líneas 120, 126): `style={{ whiteSpace: 'pre-wrap' }}`
- **Problema:** Mezcla de estilos inline con clases de Tailwind
- **Impacto:** Dificulta el mantenimiento y la consistencia
- **Solución:** Mover a clases de Tailwind o crear componentes especializados

**4. Clases de Utilidad Repetitivas y Excesivas**
- **Ubicación:** Múltiples páginas (`pages/Dashboard.tsx`, `pages/Donors.tsx`, etc.)
- **Problema:** Cadenas largas de clases Tailwind directamente en JSX
```tsx
<Card className="border-l-4 border-l-primary shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 hover:bg-card-hover">
```
- **Impacto:** Código difícil de leer, mantenimiento complicado, inconsistencias
- **Solución:** Crear variantes de componentes o usar `@apply` de forma centralizada

**5. Inconsistencias en Dark Mode**
- **Ubicación:** Múltiples componentes
- **Problema:** Mezcla de patrones:
  - Algunos usan: `dark:bg-dark-card dark:text-dark-foreground`
  - Otros usan: `dark:bg-card dark:text-foreground`
  - Badge usa ambos patrones inconsistentemente
- **Impacto:** Comportamiento visual inconsistente en modo oscuro
- **Solución:** Estandarizar uso de tokens (no usar prefijos `dark-*` duplicados)

#### 🟡 Problemas Moderados

**6. Valores Mágicos en Espaciado**
- **Problema:** Uso directo de valores como `gap-4`, `p-6`, `px-3` sin considerar escala de espaciado
- **Solución:** Documentar escala de espaciado y crear componentes que encapsulen espaciado consistente

**7. Duplicación de Estilos de Hover/Transición**
- **Problema:** Patrones repetidos de `hover:shadow-medium transition-all duration-300 hover:-translate-y-1`
- **Solución:** Crear clases de utilidad personalizadas o variantes de componentes

### 1.2 Auditoría de Dependencias Externas (CDN)

#### 🔴 Dependencias Identificadas

**1. Google Fonts - Inter**
- **Ubicación:** `index.html` (líneas 10-15)
- **Estado Actual:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```
- **Problemas:**
  - Dependencia externa (riesgo de disponibilidad)
  - Requiere `fonts.googleapis.com` y `fonts.gstatic.com` en CSP
  - No se puede optimizar con `font-display: swap` de forma nativa
  - Aumenta tiempo de carga inicial
- **Solución:** Auto-hospedar fuentes usando `@font-face` con `font-display: swap`

**2. xlsx Library (SheetJS)**
- **Ubicación:** `index.html` (línea 18)
- **Estado Actual:**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" defer></script>
```
- **Problemas:**
  - Dependencia externa crítica para funcionalidad de exportación
  - Requiere `cdnjs.cloudflare.com` en CSP (`script-src`)
  - Tamaño grande (~2.5MB) cargado de forma síncrona
  - No se puede tree-shake
- **Solución:** Instalar como dependencia npm y usar import dinámico solo cuando sea necesario

**3. Configuración CSP Actual**
- **Ubicación:** `vercel.json`
- **Estado:** Permite múltiples dominios externos
- **Problema:** Política de seguridad relajada debido a dependencias externas
- **Solución:** Eliminar dependencias externas para permitir CSP más estricta

### 1.3 Inventario de Componentes UI

#### ✅ Componentes Base Existentes
1. **Button** (`components/Button.tsx`)
   - Variantes: `default`, `destructive`, `outline`, `ghost`, `link`
   - Tamaños: `default`, `sm`, `lg`, `icon`
   - Estado: ✅ Bien estructurado, usa tokens de diseño
   - Mejoras: Añadir variante `loading`, mejorar accesibilidad

2. **Card** (`components/Card.tsx`)
   - Subcomponentes: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
   - Estado: ✅ Bien estructurado
   - Mejoras: Añadir variantes (elevated, outlined, flat)

3. **Badge** (`components/Badge.tsx`)
   - Variantes: `primary`, `secondary`, `destructive`, `success`, `warning`, `inventory-*`
   - Problema: ⚠️ Inconsistencias en uso de dark mode
   - Mejoras: Estandarizar uso de tokens, eliminar prefijos `dark-*` duplicados

4. **Input/Forms** (`components/forms.tsx`)
   - Componentes: `Input`, `Label`, `Select`, `Textarea`, `FormError`
   - Estado: ✅ Bien estructurado
   - Mejoras: Añadir `Checkbox`, `Radio`, `Switch`, mejorar validación visual

5. **Table** (`components/Table.tsx`)
   - Funcionalidades: Ordenamiento, redimensionamiento, expansión de filas
   - Problema: ⚠️ Estilos inline mezclados
   - Mejoras: Eliminar estilos inline, crear variantes de tabla

6. **Icons** (`components/icons/Icons.tsx`)
   - Estado: ✅ Bien organizados como componentes SVG
   - Mejoras: Considerar usar `lucide-react` (ya instalado) para consistencia

#### 🟡 Componentes que Necesitan Refactorización
1. **Sidebar** (`components/Sidebar.tsx`)
   - Problema: Clases de utilidad excesivas, lógica de estilos mezclada
   - Mejoras: Extraer variantes, crear componentes más pequeños

2. **Alerts** (`components/Alerts.tsx`)
   - Problema: Configuración hardcodeada con valores opacos
   - Mejoras: Usar tokens de diseño para colores de fondo/borde

3. **DatePicker** (`components/DatePicker.tsx`)
   - Problema: Estilos inline para posicionamiento
   - Mejoras: Usar clases de Tailwind o crear hook de posicionamiento

#### 🔴 Componentes Faltantes (Identificados)
1. **Spinner/Loading** - Existe pero puede mejorarse
2. **Modal/Dialog** - Existe (`Dialog.tsx`, `Modal.tsx`) pero necesita unificación
3. **Toast/Notification** - Existe pero puede mejorarse
4. **Tooltip** - No existe
5. **Dropdown/Menu** - No existe (usar Combobox no es ideal)
6. **Tabs** - No existe
7. **Accordion** - No existe
8. **Avatar** - No existe (se usa div con iniciales)
9. **Progress** - No existe
10. **Skeleton** - No existe (para loading states)

### 1.4 Identificación de Inconsistencias Visuales

#### Espaciado
- **Problema:** Uso inconsistente de valores de espaciado
  - Algunos componentes usan `p-6`, otros `p-4`
  - `gap-4` vs `gap-6` sin criterio claro
- **Solución:** Definir escala de espaciado estándar en tokens

#### Sombras
- **Estado:** Ya definidas en `tailwind.config.js` (soft, medium, strong, elegant, glow)
- **Problema:** Uso inconsistente, algunos componentes usan `shadow-md` de Tailwind por defecto
- **Solución:** Estandarizar uso de sombras personalizadas

#### Bordes
- **Problema:** Mezcla de `border`, `border-2`, `border-4` sin criterio
- **Solución:** Definir escala de bordes en tokens

#### Tipografía
- **Estado:** Fuente Inter configurada
- **Problema:** Escala de tamaños no documentada, uso inconsistente de `font-weight`
- **Solución:** Definir escala tipográfica completa

#### Colores de Estado
- **Problema:** Colores de inventario (`inventory-high`, `inventory-medium`, etc.) bien definidos, pero colores para gráficos no
- **Solución:** Crear paleta de colores para visualizaciones de datos

---

## 📋 FASE 2: DEFINICIÓN DEL SISTEMA DE DISEÑO (DESIGN TOKENS)

### 2.1 Extracción y Centralización de Tokens

#### Estructura Propuesta para `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // === TIPOGRAFÍA ===
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Auto-hospedada
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      // === COLORES (Ya bien definidos, solo organizar mejor) ===
      colors: {
        // Semánticos (usar HSL variables)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          light: "hsl(var(--primary-light))",
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
        },
        
        // Inventario (ya definidos)
        inventory: {
          high: "hsl(var(--inventory-high))",
          medium: "hsl(var(--inventory-medium))",
          low: "hsl(var(--inventory-low))",
          expired: "hsl(var(--inventory-expired))",
        },
        
        // NUEVO: Colores para gráficos y visualizaciones
        chart: {
          1: "hsl(var(--chart-color-1))",
          2: "hsl(var(--chart-color-2))",
          3: "hsl(var(--chart-color-3))",
          4: "hsl(var(--chart-color-4))",
          5: "hsl(var(--chart-color-5))",
        },
      },

      // === ESPACIADO (Escala consistente) ===
      spacing: {
        // Mantener escala de Tailwind, pero documentar uso
        // 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64
        // Uso recomendado:
        // - Componentes internos: 2, 3, 4
        // - Espaciado entre elementos: 4, 6, 8
        // - Secciones: 8, 12, 16
        // - Layout: 16, 24, 32
      },

      // === BORDES ===
      borderRadius: {
        none: '0',
        sm: 'calc(0.75rem - 4px)',    // 8px
        DEFAULT: 'calc(0.75rem - 2px)', // 10px
        md: 'calc(0.75rem - 2px)',
        lg: '0.75rem',                  // 12px
        xl: '1rem',                     // 16px
        full: '9999px',
      },
      borderWidth: {
        DEFAULT: '1px',
        '0': '0',
        '2': '2px',
        '4': '4px',
      },

      // === SOMBRAS (Ya definidas, mantener) ===
      boxShadow: {
        soft: '0 2px 8px -2px hsl(var(--foreground) / 0.08)',
        medium: '0 4px 16px -4px hsl(var(--foreground) / 0.12)',
        strong: '0 8px 32px -8px hsl(var(--foreground) / 0.16)',
        elegant: '0 10px 30px -10px hsl(var(--primary) / 0.3)',
        glow: '0 0 40px hsl(var(--primary) / 0.4)',
        'dark-soft': '0 2px 8px -2px hsl(0 0% 0% / 0.15)',
        'dark-medium': '0 4px 16px -4px hsl(0 0% 0% / 0.2)',
      },

      // === TRANSICIONES ===
      transitionDuration: {
        DEFAULT: '200ms',
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // === ANIMACIONES (Ya definidas, mantener) ===
      keyframes: {
        "content-show": {
          from: { opacity: 0, transform: 'scale(0.96)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        "slide-up": {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        "slide-in-right": {
          '0%': { transform: 'translateX(100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
      },
      animation: {
        "content-show": "content-show 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both",
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
```

#### Actualización de `src/index.css` - Añadir Tokens de Gráficos

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ... colores existentes ... */
    
    /* NUEVO: Colores para gráficos (basados en paleta existente) */
    --chart-color-1: 31 72% 56%;   /* Primary (naranja) */
    --chart-color-2: 215 90% 52%;  /* Azul */
    --chart-color-3: 142 76% 36%;  /* Success (verde) */
    --chart-color-4: 38 92% 50%;   /* Warning (amarillo) */
    --chart-color-5: 280 65% 60%;  /* Púrpura */
  }

  .dark {
    /* ... colores existentes ... */
    
    /* Colores para gráficos en modo oscuro (más saturados) */
    --chart-color-1: 31 72% 62%;   /* Primary más claro */
    --chart-color-2: 215 90% 58%;  /* Azul más claro */
    --chart-color-3: 142 76% 42%;  /* Verde más claro */
    --chart-color-4: 38 92% 56%;   /* Amarillo más claro */
    --chart-color-5: 280 65% 66%;  /* Púrpura más claro */
  }
}
```

### 2.2 Estrategia de Activos Locales

#### 2.2.1 Auto-hospedaje de Google Fonts (Inter)

**Paso 1: Descargar Fuentes**
```bash
# Usar herramienta como google-webfonts-helper o descargar manualmente
# Crear directorio: public/fonts/inter/
```

**Paso 2: Estructura de Archivos**
```
public/
  fonts/
    inter/
      Inter-Regular.woff2
      Inter-Regular.woff
      Inter-Medium.woff2
      Inter-Medium.woff
      Inter-SemiBold.woff2
      Inter-SemiBold.woff
      Inter-Bold.woff2
      Inter-Bold.woff
      Inter-ExtraBold.woff2
      Inter-ExtraBold.woff
```

**Paso 3: Definir @font-face en CSS**
```css
/* src/index.css - Añadir antes de @tailwind base */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-Regular.woff2') format('woff2'),
       url('/fonts/inter/Inter-Regular.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-Medium.woff2') format('woff2'),
       url('/fonts/inter/Inter-Medium.woff') format('woff');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-SemiBold.woff2') format('woff2'),
       url('/fonts/inter/Inter-SemiBold.woff') format('woff');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-Bold.woff2') format('woff2'),
       url('/fonts/inter/Inter-Bold.woff') format('woff');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter/Inter-ExtraBold.woff2') format('woff2'),
       url('/fonts/inter/Inter-ExtraBold.woff') format('woff');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}
```

**Paso 4: Eliminar Enlaces CDN de `index.html`**
- Remover `<link rel="preconnect">` y `<link href="https://fonts.googleapis.com...">`

#### 2.2.2 Auto-hospedaje de xlsx Library

**Paso 1: Instalar como Dependencia**
```bash
npm install xlsx
```

**Paso 2: Crear Hook de Carga Dinámica**
```typescript
// hooks/useXLSX.ts
import { useState, useEffect } from 'react';

let xlsxModule: any = null;
let loading = false;
let loadPromise: Promise<any> | null = null;

export const useXLSX = () => {
  const [isReady, setIsReady] = useState(!!xlsxModule);

  useEffect(() => {
    if (xlsxModule || loading) return;

    loading = true;
    if (!loadPromise) {
      loadPromise = import('xlsx').then((module) => {
        xlsxModule = module;
        loading = false;
        setIsReady(true);
        return module;
      });
    } else {
      loadPromise.then(() => setIsReady(true));
    }
  }, []);

  return { xlsx: xlsxModule, isReady };
};
```

**Paso 3: Actualizar Componentes que Usan xlsx**
```typescript
// En lugar de usar window.XLSX, usar:
const { xlsx, isReady } = useXLSX();
if (!isReady) return <LoadingSpinner />;
// Usar xlsx normalmente
```

**Paso 4: Eliminar Script CDN de `index.html`**
- Remover `<script src="https://cdnjs.cloudflare.com/...xlsx..."></script>`

**Paso 5: Actualizar CSP en `vercel.json`**
- Eliminar `https://cdnjs.cloudflare.com` de `script-src`
- Eliminar `https://fonts.googleapis.com` y `https://fonts.gstatic.com` de `style-src` y `font-src`

### 2.3 Definición de Componentes Base

#### Componentes Atómicos (Ya Existentes - Mejorar)
1. **Button** - ✅ Mejorar: añadir loading state
2. **Input** - ✅ Mejorar: añadir iconos, mejor validación
3. **Label** - ✅ OK
4. **Select** - ✅ Mejorar: crear componente con mejor UX
5. **Textarea** - ✅ OK
6. **Badge** - ⚠️ Refactorizar: eliminar inconsistencias dark mode
7. **Avatar** - 🔴 Crear nuevo
8. **Icon** - ✅ Mejorar: considerar lucide-react

#### Componentes Moleculares (Ya Existentes - Mejorar)
1. **Card** - ✅ Mejorar: añadir variantes
2. **Table** - ⚠️ Refactorizar: eliminar estilos inline
3. **Alert** - ⚠️ Refactorizar: usar tokens
4. **Modal/Dialog** - ⚠️ Unificar: hay Dialog y Modal separados
5. **FormField** - 🔴 Crear nuevo (Input + Label + Error)
6. **Dropdown** - 🔴 Crear nuevo
7. **Tooltip** - 🔴 Crear nuevo
8. **Tabs** - 🔴 Crear nuevo
9. **Accordion** - 🔴 Crear nuevo
10. **Progress** - 🔴 Crear nuevo
11. **Skeleton** - 🔴 Crear nuevo

#### Componentes de Layout (Ya Existentes)
1. **Sidebar** - ⚠️ Refactorizar: extraer componentes más pequeños
2. **Header/TopBar** - ✅ OK
3. **MainLayout** - ✅ OK

---

## 📋 FASE 3: REFACTORIZACIÓN E IMPLEMENTACIÓN

### 3.1 Creación de Componentes Base Mejorados

#### Prioridad 1: Componentes Críticos

**1. FormField (Nuevo)**
```typescript
// components/FormField.tsx
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && <FormError message={error} />}
    </div>
  );
};
```

**2. Button con Loading State**
```typescript
// components/Button.tsx - Añadir
interface ButtonProps {
  // ... props existentes
  loading?: boolean;
  loadingText?: string;
}

// En el componente, añadir:
{loading && <LoadingSpinner size="sm" className="mr-2" />}
{loading ? loadingText || children : children}
```

**3. Badge Refactorizado**
```typescript
// components/Badge.tsx - Eliminar prefijos dark-* duplicados
// Los tokens ya manejan dark mode automáticamente
const variantClasses = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  // ... sin dark:bg-dark-*
};
```

**4. Avatar Component**
```typescript
// components/Avatar.tsx
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
  className,
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <div
      className={cn(
        'rounded-full bg-accent flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="rounded-full w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-accent-foreground">{initials}</span>
      )}
    </div>
  );
};
```

#### Prioridad 2: Componentes de Utilidad

**5. Tooltip**
```typescript
// components/Tooltip.tsx - Usar Radix UI o crear propio con Portal
```

**6. Dropdown/Menu**
```typescript
// components/Dropdown.tsx - Crear componente accesible
```

**7. Progress**
```typescript
// components/Progress.tsx
interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100, className }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className={cn("w-full h-2 bg-muted rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
```

**8. Skeleton**
```typescript
// components/Skeleton.tsx
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn("animate-pulse bg-muted rounded", className)}
      aria-hidden="true"
    />
  );
};
```

### 3.2 Abstracción de Clases de Tailwind

#### Estrategia 1: Variantes de Componentes (Preferida)

En lugar de:
```tsx
<Card className="border-l-4 border-l-primary shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 hover:bg-card-hover">
```

Crear:
```tsx
<Card variant="elevated" accent="primary">
```

```typescript
// components/Card.tsx - Añadir variantes
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  accent?: 'primary' | 'success' | 'warning' | 'destructive';
  // ...
}

const variantClasses = {
  default: 'shadow-soft',
  elevated: 'shadow-medium hover:shadow-strong transition-all duration-300 hover:-translate-y-1',
  outlined: 'border-2 shadow-none',
  flat: 'shadow-none border-none',
};

const accentClasses = {
  primary: 'border-l-4 border-l-primary',
  success: 'border-l-4 border-l-success',
  warning: 'border-l-4 border-l-warning',
  destructive: 'border-l-4 border-l-destructive',
};
```

#### Estrategia 2: Clases de Utilidad Personalizadas (Usar Moderadamente)

```css
/* src/index.css - @layer components */
@layer components {
  .card-interactive {
    @apply shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 hover:bg-card-hover;
  }
  
  .button-group {
    @apply flex gap-2;
  }
  
  .form-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
  }
}
```

**⚠️ Regla:** Solo usar `@apply` para patrones que se repiten 3+ veces y que no tienen sentido como componente.

### 3.3 Refactorización Progresiva

#### Plan de Migración por Fases

**Fase 3.1: Fundación (Semana 1-2)**
1. ✅ Auto-hospedar Google Fonts
2. ✅ Migrar xlsx a npm
3. ✅ Actualizar CSP
4. ✅ Añadir tokens de gráficos
5. ✅ Refactorizar Badge

**Fase 3.2: Componentes Base (Semana 3-4)**
1. ✅ Crear FormField
2. ✅ Mejorar Button (loading state)
3. ✅ Crear Avatar
4. ✅ Refactorizar Table (eliminar estilos inline)
5. ✅ Refactorizar Alerts (usar tokens)

**Fase 3.3: Componentes de Utilidad (Semana 5-6)**
1. ✅ Crear Tooltip
2. ✅ Crear Dropdown
3. ✅ Crear Progress
4. ✅ Crear Skeleton
5. ✅ Unificar Modal/Dialog

**Fase 3.4: Refactorización de Páginas (Semana 7-8)**
1. ✅ Refactorizar `DonorAnalysis.tsx` (usar tokens de gráficos)
2. ✅ Refactorizar `Dashboard.tsx` (usar variantes de Card)
3. ✅ Refactorizar `Donors.tsx` (usar Avatar component)
4. ✅ Refactorizar otras páginas progresivamente

**Fase 3.5: Limpieza Final (Semana 9-10)**
1. ✅ Eliminar estilos inline restantes
2. ✅ Estandarizar uso de espaciado
3. ✅ Revisar y unificar dark mode
4. ✅ Optimización de rendimiento

#### Ejemplo: Refactorización de DonorAnalysis.tsx

**Antes:**
```typescript
const chartTheme = {
  axis: {
    stroke: theme === 'dark' ? 'hsl(215 20% 65%)' : 'hsl(215 16% 46%)',
    // ...
  },
};

const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#AF19FF'];
```

**Después:**
```typescript
// hooks/useChartTheme.ts
import { useTheme } from '../contexts/ThemeContext';

export const useChartTheme = () => {
  const { theme } = useTheme();
  
  return {
    axis: {
      stroke: theme === 'dark' 
        ? 'hsl(var(--muted-foreground))' 
        : 'hsl(var(--muted-foreground))',
      tick: { fill: 'hsl(var(--muted-foreground))' },
    },
    grid: {
      stroke: theme === 'dark' 
        ? 'hsl(var(--border))' 
        : 'hsl(var(--border))',
    },
    tooltip: {
      background: theme === 'dark' 
        ? 'hsl(var(--card))' 
        : 'hsl(var(--card))',
      border: 'hsl(var(--border))',
    },
  };
};

// hooks/useChartColors.ts
export const useChartColors = () => {
  return [
    'hsl(var(--chart-color-1))',
    'hsl(var(--chart-color-2))',
    'hsl(var(--chart-color-3))',
    'hsl(var(--chart-color-4))',
    'hsl(var(--chart-color-5))',
  ];
};

// En DonorAnalysis.tsx
const chartTheme = useChartTheme();
const COLORS = useChartColors();
```

---

## 📋 FASE 4: DOCUMENTACIÓN Y MANTENIMIENTO

### 4.1 Guía de Estilo

#### Estructura Propuesta

Crear `DESIGN_SYSTEM.md` en la raíz del proyecto con:

1. **Design Tokens**
   - Colores (paleta completa con ejemplos)
   - Tipografía (escala, pesos, line-height)
   - Espaciado (escala y uso recomendado)
   - Sombras (cuándo usar cada una)
   - Bordes (escala de radios, grosores)

2. **Componentes**
   - Documentación de cada componente
   - Props y variantes
   - Ejemplos de uso
   - Casos de uso comunes

3. **Patrones**
   - Formularios (cómo estructurar)
   - Tablas (cuándo usar cada variante)
   - Navegación (patrones de sidebar, breadcrumbs)
   - Feedback (alerts, toasts, loading states)

4. **Accesibilidad**
   - Requisitos de ARIA
   - Navegación por teclado
   - Contraste de colores
   - Screen readers

#### Herramientas Opcionales

**Opción 1: Storybook** (Recomendado para equipos grandes)
```bash
npm install -D @storybook/react @storybook/addon-essentials
```
- Ventajas: Documentación interactiva, pruebas visuales
- Desventajas: Configuración adicional, mantenimiento

**Opción 2: Markdown Simple** (Recomendado para equipos pequeños)
- Crear `DESIGN_SYSTEM.md` con ejemplos de código
- Ventajas: Simple, fácil de mantener
- Desventajas: No interactivo

**Opción 3: Component Showcase Page** (Híbrido)
- Crear página interna `/design-system` con ejemplos
- Ventajas: Interactivo, siempre actualizado
- Desventajas: Requiere desarrollo

### 4.2 Buenas Prácticas y Reglas del Equipo

#### Reglas Estrictas (No Negociables)

1. **❌ NO usar CDNs**
   - Todas las dependencias deben ser npm packages
   - Todas las fuentes deben estar auto-hospedadas
   - Todas las imágenes deben estar en `/public`

2. **❌ NO usar valores mágicos**
   - No usar colores hexadecimales directamente: `bg-[#FF8042]`
   - No usar valores HSL hardcodeados: `hsl(215 20% 65%)`
   - No usar espaciado arbitrario sin justificación: `gap-[13px]`
   - Usar siempre tokens: `bg-primary`, `text-muted-foreground`, `gap-4`

3. **❌ NO usar estilos inline**
   - Excepto para estilos dinámicos calculados (ej: posicionamiento de tooltips)
   - Usar clases de Tailwind o componentes

4. **❌ NO duplicar lógica de estilos**
   - Si un patrón se repite 3+ veces, crear componente o clase de utilidad
   - Priorizar componentes sobre clases de utilidad

5. **✅ SIEMPRE usar componentes existentes**
   - Antes de crear un nuevo componente, verificar si existe uno similar
   - Extender componentes existentes antes de crear nuevos

6. **✅ SIEMPRE usar tokens de diseño**
   - Colores: usar `bg-primary`, no `bg-[#...]`
   - Espaciado: usar escala estándar (`p-4`, `gap-6`)
   - Tipografía: usar escala definida (`text-lg`, `font-semibold`)

7. **✅ SIEMPRE considerar dark mode**
   - Los tokens ya manejan dark mode automáticamente
   - No usar prefijos `dark-*` duplicados (ej: `dark:bg-dark-card` es incorrecto)
   - Usar `dark:bg-card` o simplemente `bg-card` (el token se adapta)

#### Guías de Estilo (Recomendaciones)

1. **Estructura de Componentes**
   ```typescript
   // ✅ Bueno: Componente con variantes claras
   <Button variant="primary" size="lg" loading={isLoading}>
     Guardar
   </Button>
   
   // ❌ Malo: Clases de utilidad excesivas
   <button className="bg-primary hover:bg-primary-hover px-4 py-2 rounded-md...">
     Guardar
   </button>
   ```

2. **Formularios**
   ```tsx
   // ✅ Bueno: Usar FormField
   <FormField label="Nombre" error={errors.name} required>
     <Input {...register('name')} />
   </FormField>
   
   // ❌ Malo: Estructura manual
   <label className="block text-sm font-medium mb-1">Nombre</label>
   <Input {...register('name')} />
   {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
   ```

3. **Layouts**
   ```tsx
   // ✅ Bueno: Usar componentes de layout
   <Card>
     <CardHeader>
       <CardTitle>Título</CardTitle>
     </CardHeader>
     <CardContent>...</CardContent>
   </Card>
   
   // ❌ Malo: Divs con clases
   <div className="rounded-lg border bg-card p-6">
     <div className="mb-4">
       <h3 className="text-lg font-semibold">Título</h3>
     </div>
     <div>...</div>
   </div>
   ```

4. **Dark Mode**
   ```tsx
   // ✅ Bueno: Usar tokens (se adaptan automáticamente)
   <div className="bg-card text-card-foreground">
   
   // ❌ Malo: Duplicar con prefijos dark-*
   <div className="bg-card dark:bg-dark-card text-card-foreground dark:text-dark-card-foreground">
   ```

### 4.3 Checklist de Revisión de Código

#### Antes de Hacer Merge

- [ ] ¿Se usan componentes existentes en lugar de crear nuevos?
- [ ] ¿Se usan tokens de diseño (no valores mágicos)?
- [ ] ¿No hay dependencias de CDN?
- [ ] ¿No hay estilos inline (excepto casos justificados)?
- [ ] ¿El dark mode funciona correctamente?
- [ ] ¿Los componentes son accesibles (ARIA, keyboard navigation)?
- [ ] ¿El código sigue las convenciones del proyecto?
- [ ] ¿Los estilos son consistentes con el Design System?

### 4.4 Mantenimiento Continuo

#### Revisión Mensual
- Revisar componentes no utilizados
- Identificar nuevos patrones repetitivos
- Actualizar documentación
- Revisar y actualizar tokens si es necesario

#### Revisión Trimestral
- Auditar uso de componentes
- Identificar oportunidades de mejora
- Actualizar Storybook/documentación
- Revisar y optimizar rendimiento

---

## 🎯 RESUMEN DE ACCIONES PRIORITARIAS

### 🔴 Crítico (Hacer Inmediatamente)
1. Auto-hospedar Google Fonts
2. Migrar xlsx a npm
3. Actualizar CSP para eliminar dominios externos
4. Refactorizar Badge (eliminar inconsistencias dark mode)
5. Extraer valores hardcodeados de DonorAnalysis.tsx a tokens

### 🟡 Importante (Hacer en las Próximas 2 Semanas)
1. Crear FormField component
2. Mejorar Button (loading state)
3. Crear Avatar component
4. Refactorizar Table (eliminar estilos inline)
5. Añadir tokens de gráficos

### 🟢 Mejoras (Hacer en las Próximas 4 Semanas)
1. Crear Tooltip, Dropdown, Progress, Skeleton
2. Refactorizar páginas para usar variantes de componentes
3. Crear documentación del Design System
4. Establecer reglas y checklist de revisión

---

## 📚 RECURSOS ADICIONALES

### Herramientas Recomendadas
- **Tailwind CSS IntelliSense** (VS Code): Autocompletado de clases
- **Headwind** (VS Code): Ordenamiento automático de clases
- **Storybook**: Documentación interactiva (opcional)
- **Chromatic**: Visual testing (opcional)

### Referencias
- [Tailwind CSS - Design Systems](https://tailwindcss.com/docs/theme)
- [Design Tokens Community Group](https://www.designtokens.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Documento creado por:** Arquitecto Front-End Senior  
**Última actualización:** 2024  
**Versión:** 1.0

