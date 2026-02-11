"use client"

import { useUser } from "@/providers/user-provider"
import { useSelectedParking } from "@/providers/selected-parking-provider"
import { useParkingInfo } from "@/hooks/use-parking-info"
import { UpcomingBookingsTable } from "@/components/bookings/UpcomingBookingsTable"
import type { PktReservation } from "@/types"
import { Empty, EmptyTitle, EmptyDescription, EmptyMedia, EmptyHeader, EmptyContent } from "./ui/empty"
import { BookOpenIcon } from "lucide-react"

export function DashboardUpcomingBookings() {
  const { user } = useUser()
  const { selectedParkingId } = useSelectedParking()
  const { data: parkingInfo, isLoading, isFetching, error } = useParkingInfo(selectedParkingId)

  if (!user) {
    return <p className="text-sm text-blue-100">Caricamento...</p>
  }

  const reservations = (parkingInfo?.reservations ?? []) as PktReservation[]

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  // Prenotazioni future che iniziano entro le prossime 24 ore
  const upcomingWithin24h = reservations.filter((r) => {
    const start = new Date(r.start_datetime as unknown as string)
    return start > now && start <= in24h
  })

  // Prenotazioni attive: adesso è compreso tra start ed end
  const activeBookings = reservations.filter((r) => {
    const start = new Date(r.start_datetime as unknown as string)
    const end = new Date(r.end_datetime as unknown as string)
    return start <= now && end >= now
  })

  // Unione (senza duplicati) e ordinamento per data di inizio
  const highlightedBookings: PktReservation[] = Array.from(
    new Map(
      [...upcomingWithin24h, ...activeBookings].map((r) => [
        String(r.id ?? `${r.parking_id}-${r.start_datetime}-${r.end_datetime}`),
        r,
      ])
    ).values()
  ).sort((a, b) => {
    const aStart = new Date(a.start_datetime as unknown as string).getTime()
    const bStart = new Date(b.start_datetime as unknown as string).getTime()
    return aStart - bStart
  })

  return (
    <div className="flex-1 bg-background/5 rounded-lg p-4 overflow-hidden">
      <h2 className="text-lg font-semibold text-white mb-2">Prenotazioni imminenti</h2>
      <p className="text-xs text-blue-100 mb-4">
        Prenotazioni che iniziano nelle prossime 24 ore e prenotazioni attive in corso.
      </p>

      {(!selectedParkingId || isLoading || isFetching) && (
        <p className="text-sm text-blue-100">Caricamento prenotazioni...</p>
      )}

      {error && !isLoading && !isFetching && (
        <p className="text-sm text-red-200">
          Errore nel caricamento delle prenotazioni. Riprova tra qualche istante.
        </p>
      )}

      {!isLoading && !isFetching && !error && highlightedBookings.length === 0 && (
        <Empty className="flex flex-1 h-[calc(100%-5rem)] flex-col items-center justify-center rounded-md border border-dashed border-blue-300/40 bg-blue-900/20 px-4 py-8 text-center">
          <EmptyHeader>
            <EmptyMedia>
              <BookOpenIcon className="size-10 text-blue-50" />
            </EmptyMedia>
            <EmptyTitle>
              Nessuna prenotazione imminente
            </EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <EmptyDescription>
              Non ci sono prenotazioni attive o in partenza nelle prossime 24 ore per questo parcheggio.
            </EmptyDescription>
          </EmptyContent>

        </Empty>
      )}

      {!isLoading && !isFetching && !error && highlightedBookings.length > 0 && (
        <div className="bg-background rounded-md p-2">
          <UpcomingBookingsTable bookings={highlightedBookings} />
        </div>
      )}
    </div>
  )
}

