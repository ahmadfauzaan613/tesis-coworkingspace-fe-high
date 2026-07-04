/**
 * Unit Tests: AdminDashboard
 * Tests tab navigation IDs, room management IDs, booking action IDs.
 * Dummy data is generated dynamically via factories (mirrors real API shape).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../../pages/AdminDashboard';
import { makeAdminStats, makeAllBooking, makeRoom, makeUser } from '../factories';

// ─── Mock api ─────────────────────────────────────────────────────────────────
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const buildFixtures = () => {
  const stats = makeAdminStats();
  const rooms = [makeRoom(), makeRoom()];
  const bookingUser = makeUser({ role: 'customer' });
  const allBookings = [
    makeAllBooking({
      status: 'pending',
      room_id: rooms[0].id,
      room_name: rooms[0].name,
      user_id: bookingUser.id,
      user_name: bookingUser.name,
      user_email: bookingUser.email,
    }),
  ];
  return { stats, rooms, allBookings };
};

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderAdmin = async (
  fixtures: ReturnType<typeof buildFixtures>,
  client = createQueryClient()
) => {
  const api = await import('../../lib/api');
  (api.default.get as any).mockImplementation((url: string) => {
    if (url.includes('/admin/stats')) return Promise.resolve({ data: fixtures.stats });
    if (url.includes('/rooms')) return Promise.resolve({ data: fixtures.rooms });
    if (url.includes('/bookings/admin/all')) return Promise.resolve({ data: fixtures.allBookings });
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
    const adminUser = makeUser({ role: 'admin' });
    localStorage.setItem('token', 'admin-token');
    localStorage.setItem('user', JSON.stringify(adminUser));
  });

  describe('Tab Navigation IDs', () => {
    it('renders tab buttons with correct IDs', async () => {
      await renderAdmin(buildFixtures());
      expect(document.getElementById('tab-reports')).toBeInTheDocument();
      expect(document.getElementById('tab-rooms')).toBeInTheDocument();
      expect(document.getElementById('tab-bookings')).toBeInTheDocument();
    });

    it('switches to Rooms tab when tab-rooms is clicked', async () => {
      await renderAdmin(buildFixtures());
      fireEvent.click(document.getElementById('tab-rooms')!);
      await waitFor(() => {
        expect(document.getElementById('btn-create-room-trigger')).toBeInTheDocument();
      });
    });

    it('switches to Bookings tab when tab-bookings is clicked', async () => {
      const fixtures = buildFixtures();
      await renderAdmin(fixtures);
      fireEvent.click(document.getElementById('tab-bookings')!);
      await waitFor(() => {
        expect(
          document.getElementById(`btn-approve-booking-${fixtures.allBookings[0].id}`)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Reports Tab IDs', () => {
    it('renders CSV download button with id="btn-download-csv"', async () => {
      await renderAdmin(buildFixtures());
      await waitFor(() => {
        expect(document.getElementById('btn-download-csv')).toBeInTheDocument();
      });
    });
  });

  describe('UI Content Rendering', () => {
    it('renders "Admin Dashboard" heading', async () => {
      await renderAdmin(buildFixtures());
      expect(screen.getByText(/Admin Control Portal/i)).toBeInTheDocument();
    });

    it('renders tab labels: Reports, Rooms, Bookings', async () => {
      await renderAdmin(buildFixtures());
      expect(document.getElementById('tab-reports')).toHaveTextContent(/Reports/i);
      expect(document.getElementById('tab-rooms')).toHaveTextContent(/Rooms/i);
      expect(document.getElementById('tab-bookings')).toHaveTextContent(/Bookings/i);
    });

    it('renders stat cards with summary data after load', async () => {
      const fixtures = buildFixtures();
      await renderAdmin(fixtures);
      await waitFor(() => {
        const bookingsLabel = screen.getByText('Total Booking Requests');
        const roomsLabel = screen.getByText('Active Workspace Rooms');
        const usersLabel = screen.getByText('Registered Accounts');
        expect(bookingsLabel.nextElementSibling).toHaveTextContent(String(fixtures.stats.summary.bookings));
        expect(roomsLabel.nextElementSibling).toHaveTextContent(String(fixtures.stats.summary.rooms));
        expect(usersLabel.nextElementSibling).toHaveTextContent(String(fixtures.stats.summary.users));
      });
    });

    it('renders room names in Rooms tab', async () => {
      const fixtures = buildFixtures();
      await renderAdmin(fixtures);
      fireEvent.click(document.getElementById('tab-rooms')!);
      await waitFor(() => {
        fixtures.rooms.forEach((room) => {
          expect(screen.getByText(room.name)).toBeInTheDocument();
        });
      });
    });

    it('renders booking user info in Bookings tab', async () => {
      const fixtures = buildFixtures();
      await renderAdmin(fixtures);
      fireEvent.click(document.getElementById('tab-bookings')!);
      await waitFor(() => {
        expect(screen.getByText(fixtures.allBookings[0].user_name)).toBeInTheDocument();
        expect(screen.getByText(fixtures.allBookings[0].room_name)).toBeInTheDocument();
      });
    });
  });

  describe('Rooms Management IDs', () => {
    it('shows room create form when btn-create-room-trigger is clicked', async () => {
      await renderAdmin(buildFixtures());
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
      await renderAdmin(buildFixtures());
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
      const fixtures = buildFixtures();
      await renderAdmin(fixtures);
      fireEvent.click(document.getElementById('tab-rooms')!);
      await waitFor(() => {
        fixtures.rooms.forEach((room) => {
          expect(document.getElementById(`btn-edit-room-${room.id}`)).toBeInTheDocument();
          expect(document.getElementById(`btn-delete-room-${room.id}`)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Bookings Management IDs', () => {
    it('renders approve/reject buttons per pending booking', async () => {
      const fixtures = buildFixtures();
      await renderAdmin(fixtures);
      fireEvent.click(document.getElementById('tab-bookings')!);
      await waitFor(() => {
        expect(
          document.getElementById(`btn-approve-booking-${fixtures.allBookings[0].id}`)
        ).toBeInTheDocument();
        expect(
          document.getElementById(`btn-reject-booking-${fixtures.allBookings[0].id}`)
        ).toBeInTheDocument();
      });
    });

    it('shows admin confirm modal when delete room is clicked', async () => {
      const fixtures = buildFixtures();
      await renderAdmin(fixtures);
      fireEvent.click(document.getElementById('tab-rooms')!);
      await waitFor(() => {
        expect(document.getElementById(`btn-delete-room-${fixtures.rooms[0].id}`)).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById(`btn-delete-room-${fixtures.rooms[0].id}`)!);
      await waitFor(() => {
        expect(document.getElementById('btn-admin-confirm-cancel')).toBeInTheDocument();
        expect(document.getElementById('btn-admin-confirm-ok')).toBeInTheDocument();
      });
    });
  });
});
