# Métricas Clave para Análisis de Donantes

## Datos Disponibles en la Base de Datos

### Tabla `donors`
- `donor_id`: Identificador único
- `donor_name`: Nombre del donante
- `donor_type_id`: Tipo de donante (referencia a `donor_types`)
- `contact_person`: Persona de contacto
- `phone`: Teléfono
- `email`: Email
- `address`: Dirección
- `created_at`: Fecha de registro
- `updated_at`: Última actualización

### Tabla `donation_transactions`
- `donation_id`: Identificador único
- `donor_id`: Donante (FK)
- `warehouse_id`: Almacén de destino (FK)
- `donation_date`: Fecha de la donación
- `total_market_value`: Valor total de mercado
- `total_actual_value`: Valor real total
- `created_at`: Fecha de creación
- `updated_at`: Última actualización

### Tabla `donation_items`
- `item_id`: Identificador único
- `donation_id`: Donación (FK)
- `product_id`: Producto donado (FK)
- `quantity`: Cantidad donada
- `market_unit_price`: Precio unitario de mercado
- `actual_unit_price`: Precio unitario real
- `expiry_date`: Fecha de caducidad

### Tabla `donor_types`
- `donor_type_id`: Identificador único
- `type_name`: Nombre del tipo (ej: "Empresa", "Individual", "Organización")
- `description`: Descripción

## Métricas Clave Recomendadas

### 1. Métricas Financieras
- ✅ **Valor Total Donado** (`total_actual_value`): Suma de todas las donaciones
- ✅ **Valor Promedio por Donación**: `total_value_donated / total_donations_count`
- ⚠️ **Valor de Mercado vs Valor Real**: Diferencia entre `total_market_value` y `total_actual_value`
- ⚠️ **Valor Total de Mercado**: Suma de `total_market_value` de todas las donaciones
- ⚠️ **Tendencia de Valor**: Comparación del valor donado por período (mes/año)

### 2. Métricas de Frecuencia y Temporalidad
- ✅ **Número Total de Donaciones** (`total_donations_count`)
- ✅ **Última Donación** (`last_donation_date`)
- ⚠️ **Primera Donación**: Fecha de la primera donación registrada
- ⚠️ **Frecuencia de Donaciones**: Promedio de días entre donaciones
- ⚠️ **Duración de la Relación**: Días desde la primera hasta la última donación
- ⚠️ **Donaciones por Período**: Agrupación por mes, trimestre o año
- ⚠️ **Tasa de Actividad**: Donaciones en los últimos 30/60/90 días

### 3. Métricas por Tipo de Donante
- ✅ **Contribución por Tipo** (`donor_type_id`): Agregación por tipo de donante
- ⚠️ **Comparativa de Tipos**: Valor promedio por tipo de donante
- ⚠️ **Distribución de Tipos**: Porcentaje de cada tipo en el total

### 4. Métricas por Almacén
- ⚠️ **Almacenes de Destino**: Frecuencia y valor por almacén (`warehouse_id`)
- ⚠️ **Almacén Principal**: Almacén donde más dona cada donante

### 5. Métricas por Producto/Categoría
- ✅ **Categoría Principal Donada** (`top_donated_category`)
- ⚠️ **Productos Más Donados**: Top productos por cantidad o valor
- ⚠️ **Distribución por Categoría**: Valor y cantidad por categoría de producto
- ⚠️ **Productos con Caducidad Próxima**: Items con `expiry_date` cercana

### 6. Métricas de Contribución Relativa
- ✅ **Porcentaje de Contribución** (`contribution_percentage`): % del total donado
- ⚠️ **Ranking de Donantes**: Posición en el ranking general
- ⚠️ **Segmentación**: Top 10%, Top 25%, etc.

### 7. Métricas de Calidad de Datos
- ⚠️ **Información Completa**: Porcentaje de donantes con email, teléfono, dirección
- ⚠️ **Donantes Inactivos**: Sin donaciones en X meses
- ⚠️ **Donantes Nuevos**: Registrados en los últimos X meses

