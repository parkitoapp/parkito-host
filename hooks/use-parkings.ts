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
    initialData:
      hostId && initialParkings?.length !== undefined
        ? initialParkings
        : undefined,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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
