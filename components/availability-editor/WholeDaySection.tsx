"use client";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RIPETIZIONE_OPTIONS, type RipetizioneValue } from "@/lib/availability-dates";

interface WholeDaySectionProps {
  wholeDayAvailable: boolean;
  onWholeDayAvailableChange: (v: boolean) => void;
  wholeDayHourlyPrice: string;
  onWholeDayHourlyPriceChange: (v: string) => void;
  wholeDayRipetizione: RipetizioneValue;
  onWholeDayRipetizioneChange: (v: RipetizioneValue) => void;
}

export function WholeDaySection({
  wholeDayAvailable,
  onWholeDayAvailableChange,
  wholeDayHourlyPrice,
  onWholeDayHourlyPriceChange,
  wholeDayRipetizione,
  onWholeDayRipetizioneChange,
}: WholeDaySectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Disponibile</p>
          <p className="text-sm text-muted-foreground">
            I driver possono prenotare
          </p>
        </div>
        <Switch
          id="whole-day-available"
          checked={wholeDayAvailable}
          onCheckedChange={onWholeDayAvailableChange}
          aria-label="Disponibile – I driver possono prenotare"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="whole-day-hourly-price">Prezzo orario per la giornata</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            €
          </span>
          <Input
            id="whole-day-hourly-price"
            type="number"
            step="0.01"
            min="0"
            value={wholeDayHourlyPrice}
            onChange={(e) => onWholeDayHourlyPriceChange(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      {!wholeDayAvailable && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="whole-day-ripetizione">Ripeti</Label>
          <Select
            value={wholeDayRipetizione}
            onValueChange={(v) => onWholeDayRipetizioneChange(v as RipetizioneValue)}
          >
            <SelectTrigger id="whole-day-ripetizione" className="w-full">
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
      )}
    </div>
  );
}
