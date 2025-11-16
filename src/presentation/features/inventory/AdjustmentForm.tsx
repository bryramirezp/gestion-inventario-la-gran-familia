import React, { useState, useEffect } from 'react';
import { StockLot, Product, Warehouse } from '@/domain/types';
import { productApi, warehouseApi, stockLotApi } from '@/data/api';
import { Label, Input, Textarea, Select, FormError, FormContainer, FormField } from '@/presentation/components/forms';
import { Button } from '@/presentation/components/ui/Button';
import { DialogFooter } from '@/presentation/components/ui/Dialog';
import { useAuth } from '@/app/providers/AuthProvider';
import { useForm } from '@/infrastructure/hooks/useForm';
import { validateNumericInput } from '@/infrastructure/utils/validation.util';
import { useApiQuery } from '@/infrastructure/hooks/useApiQuery';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import { Badge } from '@/presentation/components/ui/Badge';

interface AdjustmentFormData {
  lot_id: number | null;
  quantity_after: number;
  reason: string;
}

interface AdjustmentFormProps {
  onSave: (data: AdjustmentFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialLotId?: number;
}

export const AdjustmentForm: React.FC<AdjustmentFormProps> = ({
  onSave,
  onCancel,
  isSubmitting = false,
  initialLotId,
}) => {
  const { getToken } = useAuth();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [selectedLot, setSelectedLot] = useState<StockLot | null>(null);
  const [availableLots, setAvailableLots] = useState<StockLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLots, setLoadingLots] = useState(false);

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

