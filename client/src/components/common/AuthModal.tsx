import { useEffect, useRef, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { PasswordResetForm } from '@/components/common/PasswordResetForm';
import {
  clearAuthError,
  clearPasswordReset,
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

interface PasswordFieldProps {
  id: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function PasswordField({ id, value, error, onChange }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label>Mật khẩu</Form.Label>
      <div className="auth-modal__password">
        <Form.Control
          type={visible ? 'text' : 'password'}
          value={value}
          isInvalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          type="button"
          variant="outline-secondary"
          className="auth-modal__password-toggle"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          title={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          onClick={() => setVisible((prev) => !prev)}
        >
          <i className={`bi ${visible ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
        </Button>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </div>
    </Form.Group>
  );
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
  const [showReset, setShowReset] = useState(false);
  const loginTabRef = useRef<HTMLButtonElement>(null);
  const registerTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (show) {
      firstInputRef.current?.focus();
    }
  }, [show]);

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

  const openReset = (): void => {
    setShowReset(true);
    setFieldErrors({});
    dispatch(clearAuthError());
  };

  const closeReset = (): void => {
    setShowReset(false);
    setFieldErrors({});
    dispatch(clearAuthError());
    dispatch(clearPasswordReset());
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    const next: AuthMode = event.key === 'ArrowRight' ? 'register' : 'login';
    switchMode(next);
    (next === 'login' ? loginTabRef : registerTabRef).current?.focus();
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
    <Modal
      show={show}
      onHide={onClose}
      centered
      contentClassName="auth-modal"
      aria-labelledby="auth-modal-title"
      autoFocus
      enforceFocus
      restoreFocus
      restoreFocusOptions={{ preventScroll: true }}
    >
      <Modal.Header closeButton>
        <Modal.Title id="auth-modal-title" className="fs-5">
          {showReset ? 'Quên mật khẩu' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {showReset ? (
          <PasswordResetForm onDone={closeReset} />
        ) : (
          <>
        <div className="auth-modal__tabs" role="tablist" aria-label="Đăng nhập hoặc đăng ký">
          <button
            type="button"
            role="tab"
            id="auth-tab-login"
            ref={loginTabRef}
            aria-controls="auth-panel-login"
            aria-selected={mode === 'login'}
            tabIndex={mode === 'login' ? 0 : -1}
            className={`btn btn-sm ${mode === 'login' ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => switchMode('login')}
            onKeyDown={handleTabKeyDown}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            id="auth-tab-register"
            ref={registerTabRef}
            aria-controls="auth-panel-register"
            aria-selected={mode === 'register'}
            tabIndex={mode === 'register' ? 0 : -1}
            className={`btn btn-sm ${mode === 'register' ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => switchMode('register')}
            onKeyDown={handleTabKeyDown}
          >
            Đăng ký
          </button>
        </div>

        {mode === 'login' ? (
          <div
            role="tabpanel"
            id="auth-panel-login"
            aria-labelledby="auth-tab-login"
            tabIndex={0}
          >
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

            <PasswordField
              id="auth-login-password"
              value={loginForm.password}
              error={fieldErrors.password}
              onChange={(password) =>
                setLoginForm((prev) => ({ ...prev, password }))
              }
            />

            {authError && (
              <p className="auth-modal__error" role="alert">
                {authError}
              </p>
            )}

            <Button type="submit" variant="dark" className="w-100">
              Đăng nhập
            </Button>

            <button type="button" className="auth-modal__link" onClick={openReset}>
              Quên mật khẩu?
            </button>
            </Form>
          </div>
        ) : (
          <div
            role="tabpanel"
            id="auth-panel-register"
            aria-labelledby="auth-tab-register"
            tabIndex={0}
          >
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

            <PasswordField
              id="auth-register-password"
              value={registerForm.password}
              error={fieldErrors.password}
              onChange={(password) =>
                setRegisterForm((prev) => ({ ...prev, password }))
              }
            />

            {authError && (
              <p className="auth-modal__error" role="alert">
                {authError}
              </p>
            )}

            <Button type="submit" variant="dark" className="w-100">
              Tạo tài khoản
            </Button>
            </Form>
          </div>
        )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
