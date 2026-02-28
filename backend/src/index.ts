import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import router from './routes/index.js';
import { env } from './config/env.js';
import { migrate } from './db/pool.js';
import { initWebsocket } from './ws/server.js';
import { startPaymentWatcher } from './services/paymentWatcher.js';

async function bootstrap() {
  await migrate();
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.allowedOrigin, credentials: true }));
  app.use(express.json());

  app.use('/api', router);

  const server = http.createServer(app);
  initWebsocket(server);
  startPaymentWatcher();

  server.listen(env.port, () => {
    console.log(`API listening on :${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});
