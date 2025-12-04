/**
 * LoginForm Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../../helpers/render';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../../../src/features/auth/components/LoginForm';
import { authService } from '../../../../src/features/auth/services/auth.service';

// Mock auth service
vi.mock('../../../../src/features/auth/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

// Mock auth store
const mockSetAuth = vi.fn();
vi.mock('../../../../src/features/auth/store/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    if (selector) {
      return selector({
        setAuth: mockSetAuth,
        clearAuth: vi.fn(),
      });
    }
    return {
      setAuth: mockSetAuth,
      clearAuth: vi.fn(),
    };
  }),
}));

// Mock toast
const mockShowToast = vi.fn();
vi.mock('../../../../src/components/ui/use-toast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetAuth.mockClear();
    mockShowToast.mockClear();
    mockNavigate.mockClear();
  });

  it('should render login form', () => {
    render(<LoginForm />);

    expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    // HTML5 validation should prevent submission
    // Check that the form inputs are marked as required
    const emailInput = screen.getByPlaceholderText(/your@email.com/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/••••••••/i) as HTMLInputElement;
    
    expect(emailInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
    
    // Form should not submit with empty fields (HTML5 validation)
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should call authService.login on valid submit', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.mocked(authService.login).mockResolvedValue({
      user: { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'ADMIN' },
      token: 'test-token',
    });

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/your@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      },
      { timeout: 3000 }
    );
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.mocked(authService.login).mockRejectedValue({
      response: { data: { error: { message: 'Invalid credentials' } } },
    });

    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText(/your@email.com/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Login failed',
          description: 'Invalid credentials',
          status: 'error',
        })
      );
    });
  });
});

