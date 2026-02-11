"use client"


import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { PERKS } from "@/constants/perks"
import type { ParkingInfoState } from "@/hooks/use-parking-draft"
import { Button } from "./ui/button"
import PerkCard from "./PerkCard"

export default function PerksStep({ draft, onChange }: { draft: ParkingInfoState, onChange: (patch: Partial<ParkingInfoState>) => void }) {
  const selectedPerks = new Set(draft.perks?.map((p: string) => p.toLowerCase()) ?? [])
  const isNoneSelected = selectedPerks.has("nessuno") || selectedPerks.has("none")

  const togglePerk = (perkId: string) => {
    const currentPerks = (draft.perks ?? []) as string[]
    const normalized = currentPerks.map((p) => p.toLowerCase())
    const has = normalized.includes(perkId.toLowerCase())

    if (perkId.toLowerCase() === "nessuno" || perkId.toLowerCase() === "none") {
      if (has) {
        onChange({ perks: currentPerks.filter((p) => p.toLowerCase() !== "nessuno" && p.toLowerCase() !== "none") })
      } else {
        onChange({ perks: ["nessuno"] })
      }
      return
    }

    if (has) {
      onChange({ perks: currentPerks.filter((p) => p.toLowerCase() !== perkId.toLowerCase()) })
    } else {
      const withoutNone = currentPerks.filter((p) => p.toLowerCase() !== "nessuno" && p.toLowerCase() !== "none")
      onChange({ perks: [...withoutNone, perkId] })
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Servizi e caratteristiche</CardTitle>
        <CardDescription>
          Seleziona i servizi aggiuntivi offerti dal tuo parcheggio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="w-full flex flex-col gap-4">
          {PERKS.map((perk) => {
            const isNone = perk.id === "nessuno"
            const isSelected = isNone
              ? selectedPerks.has("nessuno") || selectedPerks.has("none")
              : selectedPerks.has(perk.id.toLowerCase()) ||
              selectedPerks.has(perk.title.toLowerCase())

            const isDisabled = !isNone && isNoneSelected

            return (
              <li key={perk.id} className="w-[50%] mx-auto">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isDisabled}
                  onClick={() => togglePerk(perk.id)}
                  className={cn(
                    "h-full p-0 text-left w-full",
                    isDisabled && "pointer-events-none opacity-50"
                  )}
                >
                  <PerkCard selected={isSelected} perk={perk} />
                </Button>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

