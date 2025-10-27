import React, { useState } from 'react';
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { Button } from '../components/Button';
import { AnimatedWrapper } from '../components/Animated';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/AlertDialog';
import { Label, Select, Input } from '../components/forms';
import { DatabaseBackupIcon, ExclamationTriangleIcon } from '../components/icons/Icons';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';
import { systemApi } from '../services/api';

// This is a global declaration for the SheetJS library loaded from CDN
declare const XLSX: any;

const Backup: React.FC = () => {
  const { callApi } = useAuth();
  const { addAlert } = useAlerts();

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleBackup = async () => {
    setIsBackupLoading(true);
    addAlert('Generando respaldo... esto puede tardar un momento.', 'info');
    try {
      const data = await callApi((token) => systemApi.getDataForExport(token, selectedYear));

      const wb = XLSX.utils.book_new();

      const wsSummary = XLSX.utils.json_to_sheet(data.donationSummary);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Donaciones');

      const wsItems = XLSX.utils.json_to_sheet(data.donationItems);
      XLSX.utils.book_append_sheet(wb, wsItems, 'Artículos Donados');

      const wsLots = XLSX.utils.json_to_sheet(data.stockLotsData);
      XLSX.utils.book_append_sheet(wb, wsLots, 'Lotes de Inventario');

      const wsKitchen = XLSX.utils.json_to_sheet(data.kitchenRequests);
      XLSX.utils.book_append_sheet(wb, wsKitchen, 'Solicitudes Cocina');

      const wsKitchenItems = XLSX.utils.json_to_sheet(data.requestItems);
      XLSX.utils.book_append_sheet(wb, wsKitchenItems, 'Artículos Solicitados');

      XLSX.writeFile(wb, `Respaldo_LaGranFamilia_${selectedYear}.xlsx`);

      addAlert('¡Respaldo generado con éxito!', 'success');
    } catch (error) {
      console.error('Failed to generate backup', error);
      addAlert('Error al generar el respaldo. Por favor, inténtalo de nuevo.', 'error');
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleReset = async () => {
    setIsResetLoading(true);
    try {
      await callApi((token) => systemApi.resetSystem(token));
      addAlert(
        'Sistema reseteado con éxito. Todos los datos transaccionales han sido eliminados.',
        'success'
      );
      setIsResetAlertOpen(false);
      setResetConfirmationText('');
      // Optionally, force a reload or redirect
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset system', error);
      addAlert('Error al resetear el sistema. Por favor, inténtalo de nuevo.', 'error');
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!importFile) {
      addAlert('Por favor, selecciona un archivo de Excel para importar.', 'warning');
      return;
    }
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const parsedData = json
          .map((row: any) => ({
            donorTypeId: row['Ref'],
            donorName: row['Nombre Completo'],
            phone: row['Celular / Telefono'],
            date: row['Fecha'],
            quantity: row['Cantidad'],
            unit: row['Unidad'],
            productName: row['Descripción'],
            unitPrice: row['Precio Unitario'],
          }))
          .filter((r) => r.productName);

        if (parsedData.length === 0) {
          addAlert('El archivo parece estar vacío o en un formato incorrecto.', 'warning');
          return;
        }

        const { summary } = await callApi((token) => systemApi.importData(token, parsedData));
        addAlert(summary, 'success');
      } catch (error) {
        console.error('Failed to import data', error);
        addAlert(
          'Error al analizar o importar el archivo. Por favor, comprueba el formato del archivo y la consola para más detalles.',
          'error'
        );
      } finally {
        setIsImporting(false);
        setImportFile(null);
        const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.readAsArrayBuffer(importFile);
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
              <Button onClick={handleBackup} disabled={isBackupLoading} className="w-full">
                {isBackupLoading ? 'Generando...' : 'Generar y Descargar Respaldo'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-muted dark:bg-dark-muted">
                  <DatabaseBackupIcon className="w-6 h-6 text-muted-foreground -scale-x-100" />
                </div>
                <div>
                  <CardTitle>Importar Datos desde Excel</CardTitle>
                  <CardDescription>
                    Sube un archivo para agregar nuevos registros de donaciones al sistema.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="import-file-input">Selecciona Archivo de Excel</Label>
                <Input
                  id="import-file-input"
                  type="file"
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="pt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Formato esperado: Una hoja de Excel con columnas para Ref, Nombre Completo, Fecha,
                  Cantidad, Unidad, Descripción y Precio Unitario.
                </p>
              </div>
              <Button
                onClick={handleImport}
                disabled={isImporting || !importFile}
                className="w-full"
              >
                {isImporting ? 'Importando...' : 'Importar Datos'}
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
              disabled={resetConfirmationText !== 'RESET' || isResetLoading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isResetLoading ? 'Reseteando...' : 'Entiendo, resetear los datos'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatedWrapper>
  );
};

export default Backup;
