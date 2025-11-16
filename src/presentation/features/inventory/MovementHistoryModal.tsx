import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/presentation/components/ui/Dialog';
import { StockMovementWithType, StockLot } from '@/domain/types';
import { Column } from '@/presentation/components/ui/Table';
import { ResponsiveTable } from '@/presentation/components/ui/ResponsiveTable';
import { Badge } from '@/presentation/components/ui/Badge';
import { useApiQuery } from '@/infrastructure/hooks/useApiQuery';
import { stockMovementApi } from '@/data/api';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import useTableState from '@/infrastructure/hooks/useTableState';

interface MovementHistoryModalProps {
  lot: StockLot;
  onClose: () => void;
}

const MovementHistoryModal: React.FC<MovementHistoryModalProps> = ({ lot, onClose }) => {
  const { data: movements = [], isLoading } = useApiQuery<StockMovementWithType[]>(
    ['movements', 'lot', lot.lot_id],
    (token) => stockMovementApi.getByLot(token, lot.lot_id),
    {
      staleTime: 30 * 1000,
    }
  );

  const columns: Column<StockMovementWithType>[] = React.useMemo(
    () => [
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
        header: 'Cantidad',
        accessor: (item) => (
          <span className={item.movement_type?.category === 'ENTRADA' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {item.movement_type?.category === 'ENTRADA' ? '+' : '-'}
            {item.quantity.toFixed(2)}
          </span>
        ),
      },
      {
        header: 'Stock Actual',
        accessor: (item) => {
          // quantity_after no está disponible en stock_movements
          // Mostramos el stock actual del lote como referencia
          return lot?.current_quantity?.toFixed(2) || 'N/A';
        },
      },
      {
        header: 'Notas',
        accessor: (item) => (
          <div className="max-w-xs truncate" title={item.notes || ''}>
            {item.notes || '-'}
          </div>
        ),
      },
      {
        header: 'Departamento',
        accessor: (item) => item.requesting_department || '-',
      },
      {
        header: 'Organización',
        accessor: (item) => item.recipient_organization || '-',
      },
    ],
    []
  );

  const tableState = useTableState(columns);

  return (
    <Dialog isOpen={true} onClose={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Historial de Movimientos - Lote #{lot.lot_id}</DialogTitle>
          <DialogDescription>
            Kardex completo del lote. Stock actual: {lot.current_quantity}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <LoadingSpinner size="sm" message="Cargando historial..." />
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay movimientos registrados para este lote.
            </div>
          ) : (
            <ResponsiveTable
              columns={columns}
              data={movements}
              getKey={(m) => m.movement_id.toString()}
              {...tableState}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MovementHistoryModal;

