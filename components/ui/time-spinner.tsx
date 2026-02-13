"use client";

import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const MINUTE_OPTIONS = [0, 15, 30, 45] as const;

function snapToNearestQuarter(hour: number, minute: number): { h: number; m: number } {
  const totalMins = hour * 60 + minute;
  const snapped = Math.round(totalMins / 15) * 15;
  const h = Math.floor(snapped / 60) % 24;
  const m = snapped % 60;
  return { h, m };
}

function minuteToOption(m: number): number {
  const idx = MINUTE_OPTIONS.indexOf(m as (typeof MINUTE_OPTIONS)[number]);
  return idx >= 0 ? idx : Math.round(m / 15) % 4;
}

export interface TimeSpinnerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  invalid?: boolean;
  "aria-label"?: string;
}

export function TimeSpinner({
  value,
  onChange,
  className,
  disabled = false,
  invalid = false,
  "aria-label": ariaLabel,
}: TimeSpinnerProps) {
  const [h, m] = (() => {
    const parts = value.split(":").map(Number);
    const hour = Number.isFinite(parts[0]) ? Math.max(0, Math.min(23, parts[0])) : 0;
    let minute = Number.isFinite(parts[1]) ? parts[1] : 0;
    const snapped = snapToNearestQuarter(hour, minute);
    minute = MINUTE_OPTIONS[minuteToOption(snapped.m)];
    return [snapped.h, minute];
  })();

  const update = React.useCallback(
    (newH: number, newM: number) => {
      const nh = Math.max(0, Math.min(23, newH));
      const nm = MINUTE_OPTIONS[Math.max(0, Math.min(3, minuteToOption(newM)))];
      onChange(`${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`);
    },
    [onChange]
  );

  const incHour = () => update(h + 1, m);
  const decHour = () => update(h - 1, m);
  const incMin = () => {
    const idx = MINUTE_OPTIONS.indexOf(m as (typeof MINUTE_OPTIONS)[number]);
    const nextIdx = idx >= 0 ? (idx + 1) % 4 : 0;
    update(h, MINUTE_OPTIONS[nextIdx]!);
  };
  const decMin = () => {
    const idx = MINUTE_OPTIONS.indexOf(m as (typeof MINUTE_OPTIONS)[number]);
    const nextIdx = idx >= 0 ? (idx - 1 + 4) % 4 : 0;
    update(h, MINUTE_OPTIONS[nextIdx]!);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-input bg-card/50 px-3 py-2 shadow-sm",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        invalid && "border-destructive ring-destructive/20",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      role="group"
      aria-label={ariaLabel}
    >
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={incHour}
          disabled={disabled}
          className="p-1.5 -m-0.5 rounded-md hover:bg-accent/80 active:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Incrementa ore"
        >
          <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div
          className="min-w-9 py-1 px-2 rounded-md bg-muted/60 text-center font-semibold tabular-nums text-base text-foreground"
          aria-hidden
        >
          {String(h).padStart(2, "0")}
        </div>
        <button
          type="button"
          onClick={decHour}
          disabled={disabled}
          className="p-1.5 -m-0.5 rounded-md hover:bg-accent/80 active:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Decrementa ore"
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      <span className="text-muted-foreground/70 font-semibold text-lg pb-1 px-0.5">:</span>
      <div className="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onClick={incMin}
          disabled={disabled}
          className="p-1.5 -m-0.5 rounded-md hover:bg-accent/80 active:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Incrementa minuti"
        >
          <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div
          className="min-w-9 py-1 px-2 rounded-md bg-muted/60 text-center font-semibold tabular-nums text-base text-foreground"
          aria-hidden
        >
          {String(m).padStart(2, "0")}
        </div>
        <button
          type="button"
          onClick={decMin}
          disabled={disabled}
          className="p-1.5 -m-0.5 rounded-md hover:bg-accent/80 active:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Decrementa minuti"
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/** Snaps a time string "HH:mm" to the nearest 15-minute slot (00, 15, 30, 45). */
export function snapTimeToQuarter(value: string): string {
  const parts = value.split(":").map(Number);
  const hour = Number.isFinite(parts[0]) ? Math.max(0, Math.min(23, parts[0])) : 0;
  const minute = Number.isFinite(parts[1]) ? parts[1] : 0;
  const { h, m } = snapToNearestQuarter(hour, minute);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Returns the next 15-min slot after the given time (used for chaining slots). */
export function nextQuarterSlot(value: string): string {
  const parts = value.split(":").map(Number);
  const h = Number.isFinite(parts[0]) ? parts[0]! : 0;
  const m = Number.isFinite(parts[1]) ? parts[1]! : 0;
  const totalMins = h * 60 + m;
  const next = totalMins + 15;
  if (next >= 24 * 60) return "23:45";
  const nh = Math.floor(next / 60);
  const nm = next % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

/** Minutes between start and end (assumes same day, end >= start). */
export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh! * 60 + em!) - (sh! * 60 + sm!);
}

/** Whether start < end (valid time range). */
export function isEndAfterStart(start: string, end: string): boolean {
  return minutesBetween(start, end) > 0;
}
