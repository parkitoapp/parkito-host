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
const PREFERRED_PARKING_ID_KEY = "preferredParkingId";

interface SelectedParkingContextValue {
  selectedParkingId: string | null;
  setSelectedParkingId: (id: string) => void;
  selectedParking: Parking | null;
  /** Optional user-chosen favourite parking that should take precedence on load. */
  preferredParkingId: string | null;
  setPreferredParkingId: (id: string | null) => void;
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
  // On reopen: show preferred parking if set, else last viewed. User can still switch anytime.
  const [selectedParkingId, setSelectedParkingIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const preferred = localStorage.getItem(PREFERRED_PARKING_ID_KEY);
    const last = localStorage.getItem(LAST_PARKING_ID_KEY);
    return preferred ?? last;
  });

  // Initialize preferred parking from localStorage (if any)
  const [preferredParkingId, setPreferredParkingIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(PREFERRED_PARKING_ID_KEY);
  });

  // Persist to localStorage whenever user changes parking (e.g. via team-switcher)
  useEffect(() => {
    if (selectedParkingId && typeof window !== "undefined") {
      // Always store as string for consistency
      localStorage.setItem(LAST_PARKING_ID_KEY, String(selectedParkingId));
    }
  }, [selectedParkingId]);

  // Persist preferred parking when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (preferredParkingId) {
      localStorage.setItem(PREFERRED_PARKING_ID_KEY, String(preferredParkingId));
    } else {
      localStorage.removeItem(PREFERRED_PARKING_ID_KEY);
    }
  }, [preferredParkingId]);

  // When parkings load or list changes: only set selection when current is missing/invalid.
  // Preferred = default on first load; once user has switched parking, respect their choice.
  useEffect(() => {
    if (parkings.length === 0) return;
    const storedLastId =
      typeof window !== "undefined" ? localStorage.getItem(LAST_PARKING_ID_KEY) : null;
    const storedPreferredId =
      typeof window !== "undefined" ? localStorage.getItem(PREFERRED_PARKING_ID_KEY) : preferredParkingId;

    const hasPreferred =
      !!storedPreferredId && parkings.some((p) => String(p.id) === storedPreferredId);
    const hasLast =
      !!storedLastId && parkings.some((p) => String(p.id) === storedLastId);
    const currentValid =
      !!selectedParkingId && parkings.some((p) => String(p.id) === String(selectedParkingId));

    // Only set selection when we don't have a valid one (e.g. first load or list changed).
    // Do not override when user has explicitly switched to another parking.
    if (!currentValid) {
      const fallbackId = parkings[0] ? String(parkings[0].id) : null;
      const nextId = hasPreferred
        ? storedPreferredId
        : hasLast
          ? storedLastId
          : fallbackId;
      if (nextId !== null) {
        queueMicrotask(() => {
          setSelectedParkingIdState(nextId);
        });
      }
    }
  }, [parkings, selectedParkingId, preferredParkingId]);

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
      preferredParkingId,
      setPreferredParkingId: setPreferredParkingIdState,
      isInitializingSelection,
    }),
    [selectedParkingId, selectedParking, preferredParkingId, isInitializingSelection]
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
