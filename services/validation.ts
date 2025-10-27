/**
 * Utility functions for input validation
 */

/**
 * Validates if an email has basic valid format
 * @param email - Email string to validate
 * @returns true if email format is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;

  // Basic email regex: local@domain.tld
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email.trim());
};

/**
 * Validates if a string is not empty after trimming
 * @param value - String to validate
 * @returns true if string has content, false otherwise
 */
export const isRequired = (value: string): boolean => {
  return value && value.trim().length > 0;
};

/**
 * Validates if a number is positive
 * @param value - Number to validate
 * @returns true if number is positive, false otherwise
 */
export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};