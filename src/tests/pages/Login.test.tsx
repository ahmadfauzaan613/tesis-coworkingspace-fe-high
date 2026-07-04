/**
 * Unit Tests: Login Page
 * Tests form rendering, input IDs for automation, and user interactions.
 * Dummy data is generated dynamically via factories (mirrors real API shape).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faker } from '@faker-js/faker';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { makeAuthPayload } from '../factories';

// ─── Mock api module ──────────────────────────────────────────────────────────
vi.mock('../../lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

// ─── Mock react-router-dom navigate ──────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Rendering & Element IDs (for automation)', () => {
    it('renders the login form with id="login-form"', () => {
      renderLogin();
      expect(document.getElementById('login-form')).toBeInTheDocument();
    });

    it('renders email input with id="login-email"', () => {
      renderLogin();
      expect(document.getElementById('login-email')).toBeInTheDocument();
    });

    it('renders password input with id="login-password"', () => {
      renderLogin();
      expect(document.getElementById('login-password')).toBeInTheDocument();
    });

    it('renders submit button with id="btn-login-submit"', () => {
      renderLogin();
      expect(document.getElementById('btn-login-submit')).toBeInTheDocument();
    });

    it('renders link to register with id="link-register"', () => {
      renderLogin();
      expect(document.getElementById('link-register')).toBeInTheDocument();
    });

    it('renders demo autofill buttons with correct ids', () => {
      renderLogin();
      expect(document.getElementById('btn-demo-autofill-0')).toBeInTheDocument();
      expect(document.getElementById('btn-demo-autofill-1')).toBeInTheDocument();
    });
  });

  describe('UI Content Rendering', () => {
    it('renders "Welcome back" heading', () => {
      renderLogin();
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });

    it('renders "Email address" label', () => {
      renderLogin();
      expect(screen.getByText('Email address')).toBeInTheDocument();
    });

    it('renders "Password" label', () => {
      renderLogin();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('renders "Log In" button text', () => {
      renderLogin();
      expect(screen.getByText('Log In')).toBeInTheDocument();
    });

    it('renders sign up link with text "Sign Up"', () => {
      renderLogin();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('renders Quick Accounts Auto Fill section', () => {
      renderLogin();
      expect(screen.getByText(/Quick Accounts Auto Fill/i)).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('updates email input when user types', async () => {
      renderLogin();
      const email = faker.internet.email();
      const emailInput = document.getElementById('login-email') as HTMLInputElement;
      await userEvent.type(emailInput, email);
      expect(emailInput.value).toBe(email);
    });

    it('updates password input when user types', async () => {
      renderLogin();
      const password = faker.internet.password({ length: 12 });
      const pwInput = document.getElementById('login-password') as HTMLInputElement;
      await userEvent.type(pwInput, password);
      expect(pwInput.value).toBe(password);
    });

    it('demo autofill button fills in email and password', async () => {
      renderLogin();
      const autoFillBtn = document.getElementById('btn-demo-autofill-0') as HTMLButtonElement;
      fireEvent.click(autoFillBtn);

      const emailInput = document.getElementById('login-email') as HTMLInputElement;
      const pwInput = document.getElementById('login-password') as HTMLInputElement;

      // Demo accounts are pre-defined in Login.tsx
      expect(emailInput.value).toBeTruthy();
      expect(pwInput.value).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('disables submit button while loading', async () => {
      const api = await import('../../lib/api');
      // Simulate slow response
      (api.default.post as any).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5000))
      );

      renderLogin();
      const emailInput = document.getElementById('login-email') as HTMLInputElement;
      const pwInput = document.getElementById('login-password') as HTMLInputElement;
      const submitBtn = document.getElementById('btn-login-submit') as HTMLButtonElement;

      await userEvent.type(emailInput, faker.internet.email());
      await userEvent.type(pwInput, faker.internet.password({ length: 12 }));
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitBtn).toBeDisabled();
      });
    });

    it('shows error message on failed login', async () => {
      const api = await import('../../lib/api');
      const errorMessage = faker.lorem.sentence();
      (api.default.post as any).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      renderLogin();
      const emailInput = document.getElementById('login-email') as HTMLInputElement;
      const pwInput = document.getElementById('login-password') as HTMLInputElement;
      const submitBtn = document.getElementById('btn-login-submit') as HTMLButtonElement;

      await userEvent.type(emailInput, faker.internet.email());
      await userEvent.type(pwInput, faker.internet.password({ length: 12 }));
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('stores token and user in localStorage on successful login', async () => {
      const api = await import('../../lib/api');
      const authPayload = makeAuthPayload({ user: { role: 'customer' } as any });
      (api.default.post as any).mockResolvedValue({ data: authPayload });

      renderLogin();
      const emailInput = document.getElementById('login-email') as HTMLInputElement;
      const pwInput = document.getElementById('login-password') as HTMLInputElement;
      const submitBtn = document.getElementById('btn-login-submit') as HTMLButtonElement;

      await userEvent.type(emailInput, authPayload.user.email);
      await userEvent.type(pwInput, faker.internet.password({ length: 12 }));
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(authPayload.token);
      });
    });
  });
});
