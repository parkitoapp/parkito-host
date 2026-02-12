/**
 * Componente per le colonne della tabella delle prenotazioni passate
 * Mostra le colonne della tabella delle prenotazioni passate
 * - ID prenotazione
 * - Driver
 * - Data inizio
 * - Data fine
 * - Durata
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
  formatDurationHours,
  formatCurrency,
  getGuestName,
  getInitials,
  getStatusBadge,
  getDurationMs,
} from "@/lib/bookings-table-utils"
import { NeonAvatar } from "@/components/NeonAvatar"

export const pastColumns: ColumnDef<PktReservation>[] = [
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
    id: "duration",
    header: "Durata",
    accessorFn: (row) => getDurationMs(row),
    cell: ({ row }) => (
      <p className="text-md">
        {formatDurationHours(row.original.start_datetime, row.original.end_datetime)}
      </p>
    ),
  },
  {
    accessorKey: "total_price",
    header: "Guadagno Netto",
    cell: ({ row }) => (
      <p className="font-medium">
        {formatCurrency(row.original.total_price)}
      </p>
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
