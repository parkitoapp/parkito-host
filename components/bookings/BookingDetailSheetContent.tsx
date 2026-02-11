/**
 * Componente per il dettaglio della prenotazione
 * Mostra le informazioni della prenotazione in un sheet
 * - ID prenotazione
 * - Stato prenotazione
 * - Informazioni ospite
 * - Data inizio e data fine
 * - Durata
 * - Guadagno netto
 * - Bottone per copiare l'ID prenotazione 
 * - Badge per la durata
 * @param booking - La prenotazione da visualizzare
 * @param statusLabelFallback - Il fallback per il nome dello stato della prenotazione
 * @returns Un componente React che mostra le informazioni della prenotazione
 */

"use client"

import * as React from "react"
import type { PktReservation } from "@/types"
import { Copy, Check, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  getGuestName,
  getInitials,
  getStatusBadge,
  formatCreatedAt,
  formatDurationLong,
  formatCurrency,
} from "@/lib/bookings-table-utils"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { NeonAvatar } from "@/components/NeonAvatar"

type ReservationWithMeta = PktReservation & {
  status?: string
  created_at?: string
}

export function BookingDetailSheetContent({
  booking,
  statusLabelFallback = "Confirmed",
}: {
  booking: PktReservation
  statusLabelFallback?: string
}) {
  const [copied, setCopied] = React.useState(false)
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const row = booking as ReservationWithMeta

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])
  const status = row.status ?? statusLabelFallback
  const { variant: statusVariant, className: statusClassName } = getStatusBadge(row.status)
  const guestName = getGuestName(booking)
  const initials = getInitials(guestName)

  const startDate = row.start_datetime
  const endDate = row.end_datetime
  const startD = startDate instanceof Date ? startDate : new Date(startDate as string)
  const endD = endDate instanceof Date ? endDate : new Date(endDate as string)
  const startDateStr = startD.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const startTimeStr = startD.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  })
  const endDateStr = endD.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const endTimeStr = endD.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  })

  async function copyId() {
    if (!row.id || typeof navigator === "undefined" || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(row.id)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      setCopied(true)
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/** ID prenotazione copiabile */}
      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          ID prenotazione
        </p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold tracking-tight text-foreground break-all">
            {row.id ?? "—"}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={copyId}
            aria-label="Copia ID prenotazione"
          >
            <span className="relative flex size-4 items-center justify-center">
              <Copy
                className={cn(
                  "size-4 text-muted-foreground transition-all duration-200",
                  copied && "scale-0 opacity-0 absolute"
                )}
              />
              <Check
                className={cn(
                  "size-4 text-green-600 dark:text-green-400 transition-all duration-200",
                  copied ? "scale-100 opacity-100" : "scale-0 opacity-0 absolute"
                )}
              />
            </span>
          </Button>
        </div>
      </div>

      {/** Stato prenotazione */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={statusVariant}
          className={cn(
            statusClassName,
            "gap-1.5 px-2.5 py-1 text-xs font-medium"
          )}
        >
          {status}
        </Badge>
        {row.created_at && (
          <span className="text-xs text-muted-foreground">
            Creato il {formatCreatedAt(row.created_at)}
          </span>
        )}
      </div>

      {/* Driver info*/}
      <div className="rounded-xl border bg-muted/50 p-4 space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Informazioni ospite
        </p>
        <div className="flex items-center gap-3">
          <NeonAvatar
            seed={guestName}
            initials={initials}
            alt={guestName}
            className="size-10 shrink-0 border-2"
            fallbackClassName="text-sm font-semibold uppercase"
          />
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="font-semibold text-foreground truncate">{guestName}</p>
          </div>
        </div>
      </div>

      {/* Data inizio e  fine */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Data inizio
          </p>
          <p className="text-sm text-foreground">{startDateStr}</p>
          <p className="text-xl font-bold text-foreground">{startTimeStr}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Data fine
          </p>
          <p className="text-sm text-foreground">{endDateStr}</p>
          <p className="text-xl font-bold text-foreground">{endTimeStr}</p>
        </div>
      </div>

      {/* badge */}
      <div className="mt-auto">
        <Badge
          variant="secondary"
          className="w-fit gap-2 rounded-full border-0 bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground dark:bg-primary/20"
        >
          <Clock className="size-3.5 shrink-0" />
          Durata: {formatDurationLong(row.start_datetime, row.end_datetime)}
        </Badge>
      </div>

      {/* guadagno netto */}
      {row.total_price != null && (
        <div className="space-y-1 border-t pt-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Guadagno netto
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(row.total_price)}
          </p>
        </div>
      )}
    </div>
  )
}
