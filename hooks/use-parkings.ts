"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchParkingByHostId } from "@/lib/getUser.client";
import { useUser } from "@/providers/user-provider";
import type { Parking } from "@/types";

const PARKINGS_QUERY_KEY = "parkings" as const;

export function useParkings(hostId: string | undefined) {
  const { initialParkings } = useUser();

  const query = useQuery({
    queryKey: [PARKINGS_QUERY_KEY, hostId],
    queryFn: () => fetchParkingByHostId(hostId!),
    enabled: !!hostId,
    // Only use server-provided parkings as initial data when we actually
    // have some. If the array is empty we want to hit the network instead,
    // otherwise React Query may treat the empty list as "fresh" for a long
    // time and never refetch (which is what causes the first-login issue).
    initialData:
      hostId && Array.isArray(initialParkings) && initialParkings.length > 0
        ? initialParkings
        : undefined,
    staleTime: 60 * 1000, // keep data briefly "fresh" but allow quick refetches
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always",
    retry: 2,
  });

  return {
    parkings: (query.data ?? []) as Parking[],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
