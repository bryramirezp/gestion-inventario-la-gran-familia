import React, { useState, useCallback, useMemo } from 'react';
import Header from '@/presentation/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Input, Select, Textarea, Label, FormError, FormContainer, FormField } from '@/presentation/components/forms';
import { Column } from '@/presentation/components/ui/Table';
import { ResponsiveTable } from '@/presentation/components/ui/ResponsiveTable';
import { Badge } from '@/presentation/components/ui/Badge';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { transferApi, warehouseApi, productApi, getLotsForConsumption } from '@/data/api';
import { StockTransfer, Warehouse, Product, StockLot } from '@/domain/types';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useApiQuery, useApiMutation } from '@/infrastructure/hooks/useApiQuery';
import useTableState from '@/infrastructure/hooks/useTableState';
import { PlusIcon } from '@/presentation/components/icons/Icons';
import { useForm } from '@/infrastructure/hooks/useForm';
import { validateNumericInput } from '@/infrastructure/utils/validation.util';
import { LotSelector } from '@/presentation/features/inventory/LotSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/presentation/components/ui/Dialog';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';

const RequestTransferForm: React.FC<{
  onSave: (data: { lotId: number; toWarehouseId: number; quantity: number; notes?: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}> = ({ onSave, onCancel, isSubmitting = false }) => {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [selectedLot, setSelectedLot] = useState<StockLot | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: products = [] } = useApiQuery<Product[]>(
    ['products'],
    (token) => productApi.getAll(token),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: warehouses = [] } = useApiQuery<Warehouse[]>(
    ['warehouses'],
    (token) => warehouseApi.getAll(token),
    { staleTime: 5 * 60 * 1000 }
  );

  const { values, errors, handleChange, handleSubmit, setErrors, setValues } = useForm<{
    toWarehouseId: number | null;
    quantity: number;
    notes: string;
  }>(
    {
      toWarehouseId: null,
      quantity: 1,
      notes: '',
    },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!selectedLot) {
        tempErrors.lot_id = 'Se debe seleccionar un lote.';
      }
      if (!formData.toWarehouseId) {
        tempErrors.toWarehouseId = 'Se debe seleccionar un almacén destino.';
      }
      if (selectedWarehouseId && formData.toWarehouseId === selectedWarehouseId) {
        tempErrors.toWarehouseId = 'El almacén destino debe ser diferente al almacén origen.';
      }

      const quantityValidation = validateNumericInput(formData.quantity, {
        min: 0.01,
        max: 1000000,
        allowZero: false,
        allowNegative: false,
        defaultValue: 1,
      });
      if (!quantityValidation.isValid) {
        tempErrors.quantity = quantityValidation.error || 'La cantidad debe ser mayor a 0.';
      }

      if (selectedLot && formData.quantity > selectedLot.current_quantity) {
        tempErrors.quantity = `La cantidad no puede ser mayor al stock disponible (${selectedLot.current_quantity}).`;
      }

      return tempErrors;
    }
  );

  const handleFormSubmit = async () => {
    if (!selectedLot) {
      setErrors({ lot_id: 'Se debe seleccionar un lote.' });
      return;
    }
    try {
      await onSave({
        lotId: selectedLot.lot_id,
        toWarehouseId: values.toWarehouseId!,
        quantity: values.quantity,
        notes: values.notes || undefined,
      });
    } catch (error: unknown) {
      setErrors({ form: error instanceof Error ? error.message : 'Error inesperado' });
    }
  };

  const handleLotChange = (lotId: number | null, lot: StockLot | null) => {
    setSelectedLot(lot);
    if (errors.lot_id) {
      setErrors({ ...errors, lot_id: undefined });
    }
  };

  return (
    <FormContainer id="transfer-form" onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
      <div className="space-y-4">
          <FormField error={errors.product_id} errorId="product_id-error">
            <Label htmlFor="product_id">Producto</Label>
            <Select
              id="product_id"
              name="product_id"
              value={selectedProductId || ''}
              onChange={(e) => {
                const productId = e.target.value ? parseInt(e.target.value, 10) : null;
                setSelectedProductId(productId);
                setSelectedWarehouseId(null);
                setSelectedLot(null);
                setValues((prev) => ({ ...prev, toWarehouseId: null }));
              }}
              required
              error={!!errors.product_id}
            >
              <option value="">Selecciona un producto</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} ({p.sku || 'Sin SKU'})
                </option>
              ))}
            </Select>
            <FormError message={errors.product_id} />
          </FormField>

          {selectedProductId && (
            <FormField error={errors.warehouse_id} errorId="warehouse_id-error">
              <Label htmlFor="warehouse_id">Almacén Origen</Label>
              <Select
                id="warehouse_id"
                name="warehouse_id"
                value={selectedWarehouseId || ''}
                onChange={(e) => {
                  const warehouseId = e.target.value ? parseInt(e.target.value, 10) : null;
                  setSelectedWarehouseId(warehouseId);
                  setSelectedLot(null);
                  setValues((prev) => ({ ...prev, toWarehouseId: null }));
                }}
                required
                error={!!errors.warehouse_id}
              >
                <option value="">Selecciona un almacén origen</option>
                {warehouses
                  .filter((w) => w.is_active)
                  .map((w) => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>
                      {w.warehouse_name}
                    </option>
                  ))}
              </Select>
              <FormError message={errors.warehouse_id} />
            </FormField>
          )}

          {selectedProductId && selectedWarehouseId && (
            <FormField error={errors.lot_id} errorId="lot_id-error">
              <LotSelector
                productId={selectedProductId}
                warehouseId={selectedWarehouseId}
                selectedLotId={selectedLot?.lot_id || null}
                onLotChange={handleLotChange}
                required
                error={errors.lot_id}
                quantity={values.quantity}
              />
              <FormError message={errors.lot_id} />
            </FormField>
          )}

          {selectedWarehouseId && (
            <FormField error={errors.toWarehouseId} errorId="toWarehouseId-error">
              <Label htmlFor="toWarehouseId">Almacén Destino</Label>
              <Select
                id="toWarehouseId"
                name="toWarehouseId"
                value={values.toWarehouseId || ''}
                onChange={handleChange}
                required
                error={!!errors.toWarehouseId}
              >
                <option value="">Selecciona un almacén destino</option>
                {warehouses
                  .filter((w) => w.is_active && w.warehouse_id !== selectedWarehouseId)
                  .map((w) => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>
                      {w.warehouse_name}
                    </option>
                  ))}
              </Select>
              <FormError message={errors.toWarehouseId} />
            </FormField>
          )}

          <FormField error={errors.quantity} errorId="quantity-error">
            <Label htmlFor="quantity">Cantidad a Traspasar</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              min="0.01"
              value={values.quantity}
              onChange={handleChange}
              onBlur={(e) => {
                const validation = validateNumericInput(e.target.value, {
                  min: 0.01,
                  max: 1000000,
                  allowZero: false,
                  allowNegative: false,
                  defaultValue: 1,
                });
                if (!validation.isValid) {
                  setErrors({ ...errors, quantity: validation.error });
                } else if (selectedLot && validation.value > selectedLot.current_quantity) {
                  setErrors({
                    ...errors,
                    quantity: `La cantidad no puede ser mayor al stock disponible (${selectedLot.current_quantity}).`,
                  });
                } else if (errors.quantity) {
                  setErrors({ ...errors, quantity: undefined });
                }
              }}
              required
              error={!!errors.quantity}
            />
            <FormError message={errors.quantity} />
            {selectedLot && (
              <div className="text-xs text-muted-foreground mt-1">
                Stock disponible: {selectedLot.current_quantity}
              </div>
            )}
          </FormField>

          <FormField>
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={values.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Notas adicionales sobre el traspaso"
            />
          </FormField>

          {errors.form && <FormError message={errors.form} />}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedProductId || !selectedWarehouseId || !values.toWarehouseId || !selectedLot}
          >
            {isSubmitting ? 'Solicitando...' : 'Solicitar Traspaso'}
          </Button>
        </DialogFooter>
      </FormContainer>
  );
};

