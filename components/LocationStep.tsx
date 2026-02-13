"use client"

import type { ParkingInfoState } from "@/hooks/use-parking-draft"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  Field,
  FieldLabel,
  FieldContent,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import dynamic from "next/dynamic"
import { GooglePlacesInput } from "@/components/GooglePlacesInput"
import ParkingMarker from "@/components/maps/ParkingMarker"

const Map = dynamic(() => import("@/components/maps/Map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-muted" />,
})

export interface LocationStepProps {
  draft: ParkingInfoState
  onChange: (patch: Partial<ParkingInfoState>) => void
}

export default function LocationStep({ draft, onChange }: LocationStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Posizione</CardTitle>
        <CardDescription>
          Definisci l&apos;indirizzo esatto del parcheggio e le impostazioni di accesso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FieldSet>
          <FieldLegend>Indirizzo</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>Cerca indirizzo</FieldLabel>
              <FieldContent>
                <GooglePlacesInput
                  selectedAddress={draft.address}
                  setSelectedAddress={(value) => onChange({ address: value })}
                  setCoordinates={({ lat, lng }) =>
                    onChange({ lat, long: lng })
                  }
                  setFullAddressDetails={(details) => {
                    const address = [details.street, details.streetNumber]
                      .filter(Boolean)
                      .join(" ")
                      .trim()
                    onChange({
                      address: address || draft.address,
                      city: details.city || draft.city,
                      zip_code: details.postalCode || draft.zip_code,
                      lat: details.lat,
                      long: details.lng,
                    })
                  }}
                  placeholder="Es. Via Roma 10, Milano"
                />
              </FieldContent>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>CAP</FieldLabel>
                <FieldContent>
                  <Input
                    value={draft.zip_code}
                    onChange={(e) => onChange({ zip_code: e.target.value })}
                    placeholder="20100"
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Città</FieldLabel>
                <FieldContent>
                  <Input
                    value={draft.city}
                    onChange={(e) => onChange({ city: e.target.value })}
                    placeholder="Milano"
                  />
                </FieldContent>
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Posizione su mappa</FieldLegend>
          <FieldGroup>
            {typeof draft.lat === "number" && typeof draft.long === "number" ? (
              <div className="h-64 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 overflow-hidden">
                <Map latitude={draft.lat} longitude={draft.long} zoom={17}>
                  <ParkingMarker
                    latitude={draft.lat}
                    longitude={draft.long}
                    draggable
                    onDragEnd={({ latitude, longitude }) => {
                      console.log("[LocationStep] Marker drag end", {
                        latitude,
                        longitude,
                      })
                      onChange({ lat: latitude, long: longitude })
                    }}
                  />
                </Map>
              </div>
            ) : (
              <div className="h-40 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 text-xs text-muted-foreground flex items-center justify-center text-center px-4">
                Cerca e seleziona un indirizzo per posizionare il pin sulla mappa.
              </div>
            )}
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Regole di accesso</FieldLegend>
          <FieldGroup>
            <Field className="flex flex-col w-full">
              <FieldLabel>ZTL</FieldLabel>
              <FieldContent>
                <RadioGroup
                  value={draft.inZTL ? "yes" : "no"}
                  onValueChange={(value) => onChange({ inZTL: value === "yes" })}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="ztl-yes" />
                    <Label htmlFor="ztl-yes" className="text-xs font-normal cursor-pointer">
                      Sì, il parcheggio è in ZTL
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="ztl-no" />
                    <Label htmlFor="ztl-no" className="text-xs font-normal cursor-pointer">
                      No, il parcheggio non è in ZTL
                    </Label>
                  </div>
                </RadioGroup>
              </FieldContent>
            </Field>

            <Field orientation="horizontal" className="flex flex-col w-full">
              <FieldLabel>Veicoli GPL</FieldLabel>
              <FieldContent>
                <RadioGroup
                  value={draft.acceptsGPL ? "yes" : "no"}
                  onValueChange={(value) => onChange({ acceptsGPL: value === "yes" })}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="gpl-yes" />
                    <Label htmlFor="gpl-yes" className="text-xs font-normal cursor-pointer">
                      Sì, sono ammessi
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="gpl-no" />
                    <Label htmlFor="gpl-no" className="text-xs font-normal cursor-pointer">
                      No, non sono ammessi
                    </Label>
                  </div>
                </RadioGroup>
              </FieldContent>
            </Field>
          </FieldGroup>
        </FieldSet>
      </CardContent>
    </Card >
  )
}

