'use strict';
const { Pool } = require('pg');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS subscribers (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS contacts (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

// Credentials come from the environment (injected from Secrets Manager at boot), never from code.
function createPool(env = process.env) {
  return new Pool({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME || 'axon',
    max: 10,
    connectionTimeoutMillis: 5000,
    // RDS accepts TLS; traffic never leaves the private subnets, CA pinning is a documented improvement.
    ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
}

async function migrate(pool, attempts = 10, delayMs = 3000) {
  for (let i = 1; ; i++) {
    try {
      await pool.query(SCHEMA);
      return;
    } catch (err) {
      if (i >= attempts) throw err;
      console.warn(`DB not ready (${err.message}), retry ${i}/${attempts}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

module.exports = { createPool, migrate, SCHEMA };
