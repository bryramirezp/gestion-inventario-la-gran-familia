import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { stockLotApi, productApi, warehouseApi, stockMovementApi, movementTypeApi } from '@/data/api';
import { StockLot, Warehouse, Product } from '@/domain/types';
import Header from '@/presentation/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Column } from '@/presentation/components/ui/Table';
import { ResponsiveTable } from '@/presentation/components/ui/ResponsiveTable';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { Input, Select } from '@/presentation/components/forms';
import useTableState from '@/infrastructure/hooks/useTableState';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { useAuth } from '@/app/providers/AuthProvider';
import { MovementForm } from '@/presentation/features/inventory/MovementForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/Dialog';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useApiMutation, useApiQuery } from '@/infrastructure/hooks/useApiQuery';
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
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedLotForMovement, setSelectedLotForMovement] = useState<ReportLot | null>(null);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);

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
      const token = getToken();
      if (!token) {
        addAlert('No se pudo obtener el token de autenticación.', 'error');
        setLoading(false);
        return;
      }
      const [lots, prods, whs] = await Promise.all([
        stockLotApi.getAll(token),
        productApi.getAll(token),
        warehouseApi.getAll(token),
      ]);
      setWarehouses(whs);
      setProducts(prods);

      const productMap = new Map(prods.map((p) => [p.product_id, p.product_name]));
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

    // Ordenar usando FEFO/FIFO: primero por fecha de caducidad, luego por fecha de recepción
    filtered.sort((a, b) => {
      // Primero ordenar por fecha de caducidad (FEFO)
      const aExpiry = new Date(a.expiry_date!).getTime();
      const bExpiry = new Date(b.expiry_date!).getTime();
      if (aExpiry !== bExpiry) {
        return sortConfig?.direction === 'asc' ? aExpiry - bExpiry : bExpiry - aExpiry;
      }
      // Si las fechas de caducidad son iguales, ordenar por fecha de recepción (FIFO)
      const aReceived = new Date(a.received_date).getTime();
      const bReceived = new Date(b.received_date).getTime();
      return sortConfig?.direction === 'asc' ? aReceived - bReceived : bReceived - aReceived;
    });

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

  // Obtener tipos de movimiento SALIDA
  const { data: exitMovementTypes = [] } = useApiQuery(
    ['movement-types', 'exit'],
    async (token) => {
      const allTypes = await movementTypeApi.getAll(token);
      return allTypes.filter((t) => t.category === 'SALIDA');
    },
    { staleTime: 5 * 60 * 1000 }
  );

  const createMovementMutation = useApiMutation(
    async (data: { lotId: number; movementTypeId: number; quantity: number; notes?: string }, token) => {
      return await stockMovementApi.create(token, {
        lot_id: data.lotId,
        movement_type_id: data.movementTypeId,
        quantity: data.quantity,
        notes: data.notes,
      });
    },
    {
      onSuccess: () => {
        addAlert('Salida registrada con éxito', 'success');
        setIsMovementModalOpen(false);
        setSelectedLotForMovement(null);
        setSelectedProductForMovement(null);
        fetchReportData();
      },
      onError: (error) => {
        addAlert(`Error al registrar salida: ${error.message}`, 'error');
      },
      invalidateQueries: [['movements'], ['stockLots']],
    }
  );

  const handleOpenMovementModal = (lot: ReportLot) => {
    const product = products.find((p) => p.product_id === lot.product_id);
    setSelectedLotForMovement(lot);
    setSelectedProductForMovement(product || null);
    setIsMovementModalOpen(true);
  };

  const handleCloseMovementModal = () => {
    setIsMovementModalOpen(false);
    setSelectedLotForMovement(null);
    setSelectedProductForMovement(null);
  };

  const handleSaveMovement = async (data: {
    lotId: number;
    movementTypeId: number;
    quantity: number;
    notes?: string;
  }) => {
    await createMovementMutation.mutateAsync(data);
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
      {
        header: 'Fecha de Recepción',
        accessor: (item) => new Date(item.received_date).toLocaleDateString(),
        sortable: true,
      },
      { header: 'Estado', accessor: (item) => getStatusBadge(item.status) },
      {
        header: 'Acciones',
        accessor: (item) => (
          <Button
            size="sm"
            variant="default"
            onClick={() => handleOpenMovementModal(item)}
            disabled={item.current_quantity <= 0}
          >
            Registrar Salida
          </Button>
        ),
      },
    ],
    [exitMovementTypes]
  );

  const { orderedColumns, ...tableState } = useTableState<ReportLot>(
    columns,
    'expiry-report-table'
  );

  if (loading) {
    return <LoadingSpinner size="lg" message="Cargando reporte de caducidad..." centerScreen />;
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
          <ResponsiveTable
            columns={orderedColumns}
            data={sortedAndFilteredLots}
            getKey={(lot) => lot.lot_id}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            renderMobileCard={(lot) => (
              <div className="space-y-2">
                <div className="font-semibold text-lg">{lot.product_name}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Almacén: {lot.warehouse_name}</div>
                  <div>Cantidad: {lot.current_quantity}</div>
                  <div>
                    Fecha de Caducidad: {lot.expiry_date ? new Date(lot.expiry_date).toLocaleDateString() : 'N/A'}
                  </div>
                  <div>
                    Fecha de Recepción: {new Date(lot.received_date).toLocaleDateString()}
                  </div>
                  <div>{getStatusBadge(lot.status)}</div>
                  <div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleOpenMovementModal(lot)}
                      disabled={lot.current_quantity <= 0}
                      className="mt-2"
                    >
                      Registrar Salida
                    </Button>
                  </div>
                </div>
              </div>
            )}
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

      {/* Dialog de Registro de Salida */}
      <Dialog isOpen={isMovementModalOpen} onClose={handleCloseMovementModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Salida de Stock</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 max-h-[calc(90vh-180px)]">
            {selectedLotForMovement && selectedProductForMovement && (
              <MovementForm
                lot={selectedLotForMovement}
                product={selectedProductForMovement}
                onSave={handleSaveMovement}
                onCancel={handleCloseMovementModal}
                isSubmitting={createMovementMutation.isLoading}
                movementTypes={exitMovementTypes}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AnimatedWrapper>
  );
};

export default ExpiryReport;
