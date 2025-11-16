import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFullProductDetails, warehouseApi, categoryApi, adjustmentApi, stockMovementApi, transferApi } from '@/data/api';
import { Warehouse, Category, StockLot, StockTransferWithDetails } from '@/domain/types';
import Header from '@/presentation/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Column } from '@/presentation/components/ui/Table';
import { ResponsiveTable } from '@/presentation/components/ui/ResponsiveTable';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { Input, Select } from '@/presentation/components/forms';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import StockLotsModal from '@/presentation/features/products/StockLotsModal';
import useTableState from '@/infrastructure/hooks/useTableState';
import { useAuth } from '@/app/providers/AuthProvider';
import { useUserProfile } from '@/infrastructure/hooks/useUserProfile';
import { ChevronLeftIcon } from '@/presentation/components/icons/Icons';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import { AdjustmentForm } from '@/presentation/features/inventory/AdjustmentForm';
import { MovementForm } from '@/presentation/features/inventory/MovementForm';
import MovementHistoryModal from '@/presentation/features/inventory/MovementHistoryModal';
import { TransferRequestForm } from '@/presentation/features/inventory/TransferRequestForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/Dialog';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useApiMutation, useApiQuery } from '@/infrastructure/hooks/useApiQuery';
import { StockMovementWithType } from '@/domain/types';

type ProductDetail = Awaited<ReturnType<typeof getFullProductDetails>>[0];

