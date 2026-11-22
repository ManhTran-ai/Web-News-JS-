import { http } from './http';
import type { RefreshResponse, RefreshSummary } from '@/types/api';

const REFRESH_COOLDOWN_MS = 30_000;
const REFRESH_RETRY_DELAYS_MS = [1_000, 3_000, 10_000];
const REFRESH_RATE_LIMIT_STATUS = 429;

export type { RefreshSummary };

export class RefreshCooldownError extends Error {
  constructor() {
    super('Đã làm mới dữ liệu gần đây');
    this.name = 'RefreshCooldownError';
  }
}

let pending: Promise<RefreshSummary> | null = null;
let lastRefreshAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusOf(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}

async function callRefresh(): Promise<RefreshSummary> {
  const response = await http.post<RefreshResponse>('/refresh');
  return response.data.data;
}

async function callRefreshWithRetry(): Promise<RefreshSummary> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await callRefresh();
    } catch (error) {
      const delay = REFRESH_RETRY_DELAYS_MS[attempt];
      if (statusOf(error) !== REFRESH_RATE_LIMIT_STATUS || delay === undefined) {
        throw error;
      }
      await sleep(delay);
    }
  }
}

export function requestRefreshOnce(): Promise<RefreshSummary> {
  if (pending) {
    return pending;
  }

  if (Date.now() - lastRefreshAt < REFRESH_COOLDOWN_MS) {
    return Promise.reject(new RefreshCooldownError());
  }

  pending = callRefreshWithRetry()
    .then((summary) => {
      lastRefreshAt = Date.now();
      return summary;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}

export function isRefreshInFlight(): boolean {
  return pending !== null;
}

export function getLastRefreshAt(): number {
  return lastRefreshAt;
}

export function resetRefreshQueue(): void {
  pending = null;
  lastRefreshAt = 0;
}
