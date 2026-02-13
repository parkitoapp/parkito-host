"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Logo from "@/components/Logo"
import { Smartphone, ArrowRight, Check, Circle } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/providers/user-provider"
import { useParkings } from "@/hooks/use-parkings"
import type { Parking } from "@/types"

const SETUP_STEPS: { key: keyof Pick<Parking, "info_parcheggio_completed" | "prezzi_disponibilita_completed" | "descrizione_accesso_completed" | "galleria_foto_completed">; label: string }[] = [
  { key: "info_parcheggio_completed", label: "Informazioni parcheggio" },
  { key: "prezzi_disponibilita_completed", label: "Prezzi e disponibilità" },
  { key: "descrizione_accesso_completed", label: "Descrizione e accesso" },
  { key: "galleria_foto_completed", label: "Galleria foto" },
]

/**
 * Find the parking closest to full completion (most flags set).
 * Returns a record of each flag's completion status.
 */
function getBestParkingStatus(parkings: Parking[]) {
  if (parkings.length === 0) {
    return Object.fromEntries(SETUP_STEPS.map((s) => [s.key, false])) as Record<string, boolean>
  }

  // Pick the parking with the most completed steps
  const best = parkings.reduce((a, b) => {
    const countFlags = (p: Parking) =>
      SETUP_STEPS.filter((s) => p[s.key]).length
    return countFlags(b) > countFlags(a) ? b : a
  })

  return Object.fromEntries(SETUP_STEPS.map((s) => [s.key, !!best[s.key]])) as Record<string, boolean>
}

export function CompleteSetupContent() {
  const { signOut, host } = useUser()
  const { parkings } = useParkings(host?.id)
  const status = getBestParkingStatus(parkings)
  const completedCount = SETUP_STEPS.filter((s) => status[s.key]).length
  const hasParkings = parkings.length > 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            <h1 className="text-lg font-semibold">Completa la configurazione</h1>
            <p className="text-sm text-muted-foreground">
              {hasParkings
                ? `Hai completato ${completedCount} di ${SETUP_STEPS.length} passaggi. Completa i rimanenti per accedere alla dashboard.`
                : "Per accedere alla dashboard devi avere almeno un parcheggio con tutti i passaggi completati."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-3 text-sm">
              {SETUP_STEPS.map((step) => {
                const completed = status[step.key]
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div
                      className={`size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${completed
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                        }`}
                    >
                      {completed ? (
                        <Check className="size-3.5" />
                      ) : (
                        <Circle className="size-3" />
                      )}
                    </div>
                    <span
                      className={
                        completed
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="text-sm text-muted-foreground">
              Apri l&apos;app Parkito per {hasParkings ? "completare i passaggi mancanti" : "aggiungere un parcheggio e completare tutti i passaggi"}.
            </p>

            <Button asChild className="w-full mt-6 gap-2" size="lg">
              <Link href="/deeplink">
                <Smartphone className="w-4 h-4" />
                Apri l&apos;app Parkito
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>

            <div className="text-center pt-2">
              <Button
                variant="link"
                onClick={() => signOut()}
                className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Esci e accedi con un altro account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
