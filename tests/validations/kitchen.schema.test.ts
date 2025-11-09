import { describe, it, expect } from 'vitest';
import {
  createKitchenRequestSchema,
  kitchenRequestItemSchema,
} from '@/domain/validations/kitchen.schema';

describe('kitchenRequestItemSchema', () => {
  describe('Valid data', () => {
    it('should accept valid kitchen request item', () => {
      const validItem = {
        product_id: 1,
        quantity: 10,
      };

      const result = kitchenRequestItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.product_id).toBe(1);
        expect(result.data.quantity).toBe(10);
      }
    });

    it('should accept item with positive integer quantity', () => {
      const validItem = {
        product_id: 1,
        quantity: 1,
      };

      const result = kitchenRequestItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid data', () => {
    it('should reject missing product_id', () => {
      const invalidItem = {
        quantity: 10,
      };

      const result = kitchenRequestItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject invalid product_id (negative)', () => {
      const invalidItem = {
        product_id: -1,
        quantity: 10,
      };

      const result = kitchenRequestItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject missing quantity', () => {
      const invalidItem = {
        product_id: 1,
      };

      const result = kitchenRequestItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject zero quantity', () => {
      const invalidItem = {
        product_id: 1,
        quantity: 0,
      };

      const result = kitchenRequestItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject negative quantity', () => {
      const invalidItem = {
        product_id: 1,
        quantity: -10,
      };

      const result = kitchenRequestItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer quantity', () => {
      const invalidItem = {
        product_id: 1,
        quantity: 10.5,
      };

      const result = kitchenRequestItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });
});

describe('createKitchenRequestSchema', () => {
  describe('Valid data', () => {
    it('should accept valid kitchen request with required fields', () => {
      const validRequest = {
        requester_id: 'user-123',
        source_warehouse_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
          },
        ],
      };

      const result = createKitchenRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.requester_id).toBe('user-123');
        expect(result.data.source_warehouse_id).toBe(1);
        expect(result.data.items).toHaveLength(1);
      }
    });

    it('should accept valid kitchen request with optional fields', () => {
      const validRequest = {
        requester_id: 'user-123',
        source_warehouse_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
          },
        ],
        notes: 'Test notes',
        requester_signature: 'John Doe',
      };

      const result = createKitchenRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBe('Test notes');
        expect(result.data.requester_signature).toBe('John Doe');
      }
    });

    it('should accept null for optional fields', () => {
      const validRequest = {
        requester_id: 'user-123',
        source_warehouse_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
          },
        ],
        notes: null,
        requester_signature: null,
      };

      const result = createKitchenRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should accept valid kitchen request with multiple items', () => {
      const validRequest = {
        requester_id: 'user-123',
        source_warehouse_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
          },
          {
            product_id: 2,
            quantity: 20,
          },
        ],
      };

      const result = createKitchenRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
      }
    });
  });

  describe('Invalid data', () => {
    it('should reject missing requester_id', () => {
      const invalidRequest = {
        source_warehouse_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
          },
        ],
      };

      const result = createKitchenRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject empty requester_id', () => {
      const invalidRequest = {
        requester_id: '',
        source_warehouse_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
          },
        ],
      };

      const result = createKitchenRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject missing source_warehouse_id', () => {
      const invalidRequest = {
        requester_id: 'user-123',
        items: [
          {
            product_id: 1,
            quantity: 10,
          },
        ],
      };

      const result = createKitchenRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid source_warehouse_id (negative)', () => {
      const invalidRequest = {
        requester_id: 'user-123',
        source_warehouse_id: -1,
        items: [
          {
            product_id: 1,
            quantity: 10,
          },
        ],
      };

      const result = createKitchenRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject empty items array', () => {
      const invalidRequest = {
        requester_id: 'user-123',
        source_warehouse_id: 1,
        items: [],
      };

      const result = createKitchenRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos un artículo');
      }
    });

    it('should reject missing items', () => {
      const invalidRequest = {
        requester_id: 'user-123',
        source_warehouse_id: 1,
      };

      const result = createKitchenRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid item in items array', () => {
      const invalidRequest = {
        requester_id: 'user-123',
        source_warehouse_id: 1,
        items: [
          {
            product_id: -1, // Invalid
            quantity: 10,
          },
        ],
      };

      const result = createKitchenRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
});

