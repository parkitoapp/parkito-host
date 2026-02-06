"use client";

import type { PktReservation } from "@/types";

type PastBookingsProps = {
  bookings: PktReservation[];
};

export default function PastBookings({ bookings }: PastBookingsProps) {
  return (
    <div className="flex flex-1 flex-col min-h-[calc(100vh-70px)]">
      {bookings.length === 0 ? (
        <p className="text-muted-foreground">Nessuna prenotazione passata.</p>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b) => (
            <li
              key={b.id ?? `${b.parking_id}-${b.driver_id}-${b.start_datetime}`}
              className="rounded-lg border p-3"
            >
              <span className="font-medium">
                {new Date(b.start_datetime).toLocaleString()} –{" "}
                {new Date(b.end_datetime).toLocaleString()}
              </span>
              <span className="ml-2 text-muted-foreground">
                €{b.total_price} · {b.reserved_slots} slot
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
