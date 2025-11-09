// Validaciones comunes reutilizables

/**
 * Valida una contraseña según los requisitos:
 * - Mínimo 8 caracteres
 * - Al menos un dígito (0-9)
 * - Al menos una letra minúscula (a-z)
 * - Al menos una letra mayúscula (A-Z)
 * - Al menos un símbolo (caracteres especiales)
 * 
 * @param password - La contraseña a validar
 * @returns Un objeto con `isValid` (boolean) y `error` (string | null)
 */
export function validatePassword(password: string): { isValid: boolean; error: string | null } {
  if (!password) {
    return { isValid: false, error: 'La contraseña es requerida.' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  // Verificar que tenga al menos un dígito
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos un dígito.' };
  }

  // Verificar que tenga al menos una letra minúscula
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos una letra minúscula.' };
  }

  // Verificar que tenga al menos una letra mayúscula
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos una letra mayúscula.' };
  }

  // Verificar que tenga al menos un símbolo (caracteres especiales)
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe contener al menos un símbolo (caracteres especiales).' };
  }

  return { isValid: true, error: null };
}

/**
 * Obtiene el mensaje de ayuda para los requisitos de contraseña
 */
export function getPasswordHelpText(): string {
  return 'La contraseña debe tener mínimo 8 caracteres e incluir: dígitos, letras minúsculas, letras mayúsculas y símbolos.';
}
