import { createApp } from './app.js';
import { config } from './config/env.js';
import { startRefreshJob } from './jobs/refresh.job.js';
import { articleStore } from './services/article.store.js';
import { readSnapshot } from './services/snapshot.service.js';

const app = createApp();

async function bootstrap(): Promise<void> {
  const snapshot = await readSnapshot();
  if (snapshot.length > 0) {
    articleStore.hydrate(snapshot);
    console.log(`[startup] Khôi phục ${snapshot.length} bài từ snapshot`);
  }

  startRefreshJob();

  const server = app.listen(config.port, () => {
    console.log(`[startup] Server đang lắng nghe tại http://localhost:${config.port}`);
  });

  const shutdown = (signal: string): void => {
    console.log(`[shutdown] Nhận ${signal}, đang đóng server`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

void bootstrap();
