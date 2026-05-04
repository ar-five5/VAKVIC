/** Validates registration input — returns array of error strings. */
export const validateRegistration = (email, password) => {
  const errors = [];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!password || !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!password || !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  return errors;
};
