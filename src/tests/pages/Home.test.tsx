/**
 * Unit Tests: Home Page
 * Tests element IDs for automation and key UI rendering.
 * Dummy data is generated dynamically via factories (mirrors real API shape).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Home from '../../pages/Home';
import { makeRoom } from '../factories';

// ─── Mock api ─────────────────────────────────────────────────────────────────
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const buildMockRooms = () => [makeRoom({ capacity: 1 }), makeRoom({ capacity: 10 })];

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderHome = (client = createQueryClient()) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </QueryClientProvider>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Hero Section IDs (for automation)', () => {
    it('renders hero CTA button with id="btn-hero-cta"', () => {
      renderHome();
      expect(document.getElementById('btn-hero-cta')).toBeInTheDocument();
    });

    it('renders browse catalog button with id="btn-browse-catalog"', async () => {
      renderHome();
      await waitFor(() => {
        expect(document.getElementById('btn-browse-catalog')).toBeInTheDocument();
      });
    });
  });

  describe('Booking Modal IDs', () => {
    let mockRooms: ReturnType<typeof buildMockRooms>;

    beforeEach(async () => {
      mockRooms = buildMockRooms();
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockRooms });
    });

    it('opens booking modal when Book Space is clicked', async () => {
      renderHome();
      const targetId = `btn-book-room-${mockRooms[0].id}`;
      await waitFor(() => {
        expect(document.getElementById(targetId)).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById(targetId)!);
      await waitFor(() => {
        expect(document.getElementById('booking-form')).toBeInTheDocument();
      });
    });

    it('modal has date input with id="input-booking-date"', async () => {
      renderHome();
      const targetId = `btn-book-room-${mockRooms[0].id}`;
      await waitFor(() => {
        expect(document.getElementById(targetId)).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById(targetId)!);
      await waitFor(() => {
        expect(document.getElementById('input-booking-date')).toBeInTheDocument();
      });
    });

    it('modal has start time select with id="select-start-time"', async () => {
      renderHome();
      const targetId = `btn-book-room-${mockRooms[0].id}`;
      await waitFor(() => {
        expect(document.getElementById(targetId)).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById(targetId)!);
      await waitFor(() => {
        expect(document.getElementById('select-start-time')).toBeInTheDocument();
      });
    });

    it('modal has end time select with id="select-end-time"', async () => {
      renderHome();
      const targetId = `btn-book-room-${mockRooms[0].id}`;
      await waitFor(() => {
        expect(document.getElementById(targetId)).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById(targetId)!);
      await waitFor(() => {
        expect(document.getElementById('select-end-time')).toBeInTheDocument();
      });
    });

    it('closes modal when btn-close-modal is clicked', async () => {
      renderHome();
      const targetId = `btn-book-room-${mockRooms[0].id}`;
      await waitFor(() => {
        expect(document.getElementById(targetId)).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById(targetId)!);
      await waitFor(() => {
        expect(document.getElementById('booking-form')).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById('btn-close-modal')!);
      await waitFor(() => {
        expect(document.getElementById('booking-form')).not.toBeInTheDocument();
      });
    });

    it('shows Login/Register buttons in modal for unauthenticated users', async () => {
      renderHome();
      const targetId = `btn-book-room-${mockRooms[0].id}`;
      await waitFor(() => {
        expect(document.getElementById(targetId)).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById(targetId)!);
      await waitFor(() => {
        expect(document.getElementById('btn-modal-login')).toBeInTheDocument();
        expect(document.getElementById('btn-modal-register')).toBeInTheDocument();
      });
    });

    it('shows Confirm Book button for authenticated users', async () => {
      localStorage.setItem('token', 'fake-jwt-token');

      renderHome();
      const targetId = `btn-book-room-${mockRooms[0].id}`;
      await waitFor(() => {
        expect(document.getElementById(targetId)).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById(targetId)!);
      await waitFor(() => {
        expect(document.getElementById('btn-confirm-booking')).toBeInTheDocument();
      });
    });
  });

  describe('Content Rendering', () => {
    it('renders heading text for the hero section', () => {
      renderHome();
      expect(screen.getByText(/Coworking Space Scheduling System/i)).toBeInTheDocument();
    });
  });
});
