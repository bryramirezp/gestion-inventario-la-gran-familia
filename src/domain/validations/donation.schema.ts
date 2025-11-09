import { z } from 'zod';

/**
 * Esquema de validación para items de donación
 */
export const donationItemSchema = z.object({
  product_id: z.number().int().positive('El producto es requerido'),
  quantity: z
    .number()
    .positive('La cantidad debe ser mayor a 0')
    .refine((val) => val > 0, {
      message: 'La cantidad debe ser mayor a 0',
    }),
  expiry_date: z.string().nullable().optional(),
  market_unit_price: z.number().min(0, 'El precio de mercado debe ser 0 o mayor'),
  actual_unit_price: z.number().min(0, 'El precio real debe ser 0 o mayor'),
});

/**
 * Esquema de validación para NewDonation usando Zod
 * Este esquema valida los datos antes de crear una donación
 */
export const newDonationSchema = z.object({
  donor_id: z.number().int().positive('El donante es requerido'),
  warehouse_id: z.number().int().positive('El almacén es requerido'),
  items: z
    .array(donationItemSchema)
    .min(1, 'Se debe agregar al menos un artículo')
    .refine((items) => items.length > 0, {
      message: 'Se debe agregar al menos un artículo',
    }),
});

export type NewDonationInput = z.infer<typeof newDonationSchema>;
export type DonationItemInput = z.infer<typeof donationItemSchema>;

