import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  REFRESH_CRON: z.string().default('*/5 * * * *'),
  FEED_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  RETENTION_HOURS: z.coerce.number().int().positive().default(72),
  MAX_ARTICLES: z.coerce.number().int().positive().default(1500),
  CONTENT_TTL_HOURS: z.coerce.number().int().positive().default(6),
  CONTENT_PREFETCH_COUNT: z.coerce.number().int().min(0).default(30),
  CONTENT_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Cấu hình môi trường không hợp lệ:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

export const config = {
  nodeEnv: raw.NODE_ENV,
  port: raw.PORT,
  corsOrigins: raw.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  refreshCron: raw.REFRESH_CRON,
  feedTimeoutMs: raw.FEED_TIMEOUT_MS,
  retentionHours: raw.RETENTION_HOURS,
  maxArticles: raw.MAX_ARTICLES,
  contentTtlHours: raw.CONTENT_TTL_HOURS,
  contentPrefetchCount: raw.CONTENT_PREFETCH_COUNT,
  contentTimeoutMs: raw.CONTENT_TIMEOUT_MS,
  userAgent:
    'News24hBot/1.0 (+https://github.com/23130205-dev/app-news24h) Node fetch RSS reader for education',
} as const;

export const isProduction = config.nodeEnv === 'production';
