/**
 * Unit Tests: Navbar Component
 * Tests navigation links, element IDs, and auth state display.
 * Dummy data is generated dynamically via factories (mirrors real API shape).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { makeUser } from '../factories';

// ─── Mock react-router-dom navigate ──────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderNavbar = () =>
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Unauthenticated State', () => {
    it('renders brand link with id="nav-brand"', () => {
      renderNavbar();
      expect(document.getElementById('nav-brand')).toBeInTheDocument();
    });

    it('renders navigation links with correct IDs', () => {
      renderNavbar();
      expect(document.getElementById('nav-home')).toBeInTheDocument();
      expect(document.getElementById('nav-catalog')).toBeInTheDocument();
      expect(document.getElementById('nav-about')).toBeInTheDocument();
      expect(document.getElementById('nav-contacts')).toBeInTheDocument();
    });

    it('shows "Log In" button when not authenticated', () => {
      renderNavbar();
      expect(document.getElementById('btn-login-nav')).toBeInTheDocument();
    });

    it('does NOT show "My Bookings" link when not authenticated', () => {
      renderNavbar();
      expect(document.getElementById('nav-my-bookings')).not.toBeInTheDocument();
    });

    it('does NOT show admin dashboard link when not authenticated', () => {
      renderNavbar();
      expect(document.getElementById('nav-admin-dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Customer State', () => {
    let customer: ReturnType<typeof makeUser>;

    beforeEach(() => {
      customer = makeUser({ role: 'customer' });
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify(customer));
    });

    it('shows "My Bookings" nav link for customers', () => {
      renderNavbar();
      expect(document.getElementById('nav-my-bookings')).toBeInTheDocument();
    });

    it('does NOT show admin dashboard for customers', () => {
      renderNavbar();
      expect(document.getElementById('nav-admin-dashboard')).not.toBeInTheDocument();
    });

    it('shows profile dropdown button with id="btn-profile-dropdown"', () => {
      renderNavbar();
      expect(document.getElementById('btn-profile-dropdown')).toBeInTheDocument();
    });

    it('shows dropdown menu items when profile button is clicked', () => {
      renderNavbar();
      const dropdownBtn = document.getElementById('btn-profile-dropdown') as HTMLButtonElement;
      fireEvent.click(dropdownBtn);

      expect(document.getElementById('dropdown-profile')).toBeInTheDocument();
      expect(document.getElementById('dropdown-my-bookings')).toBeInTheDocument();
      expect(document.getElementById('dropdown-logout')).toBeInTheDocument();
    });

    it('clears localStorage and navigates to /login on logout', () => {
      renderNavbar();
      const dropdownBtn = document.getElementById('btn-profile-dropdown') as HTMLButtonElement;
      fireEvent.click(dropdownBtn);

      const logoutBtn = document.getElementById('dropdown-logout') as HTMLButtonElement;
      fireEvent.click(logoutBtn);

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Authenticated Admin State', () => {
    let admin: ReturnType<typeof makeUser>;

    beforeEach(() => {
      admin = makeUser({ role: 'admin' });
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem('user', JSON.stringify(admin));
    });

    it('shows "Admin Dashboard" nav link for admins', () => {
      renderNavbar();
      expect(document.getElementById('nav-admin-dashboard')).toBeInTheDocument();
    });

    it('does NOT show "My Bookings" for admins', () => {
      renderNavbar();
      expect(document.getElementById('nav-my-bookings')).not.toBeInTheDocument();
    });

    it('shows admin portal link in dropdown', () => {
      renderNavbar();
      const dropdownBtn = document.getElementById('btn-profile-dropdown') as HTMLButtonElement;
      fireEvent.click(dropdownBtn);

      expect(document.getElementById('dropdown-admin-dashboard')).toBeInTheDocument();
    });
  });

  describe('UI Content Rendering', () => {
    it('renders brand name "SpaceBook"', () => {
      renderNavbar();
      expect(screen.getByText('SpaceBook')).toBeInTheDocument();
    });

    it('renders brand subtitle "Coworking Space"', () => {
      renderNavbar();
      expect(screen.getByText('Coworking Space')).toBeInTheDocument();
    });

    it('renders navigation link texts: Home, Catalog, About, Contacts', () => {
      renderNavbar();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Catalog')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Contacts')).toBeInTheDocument();
    });

    it('shows user name in dropdown when logged in as customer', () => {
      const customer = makeUser({ role: 'customer' });
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify(customer));
      renderNavbar();
      expect(screen.getByText(customer.name)).toBeInTheDocument();
    });

    it('shows "Signed in as" label in dropdown', () => {
      const customer = makeUser({ role: 'customer' });
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify(customer));
      renderNavbar();
      const dropdownBtn = document.getElementById('btn-profile-dropdown') as HTMLButtonElement;
      fireEvent.click(dropdownBtn);
      expect(screen.getByText('Signed in as')).toBeInTheDocument();
    });
  });
});
