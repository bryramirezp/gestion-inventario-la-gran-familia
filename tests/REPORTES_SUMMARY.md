# Resumen de Sistema de Reportes de Pruebas

## ✅ Configuración Completada

### Reportes de Cobertura
- **Formato HTML**: `tests/coverage/index.html` - Navegable, interactivo
- **Formato JSON**: `tests/coverage/coverage-final.json` - Para herramientas CI/CD
- **Formato LCOV**: `tests/coverage/lcov.info` - Estándar para servicios externos (Codecov, etc.)
- **Formato Texto**: Salida en consola

### Reportes de Resultados
- **Formato JSON**: `tests/test-results.json` - Resultados estructurados
- **Formato JUnit XML**: `tests/test-results.xml` - Compatible con Jenkins, GitLab CI, etc.

### Umbrales de Cobertura
Configurados en `vitest.config.ts`:
- **Líneas**: 60% mínimo
- **Funciones**: 60% mínimo
- **Ramas**: 60% mínimo
- **Sentencias**: 60% mínimo

## 🚀 Comandos Disponibles

### Ejecutar pruebas con cobertura
```bash
npm run test:coverage
```

### Ejecutar pruebas con reportes completos
```bash
npm run test:report
```

### Ver reporte HTML
```bash
# Windows
start tests/coverage/index.html

# Mac/Linux
open tests/coverage/index.html
```

## 📊 Estructura de Reportes

```
tests/
├── coverage/                    # Reportes de cobertura
│   ├── index.html              # Reporte HTML interactivo
│   ├── coverage-final.json     # Datos estructurados
│   └── lcov.info               # Formato LCOV estándar
├── test-results.json           # Resultados de pruebas (JSON)
└── test-results.xml            # Resultados de pruebas (JUnit XML)
```

## 📝 Archivos Excluidos de Cobertura

Los siguientes archivos/directorios NO se incluyen en los reportes:
- `node_modules/`
- `tests/`
- `**/*.config.*`
- `**/dist/`
- `**/build/`
- `**/*.test.{ts,tsx}`
- `**/*.spec.{ts,tsx}`
- `**/types/**`
- `**/__tests__/**`

## 🔍 Interpretar los Reportes

### Reporte HTML de Cobertura
1. **Vista General**: Muestra porcentajes de cobertura por archivo
2. **Vista de Archivo**: 
   - 🟢 Verde: Línea ejecutada
   - 🔴 Rojo: Línea no ejecutada
   - 🟡 Amarillo: Línea parcialmente ejecutada (ramas condicionales)

### Reporte de Consola
- ✅ Tests pasados
- ❌ Tests fallidos
- ⏭️ Tests omitidos
- ⏱️ Tiempo de ejecución
- 📊 Resumen de cobertura

## 🔧 Integración CI/CD

### GitHub Actions
```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage
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

## 📚 Documentación Adicional

- Ver `tests/README.md` para guía general de pruebas
- Ver `tests/TEST_REPORT_GUIDE.md` para guía detallada de reportes

