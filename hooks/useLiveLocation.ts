"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigationStore } from "@/store/navigationStore";
import { haversineDistance } from "@/utils/bearing";
import {
  fetchIpLocation,
  distanceFromCampusKm,
  NEAR_CAMPUS_KM,
  IP_ACCURACY_M,
} from "@/utils/ipLocation";

// Minimum movement (metres) before we accept a new position — filters GPS jitter
// when the user is standing still. Small enough that "aage step chale" shows up.
const MIN_DISPLACEMENT_M = 2;
// Drop fixes with very poor accuracy (metres)
const MAX_ACCEPTABLE_ACCURACY_M = 100;

/**
 * Starts navigator.geolocation.watchPosition once and streams every fix into
 * the navigation store. Call once at app root (e.g. inside CampusMap).
 *
 * - enableHighAccuracy for step-level updates
 * - ignores jitter < MIN_DISPLACEMENT_M (unless it's the very first fix)
 * - heading/speed from the Geolocation API when the device provides them
 * - GPS unavailable/denied → coarse IP-based fallback via ip2location.io
 *   (used as route origin only when within NEAR_CAMPUS_KM of campus,
 *   since IP geolocation is city-level)
 */
export function useLiveLocation() {
  const lastAccepted = useRef<{ lat: number; lng: number } | null>(null);
  const toastShown = useRef(false);
  const ipAttempted = useRef(false);

  useEffect(() => {
    const { setUserLocation, setLocationStatus, setIpInfo } =
      useNavigationStore.getState();

    // Coarse fallback: resolve the caller's city via IP and use it only if
    // it's near campus — a far-away IP fix must NOT become the route origin.
    async function tryIpFallback(reason: string) {
      if (ipAttempted.current) return;
      ipAttempted.current = true;
      try {
        const ip = await fetchIpLocation();
        const distKm = distanceFromCampusKm(ip.lat, ip.lng);
        setIpInfo({
          city: ip.city,
          region: ip.region,
          country: ip.country,
          isp: ip.isp,
          distanceFromCampusKm: Math.round(distKm),
        });
        const place = [ip.city, ip.region].filter(Boolean).join(", ") || "unknown area";
        if (distKm <= NEAR_CAMPUS_KM) {
          lastAccepted.current = { lat: ip.lat, lng: ip.lng };
          setUserLocation(
            {
              lat: ip.lat,
              lng: ip.lng,
              accuracy: IP_ACCURACY_M,
              heading: null,
              speed: null,
              timestamp: Date.now(),
            },
            "ip"
          );
          toast.info(`${reason} — approximate location: ${place} (±5 km).`);
        } else {
          // Too far for campus navigation — keep campus-gate fallback,
          // but remember the IP info for the UI badge.
          toast.warning(
            `You seem to be in ${place} (~${Math.round(distKm)} km from campus). Showing campus map.`
          );
        }
      } catch {
        if (!toastShown.current) {
          toastShown.current = true;
          toast.error(`${reason} — showing campus gate as fallback.`);
        }
      }
    }

    if (!("geolocation" in navigator)) {
      setLocationStatus("unavailable");
      void tryIpFallback("Geolocation not supported");
      return;
    }

    // Geolocation requires a secure context (HTTPS / localhost)
    if (!window.isSecureContext) {
      setLocationStatus("unavailable");
      void tryIpFallback("Live location needs HTTPS");
      return;
    }

    setLocationStatus("locating");

    // Shared accept-pipeline for both watchPosition and the poll backup.
    function acceptGpsFix(
      latitude: number,
      longitude: number,
      accuracy: number | null,
      heading: number | null,
      speed: number | null,
      timestamp: number
    ) {
      // Discard wildly inaccurate fixes
      if (accuracy != null && accuracy > MAX_ACCEPTABLE_ACCURACY_M) return;

      const { setUserLocation } = useNavigationStore.getState();

      // Jitter filter: ignore tiny jumps after the first fix
      if (lastAccepted.current) {
        const moved = haversineDistance(
          lastAccepted.current.lat,
          lastAccepted.current.lng,
          latitude,
          longitude
        );
        if (moved < MIN_DISPLACEMENT_M) {
          // Still update heading/speed if the device reports them
          if (heading != null || speed != null) {
            setUserLocation(
              {
                lat: lastAccepted.current.lat,
                lng: lastAccepted.current.lng,
                accuracy,
                heading,
                speed,
                timestamp,
              },
              "gps"
            );
          }
          return;
        }
      }

      lastAccepted.current = { lat: latitude, lng: longitude };
      setUserLocation(
        {
          lat: latitude,
          lng: longitude,
          accuracy,
          heading,
          speed,
          timestamp,
        },
        "gps"
      );
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        acceptGpsFix(
          latitude, longitude,
          accuracy ?? null, heading ?? null, speed ?? null,
          pos.timestamp
        );
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus("denied");
          void tryIpFallback("Location permission denied");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationStatus("unavailable");
          void tryIpFallback("GPS signal unavailable");
        } else if (err.code === err.TIMEOUT) {
          // Keep watching; transient timeouts are common indoors
          setLocationStatus("locating");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0, // never use cached positions — always fresh
        timeout: 15000,
      }
    );

    // Backup poll: on some phones/browsers watchPosition stalls after the
    // first fix (throttling, screen lock, weak GPS). A light 5 s poll keeps
    // the dot moving — same accept-pipeline, duplicates dropped by the
    // jitter filter. Skipped once a fresh watch fix exists (< 12 s old).
    const pollId = window.setInterval(() => {
      const last = useNavigationStore.getState().userLocation;
      const source = useNavigationStore.getState().locationSource;
      if (source === "gps" && last && Date.now() - last.timestamp < 12000) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy, heading, speed } = pos.coords;
          acceptGpsFix(
            latitude, longitude,
            accuracy ?? null, heading ?? null, speed ?? null,
            pos.timestamp
          );
        },
        () => { /* ignore — watchPosition remains the primary source */ },
        { enableHighAccuracy: false, maximumAge: 10000, timeout: 10000 }
      );
    }, 5000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(pollId);
    };
  }, []);
}
