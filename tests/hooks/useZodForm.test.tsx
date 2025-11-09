import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useZodForm } from '@/infrastructure/hooks/useZodForm';
import { z } from 'zod';

// Schema de prueba simple
const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().int().positive('Age must be positive'),
});

describe('useZodForm', () => {
  describe('Initial state', () => {
    it('should initialize with provided values', () => {
      const initialValues = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
    });

    it('should initialize with empty errors', () => {
      const initialValues = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));

      expect(result.current.errors).toEqual({});
    });
  });

  describe('handleChange', () => {
    it('should update values when input changes', () => {
      const initialValues = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));

      act(() => {
        const event = {
          target: {
            name: 'name',
            value: 'Jane',
            type: 'text',
          },
        } as React.ChangeEvent<HTMLInputElement>;

        result.current.handleChange(event);
      });

      expect(result.current.values.name).toBe('Jane');
      expect(result.current.values.email).toBe('john@example.com');
      expect(result.current.values.age).toBe(30);
    });

    it('should clear error when field is updated', () => {
      const initialValues = {
        name: '',
        email: 'john@example.com',
        age: 30,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));

      // First, validate to create an error
      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.name).toBeDefined();

      // Then update the field
      act(() => {
        const event = {
          target: {
            name: 'name',
            value: 'John',
            type: 'text',
          },
        } as React.ChangeEvent<HTMLInputElement>;

        result.current.handleChange(event);
      });

      expect(result.current.errors.name).toBeUndefined();
    });

    it('should set undefined for empty string values', () => {
      const initialValues = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));

      act(() => {
        const event = {
          target: {
            name: 'name',
            value: '',
            type: 'text',
          },
        } as React.ChangeEvent<HTMLInputElement>;

        result.current.handleChange(event);
      });

      expect(result.current.values.name).toBeUndefined();
    });

    it('should handle checkbox inputs', () => {
      const checkboxSchema = z.object({
        accepted: z.boolean(),
      });

      const initialValues = {
        accepted: false,
      };

      const { result } = renderHook(() => useZodForm(initialValues, checkboxSchema));

      act(() => {
        const event = {
          target: {
            name: 'accepted',
            type: 'checkbox',
            checked: true,
          },
        } as React.ChangeEvent<HTMLInputElement>;

        result.current.handleChange(event);
      });

      expect(result.current.values.accepted).toBe(true);
    });
  });

  describe('validate', () => {
    it('should return true for valid data', () => {
      const initialValues = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));

      let isValid = false;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('should return false for invalid data', () => {
      const initialValues = {
        name: '',
        email: 'invalid-email',
        age: -1,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));

      let isValid = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.name).toBeDefined();
      expect(result.current.errors.email).toBeDefined();
      expect(result.current.errors.age).toBeDefined();
    });

    it('should set errors for each invalid field', () => {
      const initialValues = {
        name: '',
        email: 'invalid',
        age: 0,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));

      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.name).toBe('Name is required');
      expect(result.current.errors.email).toBe('Invalid email');
      expect(result.current.errors.age).toBe('Age must be positive');
    });
  });

  describe('reset', () => {
    it('should reset values to initial values', () => {
      const initialValues = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));

      // Change values
      act(() => {
        const event = {
          target: {
            name: 'name',
            value: 'Jane',
            type: 'text',
          },
        } as React.ChangeEvent<HTMLInputElement>;

        result.current.handleChange(event);
      });

      expect(result.current.values.name).toBe('Jane');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual(initialValues);
      expect(result.current.errors).toEqual({});
    });

    it('should clear errors on reset', () => {
      const initialValues = {
        name: '',
        email: 'john@example.com',
        age: 30,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));

      // Create errors
      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.name).toBeDefined();

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('handleSubmit', () => {
    it('should call onSubmit when data is valid', () => {
      const initialValues = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));
      const onSubmit = vi.fn();

      act(() => {
        const event = {
          preventDefault: vi.fn(),
        } as unknown as React.FormEvent;

        result.current.handleSubmit(event, onSubmit);
      });

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should not call onSubmit when data is invalid', () => {
      const initialValues = {
        name: '',
        email: 'invalid',
        age: -1,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));
      const onSubmit = vi.fn();

      act(() => {
        const event = {
          preventDefault: vi.fn(),
        } as unknown as React.FormEvent;

        result.current.handleSubmit(event, onSubmit);
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should prevent default form submission', () => {
      const initialValues = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const { result } = renderHook(() => useZodForm(initialValues, testSchema));
      const preventDefault = vi.fn();
      const onSubmit = vi.fn();

      act(() => {
        const event = {
          preventDefault,
        } as unknown as React.FormEvent;

        result.current.handleSubmit(event, onSubmit);
      });

      expect(preventDefault).toHaveBeenCalledTimes(1);
    });
  });
});

