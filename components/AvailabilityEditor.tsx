"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Plus, Trash2, XIcon } from "lucide-react";
import { toast } from "sonner";
import type { ParkingFullInfo, PktAvailability } from "@/types";
import { RIPETIZIONE_OPTIONS, type RipetizioneValue } from "@/lib/availability-dates";
import {
  getPending,
  mergePendingUpdate,
  mergePendingDeleteOneDay,
  mergePendingDeleteIds,
} from "@/lib/availability-pending";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatTimeFromDatetime(dt: string | Date): string {
  const d = typeof dt === "string" ? new Date(dt) : (dt as Date);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getRecordPatternKey(row: PktAvailability): string {
  const start = formatTimeFromDatetime(row.start_datetime);
  const end = formatTimeFromDatetime(row.end_datetime);
  return `${start}_${end}_${row.is_available}`;
}

function getRecordDateStr(row: PktAvailability): string {
  const s = row.start_datetime;
  return typeof s === "string" ? s.slice(0, 10) : (s as Date).toISOString().slice(0, 10);
}


export interface EditorSlot {
  id?: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  hourlyPrice: string;
  ripetizione: RipetizioneValue;
}

export interface AvailabilityEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | undefined;
  selectedDateStr: string | null;
  parkingId: string | null;
  parkingInfo: ParkingFullInfo | null;
  baseHourlyPrice: number | null;
  refetch: () => void;
  /** Called when pending changes are updated (so parent can show global save button). */
  onPendingChange?: () => void;
}

const DEFAULT_RIPETIZIONE: RipetizioneValue = "mai";

function slotsFromAvailability(
  list: PktAvailability[],
  _basePrice: number | null
): EditorSlot[] {
  return list.map((row) => {
    const rawRule =
      typeof row.recurrence_rule === "string" ? row.recurrence_rule.trim() : "";
    const fromRule = (rawRule && rawRule !== "mai"
      ? (rawRule as RipetizioneValue)
      : DEFAULT_RIPETIZIONE) as RipetizioneValue;
    return {
      id: row.id,
      startTime: formatTimeFromDatetime(row.start_datetime),
      endTime: formatTimeFromDatetime(row.end_datetime),
      isAvailable: row.is_available === true,
      hourlyPrice:
        row.hourly_price != null && Number.isFinite(Number(row.hourly_price))
          ? String(row.hourly_price)
          : "",
      ripetizione: fromRule,
    };
  });
}

