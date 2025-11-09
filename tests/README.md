# Pruebas Unitarias

Este directorio contiene las pruebas unitarias del proyecto.

## Estructura

```
tests/
├── setup.ts                    # Configuración global de tests
├── validations/                # Pruebas de esquemas Zod
│   ├── product.schema.test.ts
│   ├── donation.schema.test.ts
│   └── kitchen.schema.test.ts
└── hooks/                      # Pruebas de hooks personalizados
    └── useZodForm.test.tsx
```

## Ejecutar Pruebas

### Modo watch (desarrollo)
```bash
npm test
```

### Interfaz UI (recomendado para desarrollo)
```bash
npm run test:ui
```

### Ejecutar una vez (CI/CD)
```bash
npm run test:run
```

### Con cobertura (genera reportes)
```bash
npm run test:coverage
```

**Genera:**
- Reporte HTML: `tests/coverage/index.html`
- Reporte JSON: `tests/coverage/coverage-final.json`
- Reporte LCOV: `tests/coverage/lcov.info`
- Reporte en consola

### Reportes completos (cobertura + resultados)
```bash
npm run test:report
```

**Genera:**
- Todos los reportes de cobertura (arriba)
- Resultados JSON: `tests/test-results.json`
- Resultados JUnit XML: `tests/test-results.xml`
- Salida verbose en consola

## Ver Reportes

### Reporte HTML de Cobertura
Abre el archivo `tests/coverage/index.html` en tu navegador para ver:
- Cobertura por archivo
- Líneas cubiertas/no cubiertas
- Métricas detalladas

### Ver reporte desde terminal
```bash
# Windows
start tests/coverage/index.html

# Mac
open tests/coverage/index.html

# Linux
xdg-open tests/coverage/index.html
```

## Cobertura Actual

### Validaciones Zod ✅
- ✅ `product.schema.test.ts` - Validación de esquemas de productos (30+ casos de prueba)
- ✅ `donation.schema.test.ts` - Validación de esquemas de donaciones (20+ casos de prueba)
- ✅ `kitchen.schema.test.ts` - Validación de esquemas de solicitudes de cocina (15+ casos de prueba)

### Hooks ✅
- ✅ `useZodForm.test.tsx` - Pruebas del hook de formularios con Zod (15+ casos de prueba)

## Umbrales de Cobertura

Los siguientes umbrales están configurados (mínimos):
- **Líneas**: 60%
- **Funciones**: 60%
- **Ramas**: 60%
- **Sentencias**: 60%

Si la cobertura está por debajo de estos umbrales, los tests fallarán.

## Reportes Disponibles

Ver `tests/TEST_REPORT_GUIDE.md` para información detallada sobre:
- Tipos de reportes
- Cómo interpretarlos
- Integración con CI/CD
- Troubleshooting

## Agregar Nuevas Pruebas

1. Crea un archivo `.test.ts` o `.test.tsx` en el directorio correspondiente
2. Usa `describe` y `it` para organizar las pruebas
3. Ejecuta `npm test` para verificar que las pruebas pasan

## Ejemplo

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/domain/services/my-service';

describe('myFunction', () => {
  it('should work correctly', () => {
    const result = myFunction();
    expect(result).toBeDefined();
  });
});
```

