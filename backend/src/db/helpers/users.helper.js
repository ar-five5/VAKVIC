import { query } from '../pool.js';

/** Insert a new user and return the created row. */
export async function createUser(email, passwordHash) {
  const { rows } = await query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
    [email, passwordHash]
  );
  return rows[0];
}

/** Find a user by email; returns null if not found. */
export async function findByEmail(email) {
  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return rows[0] ?? null;
}

/** Stamp last_login to now for the given user. */
export async function updateLastLogin(userId) {
  await query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [userId]);
}

/** Increment failed_attempts by 1 and return the new count. */
export async function incrementFailedAttempts(userId) {
  const { rows } = await query(
    'UPDATE users SET failed_attempts = failed_attempts + 1 WHERE user_id = $1 RETURNING failed_attempts',
    [userId]
  );
  return rows[0];
}

/** Reset failed_attempts to 0 and clear locked_until. */
export async function resetFailedAttempts(userId) {
  await query(
    'UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE user_id = $1',
    [userId]
  );
}

/** Set locked_until to the given timestamp for the given user. */
export async function lockAccount(userId, lockedUntil) {
  await query(
    'UPDATE users SET locked_until = $2 WHERE user_id = $1',
    [userId, lockedUntil]
  );
}
