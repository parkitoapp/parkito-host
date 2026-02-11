"use client";

import {
  Calendar as UICalendar,
  CalendarDayButton,
} from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSelectedParking } from "@/providers/selected-parking-provider";
import { useParkingInfo } from "@/hooks/use-parking-info";
import { useMemo, useState, useCallback } from "react";
import type { DayState } from "@/types";
import { it } from "react-day-picker/locale";
import { Spinner } from "@/components/ui/spinner";
import { AvailabilityEditor } from "@/components/AvailabilityEditor";
import {
  getPending,
  hasPending,
  clearPending,
} from "@/lib/availability-pending";
import type { PendingDayUpdate } from "@/lib/availability-pending";
import { computeDatesFromRipetizione } from "@/lib/availability-dates";
import type { PktAvailability, ParkingDayInfo } from "@/types";
import { toast } from "sonner";
import { Repeat2 } from "lucide-react";
import {
  getAvailabilityDateStr,
  isFullDaySlot,
  availabilityToDays,
  buildModifiersFromDays,
} from "@/lib/calendar-utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { DateRange } from "react-day-picker";

/** Turn a pending day update into synthetic PktAvailability rows for that date (for UI only). */
function pendingUpdateToRows(dateStr: string, update: PendingDayUpdate): PktAvailability[] {
  const rows: PktAvailability[] = [];
  if (update.slots.length === 0) {
    const rawRule =
      update.wholeDayRipetizione && update.wholeDayRipetizione !== "mai"
        ? update.wholeDayRipetizione
        : null;
    rows.push({
      parking_id: "",
      start_datetime: `${dateStr}T00:00:00`,
      end_datetime: `${dateStr}T23:59:00`,
      is_available: update.wholeDayAvailable,
      hourly_price: update.wholeDayHourlyPrice ? Number(update.wholeDayHourlyPrice) : null,
      recurrence_rule: rawRule,
    });
  } else {
    for (const slot of update.slots) {
      const rawRule =
        slot.ripetizione && slot.ripetizione !== "mai" ? slot.ripetizione : null;
      rows.push({
        parking_id: "",
        start_datetime: `${dateStr}T${slot.startTime}:00`,
        end_datetime: `${dateStr}T${slot.endTime}:00`,
        is_available: slot.isAvailable,
        hourly_price: slot.hourlyPrice ? Number(slot.hourlyPrice) : null,
        recurrence_rule: rawRule,
      });
    }
  }
  return rows;
}

// Base cell style so all states (including time-slots) have same size
const DAY_CELL_BASE = "min-h-full min-w-full";

// Match legend: green = custom price, blue = time slots, red = unavailable, amber = time-slot-unavailable
const DAY_STATE_CLASSES: Record<DayState, string> = {
  default:
    "bg-transparent border border-border text-foreground",
  "custom-price":
    "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-800",
  "time-slots":
    "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800",
  unavailable:
    "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800",
  "time-slot-unavailable":
    "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800",
};

// Dots match legend colors (green-500, blue-500, red-500, amber-500)
const DAY_STATE_DOT_CLASSES: Record<Exclude<DayState, "default">, string> = {
  "custom-price": "bg-green-500",
  "time-slots": "bg-blue-500",
  unavailable: "bg-red-500",
  "time-slot-unavailable": "bg-amber-500",
};

function buildModifiersClassNames(): Record<string, string> {
  const out: Record<string, string> = {};
  (Object.keys(DAY_STATE_CLASSES) as DayState[]).forEach((state) => {
    out[`day-${state}`] = DAY_STATE_CLASSES[state];
  });
  return out;
}

const modifiersClassNames = buildModifiersClassNames();

type CalendarViewMode = "single" | "range";

