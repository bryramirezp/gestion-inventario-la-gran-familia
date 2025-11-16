import React, { useState, useCallback, useMemo } from 'react';
import Header from '@/presentation/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Input, Select } from '@/presentation/components/forms';
import { Column } from '@/presentation/components/ui/Table';
import { ResponsiveTable } from '@/presentation/components/ui/ResponsiveTable';
import { Badge } from '@/presentation/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/Dialog';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { stockMovementApi, movementTypeApi, warehouseApi } from '@/data/api';
import { StockMovementWithType, MovementType, Warehouse } from '@/domain/types';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useApiQuery, useApiMutation } from '@/infrastructure/hooks/useApiQuery';
import useTableState from '@/infrastructure/hooks/useTableState';
import { MovementForm } from '@/presentation/features/inventory/MovementForm';
import { PlusIcon } from '@/presentation/components/icons/Icons';
import Pagination from '@/presentation/components/ui/Pagination';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';

const ITEMS_PER_PAGE = 20;

interface MovementFormData {
  lot_id: number | null;
  movement_type_id: number | null;
  quantity: number;
  notes: string;
  requesting_department: string;
  recipient_organization: string;
}

const StockMovements: React.FC = () => {
  const { addAlert } = useAlerts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');

  const { data: allMovements = [], isLoading: movementsLoading } = useApiQuery<StockMovementWithType[]>(
    ['stockMovements', selectedType],
    async (token) => {
      const filters: any = {};
      if (selectedType) {
        filters.movementTypeId = parseInt(selectedType, 10);
      }
      // Obtener todos los movimientos (sin límite) para poder filtrar en el cliente
      return stockMovementApi.getAll(token, filters);
    },
    {
      staleTime: 30 * 1000,
    }
  );

  const { data: movementTypes = [] } = useApiQuery<MovementType[]>(
    ['movementTypes'],
    (token) => movementTypeApi.getAll(token),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: warehouses = [] } = useApiQuery<Warehouse[]>(
    ['warehouses'],
    (token) => warehouseApi.getAll(token),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const createMovementMutation = useApiMutation<StockMovementWithType, MovementFormData>(
    async (data, token) => {
      if (!data.lot_id || !data.movement_type_id) {
        throw new Error('Lote y tipo de movimiento son requeridos');
      }
      return await stockMovementApi.create(
        token,
        data.lot_id,
        data.movement_type_id,
        data.quantity,
        data.notes || undefined,
        data.requesting_department || undefined,
        data.recipient_organization || undefined
      );
    },
    {
      onSuccess: () => {
        addAlert('Movimiento registrado con éxito', 'success');
        setIsFormOpen(false);
      },
      onError: (error) => {
        addAlert(`Error al registrar movimiento: ${error.message}`, 'error');
      },
      invalidateQueries: [['stockMovements']],
    }
  );

  const handleSaveMovement = async (data: MovementFormData) => {
    try {
      await createMovementMutation.mutateAsync(data);
    } catch (error) {
      throw error;
    }
  };

  const filteredMovements = useMemo(() => {
    let filtered = allMovements;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.notes?.toLowerCase().includes(searchLower) ||
          m.reference_id?.toLowerCase().includes(searchLower) ||
          m.lot?.product_id?.toString().includes(searchLower) ||
          m.movement_id.toString().includes(searchLower)
      );
    }

    if (selectedWarehouse) {
      const warehouseId = parseInt(selectedWarehouse, 10);
      filtered = filtered.filter((m) => m.lot?.warehouse_id === warehouseId);
    }

    return filtered;
  }, [allMovements, searchTerm, selectedWarehouse]);

  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredMovements.slice(start, end);
  }, [filteredMovements, currentPage]);

  const columns: Column<StockMovementWithType>[] = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'movement_id',
      },
      {
        header: 'Fecha',
        accessor: (item) => new Date(item.created_at).toLocaleString('es-MX'),
      },
      {
        header: 'Tipo',
        accessor: (item) => (
          <Badge variant={item.movement_type?.category === 'ENTRADA' ? 'success' : 'destructive'}>
            {item.movement_type?.type_name || 'N/A'}
          </Badge>
        ),
      },
      {
        header: 'Lote',
        accessor: (item) => `#${item.lot_id}`,
      },
      {
        header: 'Producto',
        accessor: (item) => item.lot?.product?.product_name || `Producto #${item.lot?.product_id || 'N/A'}`,
      },
      {
        header: 'Cantidad',
        accessor: (item) => (
          <span className={item.movement_type?.category === 'SALIDA' ? 'text-destructive' : 'text-success'}>
            {item.movement_type?.category === 'SALIDA' ? '-' : '+'}
            {item.quantity}
          </span>
        ),
      },
      {
        header: 'Notas',
        accessor: (item) => item.notes || '-',
      },
    ],
    []
  );

  const tableState = useTableState(columns);

  return (
    <AnimatedWrapper>
      <Header
        title="Movimientos de Stock"
        description="Registro y consulta de movimientos de inventario (Kardex)"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Movimientos de Stock</CardTitle>
              <CardDescription>
                Historial completo de movimientos de inventario. Total: {filteredMovements.length} movimientos
              </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Registrar Movimiento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Buscar por notas, referencia o producto..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Todos los tipos</option>
                {movementTypes.map((type) => (
                  <option key={type.type_id} value={type.type_id.toString()}>
                    {type.type_name}
                  </option>
                ))}
              </Select>
              <Select
                value={selectedWarehouse}
                onChange={(e) => {
                  setSelectedWarehouse(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Todos los almacenes</option>
                {warehouses
                  .filter((w) => w.is_active)
                  .map((w) => (
                    <option key={w.warehouse_id} value={w.warehouse_id.toString()}>
                      {w.warehouse_name}
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          {movementsLoading ? (
            <LoadingSpinner size="lg" message="Cargando movimientos..." />
          ) : (
            <>
              <ResponsiveTable
                columns={columns}
                data={paginatedMovements}
                getKey={(m) => m.movement_id.toString()}
                {...tableState}
              />
              {filteredMovements.length > ITEMS_PER_PAGE && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredMovements.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
        <DialogContent maxWidth="2xl">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Movimiento</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 max-h-[calc(90vh-180px)]">
            <MovementForm
              onSave={handleSaveMovement}
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={createMovementMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </AnimatedWrapper>
  );
};

export default StockMovements;