  useEffect(() => {
    const loadInitialLot = async () => {
      if (initialLotId) {
        try {
          setLoading(true);
          const token = await getToken();
          const lot = await stockLotApi.getById(token, initialLotId);
          if (lot) {
            setSelectedLot(lot);
            setSelectedProductId(lot.product_id);
            setSelectedWarehouseId(lot.warehouse_id);
            setValues((prev) => ({
              ...prev,
              lot_id: lot.lot_id,
              quantity_after: lot.current_quantity,
            }));
          }
        } catch (err) {
          console.error('Error loading lot:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadInitialLot();
  }, [initialLotId, getToken]);

  useEffect(() => {
    const loadLots = async () => {
      if (selectedProductId && selectedWarehouseId && !initialLotId) {
        try {
          setLoadingLots(true);
          const token = await getToken();
          const lots = await stockLotApi.getByProductAndWarehouse(
            token,
            selectedProductId,
            selectedWarehouseId
          );
          setAvailableLots(lots);
          if (lots.length === 0) {
            setErrors({ lot_id: 'No hay lotes disponibles para este producto en este almacén' });
          }
        } catch (err) {
          setErrors({ lot_id: 'Error al cargar los lotes' });
          setAvailableLots([]);
        } finally {
          setLoadingLots(false);
        }
      } else {
        setAvailableLots([]);
      }
    };

    loadLots();
  }, [selectedProductId, selectedWarehouseId, initialLotId, getToken]);

  const { values, errors, handleChange, handleSubmit, setErrors, setValues } = useForm<AdjustmentFormData>(
    {
      lot_id: initialLotId || null,
      quantity_after: 0,
      reason: '',
    },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.lot_id) {
        tempErrors.lot_id = 'Se debe seleccionar un lote.';
      }

      const quantityValidation = validateNumericInput(formData.quantity_after, {
        min: 0,
        max: 1000000,
        allowZero: true,
        allowNegative: false,
        defaultValue: 0,
      });
      if (!quantityValidation.isValid) {
        tempErrors.quantity_after = quantityValidation.error || 'La cantidad debe ser 0 o mayor.';
      }

      if (selectedLot && formData.quantity_after === selectedLot.current_quantity) {
        tempErrors.quantity_after = 'La cantidad después del ajuste debe ser diferente a la cantidad actual.';
      }

      if (!formData.reason || formData.reason.trim().length <= 10) {
        tempErrors.reason = 'El motivo del ajuste debe tener al menos 10 caracteres.';
      }

      return tempErrors;
    }
  );

  useEffect(() => {
    if (selectedLot) {
      setValues((prev) => ({ ...prev, lot_id: selectedLot.lot_id }));
    }
  }, [selectedLot, setValues]);

  const handleFormSubmit = async () => {
    try {
      await onSave(values);
    } catch (error: unknown) {
      setErrors({ form: error instanceof Error ? error.message : 'Error inesperado' });
    }
  };

  const handleLotSelect = async (lotId: number) => {
    try {
      setLoading(true);
      const token = await getToken();
      const lot = await stockLotApi.getById(token, lotId);
      if (lot) {
        setSelectedLot(lot);
        setSelectedProductId(lot.product_id);
        setSelectedWarehouseId(lot.warehouse_id);
        setValues((prev) => ({
          ...prev,
          lot_id: lot.lot_id,
          quantity_after: lot.current_quantity,
        }));
      }
    } catch (err) {
      setErrors({ lot_id: 'Error al cargar el lote seleccionado' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && initialLotId) {
    return (
      <div className="p-6">
        <LoadingSpinner size="sm" message="Cargando lote..." />
      </div>
    );
  }

  return (
    <FormContainer id="adjustment-form" onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
      <div className="space-y-4">
          {!initialLotId && (
            <>
              <FormField error={undefined} errorId="product_id-error">
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
                    setValues((prev) => ({ ...prev, lot_id: null, quantity_after: 0 }));
                  }}
                  required
                  error={false}
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} ({p.sku || 'Sin SKU'})
                    </option>
                  ))}
                </Select>
              </FormField>

              {selectedProductId && (
                <FormField error={undefined} errorId="warehouse_id-error">
                  <Label htmlFor="warehouse_id">Almacén</Label>
                  <Select
                    id="warehouse_id"
                    name="warehouse_id"
                    value={selectedWarehouseId || ''}
                    onChange={(e) => {
                      const warehouseId = e.target.value ? parseInt(e.target.value, 10) : null;
                      setSelectedWarehouseId(warehouseId);
                      setSelectedLot(null);
                      setValues((prev) => ({ ...prev, lot_id: null, quantity_after: 0 }));
                    }}
                    required
                    error={false}
                  >
                    <option value="">Selecciona un almacén</option>
                    {warehouses
                      .filter((w) => w.is_active)
                      .map((w) => (
                        <option key={w.warehouse_id} value={w.warehouse_id}>
                          {w.warehouse_name}
                        </option>
                      ))}
                  </Select>
                </FormField>
              )}

              {selectedProductId && selectedWarehouseId && (
                <FormField error={errors.lot_id} errorId="lot_id-error">
                  <Label htmlFor="lot_id">Lote</Label>
                  {loadingLots ? (
                    <LoadingSpinner size="sm" message="Cargando lotes..." />
                  ) : (
                    <>
                      <Select
                        id="lot_id"
                        name="lot_id"
                        value={values.lot_id || ''}
                        onChange={async (e) => {
                          const lotId = e.target.value ? parseInt(e.target.value, 10) : null;
                          if (lotId) {
                            await handleLotSelect(lotId);
                          } else {
                            setSelectedLot(null);
                            setValues((prev) => ({ ...prev, lot_id: null, quantity_after: 0 }));
                          }
                        }}
                        required
                        error={!!errors.lot_id}
                        disabled={availableLots.length === 0}
                      >
                        <option value="">Selecciona un lote</option>
                        {availableLots.map((lot) => (
                          <option key={lot.lot_id} value={lot.lot_id}>
                            Lote #{lot.lot_id} - Cantidad: {lot.current_quantity}
                            {lot.expiry_date
                              ? ` - Vence: ${new Date(lot.expiry_date).toLocaleDateString()}`
                              : ' - Sin fecha de caducidad'}
                            {lot.is_expired && ' (VENCIDO)'}
                          </option>
                        ))}
                      </Select>
                      <FormError message={errors.lot_id} />
                      {values.lot_id && availableLots.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {(() => {
                            const selected = availableLots.find((l) => l.lot_id === values.lot_id);
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
                    </>
                  )}
                </FormField>
              )}
            </>
          )}

          {selectedLot && (
            <>
              <div className="p-4 bg-muted dark:bg-dark-muted rounded-lg">
                <p className="text-sm font-semibold mb-2">Información del Lote:</p>
                <ul className="text-sm space-y-1">
                  <li>Lote ID: #{selectedLot.lot_id}</li>
                  <li>Producto ID: {selectedLot.product_id}</li>
                  <li>Almacén ID: {selectedLot.warehouse_id}</li>
                  <li>
                    <strong>Cantidad Actual: {selectedLot.current_quantity}</strong>
                  </li>
                  {selectedLot.expiry_date && (
                    <li>Fecha de Caducidad: {new Date(selectedLot.expiry_date).toLocaleDateString()}</li>
                  )}
                </ul>
              </div>

              <FormField error={errors.quantity_after} errorId="quantity_after-error">
                <Label htmlFor="quantity_after">Cantidad Después del Ajuste</Label>
                <Input
                  id="quantity_after"
                  name="quantity_after"
                  type="number"
                  step="1"
                  min="0"
                  value={values.quantity_after}
                  onChange={handleChange}
                  onBlur={(e) => {
                    const validation = validateNumericInput(e.target.value, {
                      min: 0,
                      max: 1000000,
                      allowZero: true,
                      allowNegative: false,
                      defaultValue: 0,
                    });
                    if (!validation.isValid) {
                      setErrors({ ...errors, quantity_after: validation.error });
                    } else if (selectedLot && validation.value === selectedLot.current_quantity) {
                      setErrors({
                        ...errors,
                        quantity_after: 'La cantidad después del ajuste debe ser diferente a la cantidad actual.',
                      });
                    } else if (errors.quantity_after) {
                      setErrors({ ...errors, quantity_after: undefined });
                    }
                  }}
                  required
                  error={!!errors.quantity_after}
                />
                <FormError message={errors.quantity_after} />
                <div className="text-xs text-muted-foreground mt-1">
                  Diferencia: {selectedLot ? (values.quantity_after - selectedLot.current_quantity).toFixed(2) : '0.00'}
                </div>
              </FormField>

              <FormField error={errors.reason} errorId="reason-error">
                <Label htmlFor="reason">
                  Motivo del Ajuste <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  name="reason"
                  value={values.reason}
                  onChange={handleChange}
                  rows={4}
                  required
                  error={!!errors.reason}
                  placeholder="Explica el motivo del ajuste (mínimo 10 caracteres)..."
                />
                <FormError message={errors.reason} />
                <div className="text-xs text-muted-foreground mt-1">
                  {values.reason.length}/10 caracteres mínimos
                </div>
              </FormField>
            </>
          )}

          {errors.form && <FormError message={errors.form} />}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !selectedLot || !values.reason || values.reason.trim().length <= 10}
          >
            {isSubmitting ? 'Creando...' : 'Crear Ajuste'}
          </Button>
        </DialogFooter>
      </FormContainer>
  );
};

