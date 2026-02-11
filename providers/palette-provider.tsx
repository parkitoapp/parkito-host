"use client";

import { createContext, useContext, useEffect, useState } from "react";

const PALETTE_STORAGE_KEY = "parkito-theme-palette";

const KNOWN_PALETTES = [
  "default",
  "sage-green",
  "amethyst-haze",
  "caffeine",
  "amber",
  "burgundy",
] as const;

export type PaletteId = (typeof KNOWN_PALETTES)[number];

function applyPaletteClass(palette: PaletteId) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const paletteClasses = KNOWN_PALETTES
    .filter((p) => p !== "default")
    .map((p) => `theme-${p}`);

  root.classList.remove(...paletteClasses);

  if (palette !== "default") {
    root.classList.add(`theme-${palette}`);
  }
}

type PaletteContextValue = {
  palette: PaletteId;
  setPalette: (palette: PaletteId) => void;
};

const PaletteContext = createContext<PaletteContextValue | undefined>(
  undefined
);

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteId>("default");

  // Initialize from localStorage once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    if (stored && KNOWN_PALETTES.includes(stored as PaletteId)) {
      setPaletteState(stored as PaletteId);
    }
  }, []);

  // Whenever palette changes, apply it and persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    applyPaletteClass(palette);
    window.localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  }, [palette]);

  // React to palette changes from other tabs
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PALETTE_STORAGE_KEY) return;
      const value = event.newValue as PaletteId | null;
      if (value && KNOWN_PALETTES.includes(value)) {
        setPaletteState(value);
      } else {
        setPaletteState("default");
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const ctxValue: PaletteContextValue = {
    palette,
    setPalette: (next) => {
      if (!KNOWN_PALETTES.includes(next)) return;
      setPaletteState(next);
    },
  };

  return (
    <PaletteContext.Provider value={ctxValue}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    throw new Error("usePalette must be used within a PaletteProvider");
  }
  return ctx;
}

