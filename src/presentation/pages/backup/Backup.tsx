import React, { useState } from 'react';
import Header from '@/presentation/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/presentation/components/ui/AlertDialog';
import { Label, Select, Input } from '@/presentation/components/forms';
import { DatabaseBackupIcon, ExclamationTriangleIcon } from '@/presentation/components/icons/Icons';
import { useAuth } from '@/app/providers/AuthProvider';
import { useAlerts } from '@/app/providers/AlertProvider';
import { supabase, systemApi } from '@/data/api';
import { useXLSX } from '@/infrastructure/hooks/useXLSX';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';

// Tipos para datos procesados
type DonationData = {
  donation_id: number;
  donation_date: string;
  market_value: number;
  actual_value: number;
  donor: {
    donor_id: number;
    donor_name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    donor_type_id: number;
    donor_type: {
      donor_type_id: number;
      type_name: string;
    };
  };
  warehouse: {
    warehouse_id: number;
    warehouse_name: string;
    location_description: string | null;
  };
};

type DonationItemData = {
  item_id: number;
  donation_id: number;
  product_id: number;
  quantity: number;
  market_unit_price: number;
  actual_unit_price: number;
  expiry_date: string | null;
  product: {
    product_id: number;
    product_name: string;
    category_id: number;
    brand_id: number | null;
    official_unit_id: number;
    category: {
      category_id: number;
      category_name: string;
    };
    brand: {
      brand_id: number;
      brand_name: string;
    } | null;
    unit: {
      unit_id: number;
      unit_name: string;
      abbreviation: string;
    };
  };
};

// Función auxiliar para extraer datos anidados de Supabase
const extractNestedData = <T,>(data: T | T[] | null | undefined): T | null => {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  return data;
};

// Función auxiliar para formatear fecha
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-MX');
};

// Función auxiliar para aplicar estilos a headers
const applyHeaderStyles = (worksheet: any, rowNumber: number = 1) => {
  const headerRow = worksheet.getRow(rowNumber);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
};

// Función auxiliar para aplicar estilos a fila de totales
const applyTotalRowStyles = (worksheet: any, rowNumber: number) => {
  const totalRow = worksheet.getRow(rowNumber);
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC0C0C0' }
  };
  totalRow.border = {
    top: { style: 'medium' }
  };
};

// Construir hoja 1: Resumen Donaciones
const buildDonationSummarySheet = (
  workbook: any,
  donations: DonationData[],
  donationItems: DonationItemData[]
): void => {
  const worksheet = workbook.addWorksheet('Resumen Donaciones');

  // Contar items por donación
  const itemsCountByDonation = new Map<number, number>();
  const avgDiscountByDonation = new Map<number, number>();

  donationItems.forEach(item => {
    const count = itemsCountByDonation.get(item.donation_id) || 0;
    itemsCountByDonation.set(item.donation_id, count + 1);

    // Calcular porcentaje de descuento promedio
    if (item.market_unit_price > 0) {
      const discount = ((item.market_unit_price - item.actual_unit_price) / item.market_unit_price) * 100;
      const currentAvg = avgDiscountByDonation.get(item.donation_id) || 0;
      const currentCount = itemsCountByDonation.get(item.donation_id) || 1;
      avgDiscountByDonation.set(item.donation_id, (currentAvg * (currentCount - 1) + discount) / currentCount);
    }
  });

  // Definir columnas
  worksheet.columns = [
    { header: 'ID Donación', key: 'donation_id', width: 12 },
    { header: 'Fecha', key: 'date', width: 12 },
    { header: 'Donante', key: 'donor_name', width: 30 },
    { header: 'Tipo Donante', key: 'donor_type', width: 25 },
    { header: 'Almacén', key: 'warehouse', width: 20 },
    { header: 'Total Mercado', key: 'total_market', width: 15 },
    { header: 'Total Real', key: 'total_real', width: 15 },
    { header: '# Items', key: 'items_count', width: 10 },
    { header: '% Descuento Promedio', key: 'avg_discount', width: 18 },
    { header: 'Teléfono', key: 'phone', width: 15 },
    { header: 'Correo', key: 'email', width: 25 },
    { header: 'Dirección', key: 'address', width: 35 }
  ];

  applyHeaderStyles(worksheet);

  // Agregar datos
  const rows = donations.map(donation => {
    const donor = extractNestedData(donation.donor);
    const warehouse = extractNestedData(donation.warehouse);
    const donorType = extractNestedData(donor?.donor_type);

    return {
      donation_id: donation.donation_id,
      date: formatDate(donation.donation_date),
      donor_name: donor?.donor_name || '',
      donor_type: donorType?.type_name || '',
      warehouse: warehouse?.warehouse_name || '',
      total_market: donation.market_value,
      total_real: donation.actual_value,
      items_count: itemsCountByDonation.get(donation.donation_id) || 0,
      avg_discount: (avgDiscountByDonation.get(donation.donation_id) || 0).toFixed(2),
      phone: donor?.phone || '',
      email: donor?.email || '',
      address: donor?.address || ''
    };
  });

  worksheet.addRows(rows);

  // Agregar fila de totales
  const totalRow = rows.length + 2;
  worksheet.getCell(`F${totalRow}`).value = {
    formula: `SUM(F2:F${rows.length + 1})`
  };
  worksheet.getCell(`G${totalRow}`).value = {
    formula: `SUM(G2:G${rows.length + 1})`
  };
  worksheet.getCell(`A${totalRow}`).value = 'TOTAL';
  applyTotalRowStyles(worksheet, totalRow);

  // Formatear números
  worksheet.getColumn('F').numFmt = '#,##0.00';
  worksheet.getColumn('G').numFmt = '#,##0.00';
  worksheet.getColumn('I').numFmt = '0.00';
};

