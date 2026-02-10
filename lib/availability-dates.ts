/**
 * Ripetizione options for availability (whole-day and per-slot).
 * Same list for both "Ripeti" (when day unavailable) and "Ripetizione" (per time slot).
 */
export const RIPETIZIONE_OPTIONS = [
  { value: "mai", label: "Mai" },
  { value: "ogni_giorno", label: "Ogni giorno" },
  { value: "ogni_settimana", label: "Ogni settimana" },
  { value: "ogni_due_settimane", label: "Ogni due settimane" },
  { value: "ogni_mese", label: "Ogni mese" },
] as const;

export type RipetizioneValue = (typeof RIPETIZIONE_OPTIONS)[number]["value"];

/** Cap repetition to 1 year from the selected date */
const ONE_YEAR_DAYS = 365;
const ONE_YEAR_WEEKS = 52;
const ONE_YEAR_MONTHS = 12;

/**
 * Compute an array of date strings (YYYY-MM-DD) from ripetizione + selected date.
 * Used server-side to build the `dates` array for save-availability.
 */
export function computeDatesFromRipetizione(
  ripetizione: RipetizioneValue,
  selectedDateStr: string,
  rangeStart?: string,
  rangeEnd?: string
): string[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const selected = new Date(selectedDateStr + "T12:00:00");
  if (isNaN(selected.getTime())) return [selectedDateStr];

  switch (ripetizione) {
    case "mai":
      return [selectedDateStr];

    case "ogni_giorno": {
      const dates: string[] = [];
      const end = new Date(selected);
      end.setDate(end.getDate() + ONE_YEAR_DAYS);
      for (let d = new Date(selected); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(toDateStr(d));
      }
      return dates;
    }

    case "ogni_settimana": {
      const dates: string[] = [];
      const end = new Date(selected);
      end.setDate(end.getDate() + ONE_YEAR_DAYS);
      for (let w = 0; w < ONE_YEAR_WEEKS; w++) {
        const d = new Date(selected);
        d.setDate(d.getDate() + w * 7);
        if (d > end) break;
        dates.push(toDateStr(d));
      }
      return dates;
    }

    case "ogni_due_settimane": {
      const dates: string[] = [];
      const end = new Date(selected);
      end.setDate(end.getDate() + ONE_YEAR_DAYS);
      for (let w = 0; w < ONE_YEAR_WEEKS; w++) {
        const d = new Date(selected);
        d.setDate(d.getDate() + w * 14);
        if (d > end) break;
        dates.push(toDateStr(d));
      }
      return dates;
    }

    case "ogni_mese": {
      const dates: string[] = [];
      const dayOfMonth = selected.getDate();
      const end = new Date(selected);
      end.setFullYear(end.getFullYear() + 1);
      for (let m = 0; m < ONE_YEAR_MONTHS; m++) {
        const d = new Date(
          selected.getFullYear(),
          selected.getMonth() + m,
          dayOfMonth
        );
        if (d > end) break;
        dates.push(toDateStr(d));
      }
      return dates;
    }

    default:
      return [selectedDateStr];
  }
}
