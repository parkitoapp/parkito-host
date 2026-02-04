import type { DayState, ParkingDayInfo, PktAvailability } from "@/types";

export function getAvailabilityDateStr(row: PktAvailability): string {
  const s = row.start_datetime;
  return typeof s === "string"
    ? s.slice(0, 10)
    : (s as Date).toISOString().slice(0, 10);
}

export function getSlotTimeStr(dt: string | Date): string {
  const s = typeof dt === "string" ? dt : (dt as Date).toISOString();
  return s.length >= 16 ? s.substring(11, 16) : "";
}

export function isFullDaySlot(slot: PktAvailability): boolean {
  const start = getSlotTimeStr(slot.start_datetime);
  const end = getSlotTimeStr(slot.end_datetime);
  return start === "00:00" && (end === "23:59" || end === "24:00");
}

/**
 * Derive calendar `ParkingDayInfo` from availability slots.
 * - 0 records → default (base price)
 * - Full-day unavailable → `unavailable` (red)
 * - Time-slot only unavailable → `time-slot-unavailable` (amber)
 * - Multiple slots all available, any custom price → `time-slots` (blue)
 * - Single slot available with custom price → `custom-price` (green)
 * - Otherwise → default
 */
export function availabilityToDays(
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
      slots.some(
        (s) => s?.hourly_price != null && s.hourly_price !== parkingDefaultPrice
      );

    let state: DayState;
    if (allUnavailable) {
      const singleFullDayUnavailable =
        slots.length === 1 &&
        slots[0] &&
        !slots[0].is_available &&
        isFullDaySlot(slots[0]);
      state = singleFullDayUnavailable ? "unavailable" : "time-slot-unavailable";
    } else if (slots.length > 1) {
      state = anyUnavailable
        ? "time-slot-unavailable"
        : anyCustomPrice
        ? "time-slots"
        : "default";
    } else {
      if (!slots[0]?.is_available)
        state = slots[0] && isFullDaySlot(slots[0])
          ? "unavailable"
          : "time-slot-unavailable";
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

/** Group days by `DayState` for `react-day-picker` modifiers. */
export function buildModifiersFromDays(days: {
  date: string;
  state: DayState;
}[]): Record<string, Date[]> {
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

