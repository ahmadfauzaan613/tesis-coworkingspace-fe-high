/**
 * Unit Tests: Register Page
 * Tests form rendering, input IDs for automation, and registration flow.
 * Dummy data is generated dynamically via factories (mirrors real API shape).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { faker } from '@faker-js/faker';
import { MemoryRouter } from 'react-router-dom';
import Register from '../../pages/Register';
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
      const name = faker.person.fullName();
      const email = faker.internet.email();
      const password = faker.internet.password({ length: 12 });

      const nameInput = document.getElementById('register-name') as HTMLInputElement;
      const emailInput = document.getElementById('register-email') as HTMLInputElement;
      const pwInput = document.getElementById('register-password') as HTMLInputElement;

      await userEvent.type(nameInput, name);
      await userEvent.type(emailInput, email);
      await userEvent.type(pwInput, password);

      expect(nameInput.value).toBe(name);
      expect(emailInput.value).toBe(email);
      expect(pwInput.value).toBe(password);
    });
  });

  describe('Form Submission', () => {
    it('shows error when email is already in use', async () => {
      const api = await import('../../lib/api');
      const errorMessage = faker.lorem.sentence();
      (api.default.post as any).mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      renderRegister();
      const nameInput = document.getElementById('register-name') as HTMLInputElement;
      const emailInput = document.getElementById('register-email') as HTMLInputElement;
      const pwInput = document.getElementById('register-password') as HTMLInputElement;
      const submitBtn = document.getElementById('btn-register-submit') as HTMLButtonElement;

      await userEvent.type(nameInput, faker.person.fullName());
      await userEvent.type(emailInput, faker.internet.email());
      await userEvent.type(pwInput, faker.internet.password({ length: 12 }));
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('stores token and user in localStorage on successful registration', async () => {
      const api = await import('../../lib/api');
      const authPayload = makeAuthPayload({ user: { role: 'customer' } as any });
      (api.default.post as any).mockResolvedValue({ data: authPayload });

      renderRegister();
      const nameInput = document.getElementById('register-name') as HTMLInputElement;
      const emailInput = document.getElementById('register-email') as HTMLInputElement;
      const pwInput = document.getElementById('register-password') as HTMLInputElement;
      const submitBtn = document.getElementById('btn-register-submit') as HTMLButtonElement;

      await userEvent.type(nameInput, authPayload.user.name);
      await userEvent.type(emailInput, authPayload.user.email);
      await userEvent.type(pwInput, faker.internet.password({ length: 12 }));
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(authPayload.token);
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

      await userEvent.type(nameInput, faker.person.fullName());
      await userEvent.type(emailInput, faker.internet.email());
      await userEvent.type(pwInput, faker.internet.password({ length: 12 }));
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Registration failed/i)).toBeInTheDocument();
      });
    });
  });
});
