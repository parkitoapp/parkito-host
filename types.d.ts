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
