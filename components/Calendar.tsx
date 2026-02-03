"use client";

import { Calendar as UICalendar, CalendarDayButton } from "@/components/ui/calendar";
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

function getAvailabilityDateStr(row: PktAvailability): string {
  const s = row.start_datetime;
  return typeof s === "string" ? s.slice(0, 10) : (s as Date).toISOString().slice(0, 10);
}

function getSlotTimeStr(dt: string | Date): string {
  const s = typeof dt === "string" ? dt : (dt as Date).toISOString();
  return s.length >= 16 ? s.substring(11, 16) : "";
}

function isFullDaySlot(slot: PktAvailability): boolean {
  const start = getSlotTimeStr(slot.start_datetime);
  const end = getSlotTimeStr(slot.end_datetime);
  return start === "00:00" && (end === "23:59" || end === "24:00");
}

/** Turn a pending day update into synthetic PktAvailability rows for that date (for UI only). */
function pendingUpdateToRows(dateStr: string, update: PendingDayUpdate): PktAvailability[] {
  const rows: PktAvailability[] = [];
  if (update.slots.length === 0) {
    rows.push({
      parking_id: "",
      start_datetime: `${dateStr}T00:00:00`,
      end_datetime: `${dateStr}T23:59:00`,
      is_available: update.wholeDayAvailable,
      hourly_price: update.wholeDayHourlyPrice ? Number(update.wholeDayHourlyPrice) : null,
    });
  } else {
    for (const slot of update.slots) {
      rows.push({
        parking_id: "",
        start_datetime: `${dateStr}T${slot.startTime}:00`,
        end_datetime: `${dateStr}T${slot.endTime}:00`,
        is_available: slot.isAvailable,
        hourly_price: slot.hourlyPrice ? Number(slot.hourlyPrice) : null,
      });
    }
  }
  return rows;
}

