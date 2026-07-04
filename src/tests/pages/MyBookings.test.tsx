/**
 * Unit Tests: MyBookings Page
 * Tests element IDs for automation, booking card rendering, and cancel/pay buttons.
 * Dummy data is generated dynamically via factories (mirrors real API shape).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { faker } from '@faker-js/faker';
import MyBookings from '../../pages/MyBookings';
import { makeMyBooking, makeUser } from '../factories';

// ─── Mock api ─────────────────────────────────────────────────────────────────
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const buildMockBookings = () => [
  makeMyBooking({ status: 'pending', payment_status: null }),
  makeMyBooking({
    status: 'approved',
    payment_status: 'settled',
    payment_order_id: `ORDER-${faker.string.alphanumeric(8).toUpperCase()}`,
    payment_snap_token: faker.string.alphanumeric(16),
  }),
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
    const user = makeUser({ role: 'customer' });
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify(user));
  });

  describe('Element IDs for Automation', () => {
    it('renders pay button with id="btn-pay-booking-{id}" for pending bookings', async () => {
      const mockBookings = buildMockBookings();
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockBookings });

      renderMyBookings();
      await waitFor(() => {
        // Pending booking should show pay button
        expect(document.getElementById(`btn-pay-booking-${mockBookings[0].id}`)).toBeInTheDocument();
      });
    });

    it('renders cancel button with id="btn-cancel-booking-{id}" for cancellable bookings', async () => {
      const mockBookings = buildMockBookings();
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockBookings });

      renderMyBookings();
      await waitFor(() => {
        // Pending and unpaid should show cancel button
        expect(document.getElementById(`btn-cancel-booking-${mockBookings[0].id}`)).toBeInTheDocument();
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
      const mockBookings = buildMockBookings();
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockBookings });

      renderMyBookings();
      await waitFor(() => {
        expect(document.getElementById(`btn-cancel-booking-${mockBookings[0].id}`)).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById(`btn-cancel-booking-${mockBookings[0].id}`)!);

      await waitFor(() => {
        expect(document.getElementById('btn-confirm-modal-cancel')).toBeInTheDocument();
        expect(document.getElementById('btn-confirm-modal-ok')).toBeInTheDocument();
      });
    });
  });

  describe('Booking Status Rendering', () => {
    let mockBookings: ReturnType<typeof buildMockBookings>;

    beforeEach(async () => {
      mockBookings = buildMockBookings();
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
      const mockBookings = buildMockBookings();
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockBookings });

      renderMyBookings();
      await waitFor(() => {
        expect(document.getElementById(`btn-cancel-booking-${mockBookings[0].id}`)).toBeInTheDocument();
      });

      // Open confirm modal
      fireEvent.click(document.getElementById(`btn-cancel-booking-${mockBookings[0].id}`)!);
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
      const mockBookings = buildMockBookings();
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockBookings });
      // Simulate mock payment response
      (api.default.post as any).mockResolvedValue({
        data: {
          snapToken: 'MOCK-SNAP-TOKEN',
          isMock: true,
          orderId: `ORDER-${mockBookings[0].id}`,
          amount: parseFloat(mockBookings[0].total_price),
        },
      });

      renderMyBookings();
      await waitFor(() => {
        expect(document.getElementById(`btn-pay-booking-${mockBookings[0].id}`)).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById(`btn-pay-booking-${mockBookings[0].id}`)!);

      await waitFor(() => {
        expect(document.getElementById('btn-mock-payment-cancel')).toBeInTheDocument();
        expect(document.getElementById('btn-mock-payment-success')).toBeInTheDocument();
      });
    });
  });
});
