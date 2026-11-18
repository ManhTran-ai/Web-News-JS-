import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config/env.js';

/** Thời gian hiệu lực của mã đặt lại mật khẩu (ms). */
export const RESET_CODE_TTL_MS = 5 * 60 * 1000;

/** Độ dài mã bảo mật. */
export const RESET_CODE_LENGTH = 6;

export interface PasswordResetRequest {
  email: string;
  code: string;
  expiresAt: number;
}

let transporter: Transporter | null = null;

/** SMTP chưa cấu hình thì không gửi được mail — endpoint sẽ trả lỗi cho client biết. */
export function isMailConfigured(): boolean {
  return Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  return transporter;
}

export function generateResetCode(): string {
  let code = '';
  for (let index = 0; index < RESET_CODE_LENGTH; index += 1) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/** Gửi mã bảo mật đặt lại mật khẩu qua email. */
export async function sendPasswordResetEmail(
  email: string,
  code: string,
): Promise<void> {
  await getTransporter().sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Mã bảo mật đặt lại mật khẩu — Tin tức 24h',
    text: [
      'Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Tin tức 24h.',
      '',
      `Mã bảo mật của bạn là: ${code}`,
      '',
      `Mã có hiệu lực trong ${Math.round(RESET_CODE_TTL_MS / 60000)} phút.`,
      'Nếu bạn không yêu cầu, hãy bỏ qua email này.',
    ].join('\n'),
    html: [
      '<p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản <strong>Tin tức 24h</strong>.</p>',
      `<p style="font-size:24px;font-weight:700;letter-spacing:4px;margin:16px 0">${code}</p>`,
      `<p>Mã có hiệu lực trong ${Math.round(RESET_CODE_TTL_MS / 60000)} phút.</p>`,
      '<p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>',
    ].join(''),
  });
}
