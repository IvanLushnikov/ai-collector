import { env } from '../config/env.js';
import { createApp } from './app.js';

const app = createApp();

app.listen({
  host: env.HOST,
  port: env.PORT
}).then(() => {
  app.log.info(`AI Collector API listening on ${env.HOST}:${env.PORT}`);
}).catch((err: unknown) => {
  app.log.error(err as any);
  process.exit(1);
});