### 8. Métricas de Valor Agregado
- ⚠️ **Valor por Unidad**: Valor promedio por unidad de producto
- ⚠️ **Eficiencia de Donación**: Ratio valor real / valor de mercado
- ⚠️ **Productos de Alto Valor**: Productos con mayor `actual_unit_price`

## Métricas Actualmente Implementadas

### En `DonorAnalysis.tsx`:
1. ✅ Valor Total Donado
2. ✅ Número de Donaciones
3. ✅ Última Donación
4. ✅ Categoría Principal
5. ✅ Contribución por Tipo de Donante (gráfico de pie)
6. ✅ Top 5 Donantes por Valor (gráfico de barras)

## Métricas Faltantes Recomendadas para Implementar

### Prioridad Alta:
1. **Valor de Mercado vs Valor Real**: Mostrar diferencia y ratio
2. **Frecuencia de Donaciones**: Promedio de días entre donaciones
3. **Tendencia Temporal**: Gráfico de líneas con donaciones por mes/año
4. **Primera Donación**: Para calcular duración de relación
5. **Almacén Principal**: Donde más dona cada donante

### Prioridad Media:
6. **Productos Más Donados**: Top productos por donante
7. **Distribución por Almacén**: Valor donado por almacén
8. **Tasa de Actividad**: Donaciones recientes (últimos 30/60/90 días)
9. **Donantes Inactivos**: Sin donaciones en 6+ meses
10. **Ranking de Donantes**: Posición en el ranking general

### Prioridad Baja:
11. **Información de Contacto Completa**: % de donantes con datos completos
12. **Productos con Caducidad Próxima**: Items que caducan pronto
13. **Valor por Unidad**: Valor promedio por unidad
14. **Comparativa de Tipos**: Valor promedio por tipo

## Visualizaciones Recomendadas

### Gráficos Existentes:
- ✅ Pie Chart: Contribución por Tipo de Donante
- ✅ Bar Chart: Top 5 Donantes por Valor

### Gráficos Sugeridos:
1. **Línea de Tiempo**: Donaciones por mes/año (tendencia)
2. **Gráfico de Barras Agrupadas**: Valor Real vs Valor de Mercado
3. **Gráfico de Barras Horizontales**: Top 10 Donantes
4. **Gráfico de Donas**: Distribución por Almacén
5. **Heatmap**: Donaciones por mes y por donante (calendario)
6. **Scatter Plot**: Valor vs Frecuencia de donaciones
7. **Gráfico de Área Apilada**: Donaciones por categoría a lo largo del tiempo

## Campos Adicionales para `DonorAnalysisData`

```typescript
interface DonorAnalysisData extends Donor {
  // Actuales
  total_donations_count: number;
  total_value_donated: number;
  average_donation_value: number;
  last_donation_date: string | null;
  top_donated_category: string | null;
  contribution_percentage: number;
  
  // Sugeridos (Alta Prioridad)
  total_market_value: number; // Valor total de mercado
  first_donation_date: string | null; // Primera donación
  donation_frequency_days: number | null; // Promedio de días entre donaciones
  relationship_duration_days: number | null; // Días desde primera hasta última
  main_warehouse_id: number | null; // Almacén donde más dona
  main_warehouse_name: string | null; // Nombre del almacén principal
  recent_donations_count: number; // Donaciones en últimos 90 días
  market_vs_actual_ratio: number; // Ratio valor mercado / valor real
  
  // Sugeridos (Media Prioridad)
  top_products: Array<{ product_id: number; product_name: string; total_quantity: number }>; // Top productos
  warehouse_distribution: Array<{ warehouse_id: number; warehouse_name: string; total_value: number }>; // Distribución por almacén
  monthly_donations: Array<{ month: string; count: number; value: number }>; // Donaciones por mes
  ranking_position: number; // Posición en el ranking general
  is_active: boolean; // Donaciones en últimos 6 meses
  
  // Sugeridos (Baja Prioridad)
  contact_completeness: number; // % de información de contacto completa (0-100)
  products_with_expiry_soon: number; // Productos con caducidad en próximos 30 días
  average_unit_value: number; // Valor promedio por unidad
}
```

