export type SupaSchema = Record<string, never>;

// Driver data from pkt_driver table
export interface DriverData {
  id: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string | null;
  // Add more fields as needed from your pkt_driver table
}

// Host data from pkt_host table
export interface HostData {
  id: string;
  driver_id: string;
  created_at: string | null;
  // Add more fields as needed from your pkt_host table
}

export interface UserWithDriver {
  id: string;
  email: string | null;
  driver: DriverData | null;
  host: HostData | null;
}

export type Parking = {
  id: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  created_at: string;
  /** Base hourly price from pkt_parking; can be overridden by pkt_availability.hourly_price per slot */
  base_hourly_price?: number | null;
};

// Calendar & availability
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
}

export interface AvailabilityData {
  date: string;
  available: boolean;
  price: number;
}

export interface TimeSlotInfo {
  available: boolean;
  price?: number;
}

export type DayState =
  | "default"
  | "custom-price"
  | "time-slots"
  | "unavailable"
  | "time-slot-unavailable";

/** Per-day availability/price for calendar display (derived from pkt_availability) */
export interface ParkingDayInfo {
  date: string; // YYYY-MM-DD
  state: DayState;
  price?: number;
}

/** Row from pkt_availability (FK parking_id). Each record = one time slot; multiple records per day = multiple slots. */
export interface PktAvailability {
  id?: number;
  parking_id: string;
  start_datetime: string; // ISO or date-time
  end_datetime: string;
  is_available: boolean;
  hourly_price?: number | null; // overrides parking base_hourly_price for this slot
  /** Recurrence rule serialized as text (e.g. RRULE or custom); truthy = part of a recurring series */
  recurrence_rule?: string | null;
  [key: string]: unknown; // 3 columns skipped for now
}

/** Row from pkt_reservations (FK parking_id) */
export interface PktReservation {
  id?: string;
  parking_id: string;
  [key: string]: unknown;
}

/** Full parking data: info + availability + reservations, fetched once and cached weekly */
export interface ParkingFullInfo {
  parking: Parking;
  availability: PktAvailability[];
  reservations: PktReservation[];
  days: ParkingDayInfo[]; // derived from availability for calendar
}

/** @deprecated Use ParkingFullInfo */
export type ParkingWithAvailability = ParkingFullInfo;

export type TeamMember = {
  id: string;
  name: string;
  url: string;
  image: string;
};

export type SelectOption = {
  label: string;
  memberId: string;
};