/** Derive day state from availability slots. Red = full-day unavailable only; time-slot unavailable = amber. Default when price equals base. */
function availabilityToDays(
  byDate: Map<string, PktAvailability[]>,
  parkingDefaultPrice: number | null
): ParkingDayInfo[] {
  const dates = Array.from(byDate.keys()).sort();
  return dates.map((date) => {
    const slots = byDate.get(date)!;
    const allUnavailable = slots.every((s) => s?.is_available === false);
    const anyUnavailable = slots.some((s) => s?.is_available === false);
    const anyCustomPrice =
      parkingDefaultPrice != null &&
      slots.some((s) => s?.hourly_price != null && s.hourly_price !== parkingDefaultPrice);
    let state: DayState;
    if (allUnavailable) {
      const singleFullDayUnavailable =
        slots.length === 1 && slots[0] && !slots[0].is_available && isFullDaySlot(slots[0]);
      state = singleFullDayUnavailable ? "unavailable" : "time-slot-unavailable";
    } else if (slots.length > 1) {
      state = anyUnavailable ? "time-slot-unavailable" : anyCustomPrice ? "time-slots" : "default";
    } else {
      if (!slots[0]?.is_available)
        state = slots[0] && isFullDaySlot(slots[0]) ? "unavailable" : "time-slot-unavailable";
      else if (
        parkingDefaultPrice != null &&
        slots[0]?.hourly_price != null &&
        slots[0].hourly_price !== parkingDefaultPrice
      )
        state = "custom-price";
      else state = "default";
    }
    const price = slots[0]?.hourly_price ?? parkingDefaultPrice ?? undefined;
    return { date, state, price };
  });
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

function buildModifiersFromDays(days: { date: string; state: DayState }[]) {
  const byState: Record<DayState, Date[]> = {
    default: [],
    "custom-price": [],
    "time-slots": [],
    unavailable: [],
    "time-slot-unavailable": [],
  };
  for (const d of days) {
    const dateStr = d.date.slice(0, 10);
    const date = new Date(dateStr + "T12:00:00");
    if (!isNaN(date.getTime())) byState[d.state].push(date);
  }
  const modifiers: Record<string, Date[]> = {};
  (Object.keys(byState) as DayState[]).forEach((state) => {
    if (byState[state].length) modifiers[`day-${state}`] = byState[state];
  });
  return modifiers;
}

function buildModifiersClassNames(): Record<string, string> {
  const out: Record<string, string> = {};
  (Object.keys(DAY_STATE_CLASSES) as DayState[]).forEach((state) => {
    out[`day-${state}`] = DAY_STATE_CLASSES[state];
  });
  return out;
}

const modifiersClassNames = buildModifiersClassNames();

export default function Calendar() {
  const { selectedParkingId, isInitializingSelection } = useSelectedParking();
  const { data: parkingInfo, isLoading, isFetching, error, refetch } = useParkingInfo(selectedParkingId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [pendingVersion, setPendingVersion] = useState(0);
  const [savingBulk, setSavingBulk] = useState(false);
  const showLoading =
    isInitializingSelection || (selectedParkingId != null && (isLoading || isFetching));

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

      const deleteById = async (id: number) => {
        const res = await fetch("/api/availability/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ availability_id: id }),
        });
        if (!res.ok && res.status !== 404) {
          const j = await res.json().catch(() => ({}));
          throw new Error((j as { error?: string }).error ?? "Delete failed");
        }
      };

      for (const id of pending.deleteIds) {
        await deleteById(id);
      }
      for (const dateStr of pending.deleteDates) {
        const ids = dateToIds.get(dateStr) ?? [];
        for (const id of ids) await deleteById(id);
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
        for (const id of idsToDelete) await deleteById(id);

        if (dayUpdate.slots.length === 0) {
          const dates = computeDatesFromRipetizione(dayUpdate.wholeDayRipetizione, dateStr);
          const availabilityType = dayUpdate.wholeDayAvailable ? "ALWAYS_AVAILABLE" : "UNAVAILABLE";
          await savePayload({
            parking_id: selectedParkingId,
            availabilityType,
            dates,
            startTime: { hour: 0, minute: 0 },
            endTime: { hour: 23, minute: 59 },
            hourly_price: dayUpdate.wholeDayHourlyPrice ? Number(dayUpdate.wholeDayHourlyPrice) : null,
          });
        } else {
          for (const slot of dayUpdate.slots) {
            const dates = computeDatesFromRipetizione(slot.ripetizione, dateStr);
            const availabilityType = slot.isAvailable ? "TIME_SLOT" : "UNAVAILABLE";
            const [sh, sm] = slot.startTime.split(":").map(Number);
            const [eh, em] = slot.endTime.split(":").map(Number);
            await savePayload({
              parking_id: selectedParkingId,
              availabilityType,
              dates,
              startTime: { hour: sh || 0, minute: sm || 0 },
              endTime: { hour: eh ?? 23, minute: em ?? 59 },
              hourly_price: slot.hourlyPrice ? Number(slot.hourlyPrice) : null,
            });
          }
        }
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

  const pending = useMemo(() => {
    void pendingVersion;
    return typeof window !== "undefined" && selectedParkingId ? getPending(selectedParkingId) : null;
  }, [selectedParkingId, pendingVersion]);

  const effectiveAvailability = useMemo(() => {
    const list = parkingInfo?.availability ?? [];
    const deleteIds = new Set(pending?.deleteIds ?? []);
    const deleteDates = new Set(pending?.deleteDates ?? []);
    const updates = pending?.updates ?? {};
    const filtered = list.filter(
      (row) => !deleteDates.has(getAvailabilityDateStr(row)) && !(row.id != null && deleteIds.has(row.id))
    );
    const byDate = new Map<string, PktAvailability[]>();
    for (const row of filtered) {
      const dateStr = getAvailabilityDateStr(row);
      const arr = byDate.get(dateStr) ?? [];
      arr.push(row);
      byDate.set(dateStr, arr);
    }
    for (const [dateStr, dayUpdate] of Object.entries(updates)) {
      byDate.set(dateStr, pendingUpdateToRows(dateStr, dayUpdate));
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
    <Card className="p-0 mx-auto relative min-h-[340px] w-full">
      <CardContent className="p-0 relative min-h-[340px]">
        {error && (
          <div className="p-4 text-destructive text-sm">
            Errore nel caricamento: {(error as Error).message}
          </div>
        )}
        <UICalendar
          locale={it}
          mode="single"
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

              const handleDayClick = (e: React.MouseEvent) => {
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
                    <span className="absolute bottom-1 left-1 right-1 z-10 text-center text-lg font-bold text-destructive">
                      Non disponibile
                    </span>
                  )}
                  <div className="absolute top-0.5 left-1 right-1 z-10 flex flex-col items-start gap-0.5">
                    <div className="flex w-full items-start justify-between">
                      {dayModifiers.today ? (
                        <div className="flex items-center gap-1 justify-between w-full">
                          <p className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary text-sm font-semibold">{children}</p>
                          {effectiveShowDot && (
                            <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${effectiveDotClass}`} />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-between w-full">
                          <p className="text-sm font-semibold leading-tight">{children}</p>
                          {effectiveShowDot && (
                            <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${effectiveDotClass}`} />
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
            <p className="text-sm font-medium text-foreground">caricamento calendario</p>
          </div>
        )}
        {hasPendingChanges && (
          <div className="mx-4 mb-2 flex justify-end">
            <Button
              onClick={applyPending}
              disabled={savingBulk}
            >
              {savingBulk ? "Salvataggio..." : "Salva modifiche"}
            </Button>
          </div>
        )}
        <div className="m-4 rounded-md">
          <AvailabilityEditor
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            selectedDate={selectedDateStr ? new Date(selectedDateStr + "T12:00:00") : undefined}
            selectedDateStr={selectedDateStr}
            parkingId={selectedParkingId}
            parkingInfo={parkingInfo}
            baseHourlyPrice={defaultPriceNumber}
            refetch={refetch}
            onPendingChange={() => setPendingVersion((v) => v + 1)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