## Consultas SQL Recomendadas

### Valor de Mercado vs Valor Real:
```sql
SELECT 
  d.donor_id,
  SUM(dt.total_market_value) as total_market_value,
  SUM(dt.total_actual_value) as total_actual_value,
  SUM(dt.total_market_value) - SUM(dt.total_actual_value) as difference,
  CASE 
    WHEN SUM(dt.total_actual_value) > 0 
    THEN (SUM(dt.total_market_value) / SUM(dt.total_actual_value)) * 100 
    ELSE 0 
  END as market_vs_actual_ratio
FROM donors d
LEFT JOIN donation_transactions dt ON d.donor_id = dt.donor_id
GROUP BY d.donor_id;
```

### Frecuencia de Donaciones:
```sql
WITH donation_dates AS (
  SELECT 
    donor_id,
    donation_date,
    LAG(donation_date) OVER (PARTITION BY donor_id ORDER BY donation_date) as previous_donation
  FROM donation_transactions
)
SELECT 
  donor_id,
  AVG(donation_date - previous_donation) as avg_days_between_donations
FROM donation_dates
WHERE previous_donation IS NOT NULL
GROUP BY donor_id;
```

### Primera y Última Donación:
```sql
SELECT 
  donor_id,
  MIN(donation_date) as first_donation_date,
  MAX(donation_date) as last_donation_date,
  MAX(donation_date) - MIN(donation_date) as relationship_duration_days
FROM donation_transactions
GROUP BY donor_id;
```

### Almacén Principal:
```sql
SELECT 
  dt.donor_id,
  dt.warehouse_id,
  w.warehouse_name,
  SUM(dt.total_actual_value) as total_value,
  COUNT(*) as donation_count
FROM donation_transactions dt
JOIN warehouses w ON dt.warehouse_id = w.warehouse_id
GROUP BY dt.donor_id, dt.warehouse_id, w.warehouse_name
ORDER BY dt.donor_id, total_value DESC;
```

### Donaciones por Mes:
```sql
SELECT 
  donor_id,
  DATE_TRUNC('month', donation_date) as month,
  COUNT(*) as donation_count,
  SUM(total_actual_value) as total_value
FROM donation_transactions
GROUP BY donor_id, DATE_TRUNC('month', donation_date)
ORDER BY donor_id, month;
```

### Top Productos por Donante:
```sql
SELECT 
  dt.donor_id,
  di.product_id,
  p.product_name,
  SUM(di.quantity) as total_quantity,
  SUM(di.quantity * di.actual_unit_price) as total_value
FROM donation_transactions dt
JOIN donation_items di ON dt.donation_id = di.donation_id
JOIN products p ON di.product_id = p.product_id
GROUP BY dt.donor_id, di.product_id, p.product_name
ORDER BY dt.donor_id, total_value DESC;
```

## Implementación Sugerida

1. **Actualizar `DonorAnalysisData`** con los campos sugeridos
2. **Modificar `getDonorAnalysisData`** en `donor.api.ts` para calcular las nuevas métricas
3. **Agregar visualizaciones** en `DonorAnalysis.tsx`:
   - Gráfico de líneas para tendencia temporal
   - Comparativa valor mercado vs real
   - Tabla expandida con más columnas
   - Filtros por período, tipo, almacén
4. **Agregar filtros y búsqueda avanzada**:
   - Por tipo de donante
   - Por rango de fechas
   - Por almacén
   - Por rango de valores
   - Por estado (activo/inactivo)