// Construir hoja 2: Items Detalle
const buildItemsDetailSheet = (
  workbook: any,
  donationItems: DonationItemData[]
): void => {
  const worksheet = workbook.addWorksheet('Items Detalle');

  worksheet.columns = [
    { header: 'ID Donación', key: 'donation_id', width: 12 },
    { header: 'Item ID', key: 'item_id', width: 10 },
    { header: 'Producto', key: 'product_name', width: 35 },
    { header: 'Categoría', key: 'category', width: 25 },
    { header: 'Marca', key: 'brand', width: 20 },
    { header: 'Cantidad', key: 'quantity', width: 12 },
    { header: 'Unidad', key: 'unit', width: 10 },
    { header: 'Precio Unitario Mercado', key: 'market_unit', width: 20 },
    { header: 'Precio Unitario Real', key: 'actual_unit', width: 18 },
    { header: 'Precio Total Mercado', key: 'market_total', width: 18 },
    { header: 'Precio Total Real', key: 'actual_total', width: 18 },
    { header: '% Descuento', key: 'discount', width: 12 },
    { header: 'Fecha Caducidad', key: 'expiry_date', width: 15 }
  ];

  applyHeaderStyles(worksheet);

  const rows = donationItems.map(item => {
    const product = extractNestedData(item.product);
    const category = extractNestedData(product?.category);
    const brand = extractNestedData(product?.brand);
    const unit = extractNestedData(product?.unit);

    const marketTotal = item.market_unit_price * item.quantity;
    const actualTotal = item.actual_unit_price * item.quantity;
    const discount = item.market_unit_price > 0
      ? ((item.market_unit_price - item.actual_unit_price) / item.market_unit_price * 100).toFixed(2)
      : '0.00';

    return {
      donation_id: item.donation_id,
      item_id: item.item_id,
      product_name: product?.product_name || '',
      category: category?.category_name || '',
      brand: brand?.brand_name || '',
      quantity: item.quantity,
      unit: unit?.abbreviation || unit?.unit_name || '',
      market_unit: item.market_unit_price,
      actual_unit: item.actual_unit_price,
      market_total: marketTotal,
      actual_total: actualTotal,
      discount: discount,
      expiry_date: formatDate(item.expiry_date)
    };
  });

  worksheet.addRows(rows);

  // Agregar fila de totales
  const totalRow = rows.length + 2;
  worksheet.getCell(`J${totalRow}`).value = {
    formula: `SUM(J2:J${rows.length + 1})`
  };
  worksheet.getCell(`K${totalRow}`).value = {
    formula: `SUM(K2:K${rows.length + 1})`
  };
  worksheet.getCell(`A${totalRow}`).value = 'TOTAL';
  applyTotalRowStyles(worksheet, totalRow);

  // Formatear números
  ['H', 'I', 'J', 'K'].forEach(col => {
    worksheet.getColumn(col).numFmt = '#,##0.00';
  });
  worksheet.getColumn('F').numFmt = '#,##0.00';
  worksheet.getColumn('L').numFmt = '0.00';
};

