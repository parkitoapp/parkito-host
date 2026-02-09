"use client"

import * as React from "react"

import type { PktReservation } from "@/types"
import { DataTable } from "@/components/data-table"
import { pastColumns } from "@/components/bookings/pastColumns"
import { BookingDetailSheetContent } from "@/components/bookings/BookingDetailSheetContent"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

type PastBookingsTableProps = {
  bookings: PktReservation[]
}

export function PastBookingsTable({ bookings }: PastBookingsTableProps) {
  const [selected, setSelected] = React.useState<PktReservation | null>(null)
  const [open, setOpen] = React.useState(false)

  // Default sort: most recent bookings first (by end_datetime descending)
  const sorted = React.useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aEnd = new Date(a.end_datetime as unknown as string).getTime()
      const bEnd = new Date(b.end_datetime as unknown as string).getTime()
      return bEnd - aEnd
    })
  }, [bookings])

  function handleRowClick(row: PktReservation) {
    setSelected(row)
    setOpen(true)
  }

  return (
    <>
      <DataTable<PktReservation, unknown>
        columns={pastColumns}
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
                statusLabelFallback="Completed"
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

