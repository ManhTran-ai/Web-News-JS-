import { useEffect, useRef, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearAuthError,
  login,
  register,
  selectAuthError,
  selectIsAuthenticated,
  validateCredentials,
  validateRegister,
  type FieldErrors,
} from '@/store/slices/authSlice';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  show: boolean;
  onClose: () => void;
}

export function AuthModal({ show, onClose }: AuthModalProps) {
  const dispatch = useAppDispatch();
  const authError = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<AuthMode>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (show) {
      firstInputRef.current?.focus();
    }
  }, [show, mode]);

  // Đăng nhập/đăng ký thành công thì đóng modal.
  useEffect(() => {
    if (show && isAuthenticated) {
      onClose();
    }
  }, [show, isAuthenticated, onClose]);

  const switchMode = (next: AuthMode): void => {
    setMode(next);
    setFieldErrors({});
    dispatch(clearAuthError());
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const errors = validateCredentials(loginForm);
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    dispatch(login(loginForm));
  };

  const handleRegister = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const errors = validateRegister(registerForm);
    setFieldErrors(errors);
    if (errors.fullName || errors.email || errors.password) return;

    dispatch(register(registerForm));
  };

  return (
    <Modal show={show} onHide={onClose} centered contentClassName="auth-modal">
      <Modal.Header closeButton>
        <Modal.Title className="fs-5">
          {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="auth-modal__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`btn btn-sm ${mode === 'login' ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => switchMode('login')}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`btn btn-sm ${mode === 'register' ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => switchMode('register')}
          >
            Đăng ký
          </button>
        </div>

        {mode === 'login' ? (
          <Form onSubmit={handleLogin} noValidate>
            <Form.Group className="mb-3" controlId="auth-login-email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                ref={firstInputRef}
                type="email"
                value={loginForm.email}
                isInvalid={Boolean(fieldErrors.email)}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <Form.Control.Feedback type="invalid">{fieldErrors.email}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="auth-login-password">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                value={loginForm.password}
                isInvalid={Boolean(fieldErrors.password)}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
              <Form.Control.Feedback type="invalid">{fieldErrors.password}</Form.Control.Feedback>
            </Form.Group>

            {authError && <p className="auth-modal__error">{authError}</p>}

            <Button type="submit" variant="dark" className="w-100">
              Đăng nhập
            </Button>
          </Form>
        ) : (
          <Form onSubmit={handleRegister} noValidate>
            <Form.Group className="mb-3" controlId="auth-register-name">
              <Form.Label>Họ tên</Form.Label>
              <Form.Control
                ref={firstInputRef}
                value={registerForm.fullName}
                isInvalid={Boolean(fieldErrors.fullName)}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, fullName: event.target.value }))
                }
              />
              <Form.Control.Feedback type="invalid">{fieldErrors.fullName}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="auth-register-email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={registerForm.email}
                isInvalid={Boolean(fieldErrors.email)}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <Form.Control.Feedback type="invalid">{fieldErrors.email}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="auth-register-password">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                value={registerForm.password}
                isInvalid={Boolean(fieldErrors.password)}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
              <Form.Control.Feedback type="invalid">{fieldErrors.password}</Form.Control.Feedback>
            </Form.Group>

            {authError && <p className="auth-modal__error">{authError}</p>}

            <Button type="submit" variant="dark" className="w-100">
              Tạo tài khoản
            </Button>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}
