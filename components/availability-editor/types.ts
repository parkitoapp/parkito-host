import type { RipetizioneValue } from "@/lib/availability-dates";
import type { ParkingFullInfo } from "@/types";

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
  /** Optional: when provided, the editor works in "range" mode and applies changes to all dates. */
  selectedDatesRange?: string[] | null;
  parkingId: string | null;
  parkingInfo: ParkingFullInfo | null;
  baseHourlyPrice: number | null;
  refetch: () => void;
  /** Called when pending changes are updated (so parent can show global save button). */
  onPendingChange?: () => void;
  /** Editor mode: single day (default) or range of days. */
  mode?: "single" | "range";
  /** Optional: called after a successful range save so the calendar can clear the range highlight. */
  onRangeSaveComplete?: () => void;
}

export const DEFAULT_RIPETIZIONE: RipetizioneValue = "mai";
export const MIN_SLOT_DURATION_MINUTES = 60;
