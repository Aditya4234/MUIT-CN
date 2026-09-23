"use client";

import { useMemo } from "react";
import { useNavigationStore } from "@/store/navigationStore";
import { computeRouteProgress, type RouteProgress } from "@/utils/routeProgress";

/**
 * Live route progress shared by the map layer, overlays and re-route logic:
 * snaps the user onto the route and splits it into traveled / remaining.
 * Null when there is no route or no fix yet.
 */
export function useRouteProgress(): RouteProgress | null {
  const routeData = useNavigationStore((s) => s.routeData);
  const userLat = useNavigationStore((s) => s.userLocation?.lat);
  const userLng = useNavigationStore((s) => s.userLocation?.lng);

  return useMemo(() => {
    if (!routeData || userLat == null || userLng == null) return null;
    return computeRouteProgress(
      routeData.geometry.coordinates as [number, number][],
      userLat,
      userLng
    );
  }, [routeData, userLat, userLng]);
}
