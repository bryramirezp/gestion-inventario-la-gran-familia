import React, { useState } from 'react';
import { StockLot, Warehouse } from '@/domain/types';
import { warehouseApi } from '@/data/api';
import { Label, Input, Textarea, Select, FormError, FormContainer, FormField } from '@/presentation/components/forms';
import { Button } from '@/presentation/components/ui/Button';
import { DialogFooter } from '@/presentation/components/ui/Dialog';
import { useForm } from '@/infrastructure/hooks/useForm';
import { validateNumericInput } from '@/infrastructure/utils/validation.util';
import { useApiQuery } from '@/infrastructure/hooks/useApiQuery';

interface TransferRequestFormData {
  toWarehouseId: number | null;
  quantity: number;
  notes: string;
}

interface TransferRequestFormProps {
  lot: StockLot;
  onSave: (data: TransferRequestFormData & { lotId: number }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const TransferRequestForm: React.FC<TransferRequestFormProps> = ({
  lot,
  onSave,
  onCancel,
  isSubmitting = false,
}) => {
  const { data: warehouses = [] } = useApiQuery<Warehouse[]>(
    ['warehouses'],
    (token) => warehouseApi.getAll(token),
    { staleTime: 5 * 60 * 1000 }
  );

  const { values, errors, handleChange, handleSubmit, setErrors } = useForm<TransferRequestFormData>(
    {
      toWarehouseId: null,
      quantity: 1,
      notes: '',
    },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.toWarehouseId) {
        tempErrors.toWarehouseId = 'Se debe seleccionar un almacén destino.';
      }
      if (formData.toWarehouseId === lot.warehouse_id) {
        tempErrors.toWarehouseId = 'El almacén destino debe ser diferente al almacén origen.';
      }

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

      if (formData.quantity > lot.current_quantity) {
        tempErrors.quantity = `La cantidad no puede ser mayor al stock disponible (${lot.current_quantity}).`;
      }

      return tempErrors;
    }
  );

  const handleFormSubmit = async () => {
    try {
      await onSave({
        lotId: lot.lot_id,
        toWarehouseId: values.toWarehouseId!,
        quantity: values.quantity,
        notes: values.notes,
      });
    } catch (error: unknown) {
      setErrors({ form: error instanceof Error ? error.message : 'Error inesperado' });
    }
  };

  const availableWarehouses = warehouses.filter((w) => w.is_active && w.warehouse_id !== lot.warehouse_id);

  return (
    <form onSubmit={(e) => handleSubmit(e, handleFormSubmit)} className="p-6">
      <FormContainer id="transfer-request-form">
        <div className="space-y-4">
          <div className="p-4 bg-muted dark:bg-dark-muted rounded-lg">
            <p className="text-sm font-semibold mb-2">Información del Lote:</p>
            <ul className="text-sm space-y-1">
              <li>Lote ID: #{lot.lot_id}</li>
              <li>Producto ID: {lot.product_id}</li>
              <li>Almacén Origen ID: {lot.warehouse_id}</li>
              <li>
                <strong>Stock Disponible: {lot.current_quantity}</strong>
              </li>
            </ul>
          </div>

          <FormField error={errors.toWarehouseId} errorId="toWarehouseId-error">
            <Label htmlFor="toWarehouseId">
              Almacén Destino <span className="text-destructive">*</span>
            </Label>
            <Select
              id="toWarehouseId"
              name="toWarehouseId"
              value={values.toWarehouseId || ''}
              onChange={handleChange}
              required
              error={!!errors.toWarehouseId}
            >
              <option value="">Selecciona un almacén destino</option>
              {availableWarehouses.map((w) => (
                <option key={w.warehouse_id} value={w.warehouse_id}>
                  {w.warehouse_name}
                </option>
              ))}
            </Select>
            <FormError message={errors.toWarehouseId} />
          </FormField>

          <FormField error={errors.quantity} errorId="quantity-error">
            <Label htmlFor="quantity">
              Cantidad a Traspasar <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              step="1"
              min="1"
              max={lot.current_quantity}
              value={values.quantity}
              onChange={handleChange}
              required
              error={!!errors.quantity}
            />
            <FormError message={errors.quantity} />
            <div className="text-xs text-muted-foreground mt-1">
              Stock disponible: {lot.current_quantity}
            </div>
          </FormField>

          <FormField error={errors.notes} errorId="notes-error">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={values.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Agrega notas sobre el traspaso..."
            />
            <FormError message={errors.notes} />
          </FormField>

          {errors.form && <FormError message={errors.form} />}
        </div>
      </FormContainer>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !values.toWarehouseId || !values.quantity || values.quantity <= 0}
        >
          {isSubmitting ? 'Solicitando...' : 'Solicitar Traspaso'}
        </Button>
      </DialogFooter>
    </form>
  );
};

