/**
 * Componente per la tabella delle prenotazioni future
 * Mostra le prenotazioni future in una tabella
 * - Prenotazioni future
 * - Bottone per aprire il dettaglio della prenotazione
 * - Sheet per il dettaglio della prenotazione
 * - DataTable per la visualizzazione delle prenotazioni
 * - futureColumns per le colonne della tabella
 * - BookingDetailSheetContent per il dettaglio della prenotazione
 * - Sheet per il dettaglio della prenotazione
 * - SheetContent per il contenuto del sheet
 * - SheetHeader per il header del sheet
 * @param bookings - Le prenotazioni future
 * @returns Un componente React che mostra le prenotazioni future
 */


"use client"

import * as React from "react"

import type { PktReservation } from "@/types"
import { DataTable } from "@/components/data-table"
import { futureColumns } from "@/components/bookings/futureColumns"
import { BookingDetailSheetContent } from "@/components/bookings/BookingDetailSheetContent"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

type UpcomingBookingsTableProps = {
  bookings: PktReservation[]
}

export function UpcomingBookingsTable({ bookings }: UpcomingBookingsTableProps) {
  const [selected, setSelected] = React.useState<PktReservation | null>(null)
  const [open, setOpen] = React.useState(false)

  // Default sort: soonest booking first (by start_datetime ascending)
  const sorted = React.useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aStart = new Date(a.start_datetime as unknown as string).getTime()
      const bStart = new Date(b.start_datetime as unknown as string).getTime()
      return aStart - bStart
    })
  }, [bookings])

  function handleRowClick(row: PktReservation) {
    setSelected(row)
    setOpen(true)
  }

  return (
    <>
      <DataTable<PktReservation, unknown>
        columns={futureColumns}
        data={sorted}
        onRowClick={handleRowClick}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="top-4 right-4 bottom-4 left-auto flex h-[calc(100vh-2rem)] w-[400px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border shadow-xl overflow-hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Dettagli prenotazione</SheetTitle>
            <SheetDescription>
              Informazioni dettagliate sulla prenotazione selezionata.
            </SheetDescription>
          </SheetHeader>

          {selected ? (
            <div className="flex flex-1 flex-col overflow-y-auto px-4 pt-2">
              <BookingDetailSheetContent
                booking={selected}
                statusLabelFallback="Confermato"
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

