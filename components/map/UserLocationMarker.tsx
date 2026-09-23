"use client";

import { useEffect, useRef, useState } from "react";
import { Marker } from "react-map-gl/mapbox";
import { COLLEGE_GATE } from "@/constants/locations";
import { useNavigationStore } from "@/store/navigationStore";
import { calculateBearing, haversineDistance } from "@/utils/bearing";
import type { ViewMode } from "@/types";

interface UserLocationMarkerProps {
  mode: ViewMode;
  bearing?: number;
}

export function UserLocationMarker({ mode, bearing = 0 }: UserLocationMarkerProps) {
  const isNavMode = mode === "turn-by-turn" || mode === "ar-simulation";
  const userLocation = useNavigationStore((s) => s.userLocation);
  const locationStatus = useNavigationStore((s) => s.locationStatus);
  const locationSource = useNavigationStore((s) => s.locationSource);
  const ipInfo = useNavigationStore((s) => s.ipInfo);

  const targetLng = userLocation?.lng ?? COLLEGE_GATE.lng;
  const targetLat = userLocation?.lat ?? COLLEGE_GATE.lat;
  const heading = userLocation?.heading;
  const accuracy = userLocation?.accuracy;
  const isLive = userLocation != null;
  const isIp = locationSource === "ip";
  const isLocating = locationStatus === "locating" || locationStatus === "idle";

  // Interpolated display position — a persistent glide loop eases the dot
  // toward each new fix, so it slides like real maps instead of jumping.
  // All setState happens inside the rAF callback (never in an effect body).
  const [display, setDisplay] = useState({
    lat: targetLat,
    lng: targetLng,
    bearing: null as number | null,
  });
  const targetRef = useRef({ lat: targetLat, lng: targetLng });
  const pendingBearingRef = useRef<number | null>(null);

  // Sync the glide target (ref-only, no setState).
  useEffect(() => {
    const prev = targetRef.current;
    const dist = haversineDistance(prev.lat, prev.lng, targetLat, targetLng);
    targetRef.current = { lat: targetLat, lng: targetLng };
    if (dist > 3 && dist <= 500) {
      pendingBearingRef.current = calculateBearing(prev.lat, prev.lng, targetLat, targetLng);
    } else if (dist > 500) {
      pendingBearingRef.current = null;
    }
  }, [targetLat, targetLng]);

  // Glide loop — mounted once, trails the target with exponential easing.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = targetRef.current;
      setDisplay((prev) => {
        const d = haversineDistance(prev.lat, prev.lng, t.lat, t.lng);
        if (d < 0.5) return prev; // arrived — bail out, no re-render
        // Teleport (new route origin / first far fix) → snap instantly
        if (d > 500) return { lat: t.lat, lng: t.lng, bearing: pendingBearingRef.current };
        const k = 0.18; // ease factor per frame — converges in ~0.5 s at 60 fps
        return {
          lat: prev.lat + (t.lat - prev.lat) * k,
          lng: prev.lng + (t.lng - prev.lng) * k,
          bearing: pendingBearingRef.current,
        };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Arrow direction: device compass → travel direction → route bearing.
  const arrowRotation =
    heading != null && !Number.isNaN(heading)
      ? heading
      : display.bearing ?? bearing;

  // IP fixes are coarse (city-level) — orange marker distinguishes them from GPS
  const dotColor = isIp ? "#f59e0b" : isLive ? "#85adff" : "#94a3b8";
  const place = [ipInfo?.city, ipInfo?.region].filter(Boolean).join(", ");
  const title = isIp
    ? `Approximate location${place ? ` (${place}, ±5 km)` : ""} — enable GPS for precise navigation`
    : isLive
      ? "Your live location"
      : "Campus gate (location fallback)";

  // Accuracy circle: GPS metres are shown near 1:1 (clamped); the coarse
  // IP fix (±5 km) gets a fixed dashed ring so it doesn't cover the map.
  const accuracyRadiusPx =
    accuracy != null
      ? isIp
        ? 60
        : Math.min(Math.max(accuracy, 8), 80)
      : 0;

  return (
    <Marker longitude={display.lng} latitude={display.lat} anchor="center">
      <div
        className="relative flex items-center justify-center"
        title={title}
      >
        {/* Accuracy circle — only when we have a live fix */}
        {isLive && accuracyRadiusPx > 0 && (
          <div
            className="absolute rounded-full"
            style={{
              width: accuracyRadiusPx * 2,
              height: accuracyRadiusPx * 2,
              background: isIp ? "rgba(245, 158, 11, 0.12)" : "rgba(133, 173, 255, 0.15)",
              border: isIp
                ? "1px dashed rgba(245, 158, 11, 0.5)"
                : "1px solid rgba(133, 173, 255, 0.3)",
            }}
          />
        )}

        {isNavMode ? (
          <div
            style={{ transform: `rotate(${arrowRotation}deg)`, transition: "transform 0.3s linear" }}
            className="w-8 h-8 flex items-center justify-center drop-shadow-lg"
          >
            <svg viewBox="0 0 24 24" fill={dotColor} stroke="#060e20" strokeWidth="1.5" width="32" height="32">
              <polygon points="12,2 20,20 12,16 4,20" />
            </svg>
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <div
              className={`absolute w-10 h-10 rounded-full ${isLocating ? "animate-ping" : ""}`}
              style={{ background: isIp ? "rgba(245, 158, 11, 0.25)" : "rgba(133, 173, 255, 0.25)" }}
            />
            <div
              className={`w-4 h-4 rounded-full shadow-lg ${isLive ? "" : "opacity-60"}`}
              style={{
                background: dotColor,
                border: "2px solid #dee5ff",
                boxShadow: `0 0 10px ${dotColor}99`,
              }}
            />
          </div>
        )}
      </div>
    </Marker>
  );
}
