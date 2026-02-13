"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  snapTimeToQuarter,
  minutesBetween,
  isEndAfterStart,
} from "@/components/ui/time-spinner";
import { toast } from "sonner";
import type { PktAvailability } from "@/types";
import {
  getPending,
  mergePendingUpdate,
  mergePendingDeleteOneDay,
  mergePendingDeleteIds,
} from "@/lib/availability-pending";
import { formatTimeFromDatetime, getRecordPatternKey, getRecordDateStr, slotsFromAvailability } from "./utils";
import type { AvailabilityEditorProps, EditorSlot } from "./types";
import { DEFAULT_RIPETIZIONE, MIN_SLOT_DURATION_MINUTES } from "./types";
import { AvailabilityEditorHeader } from "./AvailabilityEditorHeader";
import { WholeDaySection } from "./WholeDaySection";
import { TimeSlotsList } from "./TimeSlotsList";
import { DeleteAvailabilityDialog } from "./DeleteAvailabilityDialog";

export type { EditorSlot, AvailabilityEditorProps };

export function AvailabilityEditor({
  open,
  onOpenChange,
  selectedDate,
  selectedDateStr,
  selectedDatesRange,
  parkingId,
  parkingInfo,
  baseHourlyPrice,
  refetch,
  onPendingChange,
  mode = "single",
  onRangeSaveComplete,
}: AvailabilityEditorProps) {
  const [wholeDayAvailable, setWholeDayAvailable] = useState(true);
  const [wholeDayHourlyPrice, setWholeDayHourlyPrice] = useState("");
  const [wholeDayRipetizione, setWholeDayRipetizione] =
    useState(DEFAULT_RIPETIZIONE);
  const [slots, setSlots] = useState<EditorSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const availabilityForDate = useMemo(
    () => parkingInfo?.availability ?? [],
    [parkingInfo]
  );
  const daySlots = useMemo(
    () =>
      selectedDateStr
        ? availabilityForDate.filter((row: PktAvailability) => {
            const dateStr =
              typeof row.start_datetime === "string"
                ? row.start_datetime.slice(0, 10)
                : (row.start_datetime as Date).toISOString().slice(0, 10);
            return dateStr === selectedDateStr;
          })
        : [],
    [selectedDateStr, availabilityForDate]
  );

  const daySlotPatternKeys = useMemo(
    () => new Set(daySlots.map((r) => getRecordPatternKey(r))),
    [daySlots]
  );

  const hasRecurrenceInData = daySlots.some(
    (r) => typeof r.recurrence_rule === "string" && r.recurrence_rule.trim() !== ""
  );
  const hasRecurrenceSet =
    hasRecurrenceInData ||
    (!wholeDayAvailable && wholeDayRipetizione !== "mai") ||
    slots.some((s) => s.ripetizione !== "mai");

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

        return daySlotPatternKeys.has(getRecordPatternKey(row));
      })
      .map((r) => r.id)
      .filter((id): id is number => id != null);
  }, [availabilityForDate, daySlotPatternKeys, selectedDateStr, currentRule]);

  useEffect(() => {
    if (!open || !selectedDateStr) return;
    setError(null);

    if (mode === "range") {
      setWholeDayAvailable(true);
      setWholeDayHourlyPrice(
        baseHourlyPrice != null ? String(baseHourlyPrice) : ""
      );
      setWholeDayRipetizione(DEFAULT_RIPETIZIONE);
      setSlots([]);
      return;
    }

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
      setWholeDayHourlyPrice(
        baseHourlyPrice != null ? String(baseHourlyPrice) : ""
      );
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
  }, [open, selectedDateStr, baseHourlyPrice, daySlots, parkingId, mode]);

  const formatSelectedDate = useCallback((date: Date | undefined) => {
    if (!date) return "";
    return date.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, []);

  /** Add a slot: starts exactly when the previous one ends, duration 1h (9-10, 10-11, ...). */
  const addSlot = useCallback(() => {
    setSlots((prev) => {
      let start = "09:00";
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        start = snapTimeToQuarter(last.endTime);
      }
      const [sh, sm] = start.split(":").map(Number);
      const startMins = (sh ?? 9) * 60 + (sm ?? 0);
      const endMinsRaw = startMins + MIN_SLOT_DURATION_MINUTES;
      const endMins = Math.min(23 * 60 + 45, endMinsRaw);
      const snapped = Math.round(endMins / 15) * 15;
      const endH = Math.floor(snapped / 60);
      const endM = snapped % 60;
      const end = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
      return [
        ...prev,
        {
          startTime: start,
          endTime: end,
          isAvailable: true,
          hourlyPrice: "",
          ripetizione: DEFAULT_RIPETIZIONE,
        },
      ];
    });
  }, []);

  const removeSlot = useCallback((index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Update a slot. When times are changed, keep slots sequential:
   * - Changing startTime updates previous slot's endTime to match.
   * - Changing endTime updates next slot's startTime to match.
   */
  const updateSlot = useCallback((index: number, patch: Partial<EditorSlot>) => {
    const snappedStart = patch.startTime != null ? snapTimeToQuarter(patch.startTime) : null;
    const snappedEnd = patch.endTime != null ? snapTimeToQuarter(patch.endTime) : null;
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== index) {
          const next = { ...s };
          if (i === index - 1 && snappedStart != null) {
            next.endTime = snappedStart;
          }
          if (i === index + 1 && snappedEnd != null) {
            next.startTime = snappedEnd;
          }
          return next;
        }
        const next = { ...s, ...patch };
        if (patch.startTime != null) next.startTime = snapTimeToQuarter(patch.startTime);
        if (patch.endTime != null) next.endTime = snapTimeToQuarter(patch.endTime);
        return next;
      })
    );
  }, []);

  const slotErrors = useMemo(() => {
    const errors: Record<number, string[]> = {};
    slots.forEach((slot, i) => {
      const list: string[] = [];
      if (!isEndAfterStart(slot.startTime, slot.endTime)) {
        list.push("L'orario di fine deve essere dopo l'orario di inizio");
      }
      if (minutesBetween(slot.startTime, slot.endTime) < MIN_SLOT_DURATION_MINUTES) {
        list.push("La fascia deve durare almeno 1 ora");
      }
      if (list.length) errors[i] = list;
    });
    return errors;
  }, [slots]);

  const hasSlotErrors = Object.keys(slotErrors).length > 0;

  const handleSave = useCallback(() => {
    if (!parkingId) return;
    if (mode === "single" && !selectedDateStr) return;
    if (mode === "range" && (!selectedDatesRange || selectedDatesRange.length === 0)) return;
    if (hasSlotErrors) {
      toast.error("Correggi gli errori nelle fasce orarie");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updatePayload = {
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
      };

      if (mode === "range" && selectedDatesRange && selectedDatesRange.length > 0) {
        for (const dateStr of selectedDatesRange) {
          mergePendingUpdate(parkingId, dateStr, updatePayload, onPendingChange);
        }
        onRangeSaveComplete?.();
      } else if (selectedDateStr) {
        mergePendingUpdate(
          parkingId,
          selectedDateStr,
          updatePayload,
          onPendingChange
        );
      }
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
  }, [
    parkingId,
    mode,
    selectedDateStr,
    selectedDatesRange,
    hasSlotErrors,
    wholeDayAvailable,
    wholeDayHourlyPrice,
    wholeDayRipetizione,
    slots,
    onPendingChange,
    onRangeSaveComplete,
    onOpenChange,
  ]);

  const handleDeleteClick = useCallback(() => {
    if (daySlots.length === 0) return;
    if (hasRecurrenceSet) {
      setDeleteDialogOpen(true);
    } else {
      mergePendingDeleteOneDay(parkingId, selectedDateStr!, onPendingChange);
      toast.success("Eliminazione salvata in bozza");
      onPendingChange?.();
      onOpenChange(false);
    }
  }, [daySlots.length, hasRecurrenceSet, parkingId, selectedDateStr, onPendingChange, onOpenChange]);

  const handleDeleteJustThisOne = useCallback(() => {
    mergePendingDeleteOneDay(parkingId, selectedDateStr!, onPendingChange);
    toast.success("Eliminazione salvata in bozza");
    onPendingChange?.();
    setDeleteDialogOpen(false);
    onOpenChange(false);
  }, [parkingId, selectedDateStr, onPendingChange, onOpenChange]);

  const handleDeleteAllFuture = useCallback(() => {
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
  }, [parkingId, idsToDeleteAllFuture, selectedDateStr, onPendingChange, onOpenChange]);

  if (!selectedDateStr) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          hideCloseButton
          className="top-4 right-4 bottom-4 left-auto h-[calc(100vh-2rem)] w-[400px] max-w-[calc(100vw-2rem)] rounded-xl border shadow-xl overflow-y-auto px-4"
        >
          <AvailabilityEditorHeader
            selectedDate={selectedDate}
            selectedDatesRange={selectedDatesRange}
            mode={mode}
            formatSelectedDate={formatSelectedDate}
          />

          <div className="mt-6 flex flex-col gap-6">
            <WholeDaySection
              wholeDayAvailable={wholeDayAvailable}
              onWholeDayAvailableChange={setWholeDayAvailable}
              wholeDayHourlyPrice={wholeDayHourlyPrice}
              onWholeDayHourlyPriceChange={setWholeDayHourlyPrice}
              wholeDayRipetizione={wholeDayRipetizione}
              onWholeDayRipetizioneChange={setWholeDayRipetizione}
            />

            <TimeSlotsList
              slots={slots}
              slotErrors={slotErrors}
              onAddSlot={addSlot}
              onRemoveSlot={removeSlot}
              onUpdateSlot={updateSlot}
            />

            {mode === "range" && (
              <p className="text-xs text-muted-foreground">
                Se imposti una ripetizione, le modifiche possono estendersi oltre
                l&apos;intervallo selezionato.
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <SheetFooter className="flex flex-col items-stretch w-full gap-2">
            <Button onClick={handleSave} disabled={saving || hasSlotErrors} className="w-full">
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

      <DeleteAvailabilityDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleteJustThisOne={handleDeleteJustThisOne}
        onDeleteAllFuture={handleDeleteAllFuture}
      />
    </>
  );
}
