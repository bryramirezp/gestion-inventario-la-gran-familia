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
import { supabase } from '@/data/api';
import { useXLSX } from '@/infrastructure/hooks/useXLSX';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';

// Función auxiliar para obtener ancho de columna
const getColumnWidth = (header: string): number => {
  const widths: Record<string, number> = {
    'Ref': 8,
    'Nombre Completo': 25,
    'Celular / Telefono': 15,
    'Correo': 25,
    'Dirección': 30,
    'Fecha': 12,
    'Almacén': 20,
    'Cantidad': 10,
    'Unidad': 10,
    'Descripción': 35,
    'Precio Unitario': 12,
    'Precio Total': 12,
    'Total con descuento': 15,
    'Porcentaje Descuento': 12,
    'Tipo de Donativo': 20,
  };
  return widths[header] || 12;
};

const Backup: React.FC = () => {
  const { addAlert } = useAlerts();
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
        total_market_value,
        total_actual_value,
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
    // Donaciones obtenidas correctamente

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
    // Artículos donados obtenidos correctamente

    // 🔹 3. Mapear tipos de donativo (según tu catálogo)
    const donorTypeMapping: Record<number, string> = {
      1: 'Aportaciones por familia',
      2: 'Empresas con recibo',
      3: 'Empresas sin recibo',
      4: 'Particulares',
      5: 'Fundaciones',
      6: 'Universidades',
      7: 'Gobierno',
      8: 'Anónimo'
    };

    // 🔹 4. Mapear categorías de productos (según tu ejemplo Excel)
    const categoryMapping: Record<string, string> = {
      'Alimentos básicos': 'alimentos',
      'Enlatados y conservas': 'alimentos',
      'Productos refrigerados y perecederos': 'alimentos',
      'Frutas y verduras': 'alimentos',
      'Panadería y repostería': 'alimentos',
      'Bebidas': 'alimentos',
      'Productos de limpieza del hogar': 'art. limp.',
      'Higiene y cuidado personal': 'art. aseo per',
      'Papelería y suministros de oficina': 'Papelería',
      'Material educativo y didáctico': 'Papelería',
      'Ropa y calzado': 'Art. de vestir',
      'Accesorios personales': 'Art. de vestir',
      'Artículos para bebés': 'Art. de vestir',
      'Regalos y artículos de temporada': 'juguetes y recreación',
      'Textiles y hogar': 'decoración y blancos',
      'Electrodomésticos pequeños': 'mob y equipo',
      'Utensilios de cocina y menaje': 'mob y equipo'
    };

    // 🔹 5. Construir datos para Excel
    const excelData = donationItems?.map(item => {
      const donation = donations.find(d => d.donation_id === item.donation_id);
      
      // Extraer datos anidados correctamente
      const donor = Array.isArray(donation?.donor) ? donation.donor[0] : donation?.donor;
      const warehouse = Array.isArray(donation?.warehouse) ? donation.warehouse[0] : donation?.warehouse;
      const product = Array.isArray(item?.product) ? item.product[0] : item?.product;
      const category = Array.isArray(product?.category) ? product.category[0] : product?.category;
      const unit = Array.isArray(product?.unit) ? product.unit[0] : product?.unit;
      
      // Calcular valores
      const precioUnitario = item.market_unit_price || 0;
      const cantidad = item.quantity || 0;
      const precioTotal = precioUnitario * cantidad;
      
      // Calcular precio con descuento (valor real vs valor de mercado)
      const costoAdquisicion = item.actual_unit_price || 0;
      const precioConDescuento = costoAdquisicion * cantidad;
      const porcentajeDescuento = precioUnitario > 0 
        ? ((precioUnitario - costoAdquisicion) / precioUnitario * 100).toFixed(2)
        : '0.00';

      // Identificar tipo de donativo
      const donorTypeId = donor?.donor_type_id || 8; // Default: Anónimo
      const donorTypeName = donorTypeMapping[donorTypeId] || 'Otros';
      
      // Crear columnas para cada tipo de donativo (1-7)
      const tipoDonativoColumns: Record<string, string> = {};
      for (let i = 1; i <= 7; i++) {
        tipoDonativoColumns[i.toString()] = donorTypeId === i ? precioTotal.toFixed(2) : '';
      }

      // Identificar categoría del producto
      const categoryName = category?.category_name || '';
      const mappedCategory = categoryMapping[categoryName] || 'Otros';
      
      // Crear columnas para cada categoría de producto
      const productCategories = [
        'alimentos', 'art. limp.', 'art. aseo per', 'Papelería',
        'Art. de vestir', 'juguetes y recreación', 'decoración y blancos', 'mob y equipo'
      ];
      const categoryColumns: Record<string, string> = {};
      productCategories.forEach(cat => {
        categoryColumns[cat] = cat === mappedCategory ? precioTotal.toFixed(2) : '';
      });

      return {
        'Ref': item.item_id,
        'Nombre Completo': donor?.donor_name || '',
        'Celular / Telefono': donor?.phone || '',
        'Correo': donor?.email || '',
        'Dirección': donor?.address || '',
        'Fecha': donation?.donation_date 
          ? new Date(donation.donation_date).toLocaleDateString('es-MX')
          : '',
        'Almacén': warehouse?.warehouse_name || '',
        'Cantidad': cantidad,
        'Unidad': unit?.abbreviation || unit?.unit_name || '',
        'Descripción': product?.product_name || '',
        'Precio Unitario': precioUnitario.toFixed(2),
        'Precio Total': precioTotal.toFixed(2),
        'Total con descuento': precioConDescuento.toFixed(2),
        'Porcentaje Descuento': porcentajeDescuento,
        'Tipo de Donativo': donorTypeName,
        // Columnas por tipo de donativo
        ...tipoDonativoColumns,
        // Columnas por categoría de producto
        ...categoryColumns
      };
    }) || [];

    // 🔹 6. Crear libro de Excel con ExcelJS
    if (!xlsx) {
      throw new Error('ExcelJS library no está disponible');
    }

    const workbook = new xlsx.Workbook();
    const worksheet = workbook.addWorksheet(`Donativos_${selectedYear}`);
    
    // Definir headers personalizados según tu formato
    const headers = [
      'Ref',
      'Nombre Completo',
      'Celular / Telefono',
      'Correo',
      'Dirección',
      'Fecha',
      'Almacén',
      'Cantidad',
      'Unidad',
      'Descripción',
      'Precio Unitario',
      'Precio Total',
      'Total con descuento',
      'Porcentaje Descuento',
      'Tipo de Donativo',
      '1', '2', '3', '4', '5', '6', '7', // Tipos de donativo
      'alimentos',
      'art. limp.',
      'art. aseo per',
      'Papelería',
      'Art. de vestir',
      'juguetes y recreación',
      'decoración y blancos',
      'mob y equipo'
    ];

    // Definir columnas con headers
    worksheet.columns = headers.map(header => ({
      header,
      key: header,
      width: getColumnWidth(header)
    }));

    // Aplicar estilo a la fila de headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Añadir datos
    worksheet.addRows(excelData);

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

    addAlert(`✅ Respaldo generado: ${donationItems?.length || 0} artículos exportados`, 'success');
  } catch (error) {
    // Error al generar respaldo - manejado por el sistema de alertas
    addAlert(`Error: ${error.message}`, 'error');
  } finally {
    setIsBackupLoading(false);
  }
};



