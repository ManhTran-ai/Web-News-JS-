import type { Request, Response } from 'express';
import { ApiError } from '../middlewares/error.js';
import {
  generateResetCode,
  isMailConfigured,
  RESET_CODE_TTL_MS,
  sendPasswordResetEmail,
  type PasswordResetRequest,
} from '../services/mail.service.js';

/**
 * Backend chưa có cơ sở dữ liệu nên danh sách yêu cầu đặt lại mật khẩu chỉ giữ
 * trong RAM của server. Khi có database sẽ thay bằng bảng `password_resets`.
 */
const resetRequests = new Map<string, PasswordResetRequest>();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Bước 1: sinh mã bảo mật rồi gửi qua email. */
export async function requestPasswordResetController(req: Request, res: Response): Promise<void> {
  const email = String(res.locals.parsedBody?.email ?? '').trim().toLowerCase();

  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Email không đúng định dạng.');
  }

  if (!isMailConfigured()) {
    throw new ApiError(
      503,
      'MAIL_NOT_CONFIGURED',
      'Chưa cấu hình SMTP nên chưa thể gửi mã bảo mật qua email.',
    );
  }

  const code = generateResetCode();
  resetRequests.set(email, { email, code, expiresAt: Date.now() + RESET_CODE_TTL_MS });

  try {
    await sendPasswordResetEmail(email, code);
  } catch (error) {
    resetRequests.delete(email);
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mail] Gửi mã bảo mật thất bại:', message);
    throw new ApiError(502, 'MAIL_SEND_FAILED', 'Không gửi được email. Vui lòng thử lại sau.');
  }

  res.json({ data: { email, expiresInMs: RESET_CODE_TTL_MS } });
}

/** Bước 2: kiểm tra mã bảo mật do người dùng nhập. */
export function verifyPasswordResetCodeController(req: Request, res: Response): void {
  const email = String(res.locals.parsedBody?.email ?? '').trim().toLowerCase();
  const code = String(res.locals.parsedBody?.code ?? '').trim();

  if (!email || !code) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Thiếu email hoặc mã bảo mật.');
  }

  const request = resetRequests.get(email);
  if (!request) {
    throw new ApiError(404, 'RESET_NOT_FOUND', 'Không có yêu cầu đặt lại mật khẩu cho email này.');
  }
  if (request.expiresAt < Date.now()) {
    resetRequests.delete(email);
    throw new ApiError(410, 'RESET_EXPIRED', 'Mã bảo mật đã hết hạn. Vui lòng yêu cầu mã mới.');
  }
  if (request.code !== code) {
    throw new ApiError(400, 'INVALID_CODE', 'Mã bảo mật không đúng.');
  }

  res.json({ data: { email, verified: true } });
}
