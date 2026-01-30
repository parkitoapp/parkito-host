"use client"

import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import TimeSlotEditor from "@/components/TimeSlotEditor"

// Mock time slot data
interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  price: number
}

// Legend item component
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <div
        className="mt-1 h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)
  const [dailyPrice, setDailyPrice] = useState("15.00")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: "1", startTime: "08.00", endTime: "14.00", price: 40 },
  ])

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setIsSheetOpen(true)
  }



  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario e prezzi</h1>
          <p className="text-muted-foreground">
            Gestisci prezzi e disponibilità del tuo parcheggio
          </p>
        </div>
        <Button variant="outline">Suggerimenti sui prezzi</Button>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Calendar */}
        <div className="flex-1 rounded-lg border bg-card p-4">
          <Calendar
            mode="single"
            className="w-full"
            showOutsideDays={true}
            defaultMonth={new Date()}
            selected={selectedDate}
            onDayClick={handleDayClick}
            weekStartsOn={1}
          />
        </div>

        {/* Legend Sidebar */}
        <div className="w-64 shrink-0 rounded-lg border bg-card p-4">
          <h3 className="mb-4 font-semibold">Legenda</h3>
          <div className="flex flex-col gap-3">
            <LegendItem
              color="#1a1a1a"
              label="Default → disponibile tutto il giorno con prezzo base"
            />
            <LegendItem
              color="#22c55e"
              label="Disponibile tutto il giorno con prezzo personalizzato"
            />
            <LegendItem
              color="#3b82f6"
              label="Sempre disponibile con prezzo per fascia oraria"
            />
            <LegendItem color="#ef4444" label="Non disponibile" />
            <LegendItem color="#eab308" label="Fascia oraria non disponibile" />
          </div>
        </div>
      </div>

      {/* Day Detail Sheet */}
      <TimeSlotEditor isSheetOpen={isSheetOpen} setIsSheetOpen={setIsSheetOpen} selectedDate={selectedDate} isAvailable={isAvailable} dailyPrice={dailyPrice} timeSlots={timeSlots} setIsAvailable={setIsAvailable} setDailyPrice={setDailyPrice} setTimeSlots={setTimeSlots} />
    </div>
  )
}