"use client"

import Image from "next/image"
import { MapPin, Car } from "lucide-react"
import type { vehicleOptionsType } from "@/types"
import type { ParkingInfoState } from "@/hooks/use-parking-draft"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import dynamic from "next/dynamic"
import { PERKS } from "@/constants/perks"
import PerkCard from "./PerkCard"
import ParkingMarker from "./maps/ParkingMarker"

const Map = dynamic(() => import("./maps/Map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-muted" />,
})

export interface ParkingInfoViewProps {
  info: ParkingInfoState
  selectedVehicle: vehicleOptionsType
  lastUpdated: Date | null
}

function DimensionBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col rounded-md border bg-muted/40 px-2.5 py-2">
      <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-xl font-semibold">
        {value.toFixed(2)} m
      </span>
    </div>
  )
}

export default function ParkingInfoView({
  info,
  selectedVehicle,
}: ParkingInfoViewProps) {
  const hasDimensions =
    info.dimensions &&
    typeof info.dimensions.width === "number" &&
    typeof info.dimensions.length === "number" &&
    typeof info.dimensions.height === "number"

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="md:col-span-1 lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <MapPin className="size-6" />
            Posizione
          </CardTitle>
          <CardDescription className="text-md">
            Indirizzo e impostazioni di accesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div>
            <p className="text-xl font-medium">{info.address}</p>
            <p className="text-muted-foreground">
              {info.zip_code} · {info.city}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge
              variant={info.inZTL ? "default" : "outline"}
              className={
                `text-md ${info.inZTL
                  ? "text-amber-800 dark:text-amber-300 border-amber-500 dark:border-amber-400 bg-amber-100 dark:bg-amber-900/30"
                  : "text-muted-foreground border-border bg-muted/40"}`
              }
            >
              ZTL {info.inZTL ? "sì" : "no"}
            </Badge>
            <Badge
              variant={info.acceptsGPL ? "default" : "outline"}
              className={
                info.acceptsGPL
                  ? "text-emerald-700 dark:text-emerald-300 border-emerald-500 dark:border-emerald-400 bg-emerald-100 dark:bg-emerald-900/30"
                  : "text-muted-foreground border-border bg-muted/40"
              }
            >
              Veicoli GPL {info.acceptsGPL ? "ammessi" : "non ammessi"}
            </Badge>
          </div>
          <div className="mt-2 h-64 md:h-80 rounded-lg overflow-hidden">
            <Map latitude={info.lat} longitude={info.long}>
              <ParkingMarker latitude={info.lat} longitude={info.long} />
            </Map>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Car className="size-6" />
            Veicoli e dimensioni
          </CardTitle>
          <CardDescription className="text-md">
            Veicolo massimo accettato e dimensioni del posto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          {hasDimensions ? (
            <>
              {/* Row 1: Veicolo massimo accettato */}
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                <p className="text-xl font-semibold uppercase tracking-wide text-muted-foreground">
                  Veicolo massimo accettato
                </p>
                <div className="flex items-center gap-4">
                  <Image
                    src={selectedVehicle.image}
                    alt={selectedVehicle.label}
                    width={220}
                    height={220}
                    className="rounded-md object-contain"
                    style={{ width: "auto", height: "auto" }}
                  />
                  <div className="flex flex-col gap-1 items-center justify-center w-full">
                    <span className="text-xl font-semibold">
                      {selectedVehicle.label}
                    </span>
                    <span className="text-md text-muted-foreground">
                      Fino a {selectedVehicle.dimension.length.toFixed(1)}m L ·{" "}
                      {selectedVehicle.dimension.width.toFixed(1)}m W ·{" "}
                      {selectedVehicle.dimension.height.toFixed(1)}m H
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Dimensioni del posto */}
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                <p className="text-xl font-semibold uppercase tracking-wide text-muted-foreground">
                  Dimensioni del posto
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <DimensionBadge label="Larghezza" value={info.dimensions.width} />
                  <DimensionBadge label="Lunghezza" value={info.dimensions.length} />
                  <DimensionBadge label="Altezza" value={info.dimensions.height} />
                </div>
                <p className="mt-1 text-md text-muted-foreground">
                  Le dimensioni devono essere compatibili con il veicolo massimo accettato.
                </p>
              </div>
            </>
          ) : (
            <Empty className="min-h-[220px] bg-muted/40">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Car className="size-5" />
                </EmptyMedia>
                <EmptyTitle>
                  Informazioni incomplete sul parcheggio
                </EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <EmptyDescription>
                  Alcuni parcheggi creati in passato non hanno ancora i dati su veicoli e dimensioni.
                  Apri l&apos;app Parkito e aggiorna le informazioni del tuo parcheggio per vedere qui tutti i dettagli.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-xl">Servizi e caratteristiche</CardTitle>
            <CardDescription className="text-md">
              Servizi aggiuntivi offerti ai driver.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {info.perks.length === 0 ? (
            <p className="text-md text-muted-foreground">
              Nessun servizio configurato.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {PERKS.filter((perk) => {
                const selectedValues = new Set(
                  (info.perks as string[]).map((p) => p.toLowerCase())
                )
                const isNone = perk.id === "nessuno"
                return isNone
                  ? selectedValues.has("nessuno") || selectedValues.has("none")
                  : selectedValues.has(perk.id.toLowerCase()) ||
                  selectedValues.has(perk.title.toLowerCase())
              }).map((perk) => (
                <PerkCard key={perk.id} selected perk={perk} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

