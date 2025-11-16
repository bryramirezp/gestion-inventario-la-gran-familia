import React, { useState, useCallback, useMemo } from 'react';
import Header from '@/presentation/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Input, Textarea, Label, FormError } from '@/presentation/components/forms';
import { Column } from '@/presentation/components/ui/Table';
import { ResponsiveTable } from '@/presentation/components/ui/ResponsiveTable';
import { Badge } from '@/presentation/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/presentation/components/ui/Dialog';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { transferApi, warehouseApi } from '@/data/api';
import { StockTransferWithDetails } from '@/domain/types';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useApiQuery, useApiMutation } from '@/infrastructure/hooks/useApiQuery';
import useTableState from '@/infrastructure/hooks/useTableState';
import { CheckIcon, XMarkIcon } from '@/presentation/components/icons/Icons';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import { useForm } from '@/infrastructure/hooks/useForm';

const ApproveTransfers: React.FC = () => {
  const { addAlert } = useAlerts();
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransferWithDetails | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: pendingTransfers = [], isLoading: transfersLoading } = useApiQuery<StockTransferWithDetails[]>(
    ['transfers', 'pending'],
    (token) => transferApi.getPending(token),
    {
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000, // Refrescar cada minuto
    }
  );

  const approveMutation = useApiMutation<StockTransfer, { transferId: number; notes?: string }>(
    async ({ transferId, notes }, token) => {
      return await transferApi.approve(token, transferId, notes);
    },
    {
      onSuccess: () => {
        addAlert('Traspaso aprobado y ejecutado con éxito', 'success');
        setSelectedTransfer(null);
        setActionType(null);
      },
      onError: (error) => {
        addAlert(`Error al aprobar traspaso: ${error.message}`, 'error');
      },
      invalidateQueries: [['transfers'], ['stockMovements'], ['products']],
    }
  );

  const rejectMutation = useApiMutation<StockTransfer, { transferId: number; rejectionReason: string }>(
    async ({ transferId, rejectionReason }, token) => {
      return await transferApi.reject(token, transferId, rejectionReason);
    },
    {
      onSuccess: () => {
        addAlert('Traspaso rechazado', 'success');
        setSelectedTransfer(null);
        setActionType(null);
      },
      onError: (error) => {
        addAlert(`Error al rechazar traspaso: ${error.message}`, 'error');
      },
      invalidateQueries: [['transfers']],
    }
  );

  const handleApprove = (transfer: StockTransferWithDetails) => {
    setSelectedTransfer(transfer);
    setActionType('approve');
  };

  const handleReject = (transfer: StockTransferWithDetails) => {
    setSelectedTransfer(transfer);
    setActionType('reject');
  };

  const handleConfirmApprove = async (notes?: string) => {
    if (!selectedTransfer) return;
    try {
      await approveMutation.mutateAsync({ transferId: selectedTransfer.transfer_id, notes });
    } catch (error) {
      throw error;
    }
  };

  const handleConfirmReject = async (rejectionReason: string) => {
    if (!selectedTransfer) return;
    try {
      await rejectMutation.mutateAsync({ transferId: selectedTransfer.transfer_id, rejectionReason });
    } catch (error) {
      throw error;
    }
  };

  const filteredTransfers = useMemo(() => {
    if (!searchTerm) return pendingTransfers;
    const searchLower = searchTerm.toLowerCase();
    return pendingTransfers.filter(
      (t) =>
        t.transfer_id.toString().includes(searchLower) ||
        t.lot_id.toString().includes(searchLower) ||
        t.notes?.toLowerCase().includes(searchLower) ||
        t.from_warehouse?.warehouse_name.toLowerCase().includes(searchLower) ||
        t.to_warehouse?.warehouse_name.toLowerCase().includes(searchLower)
    );
  }, [pendingTransfers, searchTerm]);

  const columns: Column<StockTransferWithDetails>[] = useMemo(
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
        header: 'Origen',
        accessor: (item) => item.from_warehouse?.warehouse_name || `#${item.from_warehouse_id}`,
      },
      {
        header: 'Destino',
        accessor: (item) => item.to_warehouse?.warehouse_name || `#${item.to_warehouse_id}`,
      },
      {
        header: 'Cantidad',
        accessor: 'quantity',
      },
      {
        header: 'Solicitado por',
        accessor: (item) => item.requested_by_user?.full_name || 'N/A',
      },
      {
        header: 'Notas',
        accessor: (item) => item.notes || '-',
      },
      {
        header: 'Acciones',
        accessor: (item) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleApprove(item)}
              title="Aprobar"
            >
              <CheckIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(item)}
              title="Rechazar"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const tableState = useTableState(columns);

  return (
    <AnimatedWrapper>
      <Header
        title="Aprobar Traspasos"
        description="Revisar y aprobar/rechazar solicitudes de traspaso entre almacenes"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Traspasos Pendientes de Aprobación</CardTitle>
              <CardDescription>
                {filteredTransfers.length} traspaso(s) pendiente(s) de aprobación
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <Input
              placeholder="Buscar por ID, lote, almacén o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {transfersLoading ? (
            <LoadingSpinner size="lg" message="Cargando traspasos pendientes..." />
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay traspasos pendientes de aprobación
            </div>
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

      {/* Dialog de Aprobación */}
      <Dialog isOpen={actionType === 'approve' && !!selectedTransfer} onClose={() => {
        setSelectedTransfer(null);
        setActionType(null);
      }}>
        <ApproveDialog
          transfer={selectedTransfer}
          onApprove={handleConfirmApprove}
          onCancel={() => {
            setSelectedTransfer(null);
            setActionType(null);
          }}
          isSubmitting={approveMutation.isPending}
        />
      </Dialog>

      {/* Dialog de Rechazo */}
      <Dialog isOpen={actionType === 'reject' && !!selectedTransfer} onClose={() => {
        setSelectedTransfer(null);
        setActionType(null);
      }}>
        <RejectDialog
          transfer={selectedTransfer}
          onReject={handleConfirmReject}
          onCancel={() => {
            setSelectedTransfer(null);
            setActionType(null);
          }}
          isSubmitting={rejectMutation.isPending}
        />
      </Dialog>
    </AnimatedWrapper>
  );
};

