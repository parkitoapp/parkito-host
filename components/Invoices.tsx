"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { HostData } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { toast } from "sonner"
import { GlobalLoading } from "./global-loading"
import { Spinner } from "./ui/spinner"

type InvoiceMonth = string // "YYYY-MM"

async function downloadInvoicePdf(params: { hostId: string; month: InvoiceMonth }) {
  const res = await fetch("/api/invoices/pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      hostId: params.hostId,
      month: params.month,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.error("[Invoices] Edge function error:", text)
    throw new Error("Errore nella generazione della fattura")
  }

  // API returns HTML content – open it in a new tab so the host
  // can stamp or save as PDF from the browser.
  const html = await res.text()
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  window.open(url, "_blank", "noopener,noreferrer")
}

function formatMonthLabel(month: InvoiceMonth) {
  const [year, mm] = month.split("-")
  const date = new Date(Number(year), Number(mm) - 1, 1)
  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
  }).format(date)
}

export default function Invoices({ host }: { host: HostData }) {
  const [months, setMonths] = useState<InvoiceMonth[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [downloadingMonth, setDownloadingMonth] = useState<InvoiceMonth | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadMonths() {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch("/api/host-invoice-months", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostId: host.id }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? "Errore nel caricamento dei mesi")
        }

        const data = (await res.json()) as { months?: InvoiceMonth[] }
        if (!cancelled) {
          setMonths(data.months ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[Invoices] Failed to load months:", err)
          setError("Impossibile caricare i mesi disponibili.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadMonths()
    return () => {
      cancelled = true
    }
  }, [host.id])

  const visibleMonths = useMemo(
    () => (expanded ? months : months.slice(0, 4)),
    [months, expanded]
  )

  const hasMoreThanFour = months.length > 4

  const handleDownload = async (month: InvoiceMonth) => {
    try {
      setDownloadingMonth(month)
      await downloadInvoicePdf({ hostId: host.id, month })
      toast.success("Fattura scaricata con successo.")
    } catch {
      toast.error("Errore nel download della fattura. Riprova più tardi.")
    } finally {
      setDownloadingMonth((current) => (current === month ? null : current))
    }
  }

  if (isLoading && months.length === 0) {
    return (
      <Card className="w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Fatture Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Spinner />Caricamento mesi disponibili...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-5xl mx-auto ">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-2xl font-bold">Fatture Recenti</CardTitle>

        {hasMoreThanFour && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Mostra meno" : "Mostra tutte"}
          </Button>
        )}
      </CardHeader>
      <Suspense fallback={<GlobalLoading message="Caricamento fatture..." />}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          {months.length === 0 && !isLoading && !error && (
            <p className="text-sm text-muted-foreground">
              Non ci sono ancora prenotazioni da fatturare.
            </p>
          )}

          {visibleMonths.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleMonths.map((month) => (
                <Button
                  key={month}
                  variant="outline"
                  size="lg"
                  onClick={() => handleDownload(month)}
                  className="group flex h-auto flex-col items-start justify-between border bg-card/40 px-4 py-3 text-left shadow-xs transition hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="text-sm font-medium capitalize">
                    {formatMonthLabel(month)}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {downloadingMonth === month ? "Generazione in corso..." : "Scarica fattura PDF"}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Suspense>
    </Card>
  )
}
