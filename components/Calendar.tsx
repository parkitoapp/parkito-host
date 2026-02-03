"use client";

import { Calendar as UICalendar, CalendarDayButton } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { useSelectedParking } from "@/providers/selected-parking-provider";
import { useParkingInfo } from "@/hooks/use-parking-info";
import { useMemo, useEffect } from "react";
import type { DayState } from "@/types";
import { it } from "react-day-picker/locale";
import { Spinner } from "@/components/ui/spinner";

// Base cell style so all states (including time-slots) have same size
const DAY_CELL_BASE = "min-h-full min-w-full";

// Pastel theme-aware backgrounds with better contrast
const DAY_STATE_CLASSES: Record<DayState, string> = {
  default:
    "bg-transparent border border-border text-foreground",
  "custom-price":
    "bg-emerald-100/95 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50",
  "time-slots":
    "bg-sky-100/75 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800/50",
  unavailable:
    "bg-red-400/25 dark:bg-red-950/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/50",
  "time-slot-unavailable":
    "bg-amber-50 dark:bg-amber-300/10 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50",
};

// Small dot in the top-right corner (only for non-default states; default has no dot)
const DAY_STATE_DOT_CLASSES: Record<Exclude<DayState, "default">, string> = {
  "custom-price": "bg-emerald-600",
  "time-slots": "bg-sky-600",
  unavailable: "bg-red-600",
  "time-slot-unavailable": "bg-amber-600",
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
  const { selectedParkingId } = useSelectedParking();
  const { data: parkingInfo, isLoading, isFetching, error } = useParkingInfo(selectedParkingId);
  const showLoading = selectedParkingId != null && parkingInfo == null;

  const modifiers = useMemo(
    () => (parkingInfo?.days?.length ? buildModifiersFromDays(parkingInfo.days) : {}),
    [parkingInfo]
  );

  const dateToDayInfo = useMemo(() => {
    const days = parkingInfo?.days ?? [];
    return new Map(days.map((d) => [d.date.slice(0, 10), d]));
  }, [parkingInfo?.days]);

  const availabilityByDate = useMemo(() => {
    const list = parkingInfo?.availability ?? [];
    const map = new Map<string, typeof list>();
    for (const row of list) {
      const dateStr = typeof row.start_datetime === "string"
        ? row.start_datetime.slice(0, 10)
        : (row.start_datetime as Date).toISOString().slice(0, 10);
      const arr = map.get(dateStr) ?? [];
      arr.push(row);
      map.set(dateStr, arr);
    }
    return map;
  }, [parkingInfo?.availability]);

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

  useEffect(() => {
    if (selectedParkingId == null) return;
    console.log("[Calendar] selectedParkingId:", selectedParkingId);
    console.log("[Calendar] availability array:", parkingInfo?.availability ?? []);
    console.log("[Calendar] derived days (for calendar):", parkingInfo?.days ?? []);
    console.log("[Calendar] modifiers (date arrays per state):", modifiers);
  }, [selectedParkingId, parkingInfo?.availability, parkingInfo?.days, modifiers]);

  return (
    <Card className="p-0 mx-auto relative min-h-[340px] w-full">
      <CardContent className="p-0 relative min-h-[340px]">
        {showLoading && (
          <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/95 min-h-[340px] border border-border"
            aria-live="polite"
            aria-busy="true"
          >
            <Spinner className="w-8 h-8 text-primary" />
            <p className="text-sm text-muted-foreground">Caricamento disponibilità...</p>
          </div>
        )}
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
                (hasNoAvailabilityRecord || stateClass === "default" || stateClass == null) &&
                basePriceToShow != null &&
                Number.isFinite(basePriceToShow);
              const isFullDayCustomPrice = slotsForDay.length === 1 && slotsForDay[0]?.is_available === true;
              const effectiveBgClass = isFullDayCustomPrice ? DAY_STATE_CLASSES["custom-price"] : bgClass;
              const effectiveShowDot = showDot || isFullDayCustomPrice;
              const effectiveDotClass = isFullDayCustomPrice ? DAY_STATE_DOT_CLASSES["custom-price"] : dotClass;

              return (
                <CalendarDayButton
                  day={day}
                  modifiers={dayModifiers}
                  {...props}
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
                                const tagContent = isFullDay ? `tutto il giorno ${label}` : `${start}-${end} ${label}`;
                                const tagClass = slot.is_available
                                  ? "bg-emerald-200/90 dark:bg-emerald-800/50 text-emerald-900 dark:text-emerald-100"
                                  : "bg-amber-200/90 dark:bg-amber-800/50 text-amber-900 dark:text-amber-100";
                                return (
                                  <div
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
      </CardContent>
    </Card>
  );
}
