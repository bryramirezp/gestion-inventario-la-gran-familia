import React from 'react';
import { NewDonor, DonorType } from '@/domain/types';
import { useForm } from '@/infrastructure/hooks/useForm';
import {
  Label,
  Input,
  Select,
  FormError,
  FormContainer,
  FormField,
  FormFieldGroup,
} from '@/presentation/components/forms';
import { Button } from '@/presentation/components/ui/Button';
import { DialogFooter } from '@/presentation/components/ui/Dialog';

interface DonorFormProps {
  donor: Partial<NewDonor> | null;
  onSave: (donor: NewDonor) => Promise<void>;
  onCancel: () => void;
  donorTypes: DonorType[];
}

const DonorForm: React.FC<DonorFormProps> = ({ donor, onSave, onCancel, donorTypes }) => {
  const { values, errors, handleChange, handleSubmit, setErrors } = useForm<NewDonor>(
    {
      donor_name: '',
      donor_type_id: 0,
      email: '',
      phone: '',
      address: '',
      contact_person: '',
      ...donor,
    },
    (formData) => {
      const tempErrors: Record<string, string> = {};
      if (!formData.donor_name) tempErrors.donor_name = 'El nombre del donante es requerido.';
      if (!formData.donor_type_id) tempErrors.donor_type_id = 'El tipo de donante es requerido.';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        tempErrors.email = 'Por favor, ingresa un correo electrónico válido.';
      }
      return tempErrors;
    }
  );

  const handleFormSubmit = async () => {
    try {
      await onSave(values);
    } catch (error: any) {
      setErrors({ form: error.message || 'An unexpected error occurred.' });
    }
  };

  return (
    <>
      <FormContainer id="donor-form" onSubmit={(e) => handleSubmit(e, handleFormSubmit)}>
        <FormFieldGroup columns={2}>
          <FormField error={errors.donor_name} errorId="donor_name-error">
            <Label htmlFor="donor_name">Nombre del Donante *</Label>
            <Input
              id="donor_name"
              name="donor_name"
              value={values.donor_name || ''}
              onChange={handleChange}
              required
              error={!!errors.donor_name}
              aria-describedby={errors.donor_name ? 'donor_name-error' : undefined}
              placeholder="Nombre completo del donante"
            />
          </FormField>
          <FormField error={errors.donor_type_id} errorId="donor_type_id-error">
            <Label htmlFor="donor_type_id">Tipo de Donante *</Label>
            <Select
              id="donor_type_id"
              name="donor_type_id"
              value={values.donor_type_id || ''}
              onChange={handleChange}
              required
              error={!!errors.donor_type_id}
              aria-describedby={errors.donor_type_id ? 'donor_type_id-error' : undefined}
            >
              <option value="">Selecciona Tipo de Donante</option>
              {donorTypes.map((dt) => (
                <option key={dt.donor_type_id} value={dt.donor_type_id}>
                  {dt.type_name}
                </option>
              ))}
            </Select>
          </FormField>
        </FormFieldGroup>
        <FormField>
          <Label htmlFor="contact_person">Persona de Contacto</Label>
          <Input
            id="contact_person"
            name="contact_person"
            value={values.contact_person || ''}
            onChange={handleChange}
            placeholder="Nombre de la persona de contacto"
          />
        </FormField>
        <FormFieldGroup columns={2}>
          <FormField>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={values.phone || ''}
              onChange={handleChange}
              placeholder="Número de teléfono"
            />
          </FormField>
          <FormField error={errors.email} errorId="email-error">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={values.email || ''}
              onChange={handleChange}
              error={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              placeholder="correo@ejemplo.com"
            />
          </FormField>
        </FormFieldGroup>
        <FormField>
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            name="address"
            value={values.address || ''}
            onChange={handleChange}
            placeholder="Dirección completa"
          />
        </FormField>
        {errors.form && (
          <FormField>
            <FormError message={errors.form} />
          </FormField>
        )}
      </FormContainer>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" form="donor-form">
          Guardar Donante
        </Button>
      </DialogFooter>
    </>
  );
};

export default DonorForm;
