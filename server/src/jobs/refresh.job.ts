import cron from 'node-cron';
import { config } from '../config/env.js';
import { refreshAll } from '../services/refresh.service.js';

let running = false;

async function runOnce(): Promise<void> {
  if (running) {
    console.log('[job] Bỏ qua vì đợt làm mới trước chưa xong');
    return;
  }
  running = true;
  try {
    await refreshAll();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[job] Làm mới thất bại: ${message}`);
  } finally {
    running = false;
  }
}

export function startRefreshJob(): void {
  if (!cron.validate(config.refreshCron)) {
    console.error(`[job] Biểu thức cron không hợp lệ: ${config.refreshCron}`);
    return;
  }

  cron.schedule(config.refreshCron, () => {
    void runOnce();
  });

  void runOnce();
}
