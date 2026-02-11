import { useRef } from "react";

import MapProvider from "@/providers/map-provider";
import MapStyles from "@/components/maps/map/map-styles";
import MapCotrols from "@/components/maps/map/map-controls";

type MapProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  children?: React.ReactNode;
};

export default function Map({
  latitude,
  longitude,
  zoom = 15,
  children,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="relative w-full h-full">
      <div
        id="map-container"
        ref={mapContainerRef}
        className="absolute inset-0 h-full w-full"
      />

      <MapProvider
        mapContainerRef={mapContainerRef}
        initialViewState={{
          longitude,
          latitude,
          zoom,
        }}
      >
        {children}
        <MapCotrols />
        <MapStyles />
      </MapProvider>
    </div>
  );
}