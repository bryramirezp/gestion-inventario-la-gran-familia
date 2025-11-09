import React, { useState, useCallback } from 'react';
import { NewDonation, Donor, Product, Warehouse } from '@/domain/types';
import {
  Label,
  Input,
  FormError,
  FormContainer,
  FormField,
  FormFieldGroup,
} from '@/presentation/components/forms';
import { Button } from '@/presentation/components/ui/Button';
import { DialogFooter } from '@/presentation/components/ui/Dialog';
import { Combobox } from '@/presentation/features/shared/Combobox';
import CreatableCombobox from '@/presentation/features/shared/CreatableCombobox';
import { DatePicker } from '@/presentation/features/shared/DatePicker';
import { TrashIcon } from '@/presentation/components/icons/Icons';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';

export interface DonationItemForm {
  product_id: number | null;
  quantity: number;
  expiry_date: string | null;
  market_unit_price: number;
  actual_unit_price: number;
}

interface DonationFormProps {
  donors: Donor[];
  products: Product[];
  warehouses: Warehouse[];
  onSave: (donation: NewDonation) => Promise<void>;
  onCancel: () => void;
  onCreateDonor?: (name: string) => void;
  isLoading?: boolean;
}

const DonationForm: React.FC<DonationFormProps> = ({
  donors,
  products,
  warehouses,
  onSave,
  onCancel,
  onCreateDonor,
  isLoading = false,
}) => {
  const [selectedDonor, setSelectedDonor] = useState<number | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [items, setItems] = useState<DonationItemForm[]>([]);
  const [formErrors, setFormErrors] = useState<{
    general?: string;
    items?: Record<number, string>;
  }>({});

  const activeWarehouses = warehouses.filter((w) => w.is_active);

  const donorOptions = donors.map((d) => ({ value: d.donor_id, label: d.donor_name }));
  const warehouseOptions = activeWarehouses.map((w) => ({
    value: w.warehouse_id,
    label: w.warehouse_name,
  }));
  const productOptions = products.map((p) => ({ value: p.product_id, label: p.product_name }));

  const handleAddItem = useCallback(() => {
    setItems((prevItems) => [
      ...prevItems,
      { product_id: null, quantity: 1, expiry_date: null, market_unit_price: 0, actual_unit_price: 0 },
    ]);
  }, []);

  const handleItemChange = useCallback(
    (index: number, field: keyof DonationItemForm, value: string | number | null) => {
      setItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[index] = { ...newItems[index], [field]: value };
        return newItems;
      });
    },
    []
  );

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index));
  }, []);

  const resetForm = useCallback(() => {
    setSelectedDonor(null);
    setSelectedWarehouse(null);
    setItems([]);
    setFormErrors({});
  }, []);

  const validateForm = useCallback(() => {
    const errors: { general?: string; items?: Record<number, string> } = { items: {} };
    let isValid = true;

    if (!selectedDonor) {
      errors.general = 'Se debe seleccionar un donante.';
      isValid = false;
    }
    if (!selectedWarehouse) {
      errors.general = (errors.general || '') + ' Se debe seleccionar un almacén.';
      isValid = false;
    }
    if (items.length === 0) {
      errors.general = (errors.general || '') + ' Se debe agregar al menos un artículo.';
      isValid = false;
    }

    items.forEach((item, index) => {
      if (
        !item.product_id ||
        !item.quantity ||
        item.quantity <= 0 ||
        !item.market_unit_price ||
        !item.actual_unit_price
      ) {
        errors.items![index] =
          'Se requiere un producto, cantidad válida (>0), precio de mercado y precio real para cada artículo.';
        isValid = false;
      }
    });

    setFormErrors(errors);
    return isValid;
  }, [selectedDonor, selectedWarehouse, items]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) {
        return;
      }

      try {
        await onSave({
          donor_id: selectedDonor!,
          warehouse_id: selectedWarehouse!,
          items: items,
        });
        resetForm();
      } catch (error) {
        // Error manejado por el componente padre
      }
    },
    [validateForm, selectedDonor, selectedWarehouse, items, onSave, resetForm]
  );

  const handleCreateDonor = useCallback(
    (name: string) => {
      if (onCreateDonor) {
        onCreateDonor(name);
      }
    },
    [onCreateDonor]
  );

  const totalValue = items.reduce((acc, item) => {
    return acc + (item.actual_unit_price || 0) * (item.quantity || 0);
  }, 0);

  return (
    <>
      <FormContainer id="donation-form" onSubmit={handleSubmit}>
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-3 px-0">
            <CardTitle className="text-base">1. Detalles de la Donación</CardTitle>
            <CardDescription className="text-xs">
              Selecciona el donante y el almacén de destino.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 px-0">
            <FormFieldGroup columns={2}>
              <FormField error={formErrors.general && !selectedDonor ? formErrors.general : undefined}>
                <Label htmlFor="donor">Donante *</Label>
                <CreatableCombobox
                  options={donorOptions}
                  value={selectedDonor}
                  onChange={(val) => setSelectedDonor(val as number)}
                  onCreate={handleCreateDonor}
                  placeholder="Selecciona o crea un donante..."
                />
              </FormField>
              <FormField error={formErrors.general && !selectedWarehouse ? formErrors.general : undefined}>
                <Label htmlFor="warehouse">Almacén de Destino *</Label>
                <Combobox
                  options={warehouseOptions}
                  value={selectedWarehouse}
                  onChange={(val) => setSelectedWarehouse(val as number)}
                  placeholder="Selecciona un almacén..."
                />
              </FormField>
            </FormFieldGroup>
            {formErrors.general && (
              <FormField>
                <FormError message={formErrors.general} />
              </FormField>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-3 px-0">
            <CardTitle className="text-base">2. Artículos Donados</CardTitle>
            <CardDescription className="text-xs">
              Agrega cada producto incluido en la donación.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {items.map((item, index) => (
                <AnimatedWrapper
                  key={index}
                  delay={index * 0.05}
                  className="rounded-lg border p-4 relative group hover:border-primary/50 transition-all duration-300 bg-muted/30 hover:bg-muted/50"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 z-10 h-6 w-6"
                  >
                    <TrashIcon className="h-3 w-3 text-destructive" />
                  </Button>
                  <div className="space-y-3 pr-8">
                    <FormField error={formErrors.items?.[index]}>
                      <Label className="text-sm">Producto *</Label>
                      <Combobox
                        options={productOptions}
                        value={item.product_id || null}
                        onChange={(val) => handleItemChange(index, 'product_id', val)}
                        placeholder="Selecciona un producto..."
                      />
                    </FormField>
                    <FormFieldGroup columns={2}>
                      <FormField>
                        <Label className="text-sm">Cantidad *</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)
                          }
                          min="1"
                          placeholder="10"
                          className="h-9"
                        />
                      </FormField>
                    </FormFieldGroup>
                    <FormFieldGroup columns={2}>
                      <FormField>
                        <Label className="text-sm">Precio de Mercado *</Label>
                        <Input
                          type="number"
                          value={item.market_unit_price}
                          onChange={(e) =>
                            handleItemChange(index, 'market_unit_price', parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          step="0.01"
                          placeholder="15.50"
                          className="h-9"
                          required
                        />
                      </FormField>
                      <FormField>
                        <Label className="text-sm">Precio Real *</Label>
                        <Input
                          type="number"
                          value={item.actual_unit_price}
                          onChange={(e) =>
                            handleItemChange(index, 'actual_unit_price', parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          step="0.01"
                          placeholder="12.00"
                          className="h-9"
                          required
                        />
                      </FormField>
                    </FormFieldGroup>
                    <FormField>
                      <Label className="text-sm">Fecha de Caducidad</Label>
                      <DatePicker
                        selectedDate={item.expiry_date || null}
                        onSelectDate={(date) => handleItemChange(index, 'expiry_date', date)}
                      />
                    </FormField>
                    {formErrors.items?.[index] && (
                      <FormError message={formErrors.items[index]} className="text-xs" />
                    )}
                  </div>
                </AnimatedWrapper>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddItem}
              className="w-full mt-4"
              disabled={isLoading}
            >
              Agregar Otro Artículo
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-3 px-0">
            <CardTitle className="text-base">3. Resumen</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <div className="p-4 border rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground mb-1">Valor Total (Precio Real)</p>
              <p className="text-2xl font-bold text-foreground">${totalValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </FormContainer>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" form="donation-form" disabled={isLoading}>
          Registrar Donación
        </Button>
      </DialogFooter>
    </>
  );
};

export default DonationForm;

