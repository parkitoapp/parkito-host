"use client";

import { useQuery } from "@tanstack/react-query";
import type { ParkingFullInfo } from "@/types";

// Shorter stale time for reservations to appear soon after adding a booking in DB
const PARKING_INFO_STALE_MS = 60 * 1000; // 1 minute – reservations change often
const PARKING_INFO_GC_MS = 60 * 60 * 1000; // 1 hour – keep in cache for quick switches

export function useParkingInfo(parkingId: string | null) {
  const query = useQuery({
    queryKey: ["parking-info", parkingId],
    queryFn: async (): Promise<ParkingFullInfo> => {
      const res = await fetch(`/api/parking/${parkingId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to fetch parking info");
      }
      return res.json();
    },
    enabled: !!parkingId,
    staleTime: PARKING_INFO_STALE_MS,
    gcTime: PARKING_INFO_GC_MS,
    refetchOnWindowFocus: true, // Refetch when returning to tab so new bookings appear
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
