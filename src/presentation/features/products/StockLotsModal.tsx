import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/presentation/components/ui/Dialog';
import Table, { Column } from '@/presentation/components/ui/Table';
import { getFullProductDetails } from '@/data/api';
import { StockLot } from '@/domain/types';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';

type ProductDetail = Awaited<ReturnType<typeof getFullProductDetails>>[0];

interface StockLotsModalProps {
  product: ProductDetail;
  onClose: () => void;
  onAdjust?: (lot: StockLot) => void;
  onMovement?: (lot: StockLot) => void;
  onHistory?: (lot: StockLot) => void;
  onTransfer?: (lot: StockLot) => void;
}

const StockLotsModal: React.FC<StockLotsModalProps> = ({ product, onClose, onAdjust, onMovement, onHistory, onTransfer }) => {
  const columns: Column<StockLot>[] = [
    { header: 'ID de Lote', accessor: 'lot_id' },
    { header: 'Cantidad', accessor: 'current_quantity' },
    {
      header: 'Fecha de Recepción',
      accessor: (item) => new Date(item.received_date).toLocaleDateString(),
    },
    {
      header: 'Fecha de Caducidad',
      accessor: (item) =>
        item.expiry_date ? (
          <span
            className={
              new Date(item.expiry_date) < new Date() ? 'text-destructive font-semibold' : ''
            }
          >
            {new Date(item.expiry_date).toLocaleDateString()}
          </span>
        ) : (
          <Badge variant="secondary">N/A</Badge>
        ),
    },
    ...(onAdjust || onMovement || onHistory || onTransfer
      ? [
          {
            header: 'Acciones',
            accessor: (item: StockLot) => (
              <div className="flex gap-1 flex-wrap">
                {onMovement && (
                  <Button size="sm" variant="default" onClick={() => onMovement(item)} className="text-xs">
                    Registrar Salida
                  </Button>
                )}
                {onTransfer && (
                  <Button size="sm" variant="default" onClick={() => onTransfer(item)} className="text-xs">
                    Solicitar Traspaso
                  </Button>
                )}
                {onHistory && (
                  <Button size="sm" variant="outline" onClick={() => onHistory(item)} className="text-xs">
                    Historial
                  </Button>
                )}
                {onAdjust && (
                  <Button size="sm" variant="outline" onClick={() => onAdjust(item)} className="text-xs">
                    Ajustar
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  // This modal table doesn't need persistence or complex state.
  const staticTableState = {
    columnOrder: columns.map((c) => c.header),
    setColumnOrder: () => {},
    columnWidths: {},
    handleResize: () => {},
  };

  return (
    <Dialog isOpen={true} onClose={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lotes de Stock para: {product.product_name}</DialogTitle>
          <DialogDescription>
            Desglose detallado de los lotes de stock individuales para este producto en esta
            ubicación.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0">
          <Table
            columns={columns}
            data={product.lots}
            getKey={(lot) => lot.lot_id}
            {...staticTableState}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockLotsModal;