// Construir hoja 3: Totales por Tipo Donante
const buildTotalsByDonorTypeSheet = (
  workbook: any,
  donations: DonationData[]
): void => {
  const worksheet = workbook.addWorksheet('Totales por Tipo Donante');

  // Agregar por tipo de donante
  const totalsByType = new Map<string, {
    count: number;
    totalMarket: number;
    totalReal: number;
  }>();

  donations.forEach(donation => {
    const donor = extractNestedData(donation.donor);
    const donorType = extractNestedData(donor?.donor_type);
    const typeName = donorType?.type_name || 'Desconocido';

    const current = totalsByType.get(typeName) || { count: 0, totalMarket: 0, totalReal: 0 };
    totalsByType.set(typeName, {
      count: current.count + 1,
      totalMarket: current.totalMarket + donation.market_value,
      totalReal: current.totalReal + donation.actual_value
    });
  });

  const grandTotal = Array.from(totalsByType.values()).reduce((sum, t) => sum + t.totalReal, 0);

  worksheet.columns = [
    { header: 'Tipo Donante', key: 'type', width: 30 },
    { header: '# Donaciones', key: 'count', width: 15 },
    { header: 'Total Mercado', key: 'total_market', width: 15 },
    { header: 'Total Real', key: 'total_real', width: 15 },
    { header: 'Promedio por Donación', key: 'average', width: 20 },
    { header: '% del Total', key: 'percentage', width: 12 }
  ];

  applyHeaderStyles(worksheet);

  const rows = Array.from(totalsByType.entries())
    .map(([typeName, totals]) => ({
      type: typeName,
      count: totals.count,
      total_market: totals.totalMarket,
      total_real: totals.totalReal,
      average: (totals.totalReal / totals.count).toFixed(2),
      percentage: grandTotal > 0 ? ((totals.totalReal / grandTotal) * 100).toFixed(2) : '0.00'
    }))
    .sort((a, b) => b.total_real - a.total_real);

  worksheet.addRows(rows);

  // Agregar fila de totales
  const totalRow = rows.length + 2;
  worksheet.getCell(`B${totalRow}`).value = {
    formula: `SUM(B2:B${rows.length + 1})`
  };
  worksheet.getCell(`C${totalRow}`).value = {
    formula: `SUM(C2:C${rows.length + 1})`
  };
  worksheet.getCell(`D${totalRow}`).value = {
    formula: `SUM(D2:D${rows.length + 1})`
  };
  worksheet.getCell(`A${totalRow}`).value = 'TOTAL';
  applyTotalRowStyles(worksheet, totalRow);

  // Formatear números
  ['C', 'D', 'E'].forEach(col => {
    worksheet.getColumn(col).numFmt = '#,##0.00';
  });
  worksheet.getColumn('F').numFmt = '0.00';
};

