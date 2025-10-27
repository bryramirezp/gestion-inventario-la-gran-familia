import { useState, ChangeEvent, FormEvent } from 'react';

type FormErrors<T> = Partial<Record<keyof T | 'form', string>>;
type ValidateFunction<T> = (values: T) => FormErrors<T>;

export const useForm = <T extends object>(initialValues: T, validate: ValidateFunction<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setValues({
      ...values,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  const handleSubmit = (e: FormEvent, onSubmit: () => void) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
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
  };
};
