'use strict';
const os = require('os');
const { createApp } = require('./app');
const { createPool, migrate } = require('./db');
const { createStorage } = require('./storage');

async function main() {
  const pool = createPool();
  await migrate(pool);
  const app = createApp({
    db: pool,
    storage: createStorage(),
    meta: {
      hostname: os.hostname(),
      az: process.env.INSTANCE_AZ || 'local',
      instanceId: process.env.INSTANCE_ID || 'local',
      version: process.env.APP_VERSION || 'dev',
    },
  });
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, () => console.log(`axon-api listening on :${port}`));

  const shutdown = () => {
    console.log('shutting down');
    server.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => { console.error('fatal:', err); process.exit(1); });
