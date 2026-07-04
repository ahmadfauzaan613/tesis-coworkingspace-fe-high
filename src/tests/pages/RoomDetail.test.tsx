/**
 * Unit Tests: RoomDetail Page
 * Tests element IDs for automation, booking form rendering, and modal interactions.
 * Dummy data is generated dynamically via factories (mirrors real API shape).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RoomDetail from '../../pages/RoomDetail';
import { makeRoom } from '../factories';

// ─── Mock api ─────────────────────────────────────────────────────────────────
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// ─── Mock useParams ───────────────────────────────────────────────────────────
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ id: '1' }) };
});

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderRoomDetail = (client = createQueryClient()) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/rooms/1']}>
        <Routes>
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="*" element={<RoomDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('RoomDetail Page', () => {
  let mockRoom: ReturnType<typeof makeRoom>;

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    mockRoom = makeRoom({ id: 1 });

    const api = await import('../../lib/api');
    (api.default.get as any).mockImplementation((url: string) => {
      if (url.includes('/rooms/1')) return Promise.resolve({ data: mockRoom });
      if (url.includes('/bookings/conflict-check'))
        return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  });

  describe('Booking Form IDs (for automation)', () => {
    it('renders booking form with id="booking-form"', async () => {
      renderRoomDetail();
      await waitFor(() => {
        expect(document.getElementById('booking-form')).toBeInTheDocument();
      });
    });

    it('renders date input with id="input-booking-date"', async () => {
      renderRoomDetail();
      await waitFor(() => {
        expect(document.getElementById('input-booking-date')).toBeInTheDocument();
      });
    });

    it('renders start time select with id="select-start-time"', async () => {
      renderRoomDetail();
      await waitFor(() => {
        expect(document.getElementById('select-start-time')).toBeInTheDocument();
      });
    });

    it('renders end time select with id="select-end-time"', async () => {
      renderRoomDetail();
      await waitFor(() => {
        expect(document.getElementById('select-end-time')).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated vs Unauthenticated State', () => {
    it('shows Login/Register buttons in form for unauthenticated users', async () => {
      renderRoomDetail();
      await waitFor(() => {
        expect(document.getElementById('btn-modal-login')).toBeInTheDocument();
        expect(document.getElementById('btn-modal-register')).toBeInTheDocument();
      });
    });

    it('shows Confirm Book button for authenticated users', async () => {
      localStorage.setItem('token', 'fake-jwt-token');

      renderRoomDetail();
      await waitFor(() => {
        expect(document.getElementById('btn-confirm-booking')).toBeInTheDocument();
      });
    });
  });

  describe('Room Information Rendering', () => {
    it('renders room name from API data', async () => {
      renderRoomDetail();
      await waitFor(() => {
        expect(screen.getByText(mockRoom.name)).toBeInTheDocument();
      });
    });

    it('renders room description from API data', async () => {
      renderRoomDetail();
      await waitFor(() => {
        expect(screen.getByText(mockRoom.description)).toBeInTheDocument();
      });
    });
  });
});