// Construir hoja 4: Totales por Categoría
const buildTotalsByCategorySheet = (
  workbook: any,
  donationItems: DonationItemData[]
): void => {
  const worksheet = workbook.addWorksheet('Totales por Categoría');

  // Agregar por categoría
  const totalsByCategory = new Map<string, {
    quantity: number;
    totalMarket: number;
    totalReal: number;
  }>();

  donationItems.forEach(item => {
    const product = extractNestedData(item.product);
    const category = extractNestedData(product?.category);
    const categoryName = category?.category_name || 'Desconocido';

    const marketTotal = item.market_unit_price * item.quantity;
    const actualTotal = item.actual_unit_price * item.quantity;

    const current = totalsByCategory.get(categoryName) || { quantity: 0, totalMarket: 0, totalReal: 0 };
    totalsByCategory.set(categoryName, {
      quantity: current.quantity + item.quantity,
      totalMarket: current.totalMarket + marketTotal,
      totalReal: current.totalReal + actualTotal
    });
  });

  const grandTotal = Array.from(totalsByCategory.values()).reduce((sum, t) => sum + t.totalReal, 0);

  worksheet.columns = [
    { header: 'Categoría', key: 'category', width: 30 },
    { header: 'Cantidad Total', key: 'quantity', width: 15 },
    { header: 'Valor Total Mercado', key: 'total_market', width: 20 },
    { header: 'Valor Total Real', key: 'total_real', width: 18 },
    { header: '% del Total', key: 'percentage', width: 12 }
  ];

  applyHeaderStyles(worksheet);

  const rows = Array.from(totalsByCategory.entries())
    .map(([categoryName, totals]) => ({
      category: categoryName,
      quantity: totals.quantity,
      total_market: totals.totalMarket,
      total_real: totals.totalReal,
      percentage: grandTotal > 0 ? ((totals.totalReal / grandTotal) * 100).toFixed(2) : '0.00'
    }))
    .sort((a, b) => b.total_real - a.total_real);

  worksheet.addRows(rows);

  // Agregar fila de totales
  const totalRow = rows.length + 2;
  worksheet.getCell(`B${totalRow}`).value = {
    formula: `SUM(B2:B${rows.length + 1})`
  };
  worksheet.getCell(`C${totalRow}`).value = {
    formula: `SUM(C2:C${rows.length + 1})`
  };
  worksheet.getCell(`D${totalRow}`).value = {
    formula: `SUM(D2:D${rows.length + 1})`
  };
  worksheet.getCell(`A${totalRow}`).value = 'TOTAL';
  applyTotalRowStyles(worksheet, totalRow);

  // Formatear números
  ['B', 'C', 'D'].forEach(col => {
    worksheet.getColumn(col).numFmt = '#,##0.00';
  });
  worksheet.getColumn('E').numFmt = '0.00';
};

// Construir hoja 5: Totales por Almacén
const buildTotalsByWarehouseSheet = (
  workbook: any,
  donations: DonationData[]
): void => {
  const worksheet = workbook.addWorksheet('Totales por Almacén');

  // Agregar por almacén
  const totalsByWarehouse = new Map<string, {
    count: number;
    totalMarket: number;
    totalReal: number;
  }>();

  donations.forEach(donation => {
    const warehouse = extractNestedData(donation.warehouse);
    const warehouseName = warehouse?.warehouse_name || 'Desconocido';

    const current = totalsByWarehouse.get(warehouseName) || { count: 0, totalMarket: 0, totalReal: 0 };
    totalsByWarehouse.set(warehouseName, {
      count: current.count + 1,
      totalMarket: current.totalMarket + donation.market_value,
      totalReal: current.totalReal + donation.actual_value
    });
  });

  const grandTotal = Array.from(totalsByWarehouse.values()).reduce((sum, t) => sum + t.totalReal, 0);

  worksheet.columns = [
    { header: 'Almacén', key: 'warehouse', width: 25 },
    { header: '# Donaciones', key: 'count', width: 15 },
    { header: 'Total Mercado', key: 'total_market', width: 15 },
    { header: 'Total Real', key: 'total_real', width: 15 },
    { header: 'Promedio por Donación', key: 'average', width: 20 },
    { header: '% del Total', key: 'percentage', width: 12 }
  ];

  applyHeaderStyles(worksheet);

  const rows = Array.from(totalsByWarehouse.entries())
    .map(([warehouseName, totals]) => ({
      warehouse: warehouseName,
      count: totals.count,
      total_market: totals.totalMarket,
      total_real: totals.totalReal,
      average: (totals.totalReal / totals.count).toFixed(2),
      percentage: grandTotal > 0 ? ((totals.totalReal / grandTotal) * 100).toFixed(2) : '0.00'
    }))
    .sort((a, b) => b.total_real - a.total_real);

  worksheet.addRows(rows);

  // Agregar fila de totales
  const totalRow = rows.length + 2;
  worksheet.getCell(`B${totalRow}`).value = {
    formula: `SUM(B2:B${rows.length + 1})`
  };
  worksheet.getCell(`C${totalRow}`).value = {
    formula: `SUM(C2:C${rows.length + 1})`
  };
  worksheet.getCell(`D${totalRow}`).value = {
    formula: `SUM(D2:D${rows.length + 1})`
  };
  worksheet.getCell(`A${totalRow}`).value = 'TOTAL';
  applyTotalRowStyles(worksheet, totalRow);

  // Formatear números
  ['C', 'D', 'E'].forEach(col => {
    worksheet.getColumn(col).numFmt = '#,##0.00';
  });
  worksheet.getColumn('F').numFmt = '0.00';
};

