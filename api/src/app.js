'use strict';
const express = require('express');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Builds the Express app. Dependencies are injected so the app can be tested
 * without a real database or S3 bucket.
 *  - db:      { query(text, params) }
 *  - storage: optional { putJson(key, obj) }
 *  - meta:    instance metadata shown by /api/health (hostname, az, ...)
 */
function createApp({ db, storage = null, meta = {} }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  // Liveness: used by load balancer target groups. Must not touch the database,
  // so a DB blip does not make every instance look unhealthy.
  app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }));

  // Readiness / evidence endpoint: checks the DB and reveals which instance answered.
  app.get('/api/health', async (_req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ok', database: 'up', instance: meta });
    } catch (err) {
      console.error('health check failed:', err.message);
      res.status(503).json({ status: 'degraded', database: 'down', instance: meta });
    }
  });

  app.post('/api/subscribe', async (req, res) => {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    try {
      const r = await db.query(
        'INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING id',
        [email]
      );
      res.status(r.rows.length ? 201 : 200).json({ subscribed: true, alreadySubscribed: !r.rows.length });
    } catch (err) {
      console.error('subscribe failed:', err.message);
      res.status(500).json({ error: 'Could not save subscription' });
    }
  });

  app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body || {};
    const clean = {
      name: String(name || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      message: String(message || '').trim(),
    };
    if (!clean.name || clean.name.length > 100 || !EMAIL_RE.test(clean.email) ||
        !clean.message || clean.message.length > 2000) {
      return res.status(400).json({ error: 'name, valid email and message are required' });
    }
    try {
      const r = await db.query(
        'INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING id, created_at',
        [clean.name, clean.email, clean.message]
      );
      const { id, created_at } = r.rows[0];
      if (storage) {
        // Best effort copy to object storage; the DB row is the source of truth.
        storage.putJson(`contacts/${id}.json`, { id, ...clean, created_at })
          .catch((e) => console.error('s3 upload failed:', e.message));
      }
      res.status(201).json({ received: true, id });
    } catch (err) {
      console.error('contact failed:', err.message);
      res.status(500).json({ error: 'Could not save message' });
    }
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}

module.exports = { createApp, EMAIL_RE };
