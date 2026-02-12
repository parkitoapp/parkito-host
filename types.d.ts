export type SupaSchema = Record<string, never>;

// Driver data from pkt_driver table
export interface DriverData {
  id: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  TIN: string;
  veriff_status: string;
  created_at: string | null;
  // Add more fields as needed from your pkt_driver table
}

// Host data from pkt_host table
export interface HostData {
  id: string;
  driver_id: string;
  created_at: string | null;
  iban: string;
  stripe_id: string;
  // Add more fields as needed from your pkt_host table
}

export type ErrorType = {
  title: string;
  message: string;
  onClick?: () => void;
  src?: string;
};

export interface UserWithDriver {
  id: string;
  email: string | null;
  driver: DriverData | null;
  host: HostData | null;
}

export type VehicleType = {
  1: "Moto";
  2: "Utilitaria";
  3: "Berlina";
  4: "Station Wagon";
  5: "SUV";
  6: "Van";
};

export type vehicleOptionsType = {
  label: string;
  dimension: { length: number; width: number; height: number };
  image: ImageSourcePropType;
  id: number;
};

export type ParkType = {
  1: "Posto auto coperto";
  2: "Box Auto";
  3: "Autorimessa";
  4: "Posto auto scoperto";
  5: "Silo Meccanizzato";
};

export type DimensionType = {
  width: number;
  height: number;
  length: number;
};

export type Parking = {
  id: string;
  address: string;
  city: string;
  zip_code: string;
  is_available: boolean;
  vehicle_type: VehicleType;
  parking_type: ParkType;
  lat: number;
  long: number;
  base_hourly_price: number;
  media_urls: string[];
  total_slots: number;
  acceptsGPL: boolean;
  inZTL: boolean;
  activationStatus: "active" | "inactive" | "configured";
  info_parcheggio_completed: boolean;
  prezzi_disponibilita_completed: boolean;
  descrizione_accesso_completed: boolean;
  galleria_foto_completed: boolean;
  weight: string | "1000";
  floors_count: number | 0;
  dimensions: DimensionType;
  perks: string[] | [];
  is_insured: boolean | false;
  /** Base hourly price from pkt_parking; can be overridden by pkt_availability.hourly_price per slot */
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

/** Minimal driver info joined from pkt_driver for display (name/surname) */
export interface PktReservationDriver {
  name: string | null;
  surname: string | null;
}

/** Row from pkt_reservations (FK parking_id). driver is joined from pkt_driver when fetched server-side. */
export interface PktReservation {
  id?: string;
  parking_id: string;
  driver_id: string;
  /** Joined from pkt_driver (name, surname) when loading reservations */
  driver?: PktReservationDriver | null;
  start_datetime: Date;
  end_datetime: Date;
  total_price: number;
  reserved_slots: number;
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

export type servicesType = {
  id: string;
  src: string;
  title: string;
  description: string;
  url: string;
};
