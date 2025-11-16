import React, { useState, useEffect } from 'react';
import { MovementType, MovementCategory, StockLot, Product, Warehouse } from '@/domain/types';
import { movementTypeApi, stockMovementApi, productApi, warehouseApi } from '@/data/api';
import { Label, Input, Textarea, Select, FormError, FormContainer, FormField } from '@/presentation/components/forms';
import { Button } from '@/presentation/components/ui/Button';
import { DialogFooter } from '@/presentation/components/ui/Dialog';
import { LotSelector } from './LotSelector';
import { useAuth } from '@/app/providers/AuthProvider';
import { useForm } from '@/infrastructure/hooks/useForm';
import { validateNumericInput } from '@/infrastructure/utils/validation.util';

interface MovementFormData {
  lot_id: number | null;
  movement_type_id: number | null;
  quantity: number;
  notes: string;
  requesting_department: string;
  recipient_organization: string;
}

interface MovementFormProps {
  onSave: (data: MovementFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  category?: MovementCategory;
  initialProductId?: number;
  initialWarehouseId?: number;
}

export const MovementForm: React.FC<MovementFormProps> = ({
  onSave,
  onCancel,
  isSubmitting = false,
  category,
  initialProductId,
  initialWarehouseId,
}) => {
  const { getToken } = useAuth();
  const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(initialProductId || null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(initialWarehouseId || null);
  const [selectedLot, setSelectedLot] = useState<StockLot | null>(null);
  const [loading, setLoading] = useState(false);

  const { values, errors, handleChange, handleSubmit, setErrors, setValues } = useForm<MovementFormData>(
    {
      lot_id: null,
      movement_type_id: null,
      quantity: 1,
      notes: '',
      requesting_department: '',
      recipient_organization: '',
    },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.lot_id) tempErrors.lot_id = 'Se debe seleccionar un lote.';
      if (!formData.movement_type_id) tempErrors.movement_type_id = 'Se debe seleccionar un tipo de movimiento.';
      
      const quantityValidation = validateNumericInput(formData.quantity, {
        min: 1,
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const [types, prods, whs] = await Promise.all([
          movementTypeApi.getAll(token),
          productApi.getAll(token),
          warehouseApi.getAll(token),
        ]);

        let filteredTypes = types;
        if (category) {
          filteredTypes = types.filter((t) => t.category === category && t.is_active);
        } else {
          filteredTypes = types.filter((t) => t.is_active);
        }

        setMovementTypes(filteredTypes);
        setProducts(prods);
        setWarehouses(whs.filter((w) => w.is_active));
      } catch (err) {
        setErrors({ form: err instanceof Error ? err.message : 'Error al cargar datos' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [category, getToken, setErrors]);

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

  const handleLotChange = (lotId: number | null, lot: StockLot | null) => {
    setSelectedLot(lot);
    setValues((prev) => ({ ...prev, lot_id: lotId }));
    if (errors.lot_id) {
      setErrors({ ...errors, lot_id: undefined });
    }
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
      <FormContainer id="movement-form">
        <div className="space-y-4">
          {!initialProductId && (
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
                  setValues((prev) => ({ ...prev, lot_id: null }));
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
          )}

          {!initialWarehouseId && (
            <FormField error={errors.warehouse_id} errorId="warehouse_id-error">
              <Label htmlFor="warehouse_id">Almacén</Label>
              <Select
                id="warehouse_id"
                name="warehouse_id"
                value={selectedWarehouseId || ''}
                onChange={(e) => {
                  const warehouseId = e.target.value ? parseInt(e.target.value, 10) : null;
                  setSelectedWarehouseId(warehouseId);
                  setSelectedLot(null);
                  setValues((prev) => ({ ...prev, lot_id: null }));
                }}
                required
                error={!!errors.warehouse_id}
                disabled={!selectedProductId}
              >
                <option value="">Selecciona un almacén</option>
                {warehouses.map((w) => (
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
                selectedLotId={values.lot_id}
                onLotChange={handleLotChange}
                required
                error={errors.lot_id}
                quantity={values.quantity}
              />
              <FormError message={errors.lot_id} />
            </FormField>
          )}

          <FormField error={errors.movement_type_id} errorId="movement_type_id-error">
            <Label htmlFor="movement_type_id">Tipo de Movimiento</Label>
            <Select
              id="movement_type_id"
              name="movement_type_id"
              value={values.movement_type_id || ''}
              onChange={handleChange}
              required
              error={!!errors.movement_type_id}
            >
              <option value="">Selecciona un tipo</option>
              {movementTypes.map((type) => (
                <option key={type.type_id} value={type.type_id}>
                  {type.type_name} ({type.category})
                </option>
              ))}
            </Select>
            <FormError message={errors.movement_type_id} />
          </FormField>

          <FormField error={errors.quantity} errorId="quantity-error">
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="1"
              min="1"
              value={values.quantity}
              onChange={handleChange}
              onBlur={(e) => {
                const validation = validateNumericInput(e.target.value, {
                  min: 1,
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
              placeholder="Notas adicionales sobre el movimiento"
            />
          </FormField>

          <FormField>
            <Label htmlFor="requesting_department">Departamento Solicitante (Opcional)</Label>
            <Input
              id="requesting_department"
              name="requesting_department"
              value={values.requesting_department}
              onChange={handleChange}
              placeholder="Ej: Cocina, Distribución, etc."
            />
          </FormField>

          <FormField>
            <Label htmlFor="recipient_organization">Organización Receptora (Opcional)</Label>
            <Input
              id="recipient_organization"
              name="recipient_organization"
              value={values.recipient_organization}
              onChange={handleChange}
              placeholder="Ej: ONG beneficiaria, etc."
            />
          </FormField>

          {errors.form && <FormError message={errors.form} />}
        </div>
      </FormContainer>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !selectedProductId || !selectedWarehouseId || !values.lot_id}>
          {isSubmitting ? 'Registrando...' : 'Registrar Movimiento'}
        </Button>
      </DialogFooter>
    </form>
  );
};

