"use client"

import { useMemo, useState } from "react"
import { Pencil, X, Check } from "lucide-react"
import { toast } from "sonner"

import type {
  Parking,
  ParkingFullInfo,
  vehicleOptionsType,
  DimensionType,
} from "@/types"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useSelectedParking } from "@/providers/selected-parking-provider"
import { useParkingInfo } from "@/hooks/use-parking-info"
import { useParkingDraft, type ParkingInfoState, type VehicleId } from "@/hooks/use-parking-draft"
import ParkingInfoView from "@/components/ParkingInfoView"
import LocationStep from "@/components/LocationStep"
import VehicleAndDimensionsStep, {
  getDimensionErrors,
  type DimensionErrors,
} from "@/components/VehicleAndDimensionsStep"
import PerksStep from "@/components/PerkStep"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import Loading from "@/app/loading"
import { Separator } from "./ui/separator"

export const VEHICLE_OPTIONS: vehicleOptionsType[] = [
  {
    id: 1,
    label: "Moto",
    dimension: { length: 2.3, width: 0.9, height: 1.3 },
    image: "/bike.webp",
  },
  {
    id: 2,
    label: "Utilitaria",
    dimension: { length: 4.0, width: 1.65, height: 1.6 },
    image: "/car1.webp",
  },
  {
    id: 3,
    label: "Berlina",
    dimension: { length: 4.0, width: 1.9, height: 1.55 },
    image: "/car2.webp",
  },
  {
    id: 4,
    label: "Station Wagon",
    dimension: { length: 5.2, width: 2.0, height: 1.85 },
    image: "/sw.webp",
  },
  {
    id: 5,
    label: "SUV",
    dimension: { length: 4.9, width: 2.0, height: 1.85 },
    image: "/pickup.webp",
  },
  {
    id: 6,
    label: "Furgone",
    dimension: { length: 5.2, width: 2.1, height: 2.4 },
    image: "/truck.webp",
  },
]

type TabKey = "location" | "vehicle-dimensions" | "perks"

const VALID_VEHICLE_IDS: VehicleId[] = [1, 2, 3, 4, 5, 6]

function createParkingInfoStateFromParking(
  parking: ParkingFullInfo["parking"]
): ParkingInfoState {
  const withBackendFields = parking as Parking & {
    acceptsGpl?: boolean
    inZtl?: boolean
    lng?: number
    perks?: string[]
    vehicle_type_id?: number
    vehicle_type?: number
    dimensions?: Partial<DimensionType> | null
  }

  const acceptsGPL: boolean =
    typeof withBackendFields.acceptsGpl === "boolean"
      ? withBackendFields.acceptsGpl
      : (withBackendFields.acceptsGPL as boolean)

  const inZTL: boolean =
    typeof withBackendFields.inZtl === "boolean"
      ? withBackendFields.inZtl
      : (withBackendFields.inZTL as boolean)

  const long: number =
    typeof withBackendFields.lng === "number"
      ? withBackendFields.lng
      : (withBackendFields.long as number)

  const rawPerks: string[] = Array.isArray(withBackendFields.perks)
    ? withBackendFields.perks
    : []

  const vehicleTypeId =
    withBackendFields.vehicle_type_id ?? withBackendFields.vehicle_type
  const maxVehicleId: VehicleId =
    typeof vehicleTypeId === "number" &&
    VALID_VEHICLE_IDS.includes(vehicleTypeId as VehicleId)
      ? (vehicleTypeId as VehicleId)
      : 4

  const baseVehicle =
    VEHICLE_OPTIONS.find((v) => v.id === maxVehicleId) ?? VEHICLE_OPTIONS[3]

  const rawDimensions = withBackendFields.dimensions

  const safeDimensions: DimensionType = {
    width:
      typeof rawDimensions?.width === "number"
        ? rawDimensions.width
        : baseVehicle.dimension.width,
    length:
      typeof rawDimensions?.length === "number"
        ? rawDimensions.length
        : baseVehicle.dimension.length,
    height:
      typeof rawDimensions?.height === "number"
        ? rawDimensions.height
        : baseVehicle.dimension.height,
  }

  return {
    ...(withBackendFields as Parking),
    acceptsGPL,
    inZTL,
    long,
    dimensions: safeDimensions,
    perks: rawPerks,
    maxVehicleId,
    lastUpdatedAt: undefined,
  }
}

