import { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  changePassword,
  clearAuthError,
  selectAuthError,
  validateChangePassword,
  type FieldErrors,
} from '@/store/slices/authSlice';

interface ChangePasswordModalProps {
  show: boolean;
  onClose: () => void;
}

/** Đổi mật khẩu cho tài khoản đang đăng nhập. */
export function ChangePasswordModal({ show, onClose }: ChangePasswordModalProps) {
  const dispatch = useAppDispatch();
  const authError = useAppSelector(selectAuthError);

  const [form, setForm] = useState({ oldPassword: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const errors = validateChangePassword(form);
    setFieldErrors(errors);
    if (errors.oldPassword || errors.password) return;

    dispatch(changePassword(form));
    setSuccess('Đổi mật khẩu thành công.');
    setForm({ oldPassword: '', password: '' });
    setFieldErrors({});
  };

  const handleClose = (): void => {
    setForm({ oldPassword: '', password: '' });
    setFieldErrors({});
    setSuccess(null);
    dispatch(clearAuthError());
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered contentClassName="auth-modal">
      <Modal.Header closeButton>
        <Modal.Title className="fs-5">Đổi mật khẩu</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3" controlId="auth-change-old-password">
            <Form.Label>Mật khẩu hiện tại</Form.Label>
            <Form.Control
              type="password"
              value={form.oldPassword}
              isInvalid={Boolean(fieldErrors.oldPassword)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, oldPassword: event.target.value }))
              }
            />
            <Form.Control.Feedback type="invalid">{fieldErrors.oldPassword}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="auth-change-new-password">
            <Form.Label>Mật khẩu mới</Form.Label>
            <Form.Control
              type="password"
              value={form.password}
              isInvalid={Boolean(fieldErrors.password)}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
            <Form.Control.Feedback type="invalid">{fieldErrors.password}</Form.Control.Feedback>
          </Form.Group>

          {authError && <p className="auth-modal__error">{authError}</p>}
          {success && <p className="auth-modal__reset-success">{success}</p>}

          <Button type="submit" variant="dark" className="w-100">
            Lưu mật khẩu mới
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
