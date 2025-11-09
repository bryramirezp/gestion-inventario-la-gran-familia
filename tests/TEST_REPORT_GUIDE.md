# Guía de Reportes de Pruebas

## Ejecutar Pruebas con Reportes

### 1. Ejecutar pruebas con cobertura
```bash
npm run test:coverage
```

Esto generará:
- Reporte en consola (texto)
- Reporte HTML en `tests/coverage/index.html`
- Reporte JSON en `tests/coverage/coverage-final.json`
- Reporte LCOV en `tests/coverage/lcov.info`

### 2. Ejecutar pruebas con reportes completos
```bash
npm run test:report
```

Esto generará:
- Reporte de cobertura (como arriba)
- Reporte JSON en `tests/test-results.json`
- Reporte JUnit XML en `tests/test-results.xml`
- Salida verbose en consola

### 3. Ver reporte HTML de cobertura
```bash
# Abrir el archivo en el navegador
tests/coverage/index.html
```

O desde la terminal:
```bash
# Windows
start tests/coverage/index.html

# Mac
open tests/coverage/index.html

# Linux
xdg-open tests/coverage/index.html
```

## Tipos de Reportes

### Reporte de Cobertura (Coverage)

**Ubicación:** `tests/coverage/`

- **HTML**: `index.html` - Reporte interactivo con navegación
- **JSON**: `coverage-final.json` - Datos estructurados para herramientas CI/CD
- **LCOV**: `lcov.info` - Formato estándar para integración con servicios externos
- **Texto**: Salida en consola

**Métricas incluidas:**
- **Lines**: Porcentaje de líneas ejecutadas
- **Functions**: Porcentaje de funciones ejecutadas
- **Branches**: Porcentaje de ramas ejecutadas
- **Statements**: Porcentaje de sentencias ejecutadas

**Umbrales mínimos configurados:**
- Líneas: 60%
- Funciones: 60%
- Ramas: 60%
- Sentencias: 60%

### Reporte de Resultados (Test Results)

**Ubicación:** `tests/`

- **JSON**: `test-results.json` - Resultados estructurados
- **JUnit XML**: `test-results.xml` - Formato estándar para CI/CD (Jenkins, GitLab CI, etc.)

**Información incluida:**
- Nombre de cada test
- Estado (passed/failed/skipped)
- Tiempo de ejecución
- Mensajes de error (si aplica)
- Stack traces (si aplica)

## Integración con CI/CD

### GitHub Actions

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./tests/coverage/lcov.info
```

### GitLab CI

```yaml
test:
  script:
    - npm run test:report
  artifacts:
    reports:
      junit: tests/test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: tests/coverage/coverage-final.json
```

## Interpretar el Reporte

### Reporte HTML de Cobertura

1. **Vista General**: Muestra porcentajes por archivo
2. **Vista de Archivo**: Muestra líneas cubiertas/no cubiertas
   - Verde: Línea ejecutada
   - Rojo: Línea no ejecutada
   - Amarillo: Línea parcialmente ejecutada (ramas)

### Reporte de Consola

- ✅ Tests pasados
- ❌ Tests fallidos
- ⏭️ Tests omitidos
- Tiempo total de ejecución
- Resumen de cobertura por archivo

## Mejorar la Cobertura

1. **Identificar archivos con baja cobertura**: Revisar el reporte HTML
2. **Agregar pruebas faltantes**: Crear tests para casos no cubiertos
3. **Ejecutar nuevamente**: `npm run test:coverage`
4. **Verificar umbrales**: Asegurar que se cumplan los mínimos (60%)

## Archivos Excluidos de Cobertura

Los siguientes archivos/directorios están excluidos:
- `node_modules/`
- `tests/`
- `**/*.config.*`
- `**/dist/`
- `**/build/`
- `**/*.test.{ts,tsx}`
- `**/*.spec.{ts,tsx}`
- `**/types/**`
- `**/__tests__/**`

## Troubleshooting

### El reporte no se genera
- Verificar que `@vitest/coverage-v8` esté instalado
- Ejecutar `npm run test:coverage` (no `npm test`)

### Cobertura muy baja
- Revisar qué archivos no están cubiertos
- Agregar más pruebas para esos archivos
- Considerar reducir los umbrales si es necesario

### Reporte HTML no se abre
- Verificar que el archivo existe en `tests/coverage/index.html`
- Abrir manualmente desde el explorador de archivos

