import axios, { AxiosError } from 'axios';
import type { ApiErrorPayload } from '@/types/article';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
});

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    if (payload?.error) {
      return new ApiError(payload.error.code, payload.error.message, error.response?.status ?? 500);
    }
    if (error.code === 'ECONNABORTED') {
      return new ApiError('TIMEOUT', 'Yêu cầu quá thời gian chờ, vui lòng thử lại', 0);
    }
    if (!error.response) {
      return new ApiError('NETWORK_ERROR', 'Không kết nối được tới máy chủ', 0);
    }
    return new ApiError('INTERNAL_ERROR', 'Đã có lỗi xảy ra, vui lòng thử lại', error.response.status);
  }

  return new ApiError('INTERNAL_ERROR', 'Đã có lỗi xảy ra, vui lòng thử lại', 500);
}
