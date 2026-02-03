"use client"

import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import type { ReactNode } from "react"

const PARKINGS_STALE_MS = 60 * 60 * 24 * 7 * 1000 // 7 days
const CACHE_MAX_AGE_MS = 60 * 60 * 24 * 7 * 1000 // 7 days

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: PARKINGS_STALE_MS,
        gcTime: CACHE_MAX_AGE_MS,
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

function getPersister() {
  return createSyncStoragePersister({
    storage: typeof window === "undefined" ? undefined : window.localStorage,
    key: "parkito-query-cache",
    throttleTime: 1000,
  })
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()
  const persister = getPersister()

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE_MS,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
