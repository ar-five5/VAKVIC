import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AppError from '../../utils/AppError.js';
import { validateRegistration } from '../../utils/validators.js';
import {
  createUser,
  findByEmail,
  updateLastLogin,
  incrementFailedAttempts,
  resetFailedAttempts,
  lockAccount,
} from '../../db/helpers/users.helper.js';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;

function signToken(userId, email) {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

/** Create a new user, return JWT + minimal user info. */
export async function registerUser(email, password) {
  const errors = validateRegistration(email, password);
  if (errors.length > 0) {
    throw new AppError(errors.join(', '), 400, 'VALIDATION_ERROR');
  }

  const existing = await findByEmail(email);
  if (existing) {
    throw new AppError('Email already registered', 409, 'DUPLICATE_ENTRY');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser(email, passwordHash);
  const token = signToken(user.user_id, user.email);

  return { token, user: { userId: user.user_id, email: user.email } };
}

/** Authenticate a user, handle lockout, return JWT + minimal user info. */
export async function loginUser(email, password) {
  const user = await findByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new AppError('Account locked. Try again later', 423, 'ACCOUNT_LOCKED');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const result = await incrementFailedAttempts(user.user_id);
    if (result?.failed_attempts >= LOCKOUT_THRESHOLD) {
      await lockAccount(user.user_id, new Date(Date.now() + LOCKOUT_DURATION_MS));
    }
    throw new AppError('Invalid credentials', 401, 'UNAUTHORIZED');
  }

  await resetFailedAttempts(user.user_id);
  await updateLastLogin(user.user_id);
  const token = signToken(user.user_id, user.email);

  return { token, user: { userId: user.user_id, email: user.email } };
}
