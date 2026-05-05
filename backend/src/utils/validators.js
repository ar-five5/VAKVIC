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
  if (!password || typeof password !== 'string' || password.length < 8) {
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

/** Validates login input without enforcing registration password complexity. */
export const validateLogin = (email, password) => {
  const errors = [];
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  }
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }
  return errors;
};

export const VALID_ASSET_CLASSES = ['stock', 'ETF', 'bond', 'commodity'];

export const parsePositiveInteger = (value) => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value.trim())) {
    return Number(value);
  }
  return null;
};

export const isValidIsoDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
