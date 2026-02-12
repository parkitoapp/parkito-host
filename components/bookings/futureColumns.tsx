/**
 * Componente per le colonne della tabella delle prenotazioni future
 * Mostra le colonne della tabella delle prenotazioni future
 * - ID prenotazione
 * - Driver
 * - Data inizio
 * - Data fine
 * - Inizia tra
 * - Guadagno netto
 * - Stato
 */

"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { PktReservation } from "@/types"
import { Badge } from "@/components/ui/badge"
import {
  shortenId,
  formatDateAndTime,
  formatCurrency,
  formatStartsIn,
  getGuestName,
  getInitials,
  getStatusBadge,
  getStartTimeMs,
} from "@/lib/bookings-table-utils"
import { NeonAvatar } from "@/components/NeonAvatar"

export const futureColumns: ColumnDef<PktReservation>[] = [
  {
    accessorKey: "id",
    header: "ID Prenotazione",
    cell: ({ row }) => (
      <p className="text-md text-chart-2 ml-6">
        # {shortenId(row.original.id)}
      </p>
    ),
  },
  {
    id: "guest",
    header: "Driver",
    cell: ({ row }) => {
      const value = getGuestName(row.original)
      const initials = getInitials(value)
      return (
        <div className="flex items-center gap-2">
          <NeonAvatar
            seed={value}
            alt={value}
            initials={initials}
            fallbackClassName="text-xs font-semibold uppercase"
          />
          <p className="text-md">{value}</p>
        </div>
      )
    },
  },
  {
    accessorKey: "start_datetime",
    header: "Data Inizio",
    cell: ({ row }) => {
      const { date, time } = formatDateAndTime(row.original.start_datetime)
      return (
        <span className="block text-md">
          <span className="block text-foreground">{date}</span>
          <span className="block text-muted-foreground">{time}</span>
        </span>
      )
    },
  },
  {
    accessorKey: "end_datetime",
    header: "Data Fine",
    cell: ({ row }) => {
      const { date, time } = formatDateAndTime(row.original.end_datetime)
      return (
        <span className="block text-md">
          <span className="block text-foreground">{date}</span>
          <span className="block text-muted-foreground">{time}</span>
        </span>
      )
    },
  },
  {
    id: "starts_in",
    header: "Inizia tra",
    accessorFn: (row) => getStartTimeMs(row),
    cell: ({ row }) => (
      <span className="text-sm text-foreground">
        {formatStartsIn(row.original.start_datetime)}
      </span>
    ),
  },
  {
    accessorKey: "total_price",
    header: "Guadagno Netto Previsto",
    cell: ({ row }) => (
      <span className="font-medium">
        {formatCurrency(row.original.total_price)}
      </span>
    ),
  },
  {
    id: "status",
    header: "Stato",
    cell: ({ row }) => {
      const raw = (row.original as PktReservation & { status?: string }).status
      const label = raw
      const { variant, className } = getStatusBadge(raw)
      return (
        <Badge variant={variant} className={className}>
          {label}
        </Badge>
      )
    },
  },
]
