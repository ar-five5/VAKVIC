/**
 * Migration: Add last_login column to users table
 */

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.sql('ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.sql('ALTER TABLE users DROP COLUMN last_login;');
};