const RequestTransfer: React.FC = () => {
  const { addAlert } = useAlerts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  const { data: transfers = [], isLoading: transfersLoading } = useApiQuery<StockTransfer[]>(
    ['transfers', 'requested', currentPage, statusFilter],
    async (token) => {
      const filters: any = {
        status: statusFilter as any,
      };
      return transferApi.getHistory(token, filters);
    },
    {
      staleTime: 30 * 1000,
    }
  );

  const requestTransferMutation = useApiMutation<StockTransfer, { lotId: number; toWarehouseId: number; quantity: number; notes?: string }>(
    async (data, token) => {
      return await transferApi.request(token, data.lotId, data.toWarehouseId, data.quantity, data.notes);
    },
    {
      onSuccess: () => {
        addAlert('Solicitud de traspaso creada con éxito. Esperando aprobación de administrador.', 'success');
        setIsFormOpen(false);
      },
      onError: (error) => {
        addAlert(`Error al solicitar traspaso: ${error.message}`, 'error');
      },
      invalidateQueries: [['transfers']],
    }
  );

  const handleSaveTransfer = async (data: { lotId: number; toWarehouseId: number; quantity: number; notes?: string }) => {
    try {
      await requestTransferMutation.mutateAsync(data);
    } catch (error) {
      throw error;
    }
  };

  const filteredTransfers = useMemo(() => {
    let filtered = transfers;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.notes?.toLowerCase().includes(searchLower) ||
          t.transfer_id.toString().includes(searchLower) ||
          t.lot_id.toString().includes(searchLower)
      );
    }

    return filtered;
  }, [transfers, searchTerm]);

  const columns: Column<StockTransfer>[] = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'transfer_id',
      },
      {
        header: 'Fecha',
        accessor: (item) => new Date(item.created_at).toLocaleString('es-MX'),
      },
      {
        header: 'Lote',
        accessor: (item) => `#${item.lot_id}`,
      },
      {
        header: 'Almacén Origen',
        accessor: (item) => `#${item.from_warehouse_id}`,
      },
      {
        header: 'Almacén Destino',
        accessor: (item) => `#${item.to_warehouse_id}`,
      },
      {
        header: 'Cantidad',
        accessor: 'quantity',
      },
      {
        header: 'Estado',
        accessor: (item) => (
          <Badge
            variant={
              item.status === 'COMPLETED'
                ? 'default'
                : item.status === 'APPROVED'
                ? 'default'
                : item.status === 'REJECTED'
                ? 'destructive'
                : 'warning'
            }
          >
            {item.status}
          </Badge>
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
        title="Solicitar Traspaso"
        description="Solicitar traspaso de productos entre almacenes (requiere aprobación de administrador)"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Solicitudes de Traspaso</CardTitle>
              <CardDescription>
                Historial de traspasos solicitados. Total: {filteredTransfers.length} solicitudes
              </CardDescription>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Solicitar Traspaso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Buscar por ID, lote o notas..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="PENDING">Pendientes</option>
                <option value="APPROVED">Aprobados</option>
                <option value="REJECTED">Rechazados</option>
                <option value="COMPLETED">Completados</option>
                <option value="">Todos</option>
              </Select>
            </div>
          </div>

          {transfersLoading ? (
            <LoadingSpinner size="lg" message="Cargando traspasos..." />
          ) : (
            <ResponsiveTable
              columns={columns}
              data={filteredTransfers}
              getKey={(t) => t.transfer_id.toString()}
              {...tableState}
            />
          )}
        </CardContent>
      </Card>

      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
        <DialogContent maxWidth="2xl">
          <DialogHeader>
            <DialogTitle>Solicitar Traspaso entre Almacenes</DialogTitle>
          </DialogHeader>
          <RequestTransferForm
            onSave={handleSaveTransfer}
            onCancel={() => setIsFormOpen(false)}
            isSubmitting={requestTransferMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </AnimatedWrapper>
  );
};

export default RequestTransfer;

