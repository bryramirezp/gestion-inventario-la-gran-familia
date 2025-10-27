import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './Dialog';
import Table, { Column } from './Table';
import { getFullProductDetails } from '../services/api';
import { StockLot } from '../types';
import { Badge } from './Badge';

type ProductDetail = Awaited<ReturnType<typeof getFullProductDetails>>[0];

interface StockLotsModalProps {
  product: ProductDetail;
  onClose: () => void;
}

const StockLotsModal: React.FC<StockLotsModalProps> = ({ product, onClose }) => {
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