const Backup: React.FC = () => {
  const { addAlert } = useAlerts();
  const { getToken } = useAuth();
  const { xlsx, isReady: isXLSXReady } = useXLSX();

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Show loading spinner while xlsx is loading
  if (!isXLSXReady) {
    return <LoadingSpinner size="lg" message="Cargando herramientas de exportación..." centerScreen />;
  }

const handleBackup = async () => {
  setIsBackupLoading(true);
  addAlert('Generando respaldo completo... esto puede tardar un momento.', 'info');

  try {
    const startDate = new Date(selectedYear, 0, 1).toISOString();
    const endDate = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();

    // 🔹 1. Obtener donaciones con datos relacionados
    const { data: donations, error: donationsError } = await supabase
      .from('donation_transactions')
      .select(`
        donation_id,
        donation_date,
        market_value,
        actual_value,
        donor:donors!inner (
          donor_id,
          donor_name,
          phone,
          email,
          address,
          donor_type_id,
          donor_type:donor_types (
            donor_type_id,
            type_name
          )
        ),
        warehouse:warehouses!inner (
          warehouse_id,
          warehouse_name,
          location_description
        )
      `)
      .gte('donation_date', startDate)
      .lte('donation_date', endDate)
      .order('donation_date', { ascending: true });

    if (donationsError) throw donationsError;

    if (!donations || donations.length === 0) {
      addAlert('No hay donaciones en el año seleccionado.', 'warning');
      setIsBackupLoading(false);
      return;
    }

    // 🔹 2. Obtener artículos donados con productos y unidades
    const donationIds = donations.map(d => d.donation_id);
    const { data: donationItems, error: itemsError } = await supabase
      .from('donation_items')
      .select(`
        item_id,
        donation_id,
        product_id,
        quantity,
        market_unit_price,
        actual_unit_price,
        expiry_date,
        product:products!inner (
          product_id,
          product_name,
          category_id,
          brand_id,
          official_unit_id,
          category:categories (
            category_id,
            category_name
          ),
          brand:brands (
            brand_id,
            brand_name
          ),
          unit:units (
            unit_id,
            unit_name,
            abbreviation
          )
        )
      `)
      .in('donation_id', donationIds)
      .order('donation_id', { ascending: true });

    if (itemsError) throw itemsError;

    // 🔹 3. Crear libro de Excel con múltiples hojas
    if (!xlsx) {
      throw new Error('ExcelJS library no está disponible');
    }

    const workbook = new xlsx.Workbook();

    // Crear todas las hojas
    buildDonationSummarySheet(workbook, donations as DonationData[], donationItems as DonationItemData[]);
    buildItemsDetailSheet(workbook, donationItems as DonationItemData[]);
    buildTotalsByDonorTypeSheet(workbook, donations as DonationData[]);
    buildTotalsByCategorySheet(workbook, donationItems as DonationItemData[]);
    buildTotalsByWarehouseSheet(workbook, donations as DonationData[]);

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Descargar archivo
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Respaldo_Completo_LaGranFamilia_${selectedYear}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    addAlert(`✅ Respaldo generado: ${donations.length} donaciones y ${donationItems?.length || 0} artículos exportados`, 'success');
  } catch (error: any) {
    addAlert(`Error: ${error.message}`, 'error');
  } finally {
    setIsBackupLoading(false);
  }
};



const handleReset = async () => {
  setIsResetLoading(true);
  try {
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      setIsResetLoading(false);
      setIsResetAlertOpen(false);
      setResetConfirmationText('');
      return;
    }

    await systemApi.resetSystem(token);

    addAlert('Sistema reseteado con éxito.', 'success');
    setIsResetAlertOpen(false);
    setResetConfirmationText('');
    window.location.reload();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al resetear el sistema.';
    addAlert(`Error al resetear el sistema: ${errorMessage}`, 'error');
    setIsResetAlertOpen(false);
    setResetConfirmationText('');
  } finally {
    setIsResetLoading(false);
  }
};


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };

