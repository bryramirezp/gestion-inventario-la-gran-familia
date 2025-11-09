import { useState, FormEvent } from 'react';
import { z, ZodSchema } from 'zod';

type FormErrors<T> = Partial<Record<keyof T | 'form', string>>;

/**
 * Hook personalizado para formularios con validación usando Zod
 * Este hook proporciona validación type-safe usando esquemas de Zod
 *
 * @param initialValues - Valores iniciales del formulario
 * @param schema - Esquema de validación de Zod
 * @returns Objeto con valores, errores y funciones de manejo
 */
export const useZodForm = <T extends z.infer<ZodSchema>>(
  initialValues: T,
  schema: ZodSchema<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setValues({
      ...values,
      [name]: type === 'checkbox' ? checked : value === '' ? undefined : value,
    });

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name as keyof T]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof T];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    } else {
      const fieldErrors: FormErrors<T> = {};
      // Zod 4.x usa 'issues' en lugar de 'errors'
      const issues = result.error?.issues || (result.error as any)?.errors || [];
      if (Array.isArray(issues) && issues.length > 0) {
        issues.forEach((err: z.ZodIssue) => {
          const path = err.path && err.path.length > 0 ? err.path[0] as keyof T : undefined;
          if (path) {
            fieldErrors[path] = err.message;
          }
        });
      } else {
        // Fallback si no hay errores estructurados
        const errorMessage = result.error instanceof Error ? result.error.message : 'Error de validación';
        setErrors({ form: errorMessage } as FormErrors<T>);
        return false;
      }
      setErrors(fieldErrors);
      return false;
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  const handleSubmit = (e: FormEvent, onSubmit: () => void) => {
    e.preventDefault();
    if (validate()) {
      onSubmit();
    }
  };

  return {
    values,
    errors,
    setValues,
    setErrors,
    handleChange,
    handleSubmit,
    reset,
    validate,
  };
};

