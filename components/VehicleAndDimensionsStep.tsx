"use client"

import Image from "next/image"
import type { DimensionType, vehicleOptionsType } from "@/types"
import type { ParkingInfoState, VehicleId } from "@/hooks/use-parking-draft"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
  FieldLabel,
  FieldContent,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { VEHICLE_OPTIONS } from "@/components/ParkingInfoClient"
import { Button } from "./ui/button"

export type DimensionErrors = {
  width?: string
  length?: string
  height?: string
}

export interface VehicleAndDimensionsStepProps {
  draft: ParkingInfoState
  onChange: (patch: Partial<ParkingInfoState>) => void
  selectedVehicle: vehicleOptionsType
  errors: DimensionErrors
}

export function getDimensionErrors(
  draft: ParkingInfoState,
  vehicle: vehicleOptionsType
): DimensionErrors {
  const errors: DimensionErrors = {}
  if (
    !draft.dimensions ||
    typeof draft.dimensions.width !== "number" ||
    typeof draft.dimensions.length !== "number" ||
    typeof draft.dimensions.height !== "number"
  ) {
    return errors
  }

  if (draft.dimensions.width < vehicle.dimension.width) {
    errors.width = `La larghezza deve essere almeno ${vehicle.dimension.width.toFixed(2)} m.`
  }
  if (draft.dimensions.length < vehicle.dimension.length) {
    errors.length = `La lunghezza deve essere almeno ${vehicle.dimension.length.toFixed(2)} m.`
  }
  if (draft.dimensions.height < vehicle.dimension.height) {
    errors.height = `L'altezza deve essere almeno ${vehicle.dimension.height.toFixed(2)} m.`
  }
  return errors
}

export default function VehicleAndDimensionsStep({
  draft,
  onChange,
  selectedVehicle,
  errors,
}: VehicleAndDimensionsStepProps) {
  const hasAnyError = Boolean(errors.width || errors.length || errors.height)

  const handleDimensionChange = (key: keyof DimensionType, value: number) => {
    if (Number.isNaN(value)) return
    onChange({
      dimensions: {
        ...draft.dimensions,
        [key]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Veicoli e accesso</CardTitle>
          <CardDescription>
            Scegli il tipo di parcheggio e il veicolo massimo accettato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldSet>
            <FieldLegend>Veicolo massimo accettato</FieldLegend>
            <FieldGroup className="gap-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {VEHICLE_OPTIONS.map((vehicle) => {
                  const selected = draft.maxVehicleId === vehicle.id
                  return (
                    <Button
                      key={vehicle.id}
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        onChange({
                          maxVehicleId: vehicle.id as VehicleId,
                          dimensions: {
                            ...draft.dimensions,
                            width: Math.max(
                              draft.dimensions.width,
                              vehicle.dimension.width
                            ),
                            length: Math.max(
                              draft.dimensions.length,
                              vehicle.dimension.length
                            ),
                            height: Math.max(
                              draft.dimensions.height,
                              vehicle.dimension.height
                            ),
                          },
                        })
                      }
                      className={cn("h-full p-0 text-left w-full")}
                    >
                      <Card
                        className={cn(
                          "flex flex-col items-start gap-1.5 rounded-md border px-3 py-2 text-md w-full",
                          selected
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground"
                        )}
                      >
                        <CardContent className="flex flex-row items-center gap-3 w-full p-4">
                          <Image
                            src={vehicle.image}
                            alt={vehicle.label}
                            width={64}
                            height={64}
                            className="rounded-md object-contain"
                          />
                          <div className="flex flex-col items-start gap-1">
                            <CardTitle className="text-lg font-semibold leading-snug">
                              {vehicle.label}
                            </CardTitle>
                            <CardDescription className="text-md text-muted-foreground">
                              Fino a {vehicle.dimension.length.toFixed(1)}m L ·{" "}
                              {vehicle.dimension.width.toFixed(1)}m W ·{" "}
                              {vehicle.dimension.height.toFixed(1)}m H
                            </CardDescription>
                          </div>
                        </CardContent>
                      </Card>
                    </Button>
                  )
                })}
              </div>
              <FieldDescription>
                Quando cambi il veicolo massimo, le dimensioni del posto vengono adeguate
                automaticamente se sono inferiori. Puoi sempre aumentare le misure nella
                sezione sottostante.
              </FieldDescription>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dimensioni del posto</CardTitle>
          <CardDescription>
            Imposta le misure effettive del posto auto. Non possono essere inferiori a
            quelle del veicolo massimo accettato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldSet>
            <FieldLegend>Dimensioni effettive</FieldLegend>
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-3">
                <Field data-invalid={!!errors.width}>
                  <FieldLabel htmlFor="width">Larghezza (m)</FieldLabel>
                  <FieldContent>
                    <Input
                      aria-label="Larghezza del posto"
                      aria-required="true"
                      id="width"
                      type="number"
                      min={selectedVehicle.dimension.width}
                      step={0.01}
                      value={draft.dimensions.width}
                      onChange={(e) =>
                        handleDimensionChange("width", Number(e.target.value))
                      }
                    />
                    {errors.width && <FieldError>{errors.width}</FieldError>}
                  </FieldContent>
                </Field>

                <Field data-invalid={!!errors.length}>
                  <FieldLabel htmlFor="length">Lunghezza (m)</FieldLabel>
                  <FieldContent>
                    <Input
                      aria-label="Lunghezza del posto"
                      aria-required="true"
                      id="length"
                      type="number"
                      min={selectedVehicle.dimension.length}
                      step={0.01}
                      value={draft.dimensions.length}
                      onChange={(e) =>
                        handleDimensionChange("length", Number(e.target.value))
                      }
                    />
                    {errors.length && <FieldError>{errors.length}</FieldError>}
                  </FieldContent>
                </Field>

                <Field data-invalid={!!errors.height}>
                  <FieldLabel htmlFor="height">Altezza (m)</FieldLabel>
                  <FieldContent>
                    <Input
                      aria-label="Altezza del posto"
                      aria-required="true"
                      id="height"
                      type="number"
                      min={selectedVehicle.dimension.height}
                      step={0.01}
                      value={draft.dimensions.height}
                      onChange={(e) =>
                        handleDimensionChange("height", Number(e.target.value))
                      }
                    />
                    {errors.height && <FieldError>{errors.height}</FieldError>}
                  </FieldContent>
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Confronto con il veicolo massimo</FieldLegend>
            <FieldGroup>
              <div className="flex justify-center">
                <div className="w-full max-w-xl min-h-[112px] rounded-2xl border bg-muted/40 px-6 py-5 text-base space-y-2">
                  <p className="font-semibold text-foreground">
                    Confronto dimensioni veicolo / posto
                  </p>
                  <p className="font-medium text-foreground">
                    Veicolo: {selectedVehicle.dimension.length.toFixed(2)}m L ·{" "}
                    {selectedVehicle.dimension.width.toFixed(2)}m W ·{" "}
                    {selectedVehicle.dimension.height.toFixed(2)}m H
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Posto: {draft.dimensions.length.toFixed(2)}m L ·{" "}
                    {draft.dimensions.width.toFixed(2)}m W ·{" "}
                    {draft.dimensions.height.toFixed(2)}m H
                  </p>
                </div>
              </div>
              {hasAnyError && (
                <FieldError className="mt-2">
                  Le dimensioni del posto non sono sufficienti per il veicolo selezionato.
                  Aggiorna le misure prima di proseguire.
                </FieldError>
              )}
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>
    </div>
  )
}