const handleImport = async () => {
  if (!importFile) {
    addAlert('Por favor, selecciona un archivo de Excel para importar.', 'warning');
    return;
  }

  setIsImporting(true);

  try {
    if (!xlsx) {
      throw new Error('ExcelJS library no está disponible');
    }

    const arrayBuffer = await importFile.arrayBuffer();
    const workbook = new xlsx.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    // Intentar leer de "Items Detalle" primero (nueva estructura)
    // Si no existe, leer de la primera hoja (compatibilidad con estructura antigua)
    let worksheet = workbook.getWorksheet('Items Detalle');
    if (!worksheet) {
      worksheet = workbook.getWorksheet(0);
    }
    
    if (!worksheet) {
      throw new Error('No se encontró ninguna hoja en el archivo');
    }

    // Convertir a JSON
    const json: any[] = [];
    const headers: string[] = [];
    
    // Leer headers (primera fila)
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value?.toString() || '';
    });

    // Leer datos (desde la segunda fila hasta la última fila de datos, excluyendo totales)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      // Detectar fila de totales (contiene "TOTAL" en la primera celda)
      const firstCellValue = row.getCell(1).value?.toString()?.toUpperCase() || '';
      if (firstCellValue === 'TOTAL') return; // Skip total row
      
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          // Manejar diferentes tipos de valores
          if (cell.value instanceof Date) {
            rowData[header] = cell.value;
          } else if (typeof cell.value === 'object' && cell.value !== null) {
            rowData[header] = cell.value.toString();
          } else {
            rowData[header] = cell.value;
          }
        }
      });
      json.push(rowData);
    });

    // 🔹 Detectar estructura (nueva o antigua)
    const isNewStructure = json.length > 0 && 'ID Donación' in json[0] && 'Producto' in json[0];
    
    if (isNewStructure) {
      // Nueva estructura: agrupar por ID Donación
      const donationsMap = new Map<number, any[]>();
      
      for (const row of json) {
        const donationId = row['ID Donación'];
        if (!donationsMap.has(donationId)) donationsMap.set(donationId, []);
        donationsMap.get(donationId).push(row);
      }

      // Leer datos de donación de la hoja "Resumen Donaciones" si existe
      const summarySheet = workbook.getWorksheet('Resumen Donaciones');
      const summaryData = new Map<number, any>();
      
      if (summarySheet) {
        const summaryHeaders: string[] = [];
        summarySheet.getRow(1).eachCell((cell, colNumber) => {
          summaryHeaders[colNumber - 1] = cell.value?.toString() || '';
        });
        
        summarySheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const firstCellValue = row.getCell(1).value?.toString()?.toUpperCase() || '';
          if (firstCellValue === 'TOTAL') return;
          
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const header = summaryHeaders[colNumber - 1];
            if (header) {
              rowData[header] = cell.value;
            }
          });
          if (rowData['ID Donación']) {
            summaryData.set(rowData['ID Donación'], rowData);
          }
        });
      }

      // Procesar cada donación
      for (const [donationId, items] of donationsMap.entries()) {
        const firstItem = items[0];
        const summary = summaryData.get(donationId) || firstItem;
        
        // Obtener datos del donante (de summary o del primer item)
        const donorName = summary['Donante'] || firstItem['Nombre Completo']?.trim() || 'Desconocido';
        const donorPhone = summary['Teléfono'] || firstItem['Celular / Telefono'] || null;
        const donorEmail = summary['Correo'] || firstItem['Correo'] || null;
        const donorAddress = summary['Dirección'] || firstItem['Dirección'] || null;
        const donationDate = summary['Fecha'] || firstItem['Fecha'] || new Date();
        
        // Verificar o crear el donante
        const { data: existingDonor } = await supabase
          .from('donors')
          .select('donor_id')
          .eq('donor_name', donorName)
          .maybeSingle();

        let donorId = existingDonor?.donor_id;
        if (!donorId) {
          const { data: newDonor, error: donorError } = await supabase
            .from('donors')
            .insert({
              donor_name: donorName,
              donor_type_id: 4, // Particulares por defecto
              phone: donorPhone,
              email: donorEmail,
              address: donorAddress,
            })
            .select()
            .single();

          if (donorError) throw donorError;
          donorId = newDonor.donor_id;
        }

        // Crear transacción de donación
        const { data: donationTx, error: txError } = await supabase
          .from('donation_transactions')
          .insert({
            donor_id: donorId,
            warehouse_id: 1,
            donation_date: donationDate ? new Date(donationDate) : new Date(),
          })
          .select()
          .single();

        if (txError) throw txError;

        // Insertar items
        for (const item of items) {
          const productName = item['Producto']?.trim() || 'Producto desconocido';
          const unitName = item['Unidad']?.trim() || 'unidad';

          const { data: unitData } = await supabase
            .from('units')
            .select('unit_id')
            .ilike('unit_name', unitName)
            .maybeSingle();

          const unitId = unitData?.unit_id || 1;

          const { data: existingProduct } = await supabase
            .from('products')
            .select('product_id')
            .ilike('product_name', productName)
            .maybeSingle();

          let productId = existingProduct?.product_id;
          if (!productId) {
            const { data: newProduct, error: productError } = await supabase
              .from('products')
              .insert({
                product_name: productName,
                category_id: 1,
                official_unit_id: unitId,
                description: productName,
              })
              .select()
              .single();

            if (productError) throw productError;
            productId = newProduct.product_id;
          }

          const marketPrice = parseFloat(item['Precio Unitario Mercado'] || item['Precio Unitario'] || 0);
          const actualPrice = parseFloat(item['Precio Unitario Real'] || item['Precio Unitario'] || 0);
          const quantity = parseFloat(item['Cantidad']) || 0;
          
          await supabase.from('donation_items').insert({
            donation_id: donationTx.donation_id,
            product_id: productId,
            quantity: quantity,
            market_unit_price: marketPrice,
            actual_unit_price: actualPrice,
            expiry_date: item['Fecha Caducidad'] ? new Date(item['Fecha Caducidad']) : null,
          });
        }
      }
    } else {
      // Estructura antigua: agrupar por nombre de donante
      const donorsMap = new Map<string, unknown[]>();

      for (const row of json) {
        const donorName = row['Nombre Completo']?.trim() || 'Desconocido';
        if (!donorsMap.has(donorName)) donorsMap.set(donorName, []);
        donorsMap.get(donorName).push(row);
      }

      for (const [donorName, donations] of donorsMap.entries()) {
        const { data: existingDonor } = await supabase
          .from('donors')
          .select('donor_id')
          .eq('donor_name', donorName)
          .maybeSingle();

        let donorId = existingDonor?.donor_id;
        if (!donorId) {
          const { data: newDonor, error: donorError } = await supabase
            .from('donors')
            .insert({
              donor_name: donorName,
              donor_type_id: 1,
              phone: donations[0]['Celular / Telefono'] || null,
              email: donations[0]['Correo'] || null,
              address: donations[0]['Dirección'] || null,
            })
            .select()
            .single();

          if (donorError) throw donorError;
          donorId = newDonor.donor_id;
        }

        const { data: donationTx, error: txError } = await supabase
          .from('donation_transactions')
          .insert({
            donor_id: donorId,
            warehouse_id: 1,
            donation_date: donations[0]['Fecha']
              ? new Date(donations[0]['Fecha'])
              : new Date(),
          })
          .select()
          .single();

        if (txError) throw txError;

        for (const item of donations) {
          const productName = item['Descripción']?.trim() || 'Producto desconocido';
          const unitName = item['Unidad']?.trim() || 'unidad';

          const { data: unitData } = await supabase
            .from('units')
            .select('unit_id')
            .ilike('unit_name', unitName)
            .maybeSingle();

          const unitId = unitData?.unit_id || 1;

          const { data: existingProduct } = await supabase
            .from('products')
            .select('product_id')
            .ilike('product_name', productName)
            .maybeSingle();

          let productId = existingProduct?.product_id;
          if (!productId) {
            const { data: newProduct, error: productError } = await supabase
              .from('products')
              .insert({
                product_name: productName,
                category_id: 1,
                official_unit_id: unitId,
                description: productName,
              })
              .select()
              .single();

            if (productError) throw productError;
            productId = newProduct.product_id;
          }

          const precioUnitario = parseFloat(item['Precio Unitario']) || 0;
          const precioConDescuento = parseFloat(item['Total con descuento']) || precioUnitario;
          await supabase.from('donation_items').insert({
            donation_id: donationTx.donation_id,
            product_id: productId,
            quantity: parseFloat(item['Cantidad']) || 0,
            market_unit_price: precioUnitario,
            actual_unit_price: precioConDescuento / (parseFloat(item['Cantidad']) || 1),
            expiry_date: item['Fecha de Caducidad'] ? new Date(item['Fecha de Caducidad']) : null,
          });
        }
      }
    }

    addAlert('Importación completada exitosamente.', 'success');
  } catch (error: any) {
    // Error al importar datos - manejado por el sistema de alertas
    addAlert(`Error al importar los datos: ${error.message}`, 'error');
    console.error('Error al importar:', error);
  } finally {
    setIsImporting(false);
    setImportFile(null);
    const input = document.getElementById('import-file-input') as HTMLInputElement;
    if (input) input.value = '';
  }
};


  // Generate year options for the dropdown
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <AnimatedWrapper>
      <Header
        title="Respaldo y Reseteo"
        description="Administra los datos del sistema creando respaldos, importando registros y reseteando transacciones."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Backup & Import Column */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-muted dark:bg-dark-muted">
                  <DatabaseBackupIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Exportación Anual de Datos</CardTitle>
                  <CardDescription>
                    Descarga un archivo de Excel con todas las transacciones de un año específico.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="year-select">Selecciona el Año</Label>
                <Select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </div>
              <Button 
                onClick={handleBackup} 
                loading={isBackupLoading}
                loadingText="Generando..."
                className="w-full"
              >
                Generar y Descargar Respaldo
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Reset Card */}
        <Card className="border-destructive dark:border-destructive">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-destructive/10">
                <ExclamationTriangleIcon className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <CardTitle>Reseteo del Sistema</CardTitle>
                <CardDescription>
                  Elimina todos los datos transaccionales del sistema.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta acción es irreversible. Eliminará todos los registros de donaciones, lotes de
              stock. Los datos principales como productos, usuarios y
              donantes se conservarán.
            </p>
            <p className="text-sm font-semibold">
              Se recomienda encarecidamente realizar un respaldo antes de proceder.
            </p>
            <Button
              variant="destructive"
              onClick={() => setIsResetAlertOpen(true)}
              className="w-full"
            >
              Resetear Datos Transaccionales
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog isOpen={isResetAlertOpen} onClose={() => setIsResetAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta es una acción crítica. Para confirmar, por favor escribe "RESET" en el campo de
              abajo. Todo el historial de donaciones, inventario y solicitudes será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="reset-confirm">Escribe "RESET" para confirmar</Label>
            <Input
              id="reset-confirm"
              value={resetConfirmationText}
              onChange={(e) => setResetConfirmationText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsResetAlertOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={resetConfirmationText !== 'RESET'}
              loading={isResetLoading}
              loadingText="Reseteando..."
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Entiendo, resetear los datos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatedWrapper>
  );
};

export default Backup;