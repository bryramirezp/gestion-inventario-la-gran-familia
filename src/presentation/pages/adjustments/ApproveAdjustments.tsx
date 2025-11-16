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
import { adjustmentApi } from '@/data/api';
import { InventoryAdjustmentWithDetails } from '@/domain/types';
import { useAlerts } from '@/app/providers/AlertProvider';
import { useApiQuery, useApiMutation } from '@/infrastructure/hooks/useApiQuery';
import useTableState from '@/infrastructure/hooks/useTableState';
import { CheckIcon, XMarkIcon } from '@/presentation/components/icons/Icons';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import { useForm } from '@/infrastructure/hooks/useForm';

const ApproveAdjustments: React.FC = () => {
  const { addAlert } = useAlerts();
  const [selectedAdjustment, setSelectedAdjustment] = useState<InventoryAdjustmentWithDetails | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: pendingAdjustments = [], isLoading: adjustmentsLoading } = useApiQuery<
    InventoryAdjustmentWithDetails[]
  >(
    ['adjustments', 'pending'],
    (token) => adjustmentApi.getPending(token),
    {
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000, // Refrescar cada minuto
    }
  );

  const approveMutation = useApiMutation<InventoryAdjustment, { adjustmentId: number; notes?: string }>(
    async ({ adjustmentId, notes }, token) => {
      return await adjustmentApi.approve(token, adjustmentId, notes);
    },
    {
      onSuccess: () => {
        addAlert('Ajuste aprobado y ejecutado con éxito', 'success');
        setSelectedAdjustment(null);
        setActionType(null);
      },
      onError: (error) => {
        addAlert(`Error al aprobar ajuste: ${error.message}`, 'error');
      },
      invalidateQueries: [['adjustments'], ['stockMovements'], ['products'], ['stockLots']],
    }
  );

  const rejectMutation = useApiMutation<
    InventoryAdjustment,
    { adjustmentId: number; rejectionReason: string }
  >(
    async ({ adjustmentId, rejectionReason }, token) => {
      return await adjustmentApi.reject(token, adjustmentId, rejectionReason);
    },
    {
      onSuccess: () => {
        addAlert('Ajuste rechazado', 'success');
        setSelectedAdjustment(null);
        setActionType(null);
      },
      onError: (error) => {
        addAlert(`Error al rechazar ajuste: ${error.message}`, 'error');
      },
      invalidateQueries: [['adjustments']],
    }
  );

  const handleApprove = (adjustment: InventoryAdjustmentWithDetails) => {
    setSelectedAdjustment(adjustment);
    setActionType('approve');
  };

  const handleReject = (adjustment: InventoryAdjustmentWithDetails) => {
    setSelectedAdjustment(adjustment);
    setActionType('reject');
  };

  const handleConfirmApprove = async (notes?: string) => {
    if (!selectedAdjustment) return;
    try {
      await approveMutation.mutateAsync({ adjustmentId: selectedAdjustment.adjustment_id, notes });
    } catch (error) {
      throw error;
    }
  };

  const handleConfirmReject = async (rejectionReason: string) => {
    if (!selectedAdjustment) return;
    try {
      await rejectMutation.mutateAsync({
        adjustmentId: selectedAdjustment.adjustment_id,
        rejectionReason,
      });
    } catch (error) {
      throw error;
    }
  };

  const filteredAdjustments = useMemo(() => {
    if (!searchTerm) return pendingAdjustments;
    const searchLower = searchTerm.toLowerCase();
    return pendingAdjustments.filter(
      (a) =>
        a.adjustment_id.toString().includes(searchLower) ||
        a.lot_id.toString().includes(searchLower) ||
        a.reason?.toLowerCase().includes(searchLower) ||
        a.created_by_user?.full_name?.toLowerCase().includes(searchLower)
    );
  }, [pendingAdjustments, searchTerm]);

  const columns: Column<InventoryAdjustmentWithDetails>[] = useMemo(
    () => [
      {
        header: 'ID',
        accessor: 'adjustment_id',
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
        header: 'Cantidad Actual',
        accessor: (item) => item.quantity_before?.toFixed(2) || 'N/A',
      },
      {
        header: 'Cantidad Después',
        accessor: (item) => item.quantity_after.toFixed(2),
      },
      {
        header: 'Diferencia',
        accessor: (item) => {
          const diff = item.quantity_after - (item.quantity_before || 0);
          return (
            <span className={diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {diff >= 0 ? '+' : ''}
              {diff.toFixed(2)}
            </span>
          );
        },
      },
      {
        header: 'Motivo',
        accessor: (item) => (
          <div className="max-w-xs truncate" title={item.reason}>
            {item.reason}
          </div>
        ),
      },
      {
        header: 'Solicitado por',
        accessor: (item) => item.created_by_user?.full_name || 'N/A',
      },
      {
        header: 'Acciones',
        accessor: (item) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleApprove(item)}
              className="flex items-center gap-1"
            >
              <CheckIcon className="h-4 w-4" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(item)}
              className="flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              Rechazar
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const tableState = useTableState(columns);

  const {
    values: approveValues,
    errors: approveErrors,
    handleChange: handleApproveChange,
    handleSubmit: handleApproveSubmit,
    reset: resetApproveForm,
  } = useForm<{ notes?: string }>(
    { notes: '' },
    () => {
      return {};
    }
  );

  const {
    values: rejectValues,
    errors: rejectErrors,
    handleChange: handleRejectChange,
    handleSubmit: handleRejectSubmit,
    reset: resetRejectForm,
  } = useForm<{ rejectionReason: string }>(
    { rejectionReason: '' },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.rejectionReason || formData.rejectionReason.trim().length < 10) {
        tempErrors.rejectionReason = 'El motivo del rechazo debe tener al menos 10 caracteres.';
      }
      return tempErrors;
    }
  );

  const handleCloseDialog = () => {
    setSelectedAdjustment(null);
    setActionType(null);
    resetApproveForm();
    resetRejectForm();
  };

  return (
    <AnimatedWrapper>
      <Header
        title="Aprobar Ajustes de Inventario"
        description="Revisa y aprueba o rechaza los ajustes de inventario pendientes"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Ajustes Pendientes</CardTitle>
              <CardDescription>
                {filteredAdjustments.length} ajuste(s) pendiente(s) de aprobación
              </CardDescription>
            </div>
            <Input
              placeholder="Buscar por ID, lote, motivo o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {adjustmentsLoading ? (
            <LoadingSpinner size="lg" message="Cargando ajustes pendientes..." />
          ) : filteredAdjustments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay ajustes pendientes de aprobación
            </div>
          ) : (
            <ResponsiveTable
              columns={columns}
              data={filteredAdjustments}
              getKey={(a) => a.adjustment_id.toString()}
              {...tableState}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog de Aprobación */}
      <Dialog isOpen={actionType === 'approve' && selectedAdjustment !== null} onClose={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aprobar Ajuste de Inventario</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 max-h-[calc(90vh-180px)] px-6">
            {selectedAdjustment && (
              <div className="space-y-4">
              <div className="p-4 bg-muted dark:bg-dark-muted rounded-lg space-y-2">
                <div>
                  <strong>ID de Ajuste:</strong> #{selectedAdjustment.adjustment_id}
                </div>
                <div>
                  <strong>Lote:</strong> #{selectedAdjustment.lot_id}
                </div>
                <div>
                  <strong>Cantidad Actual:</strong> {selectedAdjustment.quantity_before?.toFixed(2) || 'N/A'}
                </div>
                <div>
                  <strong>Cantidad Después:</strong> {selectedAdjustment.quantity_after.toFixed(2)}
                </div>
                <div>
                  <strong>Diferencia:</strong>{' '}
                  <span
                    className={
                      (selectedAdjustment.quantity_after - (selectedAdjustment.quantity_before || 0)) >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {(selectedAdjustment.quantity_after - (selectedAdjustment.quantity_before || 0)) >= 0 ? '+' : ''}
                    {(selectedAdjustment.quantity_after - (selectedAdjustment.quantity_before || 0)).toFixed(2)}
                  </span>
                </div>
                <div>
                  <strong>Motivo:</strong> {selectedAdjustment.reason}
                </div>
                <div>
                  <strong>Solicitado por:</strong> {selectedAdjustment.created_by_user?.full_name || 'N/A'}
                </div>
              </div>
              <div>
                <Label htmlFor="approve_notes">Notas (opcional)</Label>
                <Textarea
                  id="approve_notes"
                  name="notes"
                  value={approveValues.notes || ''}
                  onChange={handleApproveChange}
                  rows={3}
                  placeholder="Agrega notas adicionales sobre la aprobación..."
                />
                <FormError message={approveErrors.notes} />
              </div>
            </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={(e) =>
                handleApproveSubmit(e, async () => {
                  await handleConfirmApprove(approveValues.notes);
                })
              }
              disabled={approveMutation.isLoading}
            >
              {approveMutation.isLoading ? 'Aprobando...' : 'Aprobar Ajuste'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rechazo */}
      <Dialog isOpen={actionType === 'reject' && selectedAdjustment !== null} onClose={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rechazar Ajuste de Inventario</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 max-h-[calc(90vh-180px)] px-6">
            {selectedAdjustment && (
              <div className="space-y-4">
              <div className="p-4 bg-muted dark:bg-dark-muted rounded-lg space-y-2">
                <div>
                  <strong>ID de Ajuste:</strong> #{selectedAdjustment.adjustment_id}
                </div>
                <div>
                  <strong>Lote:</strong> #{selectedAdjustment.lot_id}
                </div>
                <div>
                  <strong>Motivo del Ajuste:</strong> {selectedAdjustment.reason}
                </div>
                <div>
                  <strong>Solicitado por:</strong> {selectedAdjustment.created_by_user?.full_name || 'N/A'}
                </div>
              </div>
              <div>
                <Label htmlFor="rejection_reason">
                  Motivo del Rechazo <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejection_reason"
                  name="rejectionReason"
                  value={rejectValues.rejectionReason}
                  onChange={handleRejectChange}
                  rows={4}
                  required
                  error={!!rejectErrors.rejectionReason}
                  placeholder="Explica el motivo del rechazo (mínimo 10 caracteres)..."
                />
                <FormError message={rejectErrors.rejectionReason} />
                <div className="text-xs text-muted-foreground mt-1">
                  {rejectValues.rejectionReason.length}/10 caracteres mínimos
                </div>
              </div>
            </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={(e) =>
                handleRejectSubmit(e, async () => {
                  await handleConfirmReject(rejectValues.rejectionReason);
                })
              }
              disabled={rejectMutation.isLoading || !rejectValues.rejectionReason || rejectValues.rejectionReason.trim().length < 10}
            >
              {rejectMutation.isLoading ? 'Rechazando...' : 'Rechazar Ajuste'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedWrapper>
  );
};

export default ApproveAdjustments;