export function ParkingInfoClient() {
  const { selectedParkingId } = useSelectedParking()
  const { data, isLoading, isFetching, error } = useParkingInfo(selectedParkingId)

  if (!selectedParkingId) {
    return (
      <Alert variant={"default"} className="flex flex-1 flex-col justify-center items-center gap-2 py-10 text-center">
        <AlertTitle className="text-sm text-muted-foreground">Attenzione</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground">
          Seleziona un parcheggio dal menu laterale per vedere le informazioni.
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading || isFetching || !data) {
    return (
      <Loading />
    )
  }

  if (error) {
    return (
      <Alert variant={"destructive"} className="flex flex-1 flex-col justify-center items-center gap-2 py-10 text-center">
        <AlertTitle className="text-sm text-red-400">Errore</AlertTitle>
        <AlertDescription className="text-sm text-red-400">
          Errore nel caricamento delle informazioni del parcheggio. Riprova più tardi.
        </AlertDescription>
      </Alert>
    )
  }

  const parkingFullInfo = data as ParkingFullInfo
  const parking = parkingFullInfo.parking
  const initialState = createParkingInfoStateFromParking(parking)

  return (
    <ParkingInfoPageInner
      key={parking.id}
      initialParkingInfo={initialState}
    />
  )
}

interface ParkingInfoPageInnerProps {
  initialParkingInfo: ParkingInfoState
}

function ParkingInfoPageInner({ initialParkingInfo }: ParkingInfoPageInnerProps) {
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [activeTab, setActiveTab] = useState<TabKey>("location")
  const [isSaving, setIsSaving] = useState(false)

  const {
    savedParkingInfo,
    draftParkingInfo,
    updateDraft,
    resetDraft,
    commitDraft,
    hasChanges,
    lastUpdated,
  } = useParkingDraft(initialParkingInfo)

  const selectedVehicle = useMemo(
    () =>
      VEHICLE_OPTIONS.find((v) => v.id === draftParkingInfo.maxVehicleId) ??
      VEHICLE_OPTIONS[0],
    [draftParkingInfo.maxVehicleId]
  )

  const dimensionErrors: DimensionErrors = useMemo(
    () => getDimensionErrors(draftParkingInfo, selectedVehicle),
    [draftParkingInfo, selectedVehicle]
  )
  const hasBlockingErrors = Boolean(
    dimensionErrors.width || dimensionErrors.length || dimensionErrors.height
  )

  const handleEnterEdit = () => {
    resetDraft()
    setActiveTab("location")
    setMode("edit")
  }

  const handleCancelEdit = () => {
    resetDraft()
    setMode("view")
  }

  const handleSave = async () => {
    if (hasBlockingErrors || !hasChanges || isSaving) return
    setIsSaving(true)
    try {
      const payload = {
        id: draftParkingInfo.id,
        address: {
          street: draftParkingInfo.address,
          city: draftParkingInfo.city,
          postalCode: draftParkingInfo.zip_code,
          lat: draftParkingInfo.lat,
          lng: draftParkingInfo.long,
        },
        in_ztl: draftParkingInfo.inZTL,
        accepts_gpl: draftParkingInfo.acceptsGPL,
        spots_count: draftParkingInfo.total_slots,
        base_hourly_price: draftParkingInfo.base_hourly_price,
        weight: draftParkingInfo.weight,
        floors_count: draftParkingInfo.floors_count,
        dimensions: draftParkingInfo.dimensions,
        perks: draftParkingInfo.perks,
        // Optional: send vehicle_type_id based on maxVehicleId if backend expects it
        vehicle_type_id: draftParkingInfo.maxVehicleId,
      }

      const res = await fetch("/api/parking/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        const message =
          (data && (data.error as string)) ||
          "Errore durante il salvataggio delle informazioni del parcheggio."
        toast.error(message)
        return
      }

      commitDraft()
      setMode("view")
      toast.success("Informazioni del parcheggio aggiornate con successo.")
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Errore imprevisto durante il salvataggio."
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTabChange = (next: string) => {
    setActiveTab(next as TabKey)
  }

  if (mode === "view") {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Informazioni parcheggio
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Riepilogo delle informazioni configurate per il tuo parcheggio.
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={handleEnterEdit}>
            <Pencil className="h-4 w-4" />
            Modifica info
          </Button>
        </div>

        <ParkingInfoView
          info={savedParkingInfo}
          selectedVehicle={
            VEHICLE_OPTIONS.find((v) => v.id === savedParkingInfo.maxVehicleId) ??
            VEHICLE_OPTIONS[0]
          }
          lastUpdated={lastUpdated}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-background/95 px-1 py-3 backdrop-blur">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Modalità modifica
          </p>
          <h1 className="text-lg font-semibold leading-none">
            Modifica informazioni parcheggio
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleCancelEdit}>
            <X className="h-4 w-4" />
            Annulla
          </Button>
          <Button
            size="sm"
            className="gap-1"
            onClick={handleSave}
            disabled={!hasChanges || hasBlockingErrors || isSaving}
          >
            <Check className="h-4 w-4" />
            {isSaving ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </div>
      <Separator />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-1 flex-1">
        <div className="flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="location">Posizione</TabsTrigger>
            <TabsTrigger value="vehicle-dimensions">Veicoli &amp; dimensioni</TabsTrigger>
            <TabsTrigger value="perks">Servizi</TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="mt-0">
            <LocationStep
              draft={draftParkingInfo}
              onChange={updateDraft}
            />
          </TabsContent>

          <TabsContent value="vehicle-dimensions" className="mt-0">
            <VehicleAndDimensionsStep
              draft={draftParkingInfo}
              selectedVehicle={selectedVehicle}
              onChange={updateDraft}
              errors={dimensionErrors}
            />
          </TabsContent>

          <TabsContent value="perks" className="mt-0">
            <PerksStep draft={draftParkingInfo} onChange={updateDraft} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default ParkingInfoClient