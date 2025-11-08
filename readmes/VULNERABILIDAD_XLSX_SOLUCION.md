# ⚠️ Vulnerabilidades de Seguridad en xlsx - Solución

## 🚨 Problema Identificado

Después de ejecutar `npm install`, se detectaron **2 vulnerabilidades de severidad alta** en el paquete `xlsx`:

1. **Prototype Pollution** (GHSA-4r6h-8v6p-xvw6)
2. **Regular Expression Denial of Service (ReDoS)** (GHSA-5pgg-2g8v-p4x9)

**Estado:** No hay fix disponible para estas vulnerabilidades en xlsx.

## ✅ Solución: Migrar a ExcelJS

### ¿Por qué ExcelJS?

- ✅ **Más seguro**: No tiene las vulnerabilidades conocidas de xlsx
- ✅ **Activamente mantenido**: Proyecto activo con actualizaciones regulares
- ✅ **API similar**: Fácil migración desde xlsx
- ✅ **Mejor rendimiento**: Soporte nativo para streaming y archivos grandes
- ✅ **Más características**: Mejor soporte para estilos, fórmulas, y formato

### Comparación de APIs

#### xlsx (Actual)
```typescript
import * as XLSX from 'xlsx';

// Crear libro
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, 'file.xlsx');

// Leer archivo
const workbook = XLSX.read(data, { type: 'array' });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const json = XLSX.utils.sheet_to_json(worksheet);
```

#### ExcelJS (Nuevo)
```typescript
import ExcelJS from 'exceljs';

// Crear libro
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Sheet1');
worksheet.addRows(data);
await workbook.xlsx.writeFile('file.xlsx');

// Leer archivo
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(data);
const worksheet = workbook.getWorksheet(0);
const json = worksheet.getSheetValues();
```

## 📋 Plan de Migración

### Paso 1: Instalar ExcelJS
```bash
npm uninstall xlsx
npm install exceljs
```

### Paso 2: Actualizar `hooks/useXLSX.ts`
- Cambiar la importación dinámica de `xlsx` a `exceljs`
- Actualizar el tipo de retorno

### Paso 3: Actualizar `pages/Backup.tsx`
- Adaptar la función `handleBackup` para usar ExcelJS
- Adaptar la función `handleImport` para usar ExcelJS
- Mantener la misma funcionalidad pero con la nueva API

### Paso 4: Actualizar `package.json`
- Eliminar `xlsx`
- Añadir `exceljs`

### Paso 5: Verificar
- Probar exportación de Excel
- Probar importación de Excel
- Verificar que no hay errores de seguridad

## 🔄 Cambios en el Código

### Hook useXLSX.ts

**Antes:**
```typescript
import('xlsx').then((module) => {
  xlsxModule = module;
  // ...
});
```

**Después:**
```typescript
import('exceljs').then((module) => {
  xlsxModule = module.default || module;
  // ...
});
```

### Backup.tsx - Exportación

**Antes (xlsx):**
```typescript
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(excelData, { header: headers });
ws['!cols'] = [{ wch: 8 }, ...];
xlsx.utils.book_append_sheet(wb, ws, `Donativos_${selectedYear}`);
xlsx.writeFile(wb, `Respaldo_Completo_LaGranFamilia_${selectedYear}.xlsx`);
```

**Después (ExcelJS):**
```typescript
const workbook = new xlsx.Workbook();
const worksheet = workbook.addWorksheet(`Donativos_${selectedYear}`);

// Añadir headers
worksheet.columns = headers.map(header => ({ header, key: header }));
worksheet.getRow(1).font = { bold: true };

// Añadir datos
worksheet.addRows(excelData);

// Ajustar anchos de columna
worksheet.columns.forEach((column, index) => {
  column.width = columnWidths[index] || 12;
});

await workbook.xlsx.writeFile(`Respaldo_Completo_LaGranFamilia_${selectedYear}.xlsx`);
```

### Backup.tsx - Importación

**Antes (xlsx):**
```typescript
const workbook = xlsx.read(data, { type: 'array', cellDates: true });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const json = xlsx.utils.sheet_to_json(worksheet);
```

**Después (ExcelJS):**
```typescript
const workbook = new xlsx.Workbook();
await workbook.xlsx.load(data);
const worksheet = workbook.getWorksheet(0);

// Convertir a JSON
const json: any[] = [];
worksheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return; // Skip header
  
  const rowData: any = {};
  row.eachCell((cell, colNumber) => {
    const header = headers[colNumber - 1];
    rowData[header] = cell.value;
  });
  json.push(rowData);
});
```

## ✅ Beneficios de la Migración

1. **Seguridad**: Elimina vulnerabilidades de seguridad conocidas
2. **Mantenibilidad**: Librería activamente mantenida
3. **Rendimiento**: Mejor manejo de archivos grandes
4. **Características**: Más opciones de formato y estilo
5. **TypeScript**: Mejor soporte de tipos

## 📝 Notas Importantes

- La migración mantendrá toda la funcionalidad existente
- El formato de los archivos Excel generados será compatible
- Los archivos importados seguirán funcionando igual
- ExcelJS es más pesado que xlsx (~2MB vs ~1MB), pero más seguro

## 🔗 Referencias

- [ExcelJS GitHub](https://github.com/exceljs/exceljs)
- [ExcelJS Documentación](https://github.com/exceljs/exceljs#readme)
- [Vulnerabilidades xlsx](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6)
- [Vulnerabilidades xlsx ReDoS](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9)

---

**Fecha:** 2024  
**Estado:** Pendiente de implementación  
**Prioridad:** Alta (vulnerabilidades de seguridad)

