import { z } from 'zod';

/**
 * Esquema de validación para NewProduct usando Zod
 * Este esquema valida los datos antes de crear un producto
 * 
 * NOTA: Los campos opcionales se manejan con .optional().nullable() para permitir
 * valores undefined y null, que es lo que espera la base de datos
 */
export const newProductSchema = z.object({
  product_name: z.string().min(1, 'El nombre del producto es requerido').trim(),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category_id: z
    .number({
      required_error: 'La categoría es requerida',
      invalid_type_error: 'La categoría debe ser un número',
    })
    .int('La categoría debe ser un número entero')
    .positive('La categoría es requerida'),
  brand_id: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .or(z.null())
    .or(z.undefined()),
  official_unit_id: z
    .number({
      required_error: 'La unidad es requerida',
      invalid_type_error: 'La unidad debe ser un número',
    })
    .int('La unidad debe ser un número entero')
    .positive('La unidad es requerida'),
  low_stock_threshold: z
    .number()
    .int('El límite de stock debe ser un número entero')
    .min(0, 'El límite de stock debe ser 0 o mayor')
    .default(5),
});

export type NewProductInput = z.infer<typeof newProductSchema>;

