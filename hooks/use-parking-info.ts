"use client";

import { useQuery } from "@tanstack/react-query";
import type { ParkingFullInfo } from "@/types";

const PARKING_INFO_STALE_MS = 60 * 60 * 24 * 7 * 1000; // 7 days – cache to avoid too many requests

export function useParkingInfo(parkingId: string | null) {
  const query = useQuery({
    queryKey: ["parking-info", parkingId],
    queryFn: async (): Promise<ParkingFullInfo> => {
      const res = await fetch(`/api/parking/${parkingId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to fetch parking info");
      }
      return res.json();
    },
    enabled: !!parkingId,
    staleTime: PARKING_INFO_STALE_MS,
    gcTime: PARKING_INFO_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
