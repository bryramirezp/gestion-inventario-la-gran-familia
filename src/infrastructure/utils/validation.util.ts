export interface NumericValidationOptions {
  min?: number;
  max?: number;
  allowZero?: boolean;
  allowNegative?: boolean;
  defaultValue?: number;
}

export interface NumericValidationResult {
  isValid: boolean;
  value: number;
  error?: string;
}

export const validateNumericInput = (
  input: string | number | null | undefined,
  options: NumericValidationOptions = {}
): NumericValidationResult => {
  const {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    allowZero = true,
    allowNegative = false,
    defaultValue = 0,
  } = options;

  if (input === null || input === undefined || input === '') {
    return {
      isValid: true,
      value: defaultValue,
    };
  }

  const stringValue = String(input).trim();

  if (stringValue === '' || stringValue === '-' || stringValue === '.' || stringValue === '.-' || stringValue === '-.') {
    return {
      isValid: true,
      value: defaultValue,
    };
  }

  const numValue = Number(stringValue);

  if (isNaN(numValue)) {
    return {
      isValid: false,
      value: defaultValue,
      error: 'El valor debe ser un número válido.',
    };
  }

  if (Object.is(numValue, -0)) {
    return {
      isValid: false,
      value: defaultValue,
      error: 'No se permite el valor -0.',
    };
  }

  if (!allowNegative && numValue < 0) {
    return {
      isValid: false,
      value: defaultValue,
      error: 'No se permiten valores negativos.',
    };
  }

  if (!allowZero && numValue === 0) {
    return {
      isValid: false,
      value: defaultValue,
      error: 'El valor debe ser mayor que cero.',
    };
  }

  if (numValue < min) {
    return {
      isValid: false,
      value: defaultValue,
      error: `El valor debe ser mayor o igual a ${min}.`,
    };
  }

  if (numValue > max) {
    return {
      isValid: false,
      value: defaultValue,
      error: `El valor debe ser menor o igual a ${max}.`,
    };
  }

  return {
    isValid: true,
    value: numValue,
  };
};

export interface TextValidationOptions {
  allowNumbers?: boolean;
  allowSpecialChars?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export interface TextValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateTextInput = (
  input: string | null | undefined,
  options: TextValidationOptions = {}
): TextValidationResult => {
  const {
    allowNumbers = false,
    allowSpecialChars = true,
    minLength = 1,
    maxLength = 255,
    pattern,
  } = options;

  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      error: 'El campo es requerido.',
    };
  }

  const trimmed = input.trim();

  if (trimmed.length < minLength) {
    return {
      isValid: false,
      error: `El campo debe tener al menos ${minLength} caracteres.`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `El campo no puede tener más de ${maxLength} caracteres.`,
    };
  }

  if (pattern && !pattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'El formato del campo no es válido.',
    };
  }

  if (!allowNumbers && /\d/.test(trimmed)) {
    return {
      isValid: false,
      error: 'El campo no puede contener números.',
    };
  }

  if (!allowSpecialChars) {
    const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (specialCharsRegex.test(trimmed)) {
      return {
        isValid: false,
        error: 'El campo no puede contener caracteres especiales.',
      };
    }
  }

  return {
    isValid: true,
  };
};

export const validateCategoryName = (input: string | null | undefined): TextValidationResult => {
  return validateTextInput(input, {
    allowNumbers: false,
    allowSpecialChars: false,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
  });
};

export const validateBrandName = (input: string | null | undefined): TextValidationResult => {
  return validateTextInput(input, {
    allowNumbers: false,
    allowSpecialChars: false,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
  });
};

export const validateDate = (
  dateString: string | null | undefined,
  minDate?: string | Date
): { isValid: boolean; error?: string } => {
  if (!dateString) {
    return { isValid: true };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: 'La fecha no es válida.',
    };
  }

  if (minDate) {
    const min = typeof minDate === 'string' ? new Date(minDate) : minDate;
    min.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date < min) {
      return {
        isValid: false,
        error: 'La fecha no puede ser anterior a la fecha mínima permitida.',
      };
    }
  }

  return { isValid: true };
};
