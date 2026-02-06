"use client";

import type { PktReservation } from "@/types";
import { useSelectedParking } from "@/providers/selected-parking-provider";
import { useParkingInfo } from "@/hooks/use-parking-info";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { GlobalLoading } from "./global-loading";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import FutureBookings from "./FutureBookings";
import PastBookings from "./PastBookings";

export default function BookingsTab() {
  const { selectedParkingId } = useSelectedParking();
  const { data: parkingInfo, isLoading, isFetching, error } = useParkingInfo(selectedParkingId);

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

  const reservations: PktReservation[] = (parkingInfo?.reservations ?? []) as PktReservation[];
  const now = new Date();

  const futureBookings = reservations.filter((r) => {
    const start = new Date(r.start_datetime);
    return !r.is_started && start > now;
  });

  const pastBookings = reservations.filter((r) => {
    const end = new Date(r.end_datetime);
    return r.is_ended || end < now;
  });

  const hasMultipleFloors = (parkingInfo?.parking.floors_count ?? 0) > 1;

  return (
    <Tabs defaultValue="future-bookings">
      <TabsList className="w-full">
        {hasMultipleFloors && (
          <TabsTrigger value="active-bookings">Prenotazioni attive</TabsTrigger>
        )}
        <TabsTrigger value="future-bookings">Prenotazioni future</TabsTrigger>
        <TabsTrigger value="past-bookings">Prenotazioni passate</TabsTrigger>
      </TabsList>
      {hasMultipleFloors && (
        <TabsContent value="active-bookings">
          <div className="flex flex-1 flex-col min-h-[calc(100vh-70px)]">
            <div className="flex flex-1 flex-col min-h-[calc(100vh-70px)]">
              <h1>Prenotazioni attive</h1>
            </div>
          </div>
        </TabsContent>
      )}
      <TabsContent value="future-bookings">
        <FutureBookings bookings={futureBookings} />
      </TabsContent>
      <TabsContent value="past-bookings">
        <PastBookings bookings={pastBookings} />
      </TabsContent>
    </Tabs>
  );
}