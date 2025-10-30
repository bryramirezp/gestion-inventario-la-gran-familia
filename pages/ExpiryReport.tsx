import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { stockLotApi, productApi, warehouseApi } from '../services/api';
import { StockLot, Warehouse } from '../types';
import Header from '../components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import Table, { Column } from '../components/Table';
import { AnimatedWrapper } from '../components/Animated';
import { Input, Select } from '../components/forms';
import useTableState from '../hooks/useTableState';
import { Badge } from '../components/Badge';
import { useAuth } from '../contexts/AuthContext';
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
import { useAlerts } from '../contexts/AlertContext';

type ReportLot = StockLot & {
  product_name: string;
  warehouse_name: string;
  status: 'Expired' | 'Expiring Soon' | 'OK';
};

const ExpiryReport: React.FC = () => {
  const { getToken } = useAuth();
  const { addAlert } = useAlerts();
  const [reportLots, setReportLots] = useState<ReportLot[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'Fecha de Caducidad',
    direction: 'asc',
  });

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const [lots, products, whs] = await Promise.all([
        stockLotApi.getAll(''),
        productApi.getAll(''),
        warehouseApi.getAll(''),
      ]);
      setWarehouses(whs);

      const productMap = new Map(products.map((p) => [p.product_id, p.product_name]));
      const warehouseMap = new Map(whs.map((w) => [w.warehouse_id, w.warehouse_name]));

      const EXPIRED_WAREHOUSE_ID = 4; // Corresponds to 'Almacén de Caducados'
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const enrichedLots = lots
        .filter((lot) => lot.expiry_date && lot.warehouse_id !== EXPIRED_WAREHOUSE_ID)
        .map((lot) => {
          const expiryDate = new Date(lot.expiry_date!);
          let status: ReportLot['status'] = 'OK';
          if (expiryDate < today) {
            status = 'Expired';
          } else if (expiryDate <= thirtyDaysFromNow) {
            status = 'Expiring Soon';
          }
          return {
            ...lot,
            product_name: productMap.get(lot.product_id) || 'Producto Desconocido',
            warehouse_name: warehouseMap.get(lot.warehouse_id) || 'Almacén Desconocido',
            status,
          };
        });

      setReportLots(enrichedLots);
    } catch (error) {
      // Error al cargar datos de reporte de caducidad - manejado internamente
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleProcessExpired = () => {
    if (isProcessing) return;
    setIsAlertOpen(true);
  };

  const handleConfirmProcess = async () => {
    setIsAlertOpen(false);
    setIsProcessing(true);
    const token = getToken();
    if (!token) {
      addAlert('No se pudo obtener el token de autenticación.', 'error');
      setIsProcessing(false);
      return;
    }
    try {
      const result = await stockLotApi.processExpired(token);
      if (result.movedCount > 0) {
        addAlert(
          `${result.movedCount} lote(s) caducado(s) movido(s) al almacén de 'Caducados'.`,
          'success'
        );
      } else {
        addAlert('No hay lotes caducados para procesar.', 'info');
      }
      fetchReportData();
    } catch (error) {
      // Error al procesar lotes caducados - manejado por el sistema de alertas
      addAlert('Ocurrió un error al procesar los lotes caducados.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const sortedAndFilteredLots = useMemo(() => {
    const filtered = reportLots.filter((lot) => {
      const matchesSearch = lot.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWarehouse = warehouseFilter
        ? lot.warehouse_id === parseInt(warehouseFilter)
        : true;
      const matchesStatus =
        statusFilter === 'all' || lot.status.replace(' ', '').toLowerCase() === statusFilter;
      return matchesSearch && matchesWarehouse && matchesStatus;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = new Date(a.expiry_date!).getTime();
        const bValue = new Date(b.expiry_date!).getTime();
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [reportLots, searchTerm, warehouseFilter, statusFilter, sortConfig]);

  const getStatusBadge = (status: ReportLot['status']) => {
    switch (status) {
      case 'Expired':
        return <Badge variant="destructive">Caducado</Badge>;
      case 'Expiring Soon':
        return <Badge variant="warning">Por Caducar</Badge>;
      default:
        return <Badge variant="success">OK</Badge>;
    }
  };

  const columns: Column<ReportLot>[] = useMemo(
    () => [
      { header: 'Producto', accessor: 'product_name' },
      { header: 'Almacén', accessor: 'warehouse_name' },
      { header: 'Cantidad en Lote', accessor: 'current_quantity' },
      {
        header: 'Fecha de Caducidad',
        accessor: (item) => new Date(item.expiry_date!).toLocaleDateString(),
        sortable: true,
      },
      { header: 'Estado', accessor: (item) => getStatusBadge(item.status) },
    ],
    []
  );

  const { orderedColumns, ...tableState } = useTableState<ReportLot>(
    columns,
    'expiry-report-table'
  );

  if (loading) {
    return <div className="text-center p-8">Cargando reporte de caducidad...</div>;
  }

  return (
    <AnimatedWrapper>
      <Header
        title="Reporte de Caducidad"
        description="Rastrea productos que están por caducar o ya han caducado."
        buttonText={isProcessing ? 'Procesando...' : 'Procesar Lotes Caducados'}
        onButtonClick={handleProcessExpired}
      />

      <Card>
        <CardHeader
          renderHeaderActions={() => (
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
              <Input
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="">Todos los Almacenes</option>
                {warehouses.map((w) => (
                  <option key={w.warehouse_id} value={w.warehouse_id}>
                    {w.warehouse_name}
                  </option>
                ))}
              </Select>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="all">Todos los Estados</option>
                <option value="expiringsoon">Por Caducar</option>
                <option value="expired">Caducado</option>
                <option value="ok">OK</option>
              </Select>
            </div>
          )}
        >
          <CardTitle>Todos los Lotes por Caducar</CardTitle>
          <CardDescription>
            Mostrando {sortedAndFilteredLots.length} de {reportLots.length} lotes con fechas de
            caducidad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            columns={orderedColumns}
            data={sortedAndFilteredLots}
            getKey={(lot) => lot.lot_id}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            {...tableState}
          />
        </CardContent>
      </Card>

      <AlertDialog isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Proceso</AlertDialogTitle>
            <AlertDialogDescription>
              Esto moverá todos los lotes que han pasado su fecha de caducidad al "Almacén de
              Caducados". Esta acción no se puede deshacer. ¿Estás seguro de que quieres continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmProcess}>
              Sí, Procesar Caducados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatedWrapper>
  );
};

export default ExpiryReport;
