"use client";

import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

interface AvailabilityEditorHeaderProps {
  selectedDate: Date | undefined;
  selectedDatesRange: string[] | null | undefined;
  mode: "single" | "range";
  formatSelectedDate: (date: Date | undefined) => string;
}

export function AvailabilityEditorHeader({
  selectedDate,
  selectedDatesRange,
  mode,
  formatSelectedDate,
}: AvailabilityEditorHeaderProps) {
  return (
    <SheetHeader className="flex-row items-start justify-between gap-4 px-0">
      <div className="flex flex-col gap-1.5">
        <SheetTitle className="text-xl capitalize">
          {formatSelectedDate(selectedDate)}
        </SheetTitle>
        <SheetDescription>
          {mode === "range" && selectedDatesRange && selectedDatesRange.length > 1 ? (
            <>
              Da{" "}
              <span className="font-semibold">
                {new Date(selectedDatesRange[0] + "T12:00:00").toLocaleDateString(
                  "it-IT",
                  { day: "numeric", month: "long" }
                )}
              </span>{" "}
              a{" "}
              <span className="font-semibold">
                {new Date(
                  selectedDatesRange[selectedDatesRange.length - 1] + "T12:00:00"
                ).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "long",
                })}
              </span>{" "}
              (
              <span className="font-semibold">
                {selectedDatesRange.length} giorni
              </span>
              )
            </>
          ) : (
            "Modifica disponibilità"
          )}
        </SheetDescription>
      </div>
      <SheetClose asChild>
        <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Chiudi</span>
        </Button>
      </SheetClose>
    </SheetHeader>
  );
}
