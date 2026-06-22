/**
 * Unit Tests: AdminDashboard
 * Tests tab navigation IDs, room management IDs, booking action IDs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../../pages/AdminDashboard';

// ─── Mock api ─────────────────────────────────────────────────────────────────
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockStats = {
  summary: { bookings: 10, rooms: 4, users: 8, revenue: 2500000 },
  statusStats: [
    { status: 'pending', count: '3' },
    { status: 'approved', count: '5' },
    { status: 'cancelled', count: '2' },
  ],
};

const mockRooms = [
  { id: 1, name: 'Focus Pod', description: 'Quiet', capacity: 1, price_per_hour: '50000', image_url: null },
  { id: 2, name: 'Meeting Room', description: 'Conference', capacity: 10, price_per_hour: '150000', image_url: null },
];

const mockAllBookings = [
  {
    id: 20,
    user_id: 2,
    room_id: 1,
    date: '2026-12-01',
    start_time: '09:00:00',
    end_time: '12:00:00',
    total_price: '150000',
    status: 'pending',
    created_at: '2026-11-01T10:00:00Z',
    room_name: 'Focus Pod',
    user_name: 'Budi Santoso',
    user_email: 'user1@spacebook.id',
    payment_order_id: null,
    payment_status: null,
  },
];

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderAdmin = async (client = createQueryClient()) => {
  const api = await import('../../lib/api');
  (api.default.get as any).mockImplementation((url: string) => {
    if (url.includes('/admin/stats')) return Promise.resolve({ data: mockStats });
    if (url.includes('/rooms')) return Promise.resolve({ data: mockRooms });
    if (url.includes('/bookings/admin/all')) return Promise.resolve({ data: mockAllBookings });
    return Promise.resolve({ data: [] });
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'admin-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1, name: 'Admin SpaceBook', email: 'admin@spacebook.id', role: 'admin',
    }));
  });

  describe('Tab Navigation IDs', () => {
    it('renders tab buttons with correct IDs', async () => {
      await renderAdmin();
      expect(document.getElementById('tab-reports')).toBeInTheDocument();
      expect(document.getElementById('tab-rooms')).toBeInTheDocument();
      expect(document.getElementById('tab-bookings')).toBeInTheDocument();
    });

    it('switches to Rooms tab when tab-rooms is clicked', async () => {
      await renderAdmin();
      fireEvent.click(document.getElementById('tab-rooms')!);
      await waitFor(() => {
        expect(document.getElementById('btn-create-room-trigger')).toBeInTheDocument();
      });
    });

    it('switches to Bookings tab when tab-bookings is clicked', async () => {
      await renderAdmin();
      fireEvent.click(document.getElementById('tab-bookings')!);
      await waitFor(() => {
        expect(document.getElementById('btn-approve-booking-20')).toBeInTheDocument();
      });
    });
  });

  describe('Reports Tab IDs', () => {
    it('renders CSV download button with id="btn-download-csv"', async () => {
      await renderAdmin();
      await waitFor(() => {
        expect(document.getElementById('btn-download-csv')).toBeInTheDocument();
      });
    });
  });

  describe('UI Content Rendering', () => {
    it('renders "Admin Dashboard" heading', async () => {
      await renderAdmin();
      expect(screen.getByText(/Admin Control Portal/i)).toBeInTheDocument();
    });

    it('renders tab labels: Reports, Rooms, Bookings', async () => {
      await renderAdmin();
      expect(document.getElementById('tab-reports')).toHaveTextContent(/Reports/i);
      expect(document.getElementById('tab-rooms')).toHaveTextContent(/Rooms/i);
      expect(document.getElementById('tab-bookings')).toHaveTextContent(/Bookings/i);
    });

    it('renders stat cards with summary data after load', async () => {
      await renderAdmin();
      await waitFor(() => {
        // Summary stats should be visible
        expect(screen.getByText('10')).toBeInTheDocument(); // bookings count
        expect(screen.getByText('4')).toBeInTheDocument();  // rooms count
        expect(screen.getByText('8')).toBeInTheDocument();  // users count
      });
    });

    it('renders room names in Rooms tab', async () => {
      await renderAdmin();
      fireEvent.click(document.getElementById('tab-rooms')!);
      await waitFor(() => {
        expect(screen.getByText('Focus Pod')).toBeInTheDocument();
        expect(screen.getByText('Meeting Room')).toBeInTheDocument();
      });
    });

    it('renders booking user info in Bookings tab', async () => {
      await renderAdmin();
      fireEvent.click(document.getElementById('tab-bookings')!);
      await waitFor(() => {
        expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
        expect(screen.getByText('Focus Pod')).toBeInTheDocument();
      });
    });
  });

  describe('Rooms Management IDs', () => {
    it('shows room create form when btn-create-room-trigger is clicked', async () => {
      await renderAdmin();
      fireEvent.click(document.getElementById('tab-rooms')!);
      await waitFor(() => {
        expect(document.getElementById('btn-create-room-trigger')).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById('btn-create-room-trigger')!);
      await waitFor(() => {
        expect(document.getElementById('room-form')).toBeInTheDocument();
        expect(document.getElementById('room-form-name')).toBeInTheDocument();
        expect(document.getElementById('room-form-capacity')).toBeInTheDocument();
        expect(document.getElementById('room-form-price')).toBeInTheDocument();
        expect(document.getElementById('room-form-description')).toBeInTheDocument();
        expect(document.getElementById('room-form-image')).toBeInTheDocument();
        expect(document.getElementById('btn-room-form-submit')).toBeInTheDocument();
        expect(document.getElementById('btn-room-form-cancel')).toBeInTheDocument();
      });
    });

    it('hides form when btn-room-form-cancel is clicked', async () => {
      await renderAdmin();
      fireEvent.click(document.getElementById('tab-rooms')!);
      await waitFor(() => {
        expect(document.getElementById('btn-create-room-trigger')).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById('btn-create-room-trigger')!);
      await waitFor(() => {
        expect(document.getElementById('room-form')).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById('btn-room-form-cancel')!);
      await waitFor(() => {
        expect(document.getElementById('room-form')).not.toBeInTheDocument();
      });
    });

    it('renders edit/delete buttons per room with correct IDs', async () => {
      await renderAdmin();
      fireEvent.click(document.getElementById('tab-rooms')!);
      await waitFor(() => {
        expect(document.getElementById('btn-edit-room-1')).toBeInTheDocument();
        expect(document.getElementById('btn-delete-room-1')).toBeInTheDocument();
        expect(document.getElementById('btn-edit-room-2')).toBeInTheDocument();
        expect(document.getElementById('btn-delete-room-2')).toBeInTheDocument();
      });
    });
  });

  describe('Bookings Management IDs', () => {
    it('renders approve/reject buttons per pending booking', async () => {
      await renderAdmin();
      fireEvent.click(document.getElementById('tab-bookings')!);
      await waitFor(() => {
        expect(document.getElementById('btn-approve-booking-20')).toBeInTheDocument();
        expect(document.getElementById('btn-reject-booking-20')).toBeInTheDocument();
      });
    });

    it('shows admin confirm modal when delete room is clicked', async () => {
      await renderAdmin();
      fireEvent.click(document.getElementById('tab-rooms')!);
      await waitFor(() => {
        expect(document.getElementById('btn-delete-room-1')).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById('btn-delete-room-1')!);
      await waitFor(() => {
        expect(document.getElementById('btn-admin-confirm-cancel')).toBeInTheDocument();
        expect(document.getElementById('btn-admin-confirm-ok')).toBeInTheDocument();
      });
    });
  });
});
