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

interface SelectedParkingContextValue {
  selectedParkingId: string | null;
  setSelectedParkingId: (id: string) => void;
  selectedParking: Parking | null;
}

const SelectedParkingContext = createContext<SelectedParkingContextValue | undefined>(undefined);

export function SelectedParkingProvider({
  children,
  parkings,
}: {
  children: ReactNode;
  parkings: Parking[];
}) {
  const [selectedParkingId, setSelectedParkingIdState] = useState<string | null>(null);

  // Sync selected id with first parking when parkings load and none selected
  useEffect(() => {
    if (parkings.length > 0 && selectedParkingId === null) {
      setSelectedParkingIdState(parkings[0].id);
    }
    // If current selection is no longer in list, reset to first
    if (parkings.length > 0 && selectedParkingId !== null && !parkings.some((p) => p.id === selectedParkingId)) {
      setSelectedParkingIdState(parkings[0].id);
    }
  }, [parkings, selectedParkingId]);

  const selectedParking = useMemo(
    () => parkings.find((p) => p.id === selectedParkingId) ?? null,
    [parkings, selectedParkingId]
  );

  const value = useMemo(
    () => ({
      selectedParkingId,
      setSelectedParkingId: setSelectedParkingIdState,
      selectedParking,
    }),
    [selectedParkingId, selectedParking]
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
