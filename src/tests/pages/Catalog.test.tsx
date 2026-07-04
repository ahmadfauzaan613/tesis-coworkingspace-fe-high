/**
 * Unit Tests: Catalog Page
 * Tests search/filter IDs, booking modal IDs, and basic rendering.
 * API calls are mocked via @tanstack/react-query.
 * Dummy data is generated dynamically via factories (mirrors real API shape).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Catalog from '../../pages/Catalog';
import { makeRoom } from '../factories';

// ─── Mock api ─────────────────────────────────────────────────────────────────
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const buildMockRooms = () => [
  makeRoom({ capacity: 1 }),
  makeRoom({ capacity: 10 }),
  makeRoom({ capacity: 20 }),
];

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderCatalog = (client = createQueryClient()) =>
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Catalog />
      </MemoryRouter>
    </QueryClientProvider>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('Catalog Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Filter & Search Element IDs (for automation)', () => {
    it('renders search input with id="catalog-search"', () => {
      renderCatalog();
      expect(document.getElementById('catalog-search')).toBeInTheDocument();
    });

    it('renders capacity filter with id="filter-capacity"', () => {
      renderCatalog();
      expect(document.getElementById('filter-capacity')).toBeInTheDocument();
    });

    it('renders sort selector with id="sort-price"', () => {
      renderCatalog();
      expect(document.getElementById('sort-price')).toBeInTheDocument();
    });
  });

  describe('Room Cards & Modal IDs', () => {
    let mockRooms: ReturnType<typeof buildMockRooms>;

    beforeEach(async () => {
      mockRooms = buildMockRooms();
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockRooms });
    });

    it('renders book buttons with id="btn-book-room-{id}" for each room', async () => {
      renderCatalog();
      await waitFor(() => {
        mockRooms.forEach((room) => {
          expect(document.getElementById(`btn-book-room-${room.id}`)).toBeInTheDocument();
        });
      });
    });

    it('renders detail buttons with id="btn-detail-room-{id}" for each room', async () => {
      renderCatalog();
      await waitFor(() => {
        expect(document.getElementById(`btn-detail-room-${mockRooms[0].id}`)).toBeInTheDocument();
        expect(document.getElementById(`btn-detail-room-${mockRooms[1].id}`)).toBeInTheDocument();
      });
    });

    it('opens booking modal when "Book Space" is clicked', async () => {
      renderCatalog();
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
      renderCatalog();
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
      renderCatalog();
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
      renderCatalog();
      const targetId = `btn-book-room-${mockRooms[0].id}`;
      await waitFor(() => {
        expect(document.getElementById(targetId)).toBeInTheDocument();
      });

      fireEvent.click(document.getElementById(targetId)!);

      await waitFor(() => {
        expect(document.getElementById('select-end-time')).toBeInTheDocument();
      });
    });

    it('closes modal when close button (id="btn-close-modal") is clicked', async () => {
      renderCatalog();
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
      renderCatalog();
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

    it('shows "Confirm Book" button for authenticated users', async () => {
      localStorage.setItem('token', 'fake-jwt-token');

      renderCatalog();
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

  describe('UI Content Rendering', () => {
    it('renders "Workspace Catalog" heading', () => {
      renderCatalog();
      expect(screen.getByText(/Workspace Catalog/i)).toBeInTheDocument();
    });

    it('renders room names after data loads', async () => {
      const mockRooms = buildMockRooms();
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockRooms });

      renderCatalog();
      await waitFor(() => {
        mockRooms.forEach((room) => {
          expect(screen.getByText(room.name)).toBeInTheDocument();
        });
      });
    });

    it('renders room price per hour', async () => {
      const mockRooms = buildMockRooms();
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockRooms });

      renderCatalog();
      await waitFor(() => {
        // Price text should appear (formatted IDR)
        expect(screen.getAllByText(/Rp/i).length).toBeGreaterThan(0);
      });
    });

    it('shows empty-state message when search finds no results', async () => {
      const mockRooms = buildMockRooms();
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockRooms });

      renderCatalog();
      await waitFor(() => {
        expect(document.getElementById('catalog-search')).toBeInTheDocument();
      });

      fireEvent.change(
        document.getElementById('catalog-search') as HTMLInputElement,
        { target: { value: 'nonexistentroom12345' } }
      );

      await waitFor(() => {
        expect(screen.getByText(/No Workspaces Found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Filtering', () => {
    let mockRooms: ReturnType<typeof buildMockRooms>;

    beforeEach(async () => {
      mockRooms = buildMockRooms();
      const api = await import('../../lib/api');
      (api.default.get as any).mockResolvedValue({ data: mockRooms });
    });

    it('filters rooms by search term', async () => {
      renderCatalog();
      await waitFor(() => {
        expect(document.getElementById(`btn-book-room-${mockRooms[0].id}`)).toBeInTheDocument();
      });

      const searchTerm = mockRooms[0].name.split(' ')[0];
      const searchInput = document.getElementById('catalog-search') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: searchTerm } });

      await waitFor(() => {
        expect(document.getElementById(`btn-book-room-${mockRooms[0].id}`)).toBeInTheDocument();
        // Other rooms with unrelated names should be filtered out
        mockRooms.slice(1).forEach((room) => {
          if (!room.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            expect(document.getElementById(`btn-book-room-${room.id}`)).not.toBeInTheDocument();
          }
        });
      });
    });
  });
});
