/**
 * Session-storage layer for bulk availability edits.
 * Pending changes are applied in one go via "Salva modifiche" (global save).
 */

import type { RipetizioneValue } from "./availability-dates";

export interface PendingSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  hourlyPrice: string;
  ripetizione: RipetizioneValue;
}

export interface PendingDayUpdate {
  wholeDayAvailable: boolean;
  wholeDayHourlyPrice: string;
  wholeDayRipetizione: RipetizioneValue;
  slots: PendingSlot[];
}

export interface PendingAvailability {
  updates: Record<string, PendingDayUpdate>;
  deleteDates: string[];
  deleteIds: number[];
}

const KEY_PREFIX = "parkito-availability-pending-";

function getKey(parkingId: string): string {
  return `${KEY_PREFIX}${parkingId}`;
}

export function getPending(parkingId: string | null): PendingAvailability | null {
  if (!parkingId || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(getKey(parkingId));
    if (!raw) return null;
    const data = JSON.parse(raw) as PendingAvailability;
    return {
      updates: data.updates ?? {},
      deleteDates: Array.isArray(data.deleteDates) ? data.deleteDates : [],
      deleteIds: Array.isArray(data.deleteIds) ? data.deleteIds : [],
    };
  } catch {
    return null;
  }
}

export function setPending(parkingId: string | null, data: PendingAvailability): void {
  if (!parkingId || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(getKey(parkingId), JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function hasPending(parkingId: string | null): boolean {
  const p = getPending(parkingId);
  if (!p) return false;
  const hasUpdates = Object.keys(p.updates).length > 0;
  const hasDeletes = p.deleteDates.length > 0 || p.deleteIds.length > 0;
  return hasUpdates || hasDeletes;
}

/** Save or update one day's state to pending (removes that date from deleteDates). */
export function mergePendingUpdate(
  parkingId: string | null,
  dateStr: string,
  dayUpdate: PendingDayUpdate,
  onChanged?: () => void
): void {
  if (!parkingId) return;
  const prev = getPending(parkingId) ?? { updates: {}, deleteDates: [], deleteIds: [] };
  const next: PendingAvailability = {
    updates: { ...prev.updates, [dateStr]: dayUpdate },
    deleteDates: prev.deleteDates.filter((d) => d !== dateStr),
    deleteIds: prev.deleteIds,
  };
  setPending(parkingId, next);
  onChanged?.();
}

/** Queue one day for delete (remove all records for that date on global save). */
export function mergePendingDeleteOneDay(
  parkingId: string | null,
  dateStr: string,
  onChanged?: () => void
): void {
  if (!parkingId) return;
  const prev = getPending(parkingId) ?? { updates: {}, deleteDates: [], deleteIds: [] };
  const updates = { ...prev.updates };
  delete updates[dateStr];
  const next: PendingAvailability = {
    updates,
    deleteDates: prev.deleteDates.includes(dateStr) ? prev.deleteDates : [...prev.deleteDates, dateStr],
    deleteIds: prev.deleteIds,
  };
  setPending(parkingId, next);
  onChanged?.();
}

/** Queue specific record ids for delete (e.g. "all future" in a series). Optionally remove one date from updates. */
export function mergePendingDeleteIds(
  parkingId: string | null,
  ids: number[],
  dateStrToRemoveFromUpdates?: string,
  onChanged?: () => void
): void {
  if (!parkingId) return;
  const prev = getPending(parkingId) ?? { updates: {}, deleteDates: [], deleteIds: [] };
  const updates = { ...prev.updates };
  if (dateStrToRemoveFromUpdates) delete updates[dateStrToRemoveFromUpdates];
  const next: PendingAvailability = {
    updates,
    deleteDates: prev.deleteDates,
    deleteIds: [...prev.deleteIds, ...ids],
  };
  setPending(parkingId, next);
  onChanged?.();
}

export function clearPending(parkingId: string | null, onChanged?: () => void): void {
  if (!parkingId || typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(getKey(parkingId));
    onChanged?.();
  } catch {
    // ignore
  }
}
