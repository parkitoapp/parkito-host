export type SupaSchema = Record<string, never>;

// Driver data from pkt_driver table
export interface DriverData {
    id: string
    name: string | null
    surname: string | null
    email: string | null
    phone: string | null
    avatar_url: string | null
    created_at: string | null
    // Add more fields as needed from your pkt_driver table
}

// Host data from pkt_host table
export interface HostData {
    id: string
    driver_id: string
    created_at: string | null
    // Add more fields as needed from your pkt_host table
}

export interface UserWithDriver {
    id: string
    email: string | null
    driver: DriverData | null
    host: HostData | null
}
