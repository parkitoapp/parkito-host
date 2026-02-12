"use client";

import * as React from "react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { calculateDiscountedPrice } from "@/lib/priceCalculator";

interface HourTooltipProps {
  value: number;
  hourlyPrice: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
}

const TOOLTIP_WIDTH_PX = 64;

function formatPrice(hours: number, price: number) {

  if (hours < 23) {
    return calculateDiscountedPrice(hours, price, { feeFactor: 1 }).toFixed(2);
  } else {
    return calculateDiscountedPrice(Math.ceil(hours / 24) * 24, price, {
      feeFactor: 1,
    }).toFixed(2);
  }
}

function formatValue(hours: number): string {
  if (hours < 1) return "1h";
  if (hours <= 24) return `${hours}h`;
  const days = Math.ceil(hours / 24);
  return days === 1 ? "1 giorno" : `${days} giorni`;
}

export function HourTooltip({
  value,
  hourlyPrice,
  onValueChange,
  minimumValue = 1,
  maximumValue = 168,
  minimumTrackTintColor = "#0D1C73",
  maximumTrackTintColor = "#B1CFFF",
}: HourTooltipProps) {
  const [isSliding, setIsSliding] = useState(false);
  // Separate \"visual\" value used for positioning the tooltip so it follows the thumb
  // smoothly while dragging, even before the clamped value/state is committed.
  const [visualValue, setVisualValue] = useState(value);

  // Keep visual value in sync when external `value` changes (e.g. from parent).
  React.useEffect(() => {
    setVisualValue(value);
  }, [value]);

  const clampedValue = Math.max(minimumValue, Math.min(maximumValue, value));

  const clampedVisual =
    Math.max(minimumValue, Math.min(maximumValue, visualValue));

  const progress =
    (clampedVisual - minimumValue) / (maximumValue - minimumValue || 1);

  const tooltipStyle: React.CSSProperties = {
    left: `${progress * 100}%`,
    transform: "translateX(-50%)",
    width: TOOLTIP_WIDTH_PX,
  };

  const handleSliderChange = (vals: number[]) => {
    const raw = vals[0] ?? minimumValue;
    // Update visual value so tooltip immediately tracks the thumb.
    setVisualValue(raw);
    const rounded = Math.round(raw);
    const next = Math.max(minimumValue, Math.min(maximumValue, rounded));
    onValueChange(next);
  };

  return (
    <div className="relative mt-4 w-[90%] mx-auto">
      <div
        style={tooltipStyle}
        className={[
          "pointer-events-none absolute -top-9 h-8 rounded-lg bg-primary",
          "flex items-center justify-center z-10",
          "transition-all duration-150 origin-bottom",
          isSliding ? "opacity-100 scale-100" : "opacity-0 scale-90",
        ].join(" ")}
        aria-hidden="true"
      >
        <span className="text-primary-foreground text-[14px] font-bold">
          {formatValue(clampedValue)}
        </span>
        <div className="absolute -bottom-2 h-0 w-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-primary" />
      </div>

      <Slider
        className="w-full h-10"
        min={minimumValue}
        max={maximumValue}
        step={1}
        value={[clampedValue]}
        onValueChange={handleSliderChange}
        onPointerDown={() => setIsSliding(true)}
        onPointerUp={() => setIsSliding(false)}
        style={
          {
            "--slider-track-bg": maximumTrackTintColor,
            "--slider-range-bg": minimumTrackTintColor,
          } as React.CSSProperties
        }
      />

      <p className="mt-4 text-center text-lg font-semibold">
        {/* Replace label with your i18n string if needed */}
        Durata stimata:{" "}
        <span className="text-primary font-extrabold">
          €{formatPrice(clampedValue, hourlyPrice)}
        </span>
      </p>
    </div>
  );
}