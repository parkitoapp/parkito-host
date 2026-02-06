"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Parking } from "@/types";

const LAST_PARKING_ID_KEY = "lastParkingId";

interface SelectedParkingContextValue {
  selectedParkingId: string | null;
  setSelectedParkingId: (id: string) => void;
  selectedParking: Parking | null;
  /** True when parkings are loaded but selected ID not set yet (e.g. right after refresh, before effect runs). */
  isInitializingSelection: boolean;
}

const SelectedParkingContext = createContext<SelectedParkingContextValue | undefined>(undefined);

export function SelectedParkingProvider({
  children,
  parkings,
}: {
  children: ReactNode;
  parkings: Parking[];
}) {
  // Initialize from localStorage so refresh/reopen shows last chosen parking immediately
  const [selectedParkingId, setSelectedParkingIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const fromStorage = localStorage.getItem(LAST_PARKING_ID_KEY);
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/85070798-5b27-4ee4-bc65-240a7665c3d5", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "initial",
        hypothesisId: "H1",
        location: "selected-parking-provider.tsx:init",
        message: "Initial selectedParkingId from localStorage",
        data: { fromStorage },
        timestamp: Date.now(),
      }),
    }).catch(() => { });
    // #endregion agent log
    return fromStorage;
  });

  // Persist to localStorage whenever user changes parking (e.g. via team-switcher)
  useEffect(() => {
    if (selectedParkingId && typeof window !== "undefined") {
      // Always store as string for consistency
      localStorage.setItem(LAST_PARKING_ID_KEY, String(selectedParkingId));
    }
  }, [selectedParkingId]);

  // When parkings load: if current selection is missing or invalid, use stored id or first
  useEffect(() => {
    if (parkings.length === 0) return;
    const storedId = typeof window !== "undefined" ? localStorage.getItem(LAST_PARKING_ID_KEY) : null;
    // Parkings IDs might be numbers at runtime; compare as strings
    const storedIdValid = !!storedId && parkings.some((p) => String(p.id) === storedId);
    const currentValid =
      !!selectedParkingId && parkings.some((p) => String(p.id) === String(selectedParkingId));
    if (!currentValid) {
      const fallbackId = parkings[0] ? String(parkings[0].id) : null;
      const nextId = storedIdValid ? storedId : fallbackId;
      if (nextId !== null) {
        // Defer state update to avoid synchronous setState inside effect body
        queueMicrotask(() => {
          setSelectedParkingIdState(nextId);
        });
      }
    }
  }, [parkings, selectedParkingId]);

  const selectedParking = useMemo(
    () =>
      parkings.find(
        (p) =>
          selectedParkingId !== null &&
          String(p.id) === String(selectedParkingId)
      ) ?? null,
    [parkings, selectedParkingId]
  );

  const isInitializingSelection = parkings.length > 0 && selectedParkingId === null;

  const value = useMemo(
    () => ({
      selectedParkingId,
      setSelectedParkingId: setSelectedParkingIdState,
      selectedParking,
      isInitializingSelection,
    }),
    [selectedParkingId, selectedParking, isInitializingSelection]
  );

  return (
    <SelectedParkingContext.Provider value={value}>
      {children}
    </SelectedParkingContext.Provider>
  );
}

export function useSelectedParking() {
  const context = useContext(SelectedParkingContext);
  if (context === undefined) {
    throw new Error("useSelectedParking must be used within a SelectedParkingProvider");
  }
  return context;
}

/** Use when component may render outside SelectedParkingProvider (e.g. TeamSwitcher in sidebar). */
export function useSelectedParkingOptional(): SelectedParkingContextValue | undefined {
  return useContext(SelectedParkingContext);
}
