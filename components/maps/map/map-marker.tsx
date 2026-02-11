"use client";

import mapboxgl, { MarkerOptions } from "mapbox-gl";
import React, { useEffect, useRef, useCallback } from "react";

import { useMap } from "@/providers/map-context";
import { LocationFeature } from "@/lib/mapbox/utils";

type Props = {
  longitude: number;
  latitude: number;
  data: LocationFeature;
  onHover?: ({
    isHovered,
    position,
    marker,
    data,
  }: {
    isHovered: boolean;
    position: { longitude: number; latitude: number };
    marker: mapboxgl.Marker;
    data: LocationFeature;
  }) => void;
  onClick?: ({
    position,
    marker,
    data,
  }: {
    position: { longitude: number; latitude: number };
    marker: mapboxgl.Marker;
    data: LocationFeature;
  }) => void;
  children?: React.ReactNode;
} & MarkerOptions;

export default function Marker({
  children,
  latitude,
  longitude,
  data,
  onHover,
  onClick,
  ...props
}: Props) {
  const { map } = useMap();
  const markerRef = useRef<HTMLDivElement | null>(null);
  const markerInstanceRef = useRef<mapboxgl.Marker | null>(null);

  const handleHover = useCallback(
    (isHovered: boolean) => {
      const marker = markerInstanceRef.current;
      if (onHover && marker) {
        onHover({
          isHovered,
          position: { longitude, latitude },
          marker,
          data,
        });
      }
    },
    [onHover, longitude, latitude, data]
  );

  const handleClick = useCallback(() => {
    const marker = markerInstanceRef.current;
    if (onClick && marker) {
      onClick({
        position: { longitude, latitude },
        marker,
        data,
      });
    }
  }, [onClick, longitude, latitude, data]);

  useEffect(() => {
    const markerEl = markerRef.current;
    if (!map || !markerEl) return;

    const handleMouseEnter = () => handleHover(true);
    const handleMouseLeave = () => handleHover(false);

    markerEl.addEventListener("mouseenter", handleMouseEnter);
    markerEl.addEventListener("mouseleave", handleMouseLeave);
    markerEl.addEventListener("click", handleClick);

    const marker = new mapboxgl.Marker({
      element: markerEl,
      ...props,
    })
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerInstanceRef.current = marker;

    return () => {
      marker.remove();
      markerInstanceRef.current = null;

      markerEl.removeEventListener("mouseenter", handleMouseEnter);
      markerEl.removeEventListener("mouseleave", handleMouseLeave);
      markerEl.removeEventListener("click", handleClick);
    };
  }, [map, longitude, latitude, props, handleHover, handleClick]);

  return <div ref={markerRef}>{children}</div>;
}
