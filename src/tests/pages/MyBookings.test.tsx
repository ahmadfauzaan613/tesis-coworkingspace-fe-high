/**
 * Unit Tests: MyBookings Page
 * Tests element IDs for automation, booking card rendering, and cancel/pay buttons.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import MyBookings from '../../pages/MyBookings';

// ─── Mock api ─────────────────────────────────────────────────────────────────
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockBookings = [
  {
    id: 10,
    room_id: 1,
    date: '2026-12-01',
    start_time: '09:00:00',
    end_time: '12:00:00',
    total_price: '150000',
    status: 'pending',
    created_at: '2026-11-01T10:00:00Z',
    room_name: 'Focus Pod',
    room_image: null,
    price_per_hour: '50000',
    payment_order_id: null,
    payment_snap_token: null,
    payment_status: null,
  },
  {
    id: 11,
    room_id: 2,
    date: '2026-12-02',
    start_time: '13:00:00',
    end_time: '15:00:00',
    total_price: '300000',
    status: 'approved',
    created_at: '2026-11-01T11:00:00Z',
    room_name: 'Meeting Room A',
    room_image: null,
    price_per_hour: '150000',
    payment_order_id: 'ORDER-11-123',
    payment_snap_token: 'SNAP-TOKEN',
    payment_status: 'settled',
  },
];

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderMyBookings = (client = createQueryClient()) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MyBookings />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe('MyBookings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1, name: 'Test User', email: 'test@spacebook.id', role: 'customer',
    }));
  });

  describe('Element IDs for Automation', () => {
    it('renders pay button with id="btn-pay-booking-{id}" for pending bookings', async () => {
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockBookings });

      renderMyBookings();
      await waitFor(() => {
        // Pending booking should show pay button
        expect(document.getElementById('btn-pay-booking-10')).toBeInTheDocument();
      });
    });

    it('renders cancel button with id="btn-cancel-booking-{id}" for cancellable bookings', async () => {
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockBookings });

      renderMyBookings();
      await waitFor(() => {
        // Pending and unpaid should show cancel button
        expect(document.getElementById('btn-cancel-booking-10')).toBeInTheDocument();
      });
    });

    it('renders fallback button with id="btn-browse-rooms-fallback" when no bookings', async () => {
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: [] });

      renderMyBookings();
      await waitFor(() => {
        expect(document.getElementById('btn-browse-rooms-fallback')).toBeInTheDocument();
      });
    });

    it('renders confirm modal buttons with correct IDs', async () => {
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockBookings });

      renderMyBookings();
      await waitFor(() => {
        expect(document.getElementById('btn-cancel-booking-10')).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById('btn-cancel-booking-10')!);

      await waitFor(() => {
        expect(document.getElementById('btn-confirm-modal-cancel')).toBeInTheDocument();
        expect(document.getElementById('btn-confirm-modal-ok')).toBeInTheDocument();
      });
    });
  });

  describe('Booking Status Rendering', () => {
    beforeEach(async () => {
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockBookings });
    });

    it('shows "Pending Approval" badge for pending bookings', async () => {
      renderMyBookings();
      await waitFor(() => {
        expect(screen.getByText('Pending Approval')).toBeInTheDocument();
      });
    });

    it('shows "Approved" badge for approved bookings', async () => {
      renderMyBookings();
      await waitFor(() => {
        expect(screen.getByText('Approved')).toBeInTheDocument();
      });
    });

    it('shows "Paid" payment badge for settled bookings', async () => {
      renderMyBookings();
      await waitFor(() => {
        expect(screen.getByText('Paid')).toBeInTheDocument();
      });
    });

    it('shows "Unpaid" payment badge for unpaid bookings', async () => {
      renderMyBookings();
      await waitFor(() => {
        expect(screen.getByText('Unpaid')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Booking Flow', () => {
    it('closes confirm modal when "Tidak" button is clicked', async () => {
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockBookings });

      renderMyBookings();
      await waitFor(() => {
        expect(document.getElementById('btn-cancel-booking-10')).toBeInTheDocument();
      });

      // Open confirm modal
      fireEvent.click(document.getElementById('btn-cancel-booking-10')!);
      await waitFor(() => {
        expect(document.getElementById('btn-confirm-modal-cancel')).toBeInTheDocument();
      });

      // Close by clicking "Tidak"
      fireEvent.click(document.getElementById('btn-confirm-modal-cancel')!);
      await waitFor(() => {
        expect(document.getElementById('btn-confirm-modal-cancel')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mock Payment Modal', () => {
    it('renders mock payment modal buttons with correct IDs', async () => {
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockBookings });
      // Simulate mock payment response
      (api.default.post as any).mockResolvedValue({
        data: { snapToken: 'MOCK-SNAP-TOKEN', isMock: true, orderId: 'ORDER-10', amount: 150000 },
      });

      renderMyBookings();
      await waitFor(() => {
        expect(document.getElementById('btn-pay-booking-10')).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById('btn-pay-booking-10')!);

      await waitFor(() => {
        expect(document.getElementById('btn-mock-payment-cancel')).toBeInTheDocument();
        expect(document.getElementById('btn-mock-payment-success')).toBeInTheDocument();
      });
    });
  });
});
