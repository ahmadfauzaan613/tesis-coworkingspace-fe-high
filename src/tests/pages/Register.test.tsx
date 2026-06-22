/**
 * Unit Tests: Register Page
 * Tests form rendering, input IDs for automation, and registration flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../../pages/Register';

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

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Rendering & Element IDs (for automation)', () => {
    it('renders the register form with id="register-form"', () => {
      renderRegister();
      expect(document.getElementById('register-form')).toBeInTheDocument();
    });

    it('renders name input with id="register-name"', () => {
      renderRegister();
      expect(document.getElementById('register-name')).toBeInTheDocument();
    });

    it('renders email input with id="register-email"', () => {
      renderRegister();
      expect(document.getElementById('register-email')).toBeInTheDocument();
    });

    it('renders password input with id="register-password"', () => {
      renderRegister();
      expect(document.getElementById('register-password')).toBeInTheDocument();
    });

    it('renders submit button with id="btn-register-submit"', () => {
      renderRegister();
      expect(document.getElementById('btn-register-submit')).toBeInTheDocument();
    });

    it('renders link to login with id="link-login"', () => {
      renderRegister();
      expect(document.getElementById('link-login')).toBeInTheDocument();
    });
  });

  describe('UI Content Rendering', () => {
    it('renders "Create a new account" heading', () => {
      renderRegister();
      expect(screen.getByText('Create a new account')).toBeInTheDocument();
    });

    it('renders "Full name" label', () => {
      renderRegister();
      expect(screen.getByText('Full name')).toBeInTheDocument();
    });

    it('renders "Email address" label', () => {
      renderRegister();
      expect(screen.getByText('Email address')).toBeInTheDocument();
    });

    it('renders "Password" label', () => {
      renderRegister();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('renders "Register" button text', () => {
      renderRegister();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('renders "Log In" link for existing users', () => {
      renderRegister();
      expect(screen.getByText('Log In')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('updates all fields when user types', async () => {
      renderRegister();
      const nameInput = document.getElementById('register-name') as HTMLInputElement;
      const emailInput = document.getElementById('register-email') as HTMLInputElement;
      const pwInput = document.getElementById('register-password') as HTMLInputElement;

      await userEvent.type(nameInput, 'John Doe');
      await userEvent.type(emailInput, 'john@example.com');
      await userEvent.type(pwInput, 'securepassword');

      expect(nameInput.value).toBe('John Doe');
      expect(emailInput.value).toBe('john@example.com');
      expect(pwInput.value).toBe('securepassword');
    });
  });

  describe('Form Submission', () => {
    it('shows error when email is already in use', async () => {
      const api = await import('../../lib/api');
      (api.default.post as any).mockRejectedValue({
        response: { data: { message: 'Email is already registered.' } },
      });

      renderRegister();
      const nameInput = document.getElementById('register-name') as HTMLInputElement;
      const emailInput = document.getElementById('register-email') as HTMLInputElement;
      const pwInput = document.getElementById('register-password') as HTMLInputElement;
      const submitBtn = document.getElementById('btn-register-submit') as HTMLButtonElement;

      await userEvent.type(nameInput, 'Existing User');
      await userEvent.type(emailInput, 'existing@example.com');
      await userEvent.type(pwInput, 'password123');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Email is already registered.')).toBeInTheDocument();
      });
    });

    it('stores token and user in localStorage on successful registration', async () => {
      const api = await import('../../lib/api');
      (api.default.post as any).mockResolvedValue({
        data: {
          token: 'new-user-token',
          user: { id: 42, name: 'New User', email: 'new@example.com', role: 'customer' },
        },
      });

      renderRegister();
      const nameInput = document.getElementById('register-name') as HTMLInputElement;
      const emailInput = document.getElementById('register-email') as HTMLInputElement;
      const pwInput = document.getElementById('register-password') as HTMLInputElement;
      const submitBtn = document.getElementById('btn-register-submit') as HTMLButtonElement;

      await userEvent.type(nameInput, 'New User');
      await userEvent.type(emailInput, 'new@example.com');
      await userEvent.type(pwInput, 'password123');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('new-user-token');
      });
    });

    it('shows fallback error message if no server message', async () => {
      const api = await import('../../lib/api');
      (api.default.post as any).mockRejectedValue(new Error('Network error'));

      renderRegister();
      const nameInput = document.getElementById('register-name') as HTMLInputElement;
      const emailInput = document.getElementById('register-email') as HTMLInputElement;
      const pwInput = document.getElementById('register-password') as HTMLInputElement;
      const submitBtn = document.getElementById('btn-register-submit') as HTMLButtonElement;

      await userEvent.type(nameInput, 'User');
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(pwInput, 'password');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
      });
    });
  });
});
