import { describe, it, expect } from 'vitest';
import { newProductSchema } from '@/domain/validations/product.schema';

describe('newProductSchema', () => {
  describe('Valid data', () => {
    it('should accept valid product with all required fields', () => {
      const validProduct = {
        product_name: 'Test Product',
        category_id: 1,
        official_unit_id: 1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.product_name).toBe('Test Product');
        expect(result.data.category_id).toBe(1);
        expect(result.data.official_unit_id).toBe(1);
        expect(result.data.low_stock_threshold).toBe(5);
      }
    });

    it('should accept valid product with optional fields', () => {
      const validProduct = {
        product_name: 'Test Product',
        sku: 'SKU-123',
        description: 'Test description',
        category_id: 1,
        brand_id: 1,
        official_unit_id: 1,
        low_stock_threshold: 10,
      };

      const result = newProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sku).toBe('SKU-123');
        expect(result.data.description).toBe('Test description');
        expect(result.data.brand_id).toBe(1);
      }
    });

    it('should accept null values for optional fields', () => {
      const validProduct = {
        product_name: 'Test Product',
        sku: null,
        description: null,
        brand_id: null,
        category_id: 1,
        official_unit_id: 1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should trim product_name', () => {
      const validProduct = {
        product_name: '  Test Product  ',
        category_id: 1,
        official_unit_id: 1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.product_name).toBe('Test Product');
      }
    });

    it('should use default value for low_stock_threshold', () => {
      const validProduct = {
        product_name: 'Test Product',
        category_id: 1,
        official_unit_id: 1,
      };

      const result = newProductSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.low_stock_threshold).toBe(5);
      }
    });
  });

  describe('Invalid data', () => {
    it('should reject missing product_name', () => {
      const invalidProduct = {
        category_id: 1,
        official_unit_id: 1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('product_name');
      }
    });

    it('should reject empty product_name', () => {
      const invalidProduct = {
        product_name: '',
        category_id: 1,
        official_unit_id: 1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject missing category_id', () => {
      const invalidProduct = {
        product_name: 'Test Product',
        official_unit_id: 1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('category_id');
      }
    });

    it('should reject invalid category_id (negative)', () => {
      const invalidProduct = {
        product_name: 'Test Product',
        category_id: -1,
        official_unit_id: 1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject invalid category_id (zero)', () => {
      const invalidProduct = {
        product_name: 'Test Product',
        category_id: 0,
        official_unit_id: 1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject missing official_unit_id', () => {
      const invalidProduct = {
        product_name: 'Test Product',
        category_id: 1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('official_unit_id');
      }
    });

    it('should reject invalid official_unit_id (non-integer)', () => {
      const invalidProduct = {
        product_name: 'Test Product',
        category_id: 1,
        official_unit_id: 1.5,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject invalid low_stock_threshold (negative)', () => {
      const invalidProduct = {
        product_name: 'Test Product',
        category_id: 1,
        official_unit_id: 1,
        low_stock_threshold: -1,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject invalid low_stock_threshold (non-integer)', () => {
      const invalidProduct = {
        product_name: 'Test Product',
        category_id: 1,
        official_unit_id: 1,
        low_stock_threshold: 5.5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject invalid brand_id (negative)', () => {
      const invalidProduct = {
        product_name: 'Test Product',
        category_id: 1,
        official_unit_id: 1,
        brand_id: -1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });

  describe('Type validation', () => {
    it('should reject string for category_id', () => {
      const invalidProduct = {
        product_name: 'Test Product',
        category_id: '1',
        official_unit_id: 1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject string for official_unit_id', () => {
      const invalidProduct = {
        product_name: 'Test Product',
        category_id: 1,
        official_unit_id: '1',
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should reject number for product_name', () => {
      const invalidProduct = {
        product_name: 123,
        category_id: 1,
        official_unit_id: 1,
        low_stock_threshold: 5,
      };

      const result = newProductSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });
});