export function AvailabilityEditor({
  open,
  onOpenChange,
  selectedDate,
  selectedDateStr,
  parkingId,
  parkingInfo,
  baseHourlyPrice,
  refetch,
  onPendingChange,
}: AvailabilityEditorProps) {
  const [wholeDayAvailable, setWholeDayAvailable] = useState(true);
  const [wholeDayHourlyPrice, setWholeDayHourlyPrice] = useState("");
  const [wholeDayRipetizione, setWholeDayRipetizione] =
    useState<RipetizioneValue>(DEFAULT_RIPETIZIONE);
  const [slots, setSlots] = useState<EditorSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const availabilityForDate = useMemo(() => parkingInfo?.availability ?? [], [parkingInfo]);
  const daySlots = useMemo(() => selectedDateStr
    ? availabilityForDate.filter((row: PktAvailability) => {
      const dateStr =
        typeof row.start_datetime === "string"
          ? row.start_datetime.slice(0, 10)
          : (row.start_datetime as Date).toISOString().slice(0, 10);
      return dateStr === selectedDateStr;
    })
    : [], [selectedDateStr, availabilityForDate]);

  const daySlotPatternKeys = useMemo(
    () => new Set(daySlots.map((r) => getRecordPatternKey(r))),
    [daySlots]
  );

  /** Only ask "this day vs all future" when user has set recurrence (ripetizione !== \"mai\") or existing slots carry a recurrence_rule. */
  const hasRecurrenceInData = daySlots.some(
    (r) => typeof r.recurrence_rule === "string" && r.recurrence_rule.trim() !== ""
  );
  const hasRecurrenceSet =
    hasRecurrenceInData ||
    (!wholeDayAvailable && wholeDayRipetizione !== "mai") ||
    slots.some((s) => s.ripetizione !== "mai");

  // Recurrence rule of the current series (if any existing record on this day has one)
  const currentRule = useMemo(() => {
    const withRule = daySlots.find(
      (r) => typeof r.recurrence_rule === "string" && r.recurrence_rule.trim() !== ""
    );
    return withRule?.recurrence_rule?.trim() ?? null;
  }, [daySlots]);

  const idsToDeleteAllFuture = useMemo(() => {
    if (!selectedDateStr) return [];
    return availabilityForDate
      .filter((row) => {
        const dateStr = getRecordDateStr(row);
        if (dateStr < selectedDateStr) return false;

        if (currentRule) {
          const rule =
            typeof row.recurrence_rule === "string"
              ? row.recurrence_rule.trim()
              : "";
          return rule === currentRule;
        }

        // Fallback for legacy rows without recurrence_rule: match by pattern
        return daySlotPatternKeys.has(getRecordPatternKey(row));
      })
      .map((r) => r.id)
      .filter((id): id is number => id != null);
  }, [availabilityForDate, daySlotPatternKeys, selectedDateStr, currentRule]);

  useEffect(() => {
    if (!open || !selectedDateStr) return;
    setError(null);
    const pending = parkingId ? getPending(parkingId) : null;
    const pendingUpdate = pending?.updates[selectedDateStr];
    const pendingDelete = pending?.deleteDates.includes(selectedDateStr);
    if (pendingUpdate) {
      setWholeDayAvailable(pendingUpdate.wholeDayAvailable);
      setWholeDayHourlyPrice(pendingUpdate.wholeDayHourlyPrice);
      setWholeDayRipetizione(pendingUpdate.wholeDayRipetizione);
      setSlots(pendingUpdate.slots.map((s) => ({ ...s, id: undefined })));
      return;
    }
    if (pendingDelete) {
      setWholeDayAvailable(true);
      setWholeDayHourlyPrice(baseHourlyPrice != null ? String(baseHourlyPrice) : "");
      setWholeDayRipetizione(DEFAULT_RIPETIZIONE);
      setSlots([]);
      return;
    }
    if (daySlots.length === 0) {
      setWholeDayAvailable(true);
      setWholeDayHourlyPrice(
        baseHourlyPrice != null ? String(baseHourlyPrice) : ""
      );
      setWholeDayRipetizione(DEFAULT_RIPETIZIONE);
      setSlots([]);
      return;
    }
    const single = daySlots.length === 1 && daySlots[0];
    const fullDay =
      single &&
      formatTimeFromDatetime(single.start_datetime) === "00:00" &&
      formatTimeFromDatetime(single.end_datetime) === "23:59";
    if (fullDay && single) {
      setWholeDayAvailable(single.is_available === true);
      setWholeDayHourlyPrice(
        single.hourly_price != null ? String(single.hourly_price) : ""
      );
      setWholeDayRipetizione(DEFAULT_RIPETIZIONE);
      setSlots([]);
    } else {
      setWholeDayAvailable(true);
      setWholeDayHourlyPrice(
        baseHourlyPrice != null ? String(baseHourlyPrice) : ""
      );
      setWholeDayRipetizione(DEFAULT_RIPETIZIONE);
      setSlots(slotsFromAvailability(daySlots, baseHourlyPrice));
    }
  }, [open, selectedDateStr, baseHourlyPrice, daySlots, parkingId]);

  const formatSelectedDate = useCallback((date: Date | undefined) => {
    if (!date) return "";
    return date.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, []);

  /** Add a slot starting at the next hour after the last slot (09:00-10:00, 10:00-11:00, …) to avoid overlap. */
  const addSlot = () => {
    setSlots((prev) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      let startH = 9;
      let startM = 0;
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const [eh, em] = last.endTime.split(":").map(Number);
        startH = Number.isFinite(eh) ? eh : 9;
        startM = Number.isFinite(em) ? em : 0;
      }
      const endH = startH + 1;
      const endM = startM;
      const endHour = endH > 23 ? 23 : endH;
      const endMin = endH > 23 ? 59 : endM;
      return [
        ...prev,
        {
          startTime: `${pad(startH)}:${pad(startM)}`,
          endTime: `${pad(endHour)}:${pad(endMin)}`,
          isAvailable: true,
          hourlyPrice: "",
          ripetizione: DEFAULT_RIPETIZIONE,
        },
      ];
    });
  };

  const removeSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, patch: Partial<EditorSlot>) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const handleSave = () => {
    if (!selectedDateStr || !parkingId) return;
    setSaving(true);
    setError(null);
    try {
      mergePendingUpdate(
        parkingId,
        selectedDateStr,
        {
          wholeDayAvailable,
          wholeDayHourlyPrice,
          wholeDayRipetizione,
          slots: slots.map((s) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            isAvailable: s.isAvailable,
            hourlyPrice: s.hourlyPrice,
            ripetizione: s.ripetizione,
          })),
        },
        onPendingChange
      );
      toast.success("Modifiche salvate in bozza");
      onPendingChange?.();
      onOpenChange(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Errore durante il salvataggio";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    if (daySlots.length === 0) return;
    if (hasRecurrenceSet) {
      setDeleteDialogOpen(true);
    } else {
      mergePendingDeleteOneDay(parkingId, selectedDateStr!, onPendingChange);
      toast.success("Eliminazione salvata in bozza");
      onPendingChange?.();
      onOpenChange(false);
    }
  };

  const handleDeleteJustThisOne = () => {
    mergePendingDeleteOneDay(parkingId, selectedDateStr!, onPendingChange);
    toast.success("Eliminazione salvata in bozza");
    onPendingChange?.();
    setDeleteDialogOpen(false);
    onOpenChange(false);
  };

  const handleDeleteAllFuture = () => {
    mergePendingDeleteIds(
      parkingId,
      idsToDeleteAllFuture,
      selectedDateStr ?? undefined,
      onPendingChange
    );
    toast.success("Eliminazione salvata in bozza");
    onPendingChange?.();
    setDeleteDialogOpen(false);
    onOpenChange(false);
  };

  if (!selectedDateStr) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          hideCloseButton
          className="top-4 right-4 bottom-4 left-auto h-[calc(100vh-2rem)] w-[400px] max-w-[calc(100vw-2rem)] rounded-xl border shadow-xl overflow-y-auto px-4"
        >
          <SheetHeader className="flex-row items-start justify-between gap-4 px-0">
            <div className="flex flex-col gap-1.5">
              <SheetTitle className="text-xl capitalize">
                {formatSelectedDate(selectedDate)}
              </SheetTitle>
              <SheetDescription>Modifica disponibilità</SheetDescription>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Chiudi</span>
              </Button>
            </SheetClose>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Disponibile</p>
                  <p className="text-sm text-muted-foreground">
                    I driver possono prenotare
                  </p>
                </div>
                <Switch
                  checked={wholeDayAvailable}
                  onCheckedChange={setWholeDayAvailable}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Prezzo orario per la giornata</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    €
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={wholeDayHourlyPrice}
                    onChange={(e) => setWholeDayHourlyPrice(e.target.value)}
                    className="pl-7"
                  // placeholder={baseHourlyPrice != null ? String(baseHourlyPrice) : ""}
                  />
                </div>
              </div>

              {!wholeDayAvailable && (
                <div className="flex flex-col gap-2">
                  <Label>Ripeti</Label>
                  <Select
                    value={wholeDayRipetizione}
                    onValueChange={(v) => setWholeDayRipetizione(v as RipetizioneValue)}
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
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Fasce orarie</Label>
                <Button variant="ghost" size="sm" className="gap-1" onClick={addSlot}>
                  <Plus className="h-4 w-4" />
                  Aggiungi
                </Button>
              </div>

              {slots.map((slot, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-muted/30 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fascia {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeSlot(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">Disponibile</span>
                    <Switch
                      checked={slot.isAvailable}
                      onCheckedChange={(v) => updateSlot(i, { isAvailable: v })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Inizio</Label>
                      <div className="relative">
                        <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs">Fine</Label>
                      <div className="relative">
                        <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Prezzo orario (vuoto = base)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={slot.hourlyPrice}
                      onChange={(e) => updateSlot(i, { hourlyPrice: e.target.value })}
                      placeholder="Base"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Ripetizione</Label>
                    <Select
                      value={slot.ripetizione}
                      onValueChange={(v) => updateSlot(i, { ripetizione: v as RipetizioneValue })}
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
              ))}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <SheetFooter className="flex flex-col items-stretch w-full gap-2">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Salvataggio..." : "Salva"}
            </Button>
            {daySlots.length > 0 && (
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDeleteClick}
                disabled={saving}
              >
                Elimina disponibilità
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Elimina disponibilità
            </AlertDialogTitle>
            <AlertDialogDescription>
              Questa disponibilità si ripete. Vuoi eliminare solo questo giorno o tutte le date
              future?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteJustThisOne();
              }}
            >
              Solo questo giorno
            </AlertDialogAction>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAllFuture();
              }}
            >
              Tutte le date future
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
