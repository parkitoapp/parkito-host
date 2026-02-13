"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TimeSpinner } from "@/components/ui/time-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { RIPETIZIONE_OPTIONS, type RipetizioneValue } from "@/lib/availability-dates";
import type { EditorSlot } from "./types";

interface SlotCardProps {
  slot: EditorSlot;
  index: number;
  errors: string[] | undefined;
  onUpdate: (patch: Partial<EditorSlot>) => void;
  onRemove: () => void;
}

export function SlotCard({ slot, index, errors, onUpdate, onRemove }: SlotCardProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Fascia {index + 1}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Disponibile</span>
        <Switch
          checked={slot.isAvailable}
          onCheckedChange={(v) => onUpdate({ isAvailable: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Inizio</Label>
          <TimeSpinner
            value={slot.startTime}
            onChange={(v) => onUpdate({ startTime: v })}
            invalid={!!errors?.length}
            aria-label={`Fascia ${index + 1} orario di inizio`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Fine</Label>
          <TimeSpinner
            value={slot.endTime}
            onChange={(v) => onUpdate({ endTime: v })}
            invalid={!!errors?.length}
            aria-label={`Fascia ${index + 1} orario di fine`}
          />
        </div>
      </div>
      {errors && errors.length > 0 && (
        <p className="text-xs text-destructive">{errors.join(". ")}</p>
      )}
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Prezzo orario (vuoto = base)</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={slot.hourlyPrice}
          onChange={(e) => onUpdate({ hourlyPrice: e.target.value })}
          placeholder="Base"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Ripetizione</Label>
        <Select
          value={slot.ripetizione}
          onValueChange={(v) => onUpdate({ ripetizione: v as RipetizioneValue })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RIPETIZIONE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