const WarehouseDetail: React.FC = () => {
  const { data: userProfile } = useUserProfile();
  const { id } = useParams<{ id: string }>();
  const warehouseId = id ? parseInt(id, 10) : undefined;

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewingLots, setViewingLots] = useState<ProductDetail | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedLotForAdjustment, setSelectedLotForAdjustment] = useState<StockLot | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedLotForMovement, setSelectedLotForMovement] = useState<StockLot | null>(null);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<ProductDetail | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedLotForHistory, setSelectedLotForHistory] = useState<StockLot | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedLotForTransfer, setSelectedLotForTransfer] = useState<StockLot | null>(null);
  const { addAlert } = useAlerts();

  useEffect(() => {
    const fetchData = async () => {
      if (!warehouseId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [wh, prods, cats] = await Promise.all([
          warehouseApi.getById('', warehouseId),
          getFullProductDetails('', warehouseId),
          categoryApi.getAll(''),
        ]);
        setWarehouse(wh || null);
        setProducts(prods as ProductDetail[]);
        setAllCategories(cats);
      } catch (error) {
        // Error al cargar datos del almacén - manejado internamente
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [warehouseId]);

  const availableCategories = useMemo(() => {
    const categoryIdsInWarehouse = new Set(products.map((p) => p.category_id));
    return allCategories.filter((c) => categoryIdsInWarehouse.has(c.category_id));
  }, [products, allCategories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory
        ? product.category_id === parseInt(selectedCategory)
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const columns: Column<ProductDetail>[] = useMemo(
    () => [
      { header: 'Nombre', accessor: 'product_name' },
      { header: 'SKU', accessor: 'sku' },
      { header: 'Categoría', accessor: 'category_name' },
      {
        header: 'Stock',
        accessor: (item) => (
          <Button
            variant="ghost"
            className="h-auto p-0 font-normal text-left"
            onClick={() => setViewingLots(item)}
          >
            <Badge
              variant={
                item.total_stock < item.low_stock_threshold ? 'inventory-low' : 'inventory-high'
              }
            >
              {`${item.total_stock} ${item.unit_abbreviation}`}
            </Badge>
          </Button>
        ),
      },
      {
        header: 'Próx. Caducidad',
        accessor: (item) => {
          if (item.days_to_expiry === null || item.soonest_expiry_date === null) {
            return <Badge variant="secondary">N/A</Badge>;
          }
          if (item.days_to_expiry < 0) {
            return <Badge variant="destructive">Caducado</Badge>;
          }
          if (item.days_to_expiry <= 30) {
            return (
              <Badge variant="warning">
                {new Date(item.soonest_expiry_date).toLocaleDateString()}
              </Badge>
            );
          }
          return (
            <Badge variant="success">
              {new Date(item.soonest_expiry_date).toLocaleDateString()}
            </Badge>
          );
        },
      },
    ],
    []
  );

  const { orderedColumns, ...tableState } = useTableState<ProductDetail>(
    columns,
    `warehouse-detail-${warehouseId}-table`
  );

  // Funcionalidad de Ajustes
  const createAdjustmentMutation = useApiMutation<
    any,
    { lotId: number; quantityAfter: number; reason: string }
  >(
    async ({ lotId, quantityAfter, reason }, token) => {
      return await adjustmentApi.create(token, lotId, quantityAfter, reason);
    },
    {
      onSuccess: () => {
        addAlert('Ajuste de inventario creado con éxito. Pendiente de aprobación.', 'success');
        setIsAdjustmentModalOpen(false);
        setSelectedLotForAdjustment(null);
        // Recargar datos del almacén
        if (warehouseId) {
          getFullProductDetails('', warehouseId).then((prods) => {
            setProducts(prods as ProductDetail[]);
          });
        }
      },
      onError: (error) => {
        addAlert(`Error al crear ajuste: ${error.message}`, 'error');
      },
      invalidateQueries: [['adjustments'], ['products']],
    }
  );

  const handleOpenAdjustmentModal = (lot: StockLot) => {
    setSelectedLotForAdjustment(lot);
    setIsAdjustmentModalOpen(true);
  };

  const handleCloseAdjustmentModal = () => {
    setIsAdjustmentModalOpen(false);
    setSelectedLotForAdjustment(null);
  };

  const handleSaveAdjustment = async (data: { lot_id: number | null; quantity_after: number; reason: string }) => {
    if (!data.lot_id) {
      throw new Error('Se debe seleccionar un lote');
    }
    await createAdjustmentMutation.mutateAsync({
      lotId: data.lot_id,
      quantityAfter: data.quantity_after,
      reason: data.reason,
    });
  };

  // Funcionalidad de Movimientos
  const createMovementMutation = useApiMutation<
    any,
    {
      lotId: number;
      movementTypeId: number;
      quantity: number;
      notes?: string;
      requestingDepartment?: string;
      recipientOrganization?: string;
    }
  >(
    async ({ lotId, movementTypeId, quantity, notes, requestingDepartment, recipientOrganization }, token) => {
      return await stockMovementApi.create(
        token,
        lotId,
        movementTypeId,
        quantity,
        notes,
        requestingDepartment,
        recipientOrganization
      );
    },
    {
      onSuccess: () => {
        addAlert('Movimiento de salida registrado con éxito', 'success');
        setIsMovementModalOpen(false);
        setSelectedLotForMovement(null);
        setSelectedProductForMovement(null);
        // Recargar datos del almacén
        if (warehouseId) {
          getFullProductDetails('', warehouseId).then((prods) => {
            setProducts(prods as ProductDetail[]);
          });
        }
      },
      onError: (error) => {
        addAlert(`Error al registrar movimiento: ${error.message}`, 'error');
      },
      invalidateQueries: [['movements'], ['products'], ['stockMovements']],
    }
  );

  const handleOpenMovementModal = (lot: StockLot, product: ProductDetail) => {
    setSelectedLotForMovement(lot);
    setSelectedProductForMovement(product);
    setIsMovementModalOpen(true);
  };

  const handleCloseMovementModal = () => {
    setIsMovementModalOpen(false);
    setSelectedLotForMovement(null);
    setSelectedProductForMovement(null);
  };

  const handleSaveMovement = async (data: {
    lot_id: number | null;
    movement_type_id: number | null;
    quantity: number;
    notes: string;
    requesting_department: string;
    recipient_organization: string;
  }) => {
    if (!data.lot_id || !data.movement_type_id) {
      throw new Error('Se deben completar todos los campos requeridos');
    }
    await createMovementMutation.mutateAsync({
      lotId: data.lot_id,
      movementTypeId: data.movement_type_id,
      quantity: data.quantity,
      notes: data.notes || undefined,
      requestingDepartment: data.requesting_department || undefined,
      recipientOrganization: data.recipient_organization || undefined,
    });
  };

  const handleOpenHistoryModal = (lot: StockLot) => {
    setSelectedLotForHistory(lot);
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedLotForHistory(null);
  };

  // Obtener movimientos recientes del almacén
  const { data: recentMovements = [] } = useApiQuery<StockMovementWithType[]>(
    ['movements', 'warehouse', warehouseId, 'recent'],
    async (token) => {
      if (!warehouseId) return [];
      // Obtener todos los movimientos y filtrar por almacén
      const allMovements = await stockMovementApi.getAll(token, { limit: 50 });
      // Filtrar movimientos donde el lote pertenece a este almacén
      return allMovements.filter((m) => {
        const lot = m.lot as any;
        return lot && lot.warehouse_id === warehouseId;
      });
    },
    {
      enabled: !!warehouseId,
      staleTime: 30 * 1000,
    }
  );

  // Obtener traspasos pendientes relacionados con este almacén
  const { data: pendingTransfers = [] } = useApiQuery<StockTransferWithDetails[]>(
    ['transfers', 'warehouse', warehouseId, 'pending'],
    async (token) => {
      if (!warehouseId) return [];
      const allPending = await transferApi.getPending(token);
      // Filtrar traspasos donde este almacén es origen o destino
      return allPending.filter(
        (t) => t.from_warehouse_id === warehouseId || t.to_warehouse_id === warehouseId
      );
    },
    {
      enabled: !!warehouseId,
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000, // Refrescar cada minuto
    }
  );

  // Funcionalidad de Traspasos
  const createTransferMutation = useApiMutation<
    any,
    { lotId: number; toWarehouseId: number; quantity: number; notes?: string }
  >(
    async ({ lotId, toWarehouseId, quantity, notes }, token) => {
      return await transferApi.request(token, lotId, toWarehouseId, quantity, notes);
    },
    {
      onSuccess: () => {
        addAlert('Solicitud de traspaso creada con éxito. Pendiente de aprobación.', 'success');
        setIsTransferModalOpen(false);
        setSelectedLotForTransfer(null);
        // Recargar datos del almacén
        if (warehouseId) {
          getFullProductDetails('', warehouseId).then((prods) => {
            setProducts(prods as ProductDetail[]);
          });
        }
      },
      onError: (error) => {
        addAlert(`Error al solicitar traspaso: ${error.message}`, 'error');
      },
      invalidateQueries: [['transfers'], ['products']],
    }
  );

  const handleOpenTransferModal = (lot: StockLot) => {
    setSelectedLotForTransfer(lot);
    setIsTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false);
    setSelectedLotForTransfer(null);
  };

  const handleSaveTransfer = async (data: {
    lotId: number;
    toWarehouseId: number;
    quantity: number;
    notes: string;
  }) => {
    await createTransferMutation.mutateAsync({
      lotId: data.lotId,
      toWarehouseId: data.toWarehouseId,
      quantity: data.quantity,
      notes: data.notes || undefined,
    });
  };

  if (loading) return <LoadingSpinner size="lg" message="Cargando detalles del almacén..." centerScreen />;
  if (!warehouse)
    return (
      <div>
        Almacén no encontrado.{' '}
        <Link to="/warehouses" className="text-primary hover:underline">
          Volver
        </Link>
      </div>
    );

  return (
    <AnimatedWrapper>
      <div className="mb-6">
        <Button as={Link} to="/warehouses" variant="ghost" className="mb-2">
          <ChevronLeftIcon className="w-4 h-4 mr-2" />
          Volver a Almacenes
        </Button>
        <Header
          title={warehouse.warehouse_name}
          description={warehouse.location_description || 'Vista detallada del inventario.'}
        />
      </div>
      <Card>
        <CardHeader
          renderHeaderActions={() => (
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-48"
              >
                <option value="">Todas las Categorías</option>
                {availableCategories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        >
          <CardTitle>Inventario</CardTitle>
          <CardDescription>
            Mostrando {filteredProducts.length} de {products.length} productos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            columns={orderedColumns}
            data={filteredProducts}
            getKey={(p) => p.product_id}
            renderMobileCard={(product) => (
              <div className="space-y-2">
                <div className="font-semibold text-lg">{product.product_name}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>SKU: {product.sku || 'N/A'}</div>
                  <div>Categoría: {product.category_name}</div>
                  <div>
                    Stock: {product.total_stock} {product.unit_abbreviation}
                  </div>
                  {product.low_stock_threshold && (
                    <div className="text-xs">
                      Umbral: {product.low_stock_threshold} {product.unit_abbreviation}
                    </div>
                  )}
                </div>
              </div>
            )}
            {...tableState}
          />
        </CardContent>
      </Card>

      {viewingLots && (
        <StockLotsModal
          product={viewingLots}
          onClose={() => setViewingLots(null)}
          onAdjust={handleOpenAdjustmentModal}
          onMovement={(lot) => handleOpenMovementModal(lot, viewingLots)}
          onHistory={handleOpenHistoryModal}
          onTransfer={handleOpenTransferModal}
        />
      )}

      {/* Sección de Traspasos Pendientes */}
      {pendingTransfers.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Traspasos Pendientes</CardTitle>
            <CardDescription>
              Traspasos relacionados con este almacén pendientes de aprobación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingTransfers.map((transfer) => {
                const lot = transfer.lot as any;
                const isOutgoing = transfer.from_warehouse_id === warehouseId;
                return (
                  <div
                    key={transfer.transfer_id}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">
                        Lote #{transfer.lot_id} - Cantidad: {transfer.quantity}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {isOutgoing ? (
                          <>
                            <span className="font-medium">Salida:</span> {transfer.from_warehouse?.warehouse_name} →{' '}
                            {transfer.to_warehouse?.warehouse_name}
                          </>
                        ) : (
                          <>
                            <span className="font-medium">Entrada:</span> {transfer.from_warehouse?.warehouse_name} →{' '}
                            {transfer.to_warehouse?.warehouse_name}
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Solicitado por: {transfer.requested_by_user?.full_name || 'N/A'} -{' '}
                        {new Date(transfer.created_at).toLocaleString('es-MX')}
                      </div>
                      {transfer.notes && (
                        <div className="text-xs text-muted-foreground mt-1">Notas: {transfer.notes}</div>
                      )}
                    </div>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sección de Movimientos Recientes */}
      {recentMovements.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Movimientos Recientes</CardTitle>
            <CardDescription>Últimos movimientos de stock en este almacén</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentMovements.slice(0, 10).map((movement) => {
                const lot = movement.lot as any;
                const product = lot?.product;
                return (
                  <div
                    key={movement.movement_id}
                    className="p-3 border rounded-lg flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">
                        {product?.product_name || 'Producto desconocido'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {movement.movement_type?.type_name || 'N/A'} -{' '}
                        {new Date(movement.created_at).toLocaleString('es-MX')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-semibold ${
                          movement.movement_type?.category === 'ENTRADA'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {movement.movement_type?.category === 'ENTRADA' ? '+' : '-'}
                        {movement.quantity.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Stock: {movement.quantity_after.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Movimiento de Salida */}
      <Dialog isOpen={isMovementModalOpen} onClose={handleCloseMovementModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento de Salida</DialogTitle>
          </DialogHeader>
          {selectedLotForMovement && selectedProductForMovement && (
            <MovementForm
              onSave={handleSaveMovement}
              onCancel={handleCloseMovementModal}
              isSubmitting={createMovementMutation.isLoading}
              category="SALIDA"
              initialProductId={selectedProductForMovement.product_id}
              initialWarehouseId={selectedLotForMovement.warehouse_id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Historial de Movimientos */}
      {isHistoryModalOpen && selectedLotForHistory && (
        <MovementHistoryModal lot={selectedLotForHistory} onClose={handleCloseHistoryModal} />
      )}

      {/* Dialog de Solicitud de Traspaso */}
      <Dialog isOpen={isTransferModalOpen} onClose={handleCloseTransferModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solicitar Traspaso de Stock</DialogTitle>
          </DialogHeader>
          {selectedLotForTransfer && (
            <TransferRequestForm
              lot={selectedLotForTransfer}
              onSave={handleSaveTransfer}
              onCancel={handleCloseTransferModal}
              isSubmitting={createTransferMutation.isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Ajuste de Inventario */}
      <Dialog isOpen={isAdjustmentModalOpen} onClose={handleCloseAdjustmentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Ajuste de Inventario</DialogTitle>
          </DialogHeader>
          {selectedLotForAdjustment && (
            <AdjustmentForm
              onSave={handleSaveAdjustment}
              onCancel={handleCloseAdjustmentModal}
              isSubmitting={createAdjustmentMutation.isLoading}
              initialLotId={selectedLotForAdjustment.lot_id}
            />
          )}
        </DialogContent>
      </Dialog>
    </AnimatedWrapper>
  );
};

export default WarehouseDetail;
