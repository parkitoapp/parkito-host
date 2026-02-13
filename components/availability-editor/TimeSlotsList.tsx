"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SlotCard } from "./SlotCard";
import type { EditorSlot } from "./types";

interface TimeSlotsListProps {
  slots: EditorSlot[];
  slotErrors: Record<number, string[]>;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onUpdateSlot: (index: number, patch: Partial<EditorSlot>) => void;
}

export function TimeSlotsList({
  slots,
  slotErrors,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
}: TimeSlotsListProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label className="font-medium">Fasce orarie</Label>
        <Button variant="ghost" size="sm" className="gap-1" onClick={onAddSlot}>
          <Plus className="h-4 w-4" />
          Aggiungi
        </Button>
      </div>

      {slots.map((slot, i) => (
        <SlotCard
          key={i}
          slot={slot}
          index={i}
          errors={slotErrors[i]}
          onUpdate={(patch) => onUpdateSlot(i, patch)}
          onRemove={() => onRemoveSlot(i)}
        />
      ))}
    </div>
  );
}
