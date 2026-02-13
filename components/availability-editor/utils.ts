import type { PktAvailability } from "@/types";
import { snapTimeToQuarter, minutesBetween, isEndAfterStart } from "@/components/ui/time-spinner";
import type { EditorSlot } from "./types";
import { DEFAULT_RIPETIZIONE, MIN_SLOT_DURATION_MINUTES } from "./types";
import type { RipetizioneValue } from "@/lib/availability-dates";

export function formatTimeFromDatetime(dt: string | Date): string {
  const d = typeof dt === "string" ? new Date(dt) : (dt as Date);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function getRecordPatternKey(row: PktAvailability): string {
  const start = formatTimeFromDatetime(row.start_datetime);
  const end = formatTimeFromDatetime(row.end_datetime);
  return `${start}_${end}_${row.is_available}`;
}

export function getRecordDateStr(row: PktAvailability): string {
  const s = row.start_datetime;
  return typeof s === "string" ? s.slice(0, 10) : (s as Date).toISOString().slice(0, 10);
}

export function slotsFromAvailability(
  list: PktAvailability[],
  _basePrice: number | null
): EditorSlot[] {
  return list.map((row) => {
    const rawRule =
      typeof row.recurrence_rule === "string" ? row.recurrence_rule.trim() : "";
    const fromRule = (rawRule && rawRule !== "mai"
      ? (rawRule as RipetizioneValue)
      : DEFAULT_RIPETIZIONE) as RipetizioneValue;
    const rawEnd = formatTimeFromDatetime(row.end_datetime);
    const isEndOfDay = rawEnd === "23:59" || rawEnd === "24:00";
    const start = snapTimeToQuarter(formatTimeFromDatetime(row.start_datetime));
    let end = isEndOfDay ? "23:45" : snapTimeToQuarter(rawEnd);
    if (!isEndAfterStart(start, end) || minutesBetween(start, end) < MIN_SLOT_DURATION_MINUTES) {
      const [h, m] = start.split(":").map(Number);
      const endMins = Math.min(23 * 60 + 45, (h ?? 0) * 60 + (m ?? 0) + MIN_SLOT_DURATION_MINUTES);
      end = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
    }
    return {
      id: row.id,
      startTime: start,
      endTime: end,
      isAvailable: row.is_available === true,
      hourlyPrice:
        row.hourly_price != null && Number.isFinite(Number(row.hourly_price))
          ? String(row.hourly_price)
          : "",
      ripetizione: fromRule,
    };
  });
}
