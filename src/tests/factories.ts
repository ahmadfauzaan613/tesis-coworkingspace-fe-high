/**
 * Dummy data factories for unit tests.
 *
 * Instead of hardcoding fixture literals in every test file, these factories
 * generate randomized data (via @faker-js/faker) that mirrors the shapes the
 * real backend sends/stores. Each factory accepts `overrides` so a test can
 * pin down the one or two fields its assertions actually depend on (e.g. a
 * specific `status`) while everything else stays random from run to run.
 */
import { faker } from '@faker-js/faker';

const roomKinds = ['Pod', 'Room', 'Suite', 'Hall', 'Studio', 'Chamber'] as const;

export interface RoomFixture {
  id: number;
  name: string;
  description: string;
  capacity: number;
  price_per_hour: string;
  image_url: string | null;
}

export function makeRoom(overrides: Partial<RoomFixture> = {}): RoomFixture {
  return {
    id: faker.number.int({ min: 1, max: 9999 }),
    name: `${faker.word.adjective({ length: { min: 3, max: 10 } })} ${faker.helpers.arrayElement(roomKinds)}`
      .replace(/^./, (c) => c.toUpperCase()),
    description: faker.lorem.sentence(),
    capacity: faker.number.int({ min: 1, max: 30 }),
    price_per_hour: String(faker.number.int({ min: 20000, max: 500000 })),
    image_url: null,
    ...overrides,
  };
}

export function makeRooms(count = 3, overrides: Partial<RoomFixture> = {}): RoomFixture[] {
  return Array.from({ length: count }, () => makeRoom(overrides));
}

export interface ConflictingBookingFixture {
  id: number;
  start_time: string;
  end_time: string;
}

export function makeConflictingBooking(
  overrides: Partial<ConflictingBookingFixture> = {}
): ConflictingBookingFixture {
  const startHour = faker.number.int({ min: 8, max: 18 });
  const endHour = startHour + faker.number.int({ min: 1, max: 3 });
  return {
    id: faker.number.int({ min: 1, max: 9999 }),
    start_time: `${String(startHour).padStart(2, '0')}:00:00`,
    end_time: `${String(endHour).padStart(2, '0')}:00:00`,
    ...overrides,
  };
}

export type UserRole = 'customer' | 'admin';

export interface UserFixture {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
}

export function makeUser(overrides: Partial<UserFixture> = {}): UserFixture {
  const name = overrides.name ?? faker.person.fullName();
  return {
    id: faker.number.int({ min: 1, max: 9999 }),
    name,
    email: faker.internet.email({ firstName: name.split(' ')[0] }).toLowerCase(),
    role: 'customer',
    avatar_url: null,
    ...overrides,
  };
}

export interface AuthPayloadFixture {
  token: string;
  user: UserFixture;
}

export function makeAuthPayload(overrides: Partial<AuthPayloadFixture> = {}): AuthPayloadFixture {
  const { user: userOverrides, ...rest } = overrides;
  return {
    token: faker.string.alphanumeric(24),
    ...rest,
    user: makeUser(userOverrides),
  };
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type PaymentStatus = 'settled' | 'pending' | 'failed' | null;

export interface MyBookingFixture {
  id: number;
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
  total_price: string;
  status: BookingStatus;
  created_at: string;
  room_name: string;
  room_image: string | null;
  price_per_hour: string;
  payment_order_id: string | null;
  payment_snap_token: string | null;
  payment_status: PaymentStatus;
}

export function makeMyBooking(overrides: Partial<MyBookingFixture> = {}): MyBookingFixture {
  const startHour = faker.number.int({ min: 8, max: 18 });
  const endHour = startHour + faker.number.int({ min: 1, max: 3 });
  const pricePerHour = faker.number.int({ min: 20000, max: 500000 });
  return {
    id: faker.number.int({ min: 1, max: 9999 }),
    room_id: faker.number.int({ min: 1, max: 9999 }),
    date: faker.date.soon({ days: 30 }).toISOString().split('T')[0],
    start_time: `${String(startHour).padStart(2, '0')}:00:00`,
    end_time: `${String(endHour).padStart(2, '0')}:00:00`,
    total_price: String(pricePerHour * (endHour - startHour)),
    status: 'pending',
    created_at: faker.date.recent({ days: 10 }).toISOString(),
    room_name: `${faker.word.adjective()} ${faker.helpers.arrayElement(roomKinds)}`,
    room_image: null,
    price_per_hour: String(pricePerHour),
    payment_order_id: null,
    payment_snap_token: null,
    payment_status: null,
    ...overrides,
  };
}

export interface AllBookingFixture {
  id: number;
  user_id: number;
  room_id: number;
  date: string;
  start_time: string;
  end_time: string;
  total_price: string;
  status: BookingStatus;
  created_at: string;
  room_name: string;
  user_name: string;
  user_email: string;
  payment_order_id: string | null;
  payment_status: PaymentStatus;
}

export function makeAllBooking(overrides: Partial<AllBookingFixture> = {}): AllBookingFixture {
  const startHour = faker.number.int({ min: 8, max: 18 });
  const endHour = startHour + faker.number.int({ min: 1, max: 3 });
  const pricePerHour = faker.number.int({ min: 20000, max: 500000 });
  const user = makeUser();
  return {
    id: faker.number.int({ min: 1, max: 9999 }),
    user_id: user.id,
    room_id: faker.number.int({ min: 1, max: 9999 }),
    date: faker.date.soon({ days: 30 }).toISOString().split('T')[0],
    start_time: `${String(startHour).padStart(2, '0')}:00:00`,
    end_time: `${String(endHour).padStart(2, '0')}:00:00`,
    total_price: String(pricePerHour * (endHour - startHour)),
    status: 'pending',
    created_at: faker.date.recent({ days: 10 }).toISOString(),
    room_name: `${faker.word.adjective()} ${faker.helpers.arrayElement(roomKinds)}`,
    user_name: user.name,
    user_email: user.email,
    payment_order_id: null,
    payment_status: null,
    ...overrides,
  };
}

export interface AdminStatsFixture {
  summary: {
    bookings: number;
    rooms: number;
    users: number;
    revenue: number;
  };
  statusStats: Array<{ status: string; count: string }>;
}

export function makeAdminStats(overrides: Partial<AdminStatsFixture> = {}): AdminStatsFixture {
  return {
    summary: {
      bookings: faker.number.int({ min: 1, max: 100 }),
      rooms: faker.number.int({ min: 1, max: 20 }),
      users: faker.number.int({ min: 1, max: 200 }),
      revenue: faker.number.int({ min: 100000, max: 50000000 }),
      ...(overrides.summary ?? {}),
    },
    statusStats: overrides.statusStats ?? [
      { status: 'pending', count: String(faker.number.int({ min: 0, max: 20 })) },
      { status: 'approved', count: String(faker.number.int({ min: 0, max: 20 })) },
      { status: 'cancelled', count: String(faker.number.int({ min: 0, max: 20 })) },
    ],
  };
}
