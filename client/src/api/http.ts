import { AxiosError } from 'axios';
import type { ApiErrorPayload } from '@/types/api';

export { http } from './client';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;

  constructor(code: string, message: string, status: number, requestId?: string) {
    super(requestId ? `${message} (Mã yêu cầu: ${requestId})` : message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  const axiosError = error as AxiosError<ApiErrorPayload> | undefined;
  const response = axiosError?.response;

  if (response) {
    const payload = response.data;
    const requestId = (axiosError as AxiosError & { requestId?: string })?.requestId;

    if (payload?.error) {
      return new ApiError(
        payload.error.code,
        payload.error.message,
        response.status,
        requestId,
      );
    }

    return new ApiError(
      'INTERNAL_ERROR',
      'Đã có lỗi xảy ra, vui lòng thử lại',
      response.status,
      requestId,
    );
  }

  if (axiosError?.code === 'ECONNABORTED') {
    return new ApiError('TIMEOUT', 'Yêu cầu quá thời gian chờ, vui lòng thử lại', 0);
  }

  if (axiosError && axiosError.request) {
    return new ApiError('NETWORK_ERROR', 'Không kết nối được tới máy chủ', 0);
  }

  return new ApiError('INTERNAL_ERROR', 'Đã có lỗi xảy ra, vui lòng thử lại', 500);
}