export default function Calendar() {
  const { selectedParkingId, isInitializingSelection } = useSelectedParking();
  const { data: parkingInfo, isLoading, isFetching, error, refetch } = useParkingInfo(selectedParkingId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [selectedRangeDatesStr, setSelectedRangeDatesStr] = useState<string[] | null>(null);
  const [pendingVersion, setPendingVersion] = useState(0);
  const [savingBulk, setSavingBulk] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("single");
  const [rangeSelection, setRangeSelection] = useState<DateRange | undefined>();
  const showLoading =
    isInitializingSelection ||
    (selectedParkingId != null && (isLoading || isFetching)) ||
    savingBulk;

  const hasPendingChanges = useMemo(() => {
    void pendingVersion; // force re-run when draft changes (session storage)
    return selectedParkingId != null && hasPending(selectedParkingId);
  }, [selectedParkingId, pendingVersion]);

  const applyPending = useCallback(async () => {
    if (!selectedParkingId) return;
    setSavingBulk(true);
    try {
      const pending = getPending(selectedParkingId);
      if (!pending || (!Object.keys(pending.updates).length && !pending.deleteDates.length && !pending.deleteIds.length)) {
        clearPending(selectedParkingId, () => setPendingVersion((v) => v + 1));
        setSavingBulk(false);
        return;
      }
      const result = await refetch();
      const freshInfo = result.data;
      const freshAvailability: PktAvailability[] = freshInfo?.availability ?? [];
      const getDateStr = (row: PktAvailability) =>
        typeof row.start_datetime === "string"
          ? row.start_datetime.slice(0, 10)
          : (row.start_datetime as Date).toISOString().slice(0, 10);
      const dateToIds = new Map<string, number[]>();
      for (const row of freshAvailability) {
        const dateStr = getDateStr(row);
        const ids = dateToIds.get(dateStr) ?? [];
        if (row.id != null) ids.push(row.id);
        dateToIds.set(dateStr, ids);
      }

      const deleteMany = async (ids: number[]) => {
        if (!ids.length) return;
        const res = await fetch("/api/availability/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ availability_ids: ids }),
        });
        if (!res.ok && res.status !== 404) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? "Delete failed");
        }
      };

      // Collect all ids that must be deleted before applying updates
      const allIdsToDelete = new Set<number>();

      for (const id of pending.deleteIds) {
        allIdsToDelete.add(id);
      }
      for (const dateStr of pending.deleteDates) {
        const ids = dateToIds.get(dateStr) ?? [];
        for (const id of ids) {
          allIdsToDelete.add(id);
        }
      }

      const savePayload = async (body: Record<string, unknown>) => {
        const res = await fetch("/api/availability/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? "Save failed");
        }
      };

      for (const [dateStr, dayUpdate] of Object.entries(pending.updates)) {
        const idsToDelete = dateToIds.get(dateStr) ?? [];
        for (const id of idsToDelete) {
          allIdsToDelete.add(id);
        }

        if (dayUpdate.slots.length === 0) {
          const dates = computeDatesFromRipetizione(dayUpdate.wholeDayRipetizione, dateStr);
          const availabilityType = dayUpdate.wholeDayAvailable ? "ALWAYS_AVAILABLE" : "UNAVAILABLE";
          const recurrence_rule =
            dayUpdate.wholeDayRipetizione && dayUpdate.wholeDayRipetizione !== "mai"
              ? dayUpdate.wholeDayRipetizione
              : null;
          await savePayload({
            parking_id: selectedParkingId,
            availabilityType,
            dates,
            startTime: { hour: 0, minute: 0 },
            endTime: { hour: 23, minute: 59 },
            hourly_price: dayUpdate.wholeDayHourlyPrice ? Number(dayUpdate.wholeDayHourlyPrice) : null,
            recurrence_rule,
          });
        } else {
          for (const slot of dayUpdate.slots) {
            const dates = computeDatesFromRipetizione(slot.ripetizione, dateStr);
            const availabilityType = slot.isAvailable ? "TIME_SLOT" : "UNAVAILABLE";
            const [sh, sm] = slot.startTime.split(":").map(Number);
            const [eh, em] = slot.endTime.split(":").map(Number);
            const recurrence_rule =
              slot.ripetizione && slot.ripetizione !== "mai" ? slot.ripetizione : null;
            await savePayload({
              parking_id: selectedParkingId,
              availabilityType,
              dates,
              startTime: { hour: sh || 0, minute: sm || 0 },
              endTime: { hour: eh ?? 23, minute: em ?? 59 },
              hourly_price: slot.hourlyPrice ? Number(slot.hourlyPrice) : null,
              recurrence_rule,
            });
          }
        }
      }

      // Perform the actual bulk delete at the end, once
      if (allIdsToDelete.size > 0) {
        await deleteMany(Array.from(allIdsToDelete));
      }

      clearPending(selectedParkingId, () => setPendingVersion((v) => v + 1));
      await refetch();
      toast.success("Modifiche salvate");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Errore durante il salvataggio";
      toast.error(message);
    } finally {
      setSavingBulk(false);
    }
  }, [selectedParkingId, refetch]);

  const resetPending = useCallback(async () => {
    if (!selectedParkingId) return;
    clearPending(selectedParkingId, () => setPendingVersion((v) => v + 1));
    await refetch();
    toast.success("Modifiche annullate");
  }, [selectedParkingId, refetch]);

  const pending = useMemo(() => {
    void pendingVersion;
    return typeof window !== "undefined" && selectedParkingId ? getPending(selectedParkingId) : null;
  }, [selectedParkingId, pendingVersion]);

  const effectiveAvailability = useMemo(() => {
    const list = parkingInfo?.availability ?? [];
    const deleteIds = new Set(pending?.deleteIds ?? []);
    const deleteDates = new Set(pending?.deleteDates ?? []);
    const updates = pending?.updates ?? {};

    // Start from server data minus any pending deletes (by id or by date)
    const filtered = list.filter(
      (row) =>
        !deleteDates.has(getAvailabilityDateStr(row)) &&
        !(row.id != null && deleteIds.has(row.id))
    );

    const byDate = new Map<string, PktAvailability[]>();
    for (const row of filtered) {
      const dateStr = getAvailabilityDateStr(row);
      const arr = byDate.get(dateStr) ?? [];
      arr.push(row);
      byDate.set(dateStr, arr);
    }

    // Apply pending updates, expanding recurrence so the preview matches the final result
    for (const [selectedDateStr, dayUpdate] of Object.entries(updates)) {
      if (dayUpdate.slots.length === 0) {
        // Whole-day update (ALWAYS_AVAILABLE or UNAVAILABLE)
        const dates = computeDatesFromRipetizione(
          dayUpdate.wholeDayRipetizione,
          selectedDateStr
        );
        for (const date of dates) {
          byDate.set(date, pendingUpdateToRows(date, dayUpdate));
        }
      } else {
        // Time slots: each slot may have its own recurrence; merge per date
        const perDate = new Map<string, PktAvailability[]>();
        for (const slot of dayUpdate.slots) {
          const dates = computeDatesFromRipetizione(
            slot.ripetizione,
            selectedDateStr
          );
          for (const d of dates) {
            const arr = perDate.get(d) ?? [];
            arr.push({
              parking_id: "",
              start_datetime: `${d}T${slot.startTime}:00`,
              end_datetime: `${d}T${slot.endTime}:00`,
              is_available: slot.isAvailable,
              hourly_price: slot.hourlyPrice
                ? Number(slot.hourlyPrice)
                : null,
              recurrence_rule:
                slot.ripetizione && slot.ripetizione !== "mai"
                  ? slot.ripetizione
                  : null,
            });
            perDate.set(d, arr);
          }
        }
        perDate.forEach((rows, date) => {
          byDate.set(date, rows);
        });
      }
    }

    return byDate;
  }, [parkingInfo?.availability, pending]);

  const effectiveDays = useMemo((): ParkingDayInfo[] => {
    const deleteDates = new Set(pending?.deleteDates ?? []);
    const defaultPrice =
      (parkingInfo?.parking as { base_hourly_price?: number | null } | undefined)?.base_hourly_price ?? null;
    const derived = availabilityToDays(effectiveAvailability, defaultPrice);
    const derivedMap = new Map(derived.map((d) => [d.date.slice(0, 10), d]));
    const allDates = new Set([...effectiveAvailability.keys(), ...deleteDates]);
    return Array.from(allDates)
      .sort()
      .map((dateStr) => {
        if (deleteDates.has(dateStr))
          return { date: dateStr, state: "default" as DayState, price: defaultPrice ?? undefined };
        return derivedMap.get(dateStr) ?? { date: dateStr, state: "default" as DayState, price: defaultPrice ?? undefined };
      });
  }, [parkingInfo?.parking, pending, effectiveAvailability]);

  const modifiers = useMemo(
    () => (effectiveDays?.length ? buildModifiersFromDays(effectiveDays) : {}),
    [effectiveDays]
  );

  const dateToDayInfo = useMemo(() => {
    return new Map(effectiveDays.map((d) => [d.date.slice(0, 10), d]));
  }, [effectiveDays]);

  const availabilityByDate = useMemo(() => effectiveAvailability, [effectiveAvailability]);

  // A day is "recurrent" if any of its slots has a non-empty recurrence_rule
  const recurrentDates = useMemo(() => {
    const set = new Set<string>();
    effectiveAvailability.forEach((rows, dateStr) => {
      if (rows.some((r) => typeof r.recurrence_rule === "string" && r.recurrence_rule.trim() !== "")) {
        set.add(dateStr);
      }
    });
    return set;
  }, [effectiveAvailability]);

  const defaultHourlyPrice =
    (parkingInfo?.parking as { base_hourly_price?: number | null } | undefined)?.base_hourly_price ?? null;
  const defaultPriceNumber =
    defaultHourlyPrice != null && Number.isFinite(Number(defaultHourlyPrice)) ? Number(defaultHourlyPrice) : null;

  function formatSlotTime(dt: string | Date): string {
    const d = typeof dt === "string" ? new Date(dt) : (dt as Date);
    const h = d.getHours();
    const m = d.getMinutes();
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return (
    <>
      <div className="flex flex-row items-end justify-between px-4 pt-4">
        <p className="text-sm font-medium text-muted-foreground">
          Modalità calendario
        </p>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => {
            if (!value) return;
            const next = value as CalendarViewMode;
            setViewMode(next);
            // Clear any in-progress range / preview when switching modes
            setRangeSelection(undefined);
            setSelectedRangeDatesStr(null);
          }}
          className="border bg-muted px-1 my-4 py-1 text-xs"
        >
          <ToggleGroupItem
            value="single"
            className="px-3 py-1 data-[state=on]:shadow-sm"
          >
            Singolo giorno
          </ToggleGroupItem>
          <ToggleGroupItem
            value="range"
            className="px-3 py-1 data-[state=on]:shadow-sm"
          >
            Intervallo
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <Card className="p-0 mx-auto relative min-h-[340px] w-full">
        <CardContent className="p-0 relative min-h-[340px]">
          {error && (
            <div className="p-4 text-destructive text-sm">
              Errore nel caricamento: {(error as Error).message}
            </div>
          )}
          <UICalendar
            key={viewMode}
            locale={it}
            // In single mode use the default DayPicker config.
            // In range mode we pass range-specific props, including `selected`.
            {...(viewMode === "single"
              ? {
                mode: "single" as const,
              }
              : {
                mode: "range" as const,
                required: true,
                selected: rangeSelection,
                onSelect: (range: DateRange | undefined) => {
                  const prev = rangeSelection;
                  setRangeSelection(range);

                  if (!range || !range.from || !range.to) return;

                  const firstClick =
                    !prev ||
                    !prev.from ||
                    (!prev.to &&
                      range.from.getTime() === range.to.getTime());

                  if (firstClick) return;

                  const dates: string[] = [];
                  const current = new Date(range.from);
                  current.setHours(12, 0, 0, 0);
                  const end = new Date(range.to);
                  end.setHours(12, 0, 0, 0);
                  while (current <= end) {
                    const y = current.getFullYear();
                    const m = String(current.getMonth() + 1).padStart(2, "0");
                    const d = String(current.getDate()).padStart(2, "0");
                    dates.push(`${y}-${m}-${d}`);
                    current.setDate(current.getDate() + 1);
                  }
                  setSelectedRangeDatesStr(dates);
                  // Anchor the editor on the end date of the range
                  setSelectedDateStr(dates[dates.length - 1] ?? null);
                  setSheetOpen(true);
                },
              })}
            defaultMonth={new Date()}
            showOutsideDays
            numberOfMonths={1}
            buttonVariant="outline"
            className="[--cell-size:--spacing(7)] md:[--cell-size:--spacing(8)] w-full"
            classNames={{
              caption_label: "text-lg font-bold",
              month_caption: "capitalize",
              caption_after_enter: "text-base font-semibold",
              caption_before_enter: "text-base font-semibold",
              outside: "text-muted-foreground opacity-30",
            }}
            formatters={{
              formatMonthDropdown: (date) => date.toLocaleString("default", { month: "long" }),
            }}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            disabled={showLoading}
            components={{
              DayButton: ({ children, modifiers: dayModifiers, day, ...props }) => {
                const stateClass = (["default", "custom-price", "time-slots", "unavailable", "time-slot-unavailable"] as const).find(
                  (s) => dayModifiers[`day-${s}`]
                );
                const bgClass = stateClass ? DAY_STATE_CLASSES[stateClass] : DAY_STATE_CLASSES.default;
                const showDot = stateClass != null && stateClass !== "default";
                const dotClass = stateClass && stateClass !== "default" ? DAY_STATE_DOT_CLASSES[stateClass] : "";
                const isUnavailable = stateClass === "unavailable";
                const isOutside = dayModifiers.outside === true;
                const hasModifierAndOutside = isOutside && stateClass != null && stateClass !== "default";

                const dateObj = typeof day === "object" && day !== null && "date" in day ? (day as { date: Date }).date : (day as Date);
                const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
                const slotsForDay = availabilityByDate.get(dateStr) ?? [];
                const isRecurrent = recurrentDates.has(dateStr);
                const hasNoAvailabilityRecord = slotsForDay.length === 0;
                const dayInfo = dateToDayInfo.get(dateStr);
                const price = dayInfo?.price ?? defaultHourlyPrice;
                const basePriceToShow = hasNoAvailabilityRecord ? (defaultPriceNumber ?? price) : price;
                const showBasePrice =
                  basePriceToShow != null &&
                  Number.isFinite(basePriceToShow) &&
                  (hasNoAvailabilityRecord || stateClass === "default" || stateClass == null || stateClass === "custom-price");
                const singleFullDayAvailable =
                  slotsForDay.length === 1 &&
                  slotsForDay[0]?.is_available === true &&
                  isFullDaySlot(slotsForDay[0]);
                const priceDiffersFromBase =
                  defaultPriceNumber != null &&
                  slotsForDay[0]?.hourly_price != null &&
                  slotsForDay[0].hourly_price !== defaultPriceNumber;
                const isFullDayCustomPrice = singleFullDayAvailable && priceDiffersFromBase;
                const effectiveBgClass = isFullDayCustomPrice ? DAY_STATE_CLASSES["custom-price"] : bgClass;
                const effectiveShowDot = showDot || isFullDayCustomPrice;
                const effectiveDotClass = isFullDayCustomPrice ? DAY_STATE_DOT_CLASSES["custom-price"] : dotClass;

                const originalOnClick = props.onClick;
                const handleDayClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                  if (viewMode === "range") {
                    // Let react-day-picker handle selection in range mode.
                    originalOnClick?.(e);
                    return;
                  }
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedDateStr(dateStr);
                  setSheetOpen(true);
                };

                return (
                  <CalendarDayButton
                    day={day}
                    modifiers={dayModifiers}
                    {...props}
                    onClick={handleDayClick}
                    className={`relative rounded-none transition-colors duration-150 ${DAY_CELL_BASE} ${effectiveBgClass}`}
                  >
                    {hasModifierAndOutside && (
                      <span
                        className="pointer-events-none absolute inset-0 z-5 rounded-none bg-black/30"
                        aria-hidden
                      />
                    )}
                    {isUnavailable && (
                      <span className="absolute bottom-1 left-1 right-1 z-10 flex items-center justify-center gap-1.5 text-lg font-bold text-destructive">
                        <span>Non disponibile</span>
                        {isRecurrent && <Repeat2 className="h-4 w-4 shrink-0" aria-hidden />}
                      </span>
                    )}
                    <div className="absolute top-0.5 left-1 right-1 z-10 flex flex-col items-start gap-0.5">
                      <div className="flex w-full items-start justify-between">
                        {dayModifiers.today ? (
                          <div className="flex items-center gap-1 justify-between w-full">
                            <p className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary text-sm font-semibold">{children}</p>
                            {(effectiveShowDot || isRecurrent) && (
                              <span className="flex items-center gap-1 shrink-0">
                                {effectiveShowDot && (
                                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${effectiveDotClass}`} />
                                )}
                                {isRecurrent && <Repeat2 className="h-4 w-4 text-current" aria-hidden />}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-between w-full">
                            <p className="text-sm font-semibold leading-tight">{children}</p>
                            {(effectiveShowDot || isRecurrent) && (
                              <span className="flex items-center gap-1 shrink-0">
                                {effectiveShowDot && (
                                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${effectiveDotClass}`} />
                                )}
                                {isRecurrent && <Repeat2 className="h-4 w-4 text-current" aria-hidden />}
                              </span>
                            )}
                          </div>
                        )}

                      </div>
                      {isUnavailable ? null : (
                        <>
                          {showBasePrice && (
                            <span className="text-md leading-tight text-muted-foreground">
                              €{Number(basePriceToShow) % 1 === 0 ? Number(basePriceToShow) : Number(basePriceToShow).toFixed(2)}
                            </span>
                          )}
                          {(() => {
                            const slots = slotsForDay;
                            if (slots.length === 0) return null;
                            return (
                              <div className="mt-1 w-full flex flex-col gap-0.5">
                                {slots.slice(0, 3).map((slot, i) => {
                                  const isFullDay = slots.length === 1 && slot.is_available;
                                  const start = formatSlotTime(slot.start_datetime);
                                  const end = formatSlotTime(slot.end_datetime);
                                  const priceStr =
                                    slot.hourly_price != null
                                      ? Number(slot.hourly_price) % 1 === 0
                                        ? String(slot.hourly_price)
                                        : Number(slot.hourly_price).toFixed(2)
                                      : "-";
                                  const label = slot.is_available ? `€${priceStr}` : "Non disp";
                                  const tagContent = `${start}-${end} ${label}`;
                                  const tagClass = slot.is_available
                                    ? "bg-blue-200/90 dark:bg-blue-800/50 text-blue-900 dark:text-blue-100"
                                    : "bg-amber-200/90 dark:bg-amber-800/50 text-amber-900 dark:text-amber-100";
                                  return (
                                    !isFullDay && <div
                                      key={i}
                                      className={`w-full rounded-sm px-2 py-1 text-[10px] font-medium leading-tight text-center ${tagClass}`}
                                    >
                                      <span>{tagContent}</span>
                                    </div>
                                  );
                                })}
                                {slots.length > 3 && (
                                  <span className="w-full text-center text-[10px] text-muted-foreground">+{slots.length - 3}</span>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </CalendarDayButton>
                );
              },
            }}
          />
          {showLoading && (
            <div
              className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-lg min-h-[340px] bg-background/40 backdrop-blur-md border border-border/50"
              aria-live="polite"
              aria-busy="true"
            >
              <Spinner className="w-8 h-8 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {savingBulk ? "Salvataggio..." : "caricamento calendario"}
              </p>
            </div>
          )}
          {hasPendingChanges && (
            <div className="mx-4 mb-2 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={resetPending}
                disabled={savingBulk}
              >
                Annulla modifiche
              </Button>
              <Button
                onClick={applyPending}
                disabled={savingBulk}
              >
                {savingBulk ? "Salvataggio..." : "Salva modifiche"}
              </Button>
            </div>
          )}

          <AvailabilityEditor
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            selectedDate={
              selectedDateStr
                ? new Date(selectedDateStr + "T12:00:00")
                : undefined
            }
            selectedDateStr={selectedDateStr}
            selectedDatesRange={selectedRangeDatesStr}
            mode={viewMode}
            parkingId={selectedParkingId}
            parkingInfo={parkingInfo}
            baseHourlyPrice={defaultPriceNumber}
            refetch={refetch}
            onPendingChange={() => setPendingVersion((v) => v + 1)}
            onRangeSaveComplete={() => {
              setRangeSelection(undefined);
              setSelectedRangeDatesStr(null);
            }}
          />

        </CardContent>
      </Card>
    </>
  );
}
