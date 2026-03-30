"use client";

import { useEffect } from "react";
import type { MapRef } from "react-map-gl/mapbox";

export function useARControls(
  mapRef: React.RefObject<MapRef | null>,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive) return;

    const map = mapRef.current?.getMap();
    if (!map) return;

    const canvas = map.getCanvas();
    const mapInstance = map;

    // Desktop: mouse position → bearing
    function onMouseMove(e: MouseEvent) {
      const bearing = ((e.clientX / window.innerWidth) - 0.5) * 360;
      mapInstance.setBearing(bearing);
    }

    // Mobile: device orientation → bearing
    function onDeviceOrientation(e: DeviceOrientationEvent) {
      if (e.alpha !== null) mapInstance.setBearing(e.alpha);
    }

    // Touch: swipe left/right → bearing
    let touchStartX = 0;
    let startBearing = 0;
    function onTouchStart(e: TouchEvent) {
      touchStartX = e.touches[0].clientX;
      startBearing = mapInstance.getBearing();
    }
    function onTouchMove(e: TouchEvent) {
      const delta = (e.touches[0].clientX - touchStartX) / window.innerWidth * 360;
      mapInstance.setBearing(startBearing - delta);
    }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("deviceorientation", onDeviceOrientation);

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("deviceorientation", onDeviceOrientation);
    };
  }, [isActive, mapRef]);
}