const ApproveDialog: React.FC<{
  transfer: StockTransferWithDetails | null;
  onApprove: (notes?: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({ transfer, onApprove, onCancel, isSubmitting }) => {
  const { values, handleChange, handleSubmit, setErrors } = useForm<{ notes: string }>(
    { notes: '' },
    () => ({})
  );

  const handleFormSubmit = async () => {
    try {
      await onApprove(values.notes || undefined);
    } catch (error: unknown) {
      setErrors({ form: error instanceof Error ? error.message : 'Error inesperado' });
    }
  };

  if (!transfer) return null;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Aprobar Traspaso #{transfer.transfer_id}</DialogTitle>
      </DialogHeader>
      <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Detalles del traspaso:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Lote: #{transfer.lot_id}</li>
              <li>Origen: {transfer.from_warehouse?.warehouse_name || `#${transfer.from_warehouse_id}`}</li>
              <li>Destino: {transfer.to_warehouse?.warehouse_name || `#${transfer.to_warehouse_id}`}</li>
              <li>Cantidad: {transfer.quantity}</li>
              <li>Solicitado por: {transfer.requested_by_user?.full_name || 'N/A'}</li>
              {transfer.notes && <li>Notas: {transfer.notes}</li>}
            </ul>
          </div>
          <div>
            <Label htmlFor="notes">Notas adicionales (Opcional)</Label>
            <textarea
              id="notes"
              name="notes"
              value={values.notes}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border rounded"
              placeholder="Notas sobre la aprobación"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Aprobando...' : 'Aprobar Traspaso'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const RejectDialog: React.FC<{
  transfer: StockTransferWithDetails | null;
  onReject: (rejectionReason: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({ transfer, onReject, onCancel, isSubmitting }) => {
  const { values, errors, handleChange, handleSubmit, setErrors } = useForm<{ rejectionReason: string }>(
    { rejectionReason: '' },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.rejectionReason.trim()) {
        tempErrors.rejectionReason = 'El motivo de rechazo es requerido.';
      }
      return tempErrors;
    }
  );

  const handleFormSubmit = async () => {
    try {
      await onReject(values.rejectionReason);
    } catch (error: unknown) {
      setErrors({ form: error instanceof Error ? error.message : 'Error inesperado' });
    }
  };

  if (!transfer) return null;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Rechazar Traspaso #{transfer.transfer_id}</DialogTitle>
      </DialogHeader>
      <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Detalles del traspaso:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Lote: #{transfer.lot_id}</li>
              <li>Origen: {transfer.from_warehouse?.warehouse_name || `#${transfer.from_warehouse_id}`}</li>
              <li>Destino: {transfer.to_warehouse?.warehouse_name || `#${transfer.to_warehouse_id}`}</li>
              <li>Cantidad: {transfer.quantity}</li>
              <li>Solicitado por: {transfer.requested_by_user?.full_name || 'N/A'}</li>
            </ul>
          </div>
          <div>
            <Label htmlFor="rejectionReason">Motivo de Rechazo *</Label>
            <Textarea
              id="rejectionReason"
              name="rejectionReason"
              value={values.rejectionReason}
              onChange={handleChange}
              rows={4}
              required
              error={!!errors.rejectionReason}
              placeholder="Explica el motivo del rechazo..."
            />
            <FormError message={errors.rejectionReason} />
          </div>
          {errors.form && <FormError message={errors.form} />}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="destructive" disabled={isSubmitting || !values.rejectionReason.trim()}>
            {isSubmitting ? 'Rechazando...' : 'Rechazar Traspaso'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default ApproveTransfers;

