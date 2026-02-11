"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapContext } from "@/providers/map-context";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

type MapComponentProps = {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  initialViewState: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  children?: React.ReactNode;
};

export default function MapProvider({
  mapContainerRef,
  initialViewState,
  children,
}: MapComponentProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/parkitohelp/cml12nfaf006z01qxaqod9rr9",
      center: [initialViewState.longitude, initialViewState.latitude],
      zoom: initialViewState.zoom,
      attributionControl: false,
      logoPosition: "bottom-right",
    });

    mapRef.current = map;
    setMapInstance(map);

    map.on("load", () => {
      setLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
    // We intentionally do NOT depend on initialViewState here, so the map
    // is created only once for this container. Coordinate changes are
    // reflected via markers or explicit map movements instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapContainerRef]);

  return (
    <div className="relative z-1000">
      <MapContext.Provider value={{ map: mapInstance }}>
        {children}
      </MapContext.Provider>

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-1000">
          <div className="text-lg font-medium">Loading map...</div>
        </div>
      )}
    </div>
  );
}