const handleReset = async () => {
  setIsResetLoading(true);
  try {
    await Promise.all([
      supabase.from('donaciones').delete().neq('id', 0),
      supabase.from('articulos_donados').delete().neq('id', 0),
      supabase.from('solicitudes_cocina').delete().neq('id', 0),
      supabase.from('articulos_solicitados').delete().neq('id', 0),
      supabase.from('lotes_stock').delete().neq('id', 0),
    ]);

    addAlert('Sistema reseteado con éxito.', 'success');
    window.location.reload();
  } catch (error) {
    // Error al resetear sistema - manejado por el sistema de alertas
    addAlert('Error al resetear el sistema.', 'error');
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
    
    const worksheet = workbook.getWorksheet(0); // Primera hoja
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

    // Leer datos (desde la segunda fila)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
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

    // 🔹 Agrupar por nombre de donante
    const donorsMap = new Map<string, unknown[]>();

      for (const row of json) {
        const donorName = row['Nombre Completo']?.trim() || 'Desconocido';
        if (!donorsMap.has(donorName)) donorsMap.set(donorName, []);
        donorsMap.get(donorName).push(row);
      }

      // 🔹 Iterar sobre cada donante
      for (const [donorName, donations] of donorsMap.entries()) {
        // 1️⃣ Verificar o crear el donante
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
              donor_type_id: 1, // Ej. "Particular"
              phone: donations[0]['Celular / Telefono'] || null,
              email: donations[0]['Correo'] || null,
              address: donations[0]['Dirección'] || null,
            })
            .select()
            .single();

          if (donorError) throw donorError;
          donorId = newDonor.donor_id;
        }

        // 2️⃣ Crear transacción de donación
        const { data: donationTx, error: txError } = await supabase
          .from('donation_transactions')
          .insert({
            donor_id: donorId,
            warehouse_id: 1, // Puedes ajustar según tu sistema
            donation_date: donations[0]['Fecha']
              ? new Date(donations[0]['Fecha'])
              : new Date(),
          })
          .select()
          .single();

        if (txError) throw txError;

        // 3️⃣ Insertar los artículos donados
        for (const item of donations) {
          const productName = item['Descripción']?.trim() || 'Producto desconocido';
          const unitName = item['Unidad']?.trim() || 'unidad';

          // 🔍 Buscar unidad
          const { data: unitData } = await supabase
            .from('units')
            .select('unit_id')
            .ilike('unit_name', unitName)
            .maybeSingle();

          const unitId = unitData?.unit_id || 1; // default

          // 🔍 Buscar producto
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

          // 💾 Insertar item de donación
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
              stock y solicitudes de cocina. Los datos principales como productos, usuarios y
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