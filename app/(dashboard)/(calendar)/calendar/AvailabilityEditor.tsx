"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Euro } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { TimeSlotListEditor } from "./TimeSlotListEditor"
import type { TimeSlot } from "@/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const COPY = {
  titleDate: (d: Date) =>
    d.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  warningTimeSlots:
    "Quando hai fasce orarie, il prezzo della giornata non è modificabile. Ogni fascia ha il suo prezzo.",
  availability: "Disponibile",
  availabilityHint:
    "Quando hai fasce orarie attive, non puoi disattivare la disponibilità per la giornata.",
  price: "Prezzo",
  timeSlots: "Fasce orarie",
  cancel: "Annulla",
  save: "Salva",
  errorPrice: "Inserisci un prezzo valido (min. €0.50)",
  successSave: "Salvato",
}

export interface AvailabilityEditorProps {
  date: Date
  initialAvailable?: boolean
  initialPrice?: number
  basePrice: number
  initialTimeSlots?: TimeSlot[]
  onClose: () => void
  onSave: (data: {
    date: Date
    available: boolean
    price: number
    timeSlots: TimeSlot[]
  }) => void
}

export function AvailabilityEditor({
  date,
  initialAvailable = true,
  initialPrice,
  basePrice,
  initialTimeSlots = [],
  onClose,
  onSave,
}: AvailabilityEditorProps) {
  const [available, setAvailable] = useState(initialAvailable)
  const [price, setPrice] = useState(
    initialPrice && initialPrice !== basePrice ? initialPrice.toString() : ""
  )
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(initialTimeSlots)
  const [showTimeSlots, setShowTimeSlots] = useState(false)
  const [priceFocused, setPriceFocused] = useState(false)

  useEffect(() => {
    setAvailable(initialAvailable)
    setPrice(
      initialPrice && initialPrice !== basePrice ? initialPrice.toString() : ""
    )
    setTimeSlots(initialTimeSlots)
  }, [initialAvailable, initialPrice, basePrice, initialTimeSlots, date])

  const handleSave = () => {
    const priceNum = price === "" ? basePrice : parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0.5) {
      toast.error(COPY.errorPrice)
      return
    }
    const processedTimeSlots = timeSlots.map((slot) => ({
      ...slot,
      price: typeof slot.price === "string" ? parseFloat(String(slot.price)) || priceNum : slot.price ?? priceNum,
    })) as TimeSlot[]
    if (date) {
      onSave({
        date,
        available,
        price: priceNum,
        timeSlots: processedTimeSlots,
      })
      toast.success(COPY.successSave)
      onClose()
    }
  }

  const isPriceDestructive =
    price !== "" && (isNaN(parseFloat(price)) || parseFloat(price) < 0.5)
  const isPriceDisabled = timeSlots.length > 0 || !available

  const title = COPY.titleDate(date)
  const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1)

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-5">
        <h2 className="mb-4 text-base font-bold text-[#333]">
          {capitalizedTitle}
        </h2>
        {timeSlots.length > 0 && (
          <div className="mb-4 rounded-md border-l-[3px] border-[#FF9500] bg-[#FFF9E6] p-3">
            <p className="text-[13px] leading-[18px] text-[#8B6914]">
              {COPY.warningTimeSlots}
            </p>
          </div>
        )}

        <div className="mb-6">
          <div className="mb-2 flex flex-row items-center justify-between">
            <Label
              htmlFor="availability"
              className="text-base font-semibold text-[#333]"
            >
              {COPY.availability}
            </Label>
            <Switch
              id="availability"
              checked={available}
              onCheckedChange={setAvailable}
              disabled={timeSlots.length > 0}
            />
          </div>
          {timeSlots.length > 0 && (
            <p className="mt-1 text-xs text-[#666]">{COPY.availabilityHint}</p>
          )}
        </div>

        <div className="mb-6">
          <Label
            htmlFor="price"
            className="mb-2 block text-base font-semibold text-[#333]"
          >
            {COPY.price}
          </Label>
          <div
            className={cn(
              "rounded-2xl p-1",
              isPriceDestructive && "bg-red-200",
              priceFocused && !isPriceDestructive && "bg-blue-200",
              isPriceDisabled && "opacity-50"
            )}
          >
            <div
              className={cn(
                "flex items-center rounded-xl border border-neutral-300 bg-white px-4",
                isPriceDisabled && "bg-gray-50"
              )}
            >
              <Euro className="mr-2 h-5 w-5 shrink-0 text-gray-400" />
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                maxLength={6}
                placeholder={basePrice.toString()}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isPriceDisabled}
                onFocus={() => setPriceFocused(true)}
                onBlur={() => setPriceFocused(false)}
                className="flex-1 border-0 bg-transparent text-center text-lg text-gray-900 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        </div>

        <Separator className="mb-4" />

        <Collapsible open={showTimeSlots} onOpenChange={setShowTimeSlots}>
          <CollapsibleTrigger className="mb-4 flex w-full flex-row items-center justify-between">
            <span className="text-base font-bold text-[#333]">
              {COPY.timeSlots}
            </span>
            {showTimeSlots ? (
              <ChevronUp className="h-5 w-5 text-[#007AFF]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#007AFF]" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mb-6">
              <TimeSlotListEditor
                timeSlots={timeSlots}
                defaultPrice={parseFloat(price) || basePrice}
                onSlotsChange={setTimeSlots}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex flex-row justify-between gap-4 border-t p-4">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          {COPY.cancel}
        </Button>
        <Button className="w-[50%] flex-1" onClick={handleSave}>
          {COPY.save}
        </Button>
      </div>
    </div>
  )
}
