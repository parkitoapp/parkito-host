import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
}


interface TimeSlotEditorProps {
  isSheetOpen: boolean;
  selectedDate: Date | undefined;
  isAvailable: boolean;
  dailyPrice: string;
  timeSlots: TimeSlot[];
  setDailyPrice: (price: string) => void;
  setTimeSlots: (slots: TimeSlot[]) => void;
  setIsAvailable: (available: boolean) => void;
  setIsSheetOpen: (open: boolean) => void;
}

export default function TimeSlotEditor({
  isSheetOpen,
  setIsSheetOpen,
  selectedDate,
  isAvailable,
  dailyPrice,
  timeSlots,
  setDailyPrice,
  setTimeSlots,
  setIsAvailable,
}: TimeSlotEditorProps) {

  const formatSelectedDate = (date: Date | undefined) => {
    if (!date) return ""
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
    const formatted = date.toLocaleDateString("it-IT", options)
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }


  return (<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
    <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
      <SheetHeader>
        <SheetTitle className="text-xl">
          {formatSelectedDate(selectedDate)}
        </SheetTitle>
        <SheetDescription>Modifica disponibilità</SheetDescription>
      </SheetHeader>

      <div className="mt-6 flex flex-col gap-6">
        {/* Availability Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Disponibile</p>
            <p className="text-sm text-muted-foreground">
              I driver possono prenotare
            </p>
          </div>
          <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
        </div>

        {/* Daily Price */}
        <div className="flex flex-col gap-2">
          <label className="font-medium">Prezzo orario per la giornata</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              €
            </span>
            <Input
              type="text"
              value={dailyPrice}
              onChange={(e) => setDailyPrice(e.target.value)}
              className="pl-7"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Prezzo suggerito in base alla zona: € 2.50
          </p>
        </div>

        {/* Time Slots */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="font-medium">Fasce orarie</label>
            <Button variant="ghost" size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Aggiungi
            </Button>
          </div>

          {timeSlots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
            >
              <Clock className="h-4 w-4" />
              <span>
                {slot.startTime} - {slot.endTime}
              </span>
              <span className="ml-auto font-semibold">€ {slot.price}</span>
            </div>
          ))}
        </div>
      </div>
    </SheetContent>
  </Sheet>
  )
}