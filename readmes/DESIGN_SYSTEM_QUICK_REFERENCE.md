# 🚀 Design System - Guía Rápida de Referencia

## 📋 Checklist de Migración

### Fase 1: Auditoría ✅
- [x] Identificar patrones hardcodeados
- [x] Auditoría de dependencias CDN
- [x] Inventario de componentes UI
- [x] Identificar inconsistencias visuales

### Fase 2: Design Tokens
- [ ] Extraer y centralizar tokens en `tailwind.config.js`
- [ ] Añadir tokens de gráficos
- [ ] Auto-hospedar Google Fonts (Inter)
- [ ] Migrar xlsx a npm
- [ ] Actualizar CSP

### Fase 3: Refactorización
- [ ] Crear FormField component
- [ ] Mejorar Button (loading state)
- [ ] Crear Avatar component
- [ ] Refactorizar Badge (dark mode)
- [ ] Refactorizar Table (estilos inline)
- [ ] Refactorizar Alerts (tokens)
- [ ] Crear Tooltip, Dropdown, Progress, Skeleton
- [ ] Refactorizar DonorAnalysis.tsx
- [ ] Refactorizar otras páginas

### Fase 4: Documentación
- [ ] Crear DESIGN_SYSTEM.md
- [ ] Establecer reglas del equipo
- [ ] Crear checklist de revisión
- [ ] Configurar Storybook (opcional)

---

## 🎨 Tokens de Diseño - Referencia Rápida

### Colores
```typescript
// Semánticos
bg-primary / text-primary-foreground
bg-secondary / text-secondary-foreground
bg-destructive / text-destructive-foreground
bg-success / text-success-foreground
bg-warning / text-warning-foreground
bg-muted / text-muted-foreground
bg-accent / text-accent-foreground

// Cards
bg-card / text-card-foreground
bg-card-hover

// Inventario
bg-inventory-high
bg-inventory-medium
bg-inventory-low
bg-inventory-expired

// Gráficos
bg-chart-1 / bg-chart-2 / bg-chart-3 / bg-chart-4 / bg-chart-5
```

### Espaciado
```typescript
// Componentes internos
p-2, p-3, p-4

// Entre elementos
gap-4, gap-6, gap-8

// Secciones
p-8, p-12, p-16

// Layout
p-16, p-24, p-32
```

### Sombras
```typescript
shadow-soft      // Cards, elementos elevados sutiles
shadow-medium    // Hover states, modales
shadow-strong    // Elementos destacados
shadow-elegant   // Accentos especiales
shadow-glow      // Efectos de resaltado
```

### Tipografía
```typescript
// Tamaños
text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl

// Pesos
font-normal (400)
font-medium (500)
font-semibold (600)
font-bold (700)
font-extrabold (800)
```

### Bordes
```typescript
// Radios
rounded-sm    // 8px
rounded       // 10px (default)
rounded-md    // 10px
rounded-lg    // 12px
rounded-xl    // 16px
rounded-full  // 9999px

// Grosores
border       // 1px (default)
border-2     // 2px
border-4     // 4px
```

---

## 🚫 Reglas Estrictas

### ❌ NO Hacer
```tsx
// ❌ NO usar CDNs
<link href="https://fonts.googleapis.com/..." />

// ❌ NO usar valores mágicos
<div className="bg-[#FF8042]">  // ❌
<div className="gap-[13px]">     // ❌
<div style={{ color: 'hsl(215 20% 65%)' }}>  // ❌

// ❌ NO usar estilos inline (excepto dinámicos)
<div style={{ padding: '10px' }}>  // ❌

// ❌ NO duplicar dark mode
<div className="bg-card dark:bg-dark-card">  // ❌
```

### ✅ SIEMPRE Hacer
```tsx
// ✅ Usar tokens
<div className="bg-primary">  // ✅
<div className="gap-4">        // ✅
<div className="bg-card">      // ✅ (se adapta a dark mode automáticamente)

// ✅ Usar componentes
<Button variant="primary">Guardar</Button>  // ✅
<FormField label="Nombre" error={error}>
  <Input {...register('name')} />
</FormField>  // ✅

// ✅ Usar clases de Tailwind
<div className="p-4 rounded-lg shadow-soft">  // ✅
```

---

## 🧩 Componentes Disponibles

### Componentes Base
- `Button` - Variantes: default, destructive, outline, ghost, link
- `Input` - Con validación visual
- `Label` - Para formularios
- `Select` - Dropdown nativo
- `Textarea` - Área de texto
- `Badge` - Variantes: primary, secondary, destructive, success, warning, inventory-*
- `Card` - Con subcomponentes: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `Table` - Con ordenamiento y redimensionamiento
- `Alert` - Tipos: success, error, warning, info

### Componentes por Crear
- `FormField` - Input + Label + Error
- `Avatar` - Con iniciales o imagen
- `Tooltip` - Información contextual
- `Dropdown` - Menú desplegable
- `Progress` - Barra de progreso
- `Skeleton` - Loading states
- `Tabs` - Navegación por pestañas
- `Accordion` - Contenido colapsable

---

## 🔄 Patrones de Refactorización

### Antes → Después

#### Valores Hardcodeados
```typescript
// ❌ Antes
const COLORS = ['#FF8042', '#0088FE', '#00C49F'];

// ✅ Después
const COLORS = useChartColors(); // Usa tokens
```

#### Clases Excesivas
```tsx
// ❌ Antes
<Card className="border-l-4 border-l-primary shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">

// ✅ Después
<Card variant="elevated" accent="primary">
```

#### Estilos Inline
```tsx
// ❌ Antes
<div style={{ tableLayout: 'fixed' }}>

// ✅ Después
<div className="table-fixed">
```

#### Dark Mode Duplicado
```tsx
// ❌ Antes
<div className="bg-card dark:bg-dark-card text-card-foreground dark:text-dark-card-foreground">

// ✅ Después
<div className="bg-card text-card-foreground">
```

---

## 📝 Comandos Útiles

### Auto-hospedar Fuentes
```bash
# Descargar fuentes Inter
# Colocar en public/fonts/inter/
# Actualizar @font-face en src/index.css
```

### Migrar xlsx
```bash
npm install xlsx
# Crear hook useXLSX
# Actualizar componentes que usan xlsx
# Eliminar script CDN de index.html
```

### Actualizar CSP
```bash
# Editar vercel.json
# Eliminar dominios externos de CSP
```

---

## 🎯 Prioridades

### Esta Semana
1. Auto-hospedar Google Fonts
2. Migrar xlsx a npm
3. Actualizar CSP
4. Refactorizar Badge

### Próximas 2 Semanas
1. Crear FormField
2. Mejorar Button
3. Crear Avatar
4. Refactorizar Table
5. Añadir tokens de gráficos

### Próximas 4 Semanas
1. Crear componentes de utilidad
2. Refactorizar páginas
3. Crear documentación
4. Establecer reglas del equipo

---

**Última actualización:** 2024  
**Versión:** 1.0

