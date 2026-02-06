"use client"

import { Spinner } from "@/components/ui/spinner"

export function GlobalLoading({ message = "Caricamento..." }: { message?: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-8 text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
