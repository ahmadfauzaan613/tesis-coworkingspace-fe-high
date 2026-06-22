/**
 * Unit Tests: Profile Page
 * Tests element IDs for automation, form rendering, and input interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../../pages/Profile';

// ─── Mock api ─────────────────────────────────────────────────────────────────
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

const mockProfile = {
  id: 1,
  name: 'Budi Santoso',
  email: 'user1@spacebook.id',
  role: 'customer',
  avatar_url: null,
};

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderProfile = (client = createQueryClient()) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </QueryClientProvider>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Profile Page', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify(mockProfile));

    const api = await import('../../lib/api');
    (api.default.get as any).mockResolvedValue({ data: { user: mockProfile } });
  });

  describe('Element IDs for Automation', () => {
    it('renders profile name input with id="input-profile-name"', async () => {
      renderProfile();
      await waitFor(() => {
        expect(document.getElementById('input-profile-name')).toBeInTheDocument();
      });
    });

    it('renders profile email input with id="input-profile-email"', async () => {
      renderProfile();
      await waitFor(() => {
        expect(document.getElementById('input-profile-email')).toBeInTheDocument();
      });
    });

    it('renders save profile button with id="btn-submit-profile-details"', async () => {
      renderProfile();
      await waitFor(() => {
        expect(document.getElementById('btn-submit-profile-details')).toBeInTheDocument();
      });
    });

    it('renders current password input with id="input-profile-curr-pw"', async () => {
      renderProfile();
      await waitFor(() => {
        expect(document.getElementById('input-profile-curr-pw')).toBeInTheDocument();
      });
    });

    it('renders new password input with id="input-profile-new-pw"', async () => {
      renderProfile();
      await waitFor(() => {
        expect(document.getElementById('input-profile-new-pw')).toBeInTheDocument();
      });
    });

    it('renders confirm password input with id="input-profile-confirm-pw"', async () => {
      renderProfile();
      await waitFor(() => {
        expect(document.getElementById('input-profile-confirm-pw')).toBeInTheDocument();
      });
    });

    it('renders update password button with id="btn-submit-profile-password"', async () => {
      renderProfile();
      await waitFor(() => {
        expect(document.getElementById('btn-submit-profile-password')).toBeInTheDocument();
      });
    });

    it('renders avatar file input with id="avatar-file-input"', async () => {
      renderProfile();
      await waitFor(() => {
        expect(document.getElementById('avatar-file-input')).toBeInTheDocument();
      });
    });
  });

  describe('UI Content Rendering', () => {
    it('renders "Edit Details" section heading', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('Edit Details')).toBeInTheDocument();
      });
    });

    it('renders "Change Password" section heading', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('Change Password')).toBeInTheDocument();
      });
    });

    it('renders "Full Name" label', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('Full Name')).toBeInTheDocument();
      });
    });

    it('renders "Email Address" label', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('Email Address')).toBeInTheDocument();
      });
    });

    it('renders "Save Profile Details" button text', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('Save Profile Details')).toBeInTheDocument();
      });
    });

    it('renders "Update Password" button text', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText('Update Password')).toBeInTheDocument();
      });
    });

    it('renders avatar upload hint text', async () => {
      renderProfile();
      await waitFor(() => {
        expect(screen.getByText(/Supports JPEG/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Population', () => {
    it('populates name input from fetched profile', async () => {
      renderProfile();
      await waitFor(() => {
        const nameInput = document.getElementById('input-profile-name') as HTMLInputElement;
        expect(nameInput?.value).toBe('Budi Santoso');
      });
    });

    it('populates email input from fetched profile', async () => {
      renderProfile();
      await waitFor(() => {
        const emailInput = document.getElementById('input-profile-email') as HTMLInputElement;
        expect(emailInput?.value).toBe('user1@spacebook.id');
      });
    });
  });

  describe('Form Interactions', () => {
    it('updates name input when user types', async () => {
      renderProfile();
      // Wait for form to populate from API
      await waitFor(() => {
        const nameInput = document.getElementById('input-profile-name') as HTMLInputElement;
        expect(nameInput?.value).toBe('Budi Santoso');
      });

      const nameInput = document.getElementById('input-profile-name') as HTMLInputElement;
      // Clear then type new value
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Budi Updated');
      expect(nameInput.value).toBe('Budi Updated');
    });

    it('submit profile button is present and enabled by default', async () => {
      renderProfile();
      await waitFor(() => {
        const btn = document.getElementById('btn-submit-profile-details') as HTMLButtonElement;
        expect(btn).toBeInTheDocument();
        expect(btn).not.toBeDisabled();
      });
    });
  });
});
