import React, { useState, useEffect } from 'react';
import { StockLot, Product, Warehouse } from '@/domain/types';
import { getLotsForConsumption, warehouseApi } from '@/data/api';
import { Label, Select, FormError } from '@/presentation/components/forms';
import { Badge } from '@/presentation/components/ui/Badge';
import { useAuth } from '@/app/providers/AuthProvider';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';

interface LotSelectorProps {
  productId: number;
  warehouseId: number;
  selectedLotId: number | null;
  onLotChange: (lotId: number | null, lot: StockLot | null) => void;
  required?: boolean;
  error?: string;
  quantity?: number;
}

export const LotSelector: React.FC<LotSelectorProps> = ({
  productId,
  warehouseId,
  selectedLotId,
  onLotChange,
  required = false,
  error,
  quantity,
}) => {
  const { getToken } = useAuth();
  const [lots, setLots] = useState<StockLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    const fetchLots = async () => {
      if (!productId || !warehouseId) {
        setLots([]);
        return;
      }

      try {
        setLoading(true);
        setErrorState(null);
        const token = await getToken();
        const availableLots = await getLotsForConsumption(token, productId, warehouseId, quantity || undefined);
        setLots(availableLots);
        
        if (availableLots.length === 0) {
          setErrorState('No hay lotes disponibles para este producto en este almacén');
        }
      } catch (err) {
        setErrorState(err instanceof Error ? err.message : 'Error al cargar lotes');
        setLots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLots();
  }, [productId, warehouseId, quantity, getToken]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lotId = e.target.value ? parseInt(e.target.value, 10) : null;
    const selectedLot = lotId ? lots.find((l) => l.lot_id === lotId) || null : null;
    onLotChange(lotId, selectedLot);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Lote (ordenado por FEFO/FIFO)</Label>
        <LoadingSpinner size="sm" message="Cargando lotes..." />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="lot_id">
        Lote (ordenado por FEFO/FIFO)
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select
        id="lot_id"
        name="lot_id"
        value={selectedLotId || ''}
        onChange={handleChange}
        required={required}
        error={!!error || !!errorState}
        disabled={lots.length === 0}
      >
        <option value="">Selecciona un lote</option>
        {lots.map((lot) => (
          <option key={lot.lot_id} value={lot.lot_id}>
            Lote #{lot.lot_id} - Cantidad: {lot.current_quantity}
            {lot.expiry_date
              ? ` - Vence: ${new Date(lot.expiry_date).toLocaleDateString()}`
              : ' - Sin fecha de caducidad'}
            {lot.is_expired && ' (VENCIDO)'}
          </option>
        ))}
      </Select>
      {errorState && <FormError message={errorState} />}
      {error && <FormError message={error} />}
      {selectedLotId && lots.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          {(() => {
            const selected = lots.find((l) => l.lot_id === selectedLotId);
            if (!selected) return null;
            return (
              <div className="space-y-1">
                <div>
                  <strong>Stock disponible:</strong> {selected.current_quantity}
                </div>
                {selected.expiry_date && (
                  <div>
                    <strong>Fecha de caducidad:</strong>{' '}
                    {new Date(selected.expiry_date).toLocaleDateString()}
                    {selected.is_expired && (
                      <Badge variant="destructive" className="ml-2">
                        Vencido
                      </Badge>
                    )}
                  </div>
                )}
                <div>
                  <strong>Fecha de recepción:</strong>{' '}
                  {new Date(selected.received_date).toLocaleDateString()}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

