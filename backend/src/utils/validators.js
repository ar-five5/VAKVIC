/** Validates registration input — returns array of error strings. */
export const validateRegistration = (email, password) => {
  const errors = [];
  if (!email || typeof email !== 'string' ||
      email.length > 254 ||
      !email.includes('@') ||
      email.indexOf('@') !== email.lastIndexOf('@') ||
      email.split('@')[1]?.indexOf('.') === -1) {
    errors.push('Valid email is required');
  }
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else {
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  return errors;
};
