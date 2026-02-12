"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Button } from './ui/button'
import { Euro, PencilIcon } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { useSelectedParking } from "@/providers/selected-parking-provider";
import { useParkingInfo } from "@/hooks/use-parking-info";
import { useState } from 'react'
import { Spinner } from './ui/spinner'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Separator } from './ui/separator'
import { Label } from './ui/label'
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group'
import { toast } from "sonner";
import { HourTooltip } from './HourTooltip'

export default function PriceEditor() {
  const { selectedParkingId } = useSelectedParking();
  const { data: parkingInfo, isLoading, isFetching, error, refetch } = useParkingInfo(selectedParkingId);
  const [price, setPrice] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState<number>(1);
  const effectivePrice = price ?? parkingInfo?.parking.base_hourly_price ?? 0;
  if (isLoading || isFetching) {
    return <Spinner />
  }
  if (error) {
    return <Alert variant={"destructive"}><AlertTitle>Error</AlertTitle><AlertDescription>Error: {error.message}</AlertDescription></Alert>
  }

  console.log(parkingInfo?.parking.base_hourly_price);

  const numericPrice = price ?? parkingInfo?.parking.base_hourly_price ?? 0;
  const minPrice = Number.isNaN(numericPrice) || numericPrice < 0.5;
  const isValidPrice = !Number.isNaN(numericPrice) && numericPrice > 0;
  const driverPrice = isValidPrice
    ? (Math.ceil(numericPrice * 1.244 * 2) / 2).toFixed(2)
    : "0.00";

  const handleSave = async () => {
    if (!selectedParkingId) return;

    const valueToSave = price ?? parkingInfo?.parking.base_hourly_price ?? 0;
    if (!isValidPrice) {
      toast.error("Inserisci un prezzo valido maggiore di 0.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/parking/update-hourly-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parking_id: selectedParkingId,
          base_hourly_price: valueToSave,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Errore durante il salvataggio");
      }

      await refetch();
      toast.success("Prezzo orario aggiornato");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Errore durante il salvataggio";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-2xl'>Scegli il tuo prezzo orario</CardTitle>
        <CardDescription className='text-muted-foreground'>
          Potrai modificarlo in qualsiasi momento.
        </CardDescription>
      </CardHeader>
      <AlertDialog onOpenChange={(open) => { if (!open) setPrice(null); }} >
        <div className='flex flex-col w-1/3 mx-auto rounded-tr-lg'>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className='h-30 flex-col'
              aria-label="Scegli il tuo prezzo orario"
              aria-roledescription="Pulsante per modificare il prezzo orario"
            >
              <div className='flex flex-row items-center justify-between w-full'>
                <span className="capitalize text-2xl">All&apos;ora</span>
                <PencilIcon className='size-6' />
              </div>
              <div className="flex flex-row items-center justify-center w-full">
                <p className='flex flex-row items-center w-full text-primary text-4xl'>
                  <Euro className='size-8' />{effectivePrice}
                </p>
              </div>
            </Button>
          </AlertDialogTrigger>
          <Label className='text-sm text-muted-foreground mt-2'>Mostreremo il prezzo al driver maggiorato dei costi di piattaforma. In questo modo riceverai sempre la somma indicata sopra. </Label>
        </div>
        <AlertDialogContent className='flex flex-col w-full'>
          <AlertDialogHeader className='flex flex-col items-center justify-center w-full mb-4'>
            <AlertDialogMedia className='flex flex-col mx-auto -mb-2'>
              <Euro className='size-8 mx-auto' />
            </AlertDialogMedia>
            <AlertDialogTitle className='text-2xl text-center w-full mt-4'>Scegli il tuo prezzo netto orario</AlertDialogTitle>
          </AlertDialogHeader>
          <div>
            <InputGroup
              className={`w-[50%] mx-auto rounded-lg border h-14 ${minPrice ? "border-red-500" : "border-neutral-300"
                }`}
            >
              <InputGroupAddon>
                <Euro className="text-primary dark:text-accent size-6 " />
              </InputGroupAddon>
              <InputGroupInput
                type="number"
                inputMode="decimal"
                style={{ fontSize: '20px' }}
                className="font-bold placeholder:text-[20px] text-primary dark:text-accent text-center focus:placeholder-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder={effectivePrice.toString()}
                value={price !== null ? price.toString() : ""}
                onChange={(e) =>
                  setPrice(e.target.value ? Number(e.target.value) : null)
                }
              />
              <InputGroupAddon align="inline-end" className="text-primary text-2xl font-bold">
                <span>| ora</span>
              </InputGroupAddon>
            </InputGroup>

            {price !== null && !isValidPrice ? (
              <p className="mt-2 text-sm text-red-500">
                Inserisci un prezzo valido.
              </p>
            ) : minPrice ? (
              <p className="mt-2 text-sm text-red-500">
                Il prezzo minimo è 0,50&nbsp;€.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500 text-center">
                Prezzo per il driver: €{driverPrice}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await handleSave();
              }}
              disabled={saving}
            >
              {saving ? "Salvataggio..." : "Salva"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Separator className='my-4 bg-muted-foreground data-[orientation=horizontal]:w-[97%] mx-auto' />
      <CardContent>
        <div>
          <h2>
            Previsione del tuo guadagno
          </h2>
          <p>
            Guarda come varia il tuo guadagno in base alle ore prenotate.
          </p>
        </div>
        <div>
          <HourTooltip
            hourlyPrice={effectivePrice}
            value={hours}
            onValueChange={setHours}
            maximumValue={168}
          />
        </div>
      </CardContent>

    </Card>
  )
}   