import { describe, it, expect } from 'vitest';
import { newDonationSchema, donationItemSchema } from '@/domain/validations/donation.schema';

describe('donationItemSchema', () => {
  describe('Valid data', () => {
    it('should accept valid donation item', () => {
      const validItem = {
        product_id: 1,
        quantity: 10,
        unit_price: 5.0,
        discount_percentage: 0,
        expiry_date: '2024-12-31',
      };

      const result = donationItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.product_id).toBe(1);
        expect(result.data.quantity).toBe(10);
        expect(result.data.unit_price).toBe(5.0);
        expect(result.data.discount_percentage).toBe(0);
      }
    });

    it('should accept item with null expiry_date', () => {
      const validItem = {
        product_id: 1,
        quantity: 10,
        unit_price: 5.0,
        discount_percentage: 0,
        expiry_date: null,
      };

      const result = donationItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should accept item without expiry_date', () => {
      const validItem = {
        product_id: 1,
        quantity: 10,
        unit_price: 5.0,
        discount_percentage: 0,
      };

      const result = donationItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('should use default discount_percentage of 0', () => {
      const validItem = {
        product_id: 1,
        quantity: 10,
        unit_price: 5.0,
      };

      const result = donationItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.discount_percentage).toBe(0);
      }
    });

    it('should accept discount_percentage up to 100', () => {
      const validItem = {
        product_id: 1,
        quantity: 10,
        unit_price: 5.0,
        discount_percentage: 100,
      };

      const result = donationItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid data', () => {
    it('should reject missing product_id', () => {
      const invalidItem = {
        quantity: 10,
        unit_price: 5.0,
        discount_percentage: 0,
      };

      const result = donationItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject invalid product_id (negative)', () => {
      const invalidItem = {
        product_id: -1,
        quantity: 10,
        unit_price: 5.0,
        discount_percentage: 0,
      };

      const result = donationItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject missing quantity', () => {
      const invalidItem = {
        product_id: 1,
        unit_price: 5.0,
        discount_percentage: 0,
      };

      const result = donationItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject zero quantity', () => {
      const invalidItem = {
        product_id: 1,
        quantity: 0,
        unit_price: 5.0,
        discount_percentage: 0,
      };

      const result = donationItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject negative quantity', () => {
      const invalidItem = {
        product_id: 1,
        quantity: -10,
        unit_price: 5.0,
        discount_percentage: 0,
      };

      const result = donationItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject missing unit_price', () => {
      const invalidItem = {
        product_id: 1,
        quantity: 10,
        discount_percentage: 0,
      };

      const result = donationItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject negative unit_price', () => {
      const invalidItem = {
        product_id: 1,
        quantity: 10,
        unit_price: -5.0,
        discount_percentage: 0,
      };

      const result = donationItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject discount_percentage over 100', () => {
      const invalidItem = {
        product_id: 1,
        quantity: 10,
        unit_price: 5.0,
        discount_percentage: 101,
      };

      const result = donationItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should reject negative discount_percentage', () => {
      const invalidItem = {
        product_id: 1,
        quantity: 10,
        unit_price: 5.0,
        discount_percentage: -1,
      };

      const result = donationItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });
});

describe('newDonationSchema', () => {
  describe('Valid data', () => {
    it('should accept valid donation with single item', () => {
      const validDonation = {
        donor_id: 1,
        warehouse_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
            unit_price: 5.0,
            discount_percentage: 0,
          },
        ],
      };

      const result = newDonationSchema.safeParse(validDonation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.donor_id).toBe(1);
        expect(result.data.warehouse_id).toBe(1);
        expect(result.data.items).toHaveLength(1);
      }
    });

    it('should accept valid donation with multiple items', () => {
      const validDonation = {
        donor_id: 1,
        warehouse_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
            unit_price: 5.0,
            discount_percentage: 0,
          },
          {
            product_id: 2,
            quantity: 20,
            unit_price: 3.0,
            discount_percentage: 10,
          },
        ],
      };

      const result = newDonationSchema.safeParse(validDonation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(2);
      }
    });
  });

  describe('Invalid data', () => {
    it('should reject missing donor_id', () => {
      const invalidDonation = {
        warehouse_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
            unit_price: 5.0,
            discount_percentage: 0,
          },
        ],
      };

      const result = newDonationSchema.safeParse(invalidDonation);
      expect(result.success).toBe(false);
    });

    it('should reject invalid donor_id (negative)', () => {
      const invalidDonation = {
        donor_id: -1,
        warehouse_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
            unit_price: 5.0,
            discount_percentage: 0,
          },
        ],
      };

      const result = newDonationSchema.safeParse(invalidDonation);
      expect(result.success).toBe(false);
    });

    it('should reject missing warehouse_id', () => {
      const invalidDonation = {
        donor_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
            unit_price: 5.0,
            discount_percentage: 0,
          },
        ],
      };

      const result = newDonationSchema.safeParse(invalidDonation);
      expect(result.success).toBe(false);
    });

    it('should reject invalid warehouse_id (negative)', () => {
      const invalidDonation = {
        donor_id: 1,
        warehouse_id: -1,
        items: [
          {
            product_id: 1,
            quantity: 10,
            unit_price: 5.0,
            discount_percentage: 0,
          },
        ],
      };

      const result = newDonationSchema.safeParse(invalidDonation);
      expect(result.success).toBe(false);
    });

    it('should reject empty items array', () => {
      const invalidDonation = {
        donor_id: 1,
        warehouse_id: 1,
        items: [],
      };

      const result = newDonationSchema.safeParse(invalidDonation);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos un artículo');
      }
    });

    it('should reject missing items', () => {
      const invalidDonation = {
        donor_id: 1,
        warehouse_id: 1,
      };

      const result = newDonationSchema.safeParse(invalidDonation);
      expect(result.success).toBe(false);
    });

    it('should reject invalid item in items array', () => {
      const invalidDonation = {
        donor_id: 1,
        warehouse_id: 1,
        items: [
          {
            product_id: -1, // Invalid
            quantity: 10,
            unit_price: 5.0,
            discount_percentage: 0,
          },
        ],
      };

      const result = newDonationSchema.safeParse(invalidDonation);
      expect(result.success).toBe(false);
    });
  });
});

