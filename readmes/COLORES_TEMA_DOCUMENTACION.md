# 🎨 Documentación de Colores del Tema

## 📍 Ubicación de los Colores

Los colores del tema están definidos en **`src/index.css`** dentro de `@layer base`:

### Estructura
```css
@layer base {
  :root {
    /* Colores para Light Mode */
    --primary: 31 72% 56%;
    --success: 142 76% 36%;
    /* ... */
  }

  .dark {
    /* Colores para Dark Mode */
    --primary: 31 72% 56%;
    --success: 142 76% 36%;
    /* ... */
  }
}
```

### Mapeo a Tailwind
Los colores se mapean en **`tailwind.config.js`** usando:
```javascript
colors: {
  primary: {
    DEFAULT: "hsl(var(--primary))",
    // ...
  }
}
```

## 🎨 Paleta de Colores Actual

### Color Primario (Naranja) - Marca Principal
- **Light Mode**: `31 72% 56%` (HSL)
- **Dark Mode**: `31 72% 56%` (mismo, pero hover: `31 72% 62%`)
- **Uso**: Botones principales, acentos, elementos destacados
- **Variaciones**:
  - `--primary-hover`: `31 72% 50%` (light) / `31 72% 62%` (dark)
  - `--primary-light`: `31 72% 92%` (light) / `31 72% 92% / 0.1` (dark)

### Color Success (Verde)
- **Light Mode**: `142 76% 36%`
- **Dark Mode**: `142 76% 36%` (mismo)
- **Uso**: Indicadores de éxito, estados positivos, inventario alto

### Color Warning (Amarillo)
- **Light Mode**: `38 92% 50%`
- **Dark Mode**: `38 92% 50%` (mismo)
- **Uso**: Advertencias, estados de atención, inventario medio

### Color Destructive (Rojo)
- **Light Mode**: `0 84% 60%`
- **Dark Mode**: `0 63% 31%` (más oscuro en dark)
- **Uso**: Errores, acciones destructivas, inventario bajo

### Color Secondary (Azul/Gris)
- **Light Mode**: `215 15% 92%` (gris azulado claro)
- **Dark Mode**: `215 28% 22%` (gris azulado oscuro)
- **Uso**: Fondos secundarios, elementos de soporte

### Colores de Inventario
- **High**: `142 76% 36%` (verde - mismo que success)
- **Medium**: `38 92% 50%` (amarillo - mismo que warning)
- **Low**: `0 84% 60%` (rojo - mismo que destructive)
- **Expired**: `0 72% 35%` (rojo oscuro)

## 📊 Paleta Propuesta para Gráficos

Basada en los colores existentes del sistema:

### Light Mode
```css
--chart-color-1: 31 72% 56%;   /* Naranja principal (primary) */
--chart-color-2: 31 72% 45%;   /* Naranja oscuro (variación) */
--chart-color-3: 31 72% 67%;   /* Naranja claro (variación) */
--chart-color-4: 142 76% 36%;  /* Verde (success) */
--chart-color-5: 38 92% 50%;   /* Amarillo (warning) */
```

### Dark Mode
```css
--chart-color-1: 31 72% 62%;   /* Naranja más claro */
--chart-color-2: 31 72% 52%;   /* Naranja medio */
--chart-color-3: 31 72% 72%;   /* Naranja muy claro */
--chart-color-4: 142 76% 42%;  /* Verde más claro */
--chart-color-5: 38 92% 56%;   /* Amarillo más claro */
```

## 🔄 Cómo Funciona el Sistema

1. **Definición**: Colores definidos como variables CSS en `src/index.css`
2. **Formato**: HSL sin `hsl()` wrapper (ej: `31 72% 56%` en lugar de `hsl(31, 72%, 56%)`)
3. **Mapeo**: Tailwind los usa con `hsl(var(--primary))`
4. **Dark Mode**: Se activa con la clase `.dark` en el elemento raíz
5. **Contexto**: `ThemeContext` gestiona el cambio entre light/dark

## 📝 Notas Importantes

- Todos los colores usan el formato HSL sin saturación de alpha por defecto
- El modo oscuro se activa añadiendo la clase `dark` al `<html>`
- Los colores se adaptan automáticamente según el modo activo
- No usar valores hardcodeados, siempre usar tokens (`--primary`, `--success`, etc.)

---

**Última actualización:** 2024  
**Archivo principal:** `src/index.css`  
**Configuración Tailwind:** `tailwind.config.js`

