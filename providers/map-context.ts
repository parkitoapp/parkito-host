// map-context.ts
import type { Map as MapboxMap } from "mapbox-gl";
import { createContext, useContext } from "react";

interface MapContextType {
  map: MapboxMap | null;
}

export const MapContext = createContext<MapContextType | null>(null);

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a MapProvider");
  }
  return context;
}
