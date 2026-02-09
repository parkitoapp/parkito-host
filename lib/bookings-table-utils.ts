import type { PktReservation } from "@/types";

/** Shorten reservation id for display */
export function shortenId(id?: string) {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

/** Date as "6 feb 2026", time as "13:20" for two-line cell display */
export function formatDateAndTime(value: unknown) {
  const d = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "—" };
  const date = d.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

/** Single-line date-time string for detail panels (e.g. sheet). */
export function formatDateTime(value: unknown) {
  const d = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Compact "Created at" style: "Oct 12, 2023 • 09:12 AM". */
export function formatCreatedAt(value: unknown) {
  const d = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} • ${time}`;
}

export function formatDurationHours(start: unknown, end: unknown) {
  const s = start instanceof Date ? start : new Date(start as string);
  const e = end instanceof Date ? end : new Date(end as string);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "—";
  const ms = e.getTime() - s.getTime();
  if (ms <= 0) return "—";
  const hours = ms / 36e5;
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} h`;
}

/** Long-form duration for detail view, e.g. "1 day, 19 hours, 30 minutes". */
export function formatDurationLong(start: unknown, end: unknown) {
  const s = start instanceof Date ? start : new Date(start as string);
  const e = end instanceof Date ? end : new Date(end as string);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "—";
  const ms = Math.max(0, e.getTime() - s.getTime());
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(days === 1 ? "1 giorno" : `${days} giorni`);
  if (hours > 0) parts.push(hours === 1 ? "1 ora" : `${hours} ore`);
  if (minutes > 0) parts.push(minutes === 1 ? "1 minuto" : `${minutes} minuti`);
  return parts.length ? parts.join(", ") : "0 minuti";
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatStartsIn(start: unknown) {
  const now = new Date();
  const s = start instanceof Date ? start : new Date(start as string);
  if (Number.isNaN(s.getTime())) return "—";

  const diffMs = s.getTime() - now.getTime();
  if (diffMs <= 0) return "In corso";

  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    return diffDays === 1 ? "In 1 giorno" : `In ${diffDays} giorni`;
  }

  if (diffHours === 0) return `Tra ${minutes} min`;
  if (minutes === 0) return `Tra ${diffHours}h`;
  return `Tra ${diffHours}h e ${minutes}min`;
}

export function getGuestName(row: PktReservation) {
  const driver = row.driver;
  if (!driver) return "—";
  const fullName = `${driver.name ?? ""} ${driver.surname ?? ""}`.trim();
  return fullName || "—";
}

export function getInitials(fullName: string) {
  if (!fullName || fullName === "—") return "?";
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  const initials = `${first}${last}` || first || "?";
  return initials.toUpperCase();
}

export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

/** Returns variant and className for Badge by status (past and future bookings). */
export function getStatusBadge(status?: string | null): {
  variant: StatusBadgeVariant;
  className: string;
} {
  const value = (status ?? "").toLowerCase();
  switch (value) {
    case "refunded":
      return {
        variant: "destructive",
        className:
          "text-red-500 dark:text-red-400 border-red-500 dark:border-red-400 bg-red-300 dark:bg-red-900/30",
      };
    case "confirmed":
      return {
        variant: "default",
        className:
          "text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 bg-green-100 dark:bg-green-900/30",
      };
    default:
      return { variant: "secondary", className: "" };
  }
}

const NEON_AVATAR_STYLES = [
  {
    bg: "bg-pink-300 dark:bg-pink-900/30",
    text: "text-pink-50 dark:text-pink-50",
    border: "border-pink-500 dark:border-pink-400",
  },
  {
    bg: "bg-lime-300 dark:bg-lime-900/30",
    text: "text-lime-950 dark:text-lime-50",
    border: "border-lime-500 dark:border-lime-400",
  },
  {
    bg: "bg-cyan-300 dark:bg-cyan-900/30",
    text: "text-cyan-950 dark:text-cyan-50",
    border: "border-cyan-500 dark:border-cyan-400",
  },
  {
    bg: "bg-violet-300 dark:bg-violet-900/30",
    text: "text-violet-950 dark:text-violet-50",
    border: "border-violet-500 dark:border-violet-400",
  },
  {
    bg: "bg-amber-300 dark:bg-amber-900/30",
    text: "text-amber-950 dark:text-amber-50",
    border: "border-amber-500 dark:border-amber-400",
  },
  {
    bg: "bg-emerald-300 dark:bg-emerald-900/30",
    text: "text-emerald-950 dark:text-emerald-50",
    border: "border-emerald-500 dark:border-emerald-400",
  },
] as const;

/** Returns avatar and border class names by seed (e.g. guest name) for consistent colors. */
export function getNeonAvatarClasses(seed: string): {
  avatar: string;
  border: string;
} | null {
  if (!seed || seed === "—") return null;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const style = NEON_AVATAR_STYLES[hash % NEON_AVATAR_STYLES.length];
  return {
    avatar: `${style.bg} ${style.text}`,
    border: style.border,
  };
}

/** Duration in ms for sorting (end - start). */
export function getDurationMs(row: PktReservation): number {
  const start = new Date(row.start_datetime as unknown as string).getTime();
  const end = new Date(row.end_datetime as unknown as string).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return end - start;
}

/** Start datetime in ms for sorting (e.g. "starts in" column). */
export function getStartTimeMs(row: PktReservation): number {
  return new Date(row.start_datetime as unknown as string).getTime();
}
