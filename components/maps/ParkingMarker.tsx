"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { ParkingCircleIcon } from "lucide-react";

import { useMap } from "@/providers/map-context";

type ParkingMarkerProps = {
  latitude: number;
  longitude: number;
  draggable?: boolean;
  onDragEnd?: (coords: { latitude: number; longitude: number }) => void;
};

export default function ParkingMarker({
  latitude,
  longitude,
  draggable = false,
  onDragEnd,
}: ParkingMarkerProps) {
  const { map } = useMap();
  const markerRef = useRef<HTMLDivElement | null>(null);
  const markerInstanceRef = useRef<mapboxgl.Marker | null>(null);

  const hasValidCoords =
    Number.isFinite(latitude) && Number.isFinite(longitude);

  // Create marker once when map, DOM element, and coordinates are ready
  useEffect(() => {
    const el = markerRef.current;
    if (!map || !el || markerInstanceRef.current || !hasValidCoords) return;

    const marker = new mapboxgl.Marker({
      element: el,
      draggable,
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    if (draggable && onDragEnd) {
      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        onDragEnd({ latitude: lngLat.lat, longitude: lngLat.lng });
      });
    }

    markerInstanceRef.current = marker;

    return () => {
      marker.remove();
      markerInstanceRef.current = null;
    };
  }, [map, draggable, onDragEnd, hasValidCoords, latitude, longitude]);

  // Keep marker position in sync with props
  useEffect(() => {
    if (!markerInstanceRef.current || !hasValidCoords) return;
    markerInstanceRef.current.setLngLat([longitude, latitude]);
  }, [longitude, latitude, hasValidCoords]);

  if (!hasValidCoords) {
    return null;
  }

  return (
    <div
      ref={markerRef}
      className="flex items-center justify-center transform -translate-y-1/2"
    >
      <ParkingCircleIcon className="size-6 stroke-primary-foreground border-none fill-primary" />
    </div>
  );
}

