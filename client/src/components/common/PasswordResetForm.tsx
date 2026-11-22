import { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearPasswordReset,
  selectAuthError,
  selectIsSendingResetCode,
  selectResetEmail,
  sendResetCode,
  submitResetPassword,
  validatePasswordReset,
  validatePasswordResetRequest,
  type FieldErrors,
} from '@/store/slices/authSlice';

interface PasswordResetFormProps {
  onDone: () => void;
}

/**
 * Luồng quên mật khẩu: bước 1 gửi mã bảo mật qua email, bước 2 nhập mã + mật khẩu mới.
 * Mã bảo mật chỉ nằm trong email, không hiển thị trên giao diện.
 */
export function PasswordResetForm({ onDone }: PasswordResetFormProps) {
  const dispatch = useAppDispatch();
  const authError = useAppSelector(selectAuthError);
  const isSending = useAppSelector(selectIsSendingResetCode);
  const resetEmail = useAppSelector(selectResetEmail);

  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ code: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      dispatch(clearPasswordReset());
    };
  }, [dispatch]);

  const handleRequest = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const errors = validatePasswordResetRequest({ email });
    setFieldErrors(errors);
    if (errors.email) return;

    const result = await dispatch(sendResetCode({ email }));
    if (sendResetCode.fulfilled.match(result)) {
      setStep('confirm');
    }
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const errors = validatePasswordReset({ ...form, email: resetEmail ?? email });
    setFieldErrors(errors);
    if (errors.code || errors.password) return;

    const result = await dispatch(
      submitResetPassword({ ...form, email: resetEmail ?? email }),
    );
    if (submitResetPassword.fulfilled.match(result)) {
      setSuccess('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.');
    }
  };

  if (success) {
    return (
      <div className="auth-modal__reset-done">
        <p className="auth-modal__reset-success" role="status">
          {success}
        </p>
        <Button variant="dark" className="w-100" onClick={onDone}>
          Về trang đăng nhập
        </Button>
      </div>
    );
  }

  if (step === 'request') {
    return (
      <Form onSubmit={handleRequest} noValidate>
        <Form.Group className="mb-3" controlId="auth-reset-email">
          <Form.Label>Email đã đăng ký</Form.Label>
          <Form.Control
            type="email"
            value={email}
            isInvalid={Boolean(fieldErrors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Form.Control.Feedback type="invalid">{fieldErrors.email}</Form.Control.Feedback>
        </Form.Group>

        {authError && (
          <p className="auth-modal__error" role="alert">
            {authError}
          </p>
        )}

        <Button type="submit" variant="dark" className="w-100" disabled={isSending}>
          {isSending ? 'Đang gửi mã...' : 'Gửi mã bảo mật qua email'}
        </Button>

        <button type="button" className="auth-modal__link" onClick={onDone}>
          Quay lại đăng nhập
        </button>
      </Form>
    );
  }

  return (
    <Form onSubmit={handleReset} noValidate>
      <div className="auth-modal__code-box">
        <p className="auth-modal__code-label">
          Mã bảo mật đã được gửi tới <strong>{resetEmail}</strong>
        </p>
        <p className="auth-modal__code-hint">
          Mã có hiệu lực 5 phút. Kiểm tra hộp thư đến (kể cả thư rác) để lấy mã.
        </p>
      </div>

      <Form.Group className="mb-3" controlId="auth-reset-code">
        <Form.Label>Mã bảo mật</Form.Label>
        <Form.Control
          value={form.code}
          isInvalid={Boolean(fieldErrors.code)}
          onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
        />
        <Form.Control.Feedback type="invalid">{fieldErrors.code}</Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3" controlId="auth-reset-password">
        <Form.Label>Mật khẩu mới</Form.Label>
        <Form.Control
          type="password"
          value={form.password}
          isInvalid={Boolean(fieldErrors.password)}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />
        <Form.Control.Feedback type="invalid">{fieldErrors.password}</Form.Control.Feedback>
      </Form.Group>

      {authError && (
        <p className="auth-modal__error" role="alert">
          {authError}
        </p>
      )}

      <Button type="submit" variant="dark" className="w-100">
        Đặt lại mật khẩu
      </Button>

      <button type="button" className="auth-modal__link" onClick={onDone}>
        Quay lại đăng nhập
      </button>
    </Form>
  );
}
