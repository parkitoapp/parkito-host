"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { PktReservation } from "@/types";
import { useSelectedParking } from "@/providers/selected-parking-provider";
import { useParkingInfo } from "@/hooks/use-parking-info";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { GlobalLoading } from "./global-loading";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { PastBookingsTable } from "./bookings/PastBookingsTable";
import { UpcomingBookingsTable } from "./bookings/UpcomingBookingsTable";

const EMPTY_RESERVATIONS: PktReservation[] = [];

export default function BookingsTab() {
  const { selectedParkingId } = useSelectedParking();
  const { data: parkingInfo, isLoading, isFetching, error } = useParkingInfo(selectedParkingId);

  // Stable reference so effect dependency doesn’t change every render (avoids infinite loop).
  const rawReservations = useMemo(
    () => (parkingInfo?.reservations ?? EMPTY_RESERVATIONS) as PktReservation[],
    [parkingInfo?.reservations]
  );

  // Driver cache: enrich reservations that don't have driver from API
  const [driverCache, setDriverCache] = useState<
    Map<string, { name: string | null; surname: string | null }>
  >(new Map());

  const driverIdKey = useCallback((r: PktReservation) => {
    return String(r.driver_id ?? (r as Record<string, unknown>).driver_id ?? "");
  }, []);

  const reservations = useMemo(() => {
    return rawReservations.map((r) => {
      const rid = driverIdKey(r);
      const cached = rid ? driverCache.get(rid) : null;
      const driver = r.driver ?? cached ?? null;
      return driver ? { ...r, driver } : r;
    });
  }, [rawReservations, driverCache, driverIdKey]);

  useEffect(() => {
    const missing = rawReservations.filter(
      (r) => (r.driver_id || (r as Record<string, unknown>).driver_id) && !r.driver
    );
    if (missing.length === 0) return;
    const ids = [...new Set(missing.map(driverIdKey).filter(Boolean))];
    let cancelled = false;
    Promise.all(
      ids.map((id) =>
        fetch(`/api/driver/${encodeURIComponent(id)}`).then((res) =>
          res.ok ? res.json() : null
        )
      )
    ).then((results) => {
      if (cancelled) return;
      setDriverCache((prev) => {
        const next = new Map(prev);
        ids.forEach((id, i) => {
          const d = results[i];
          if (d && typeof d === "object" && "name" in d)
            next.set(id, {
              name: (d as { name?: string | null }).name ?? null,
              surname: (d as { surname?: string | null }).surname ?? null,
            });
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [rawReservations, driverIdKey]);

  // All hooks and derived values before any conditional return (Rules of Hooks).
  const pastBookings = useMemo(() => {
    const now = new Date();
    return reservations.filter((r) => {
      const end = new Date(r.end_datetime as unknown as string);
      return end < now;
    });
  }, [reservations]);

  const futureBookings = useMemo(() => {
    const now = new Date();
    return reservations.filter((r) => {
      const start = new Date(r.start_datetime as unknown as string);
      return start > now;
    });
  }, [reservations]);
  const hasMultipleFloors = (parkingInfo?.parking?.floors_count ?? 0) > 1;

  if (isLoading || isFetching) {
    return <GlobalLoading message="Caricamento prenotazioni..." />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Errore nel caricamento prenotazioni</AlertTitle>
        <AlertDescription>
          Si è verificato un errore nel caricamento delle prenotazioni. Si prega di riprovare più tardi.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full flex-1 bg-background">
      <div className="mx-auto flex h-full max-w-[1440px] flex-1 flex-col px-6 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Prenotazioni</h1>
          <p className="text-sm text-muted-foreground">
            Monitora e rivedi tutte le prenotazioni passate e future per questo parcheggio.
          </p>
        </div>

        <Tabs defaultValue="upcoming-bookings" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="upcoming-bookings">Prenotazioni Future</TabsTrigger>
            <TabsTrigger value="past-bookings">Prenotazioni Passate</TabsTrigger>
            {hasMultipleFloors && (
              <TabsTrigger value="active-bookings">Prenotazioni Attive</TabsTrigger>
            )}
          </TabsList>

          <div className="mt-4 flex-1">
            <TabsContent value="upcoming-bookings" className="mt-0">
              <UpcomingBookingsTable bookings={futureBookings} />
            </TabsContent>

            <TabsContent value="past-bookings" className="mt-0">
              <PastBookingsTable bookings={pastBookings} />
            </TabsContent>

            {hasMultipleFloors && (
              <TabsContent value="active-bookings" className="mt-0">
                <div className="text-sm text-muted-foreground">
                  Vista delle prenotazioni attive in arrivo presto.
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}