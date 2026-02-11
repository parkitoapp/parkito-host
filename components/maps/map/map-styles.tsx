"use client";

import React, { useEffect } from "react";
import { useTheme } from "next-themes";

import { useMap } from "@/providers/map-context";

const LIGHT_3D_STYLE =
  "mapbox://styles/parkitohelp/cml12nfaf006z01qxaqod9rr9";
const DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

export default function MapStyles() {
  const { map } = useMap();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!map || !resolvedTheme) return;

    const styleUrl = resolvedTheme === "dark" ? DARK_STYLE : LIGHT_3D_STYLE;
    map.setStyle(styleUrl);
  }, [map, resolvedTheme]);

  return null;
}