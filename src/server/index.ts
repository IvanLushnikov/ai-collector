import { env } from '../config/env.js';
import { prisma } from '../db/client.js';
import { createApp } from './app.js';

const app = createApp();

let shuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  app.log.info({ signal }, 'shutting down');

  const forceExit = setTimeout(() => {
    app.log.error('graceful shutdown timed out');
    process.exit(1);
  }, 15_000);
  forceExit.unref();

  try {
    await app.close();
    await prisma.$disconnect();
    app.log.info('shutdown complete');
    process.exit(0);
  } catch (err: unknown) {
    app.log.error(err as Error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

app.listen({
  host: env.HOST,
  port: env.PORT
}).then(() => {
  app.log.info(`AI Collector API listening on ${env.HOST}:${env.PORT}`);
}).catch((err: unknown) => {
  app.log.error(err as Error);
  process.exit(1);
});
