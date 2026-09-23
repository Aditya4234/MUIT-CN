"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import { toast } from "sonner";
import { Menu, LocateFixed } from "lucide-react";
import { CAMPUS_LOCATIONS, COLLEGE_GATE } from "@/constants/locations";
import { useNavigationStore } from "@/store/navigationStore";
import { getDirections } from "@/hooks/useDirections";
import { useARControls } from "@/hooks/useARControls";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import { calculateBearing, haversineDistance } from "@/utils/bearing";
import { isOffRoute, currentStepIndex } from "@/utils/routeProgress";
import { useRouteProgress } from "@/hooks/useRouteProgress";
import { formatDistance, formatDuration } from "@/utils/formatDistance";
import { arFog } from "@/utils/fogConfig";
import { UserLocationMarker } from "./UserLocationMarker";
import { DestinationPin } from "./DestinationPin";
import { MapStyleToggle } from "./MapStyleToggle";
import { RouteLayer } from "./RouteLayer";
import { BuildingLayer } from "./BuildingLayer";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const STYLES = {
  street: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

// Re-route when the user wanders this far (metres) off the planned path,
// or drifts this far from the point the route was calculated from.
// Small on-path steps are handled locally by trimming the displayed path,
// so no API call is needed for every few metres walked.
const OFF_ROUTE_THRESHOLD_M = 35;
const REROUTE_DRIFT_M = 60;

function fitRouteBounds(
  map: mapboxgl.Map,
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
) {
  const bearing = calculateBearing(origin.lat, origin.lng, dest.lat, dest.lng);
  map.fitBounds(
    [
      [Math.min(origin.lng, dest.lng), Math.min(origin.lat, dest.lat)],
      [Math.max(origin.lng, dest.lng), Math.max(origin.lat, dest.lat)],
    ],
    { padding: { top: 120, bottom: 220, left: 80, right: 80 }, pitch: 45, bearing, duration: 1500 }
  );
}

export function CampusMap() {
  const mapRef = useRef<MapRef>(null);
  const arMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const transitioningRef = useRef(false);  // guard against rapid mode switches
  const lastRouteOriginRef = useRef<{ lat: number; lng: number } | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const {
    viewMode,
    navSteps,
    selectedDestination,
    routeData,
    userLocation,
    isFollowingUser,
    setFollowingUser,
    setCurrentStepIndex,
    selectDestination,
    setRouteData,
    setSidebarOpen,
  } = useNavigationStore();

  // Start GPS tracking — streams fixes into the store via watchPosition
  useLiveLocation();

  // Shared live progress (snapped position, remaining path, off-route state)
  const progress = useRouteProgress();

  // Live origin: GPS fix when available, campus gate as fallback
  const origin = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : { lat: COLLEGE_GATE.lat, lng: COLLEGE_GATE.lng };

  const firstStepBearing = navSteps[0]?.maneuver.bearing_after ?? 0;
  const isAR = viewMode === "ar-simulation";
  // Camera follows the dot in every navigation view (route-overview included),
  // so walking 10 m never leaves the dot behind off-screen.
  const isNavigating = selectedDestination != null;

  // Track live map bearing in AR mode so the arrow always points toward destination
  const [mapBearing, setMapBearing] = useState(0);
  useEffect(() => {
    if (viewMode !== "ar-simulation") return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const update = () => setMapBearing(map.getBearing());
    update();
    map.on("rotate", update);
    return () => { map.off("rotate", update); };
  }, [viewMode]);

  const dest = CAMPUS_LOCATIONS.find((l) => l.id === selectedDestination);
  const destBearing = dest
    ? calculateBearing(origin.lat, origin.lng, dest.lat, dest.lng)
    : 0;

  // Mode 4: arrow points toward destination relative to current camera bearing.
  // Mode 3: map is rotated to firstStepBearing, so 0° points forward.
  const arrowBearing = viewMode === "ar-simulation" ? destBearing - mapBearing : 0;

  // 360° look-around for AR mode
  useARControls(mapRef, isAR);

  // If the user manually drags the map while navigating, pause follow mode
  // so we don't fight them. The recenter button resumes it.
  useEffect(() => {
    if (!isNavigating) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const onDragStart = () => setFollowingUser(false);
    map.on("dragstart", onDragStart);
    return () => { map.off("dragstart", onDragStart); };
  }, [isNavigating, setFollowingUser]);

  // Resume follow mode whenever (re-)entering a navigation view
  useEffect(() => {
    if (isNavigating) setFollowingUser(true);
  }, [isNavigating, setFollowingUser]);

  // Fetch route when destination changes. While walking, small on-path steps
  // are handled locally (RouteLayer trims the walked part) — refetch only
  // when the user goes off-route or drifts far from the route origin.
  useEffect(() => {
    if (!selectedDestination) {
      lastRouteOriginRef.current = null;
      return;
    }
    const destLoc = CAMPUS_LOCATIONS.find((l) => l.id === selectedDestination);
    if (!destLoc) return;

    const lastOrigin = lastRouteOriginRef.current;
    const isFirstFetch = !lastOrigin || !routeData;

    if (!isFirstFetch) {
      const movedSinceRoute = haversineDistance(
        lastOrigin.lat, lastOrigin.lng, origin.lat, origin.lng
      );
      const offRoute = isOffRoute(progress, OFF_ROUTE_THRESHOLD_M);
      // On-path steps (even 10–50 m) need no refetch — the displayed path
      // already shrinks locally. Refetch only when truly off-route or the
      // origin drifted far (e.g. stale GPS jumping across campus).
      if (!offRoute && movedSinceRoute < REROUTE_DRIFT_M) return;
    }

    const routeOrigin = { ...origin };
    const wasReroute = !isFirstFetch;
    setLoadingRoute(true);
    getDirections(destLoc.lat, destLoc.lng, routeOrigin)
      .then((route) => {
        // Ignore stale responses if the destination changed mid-flight
        if (useNavigationStore.getState().selectedDestination !== selectedDestination) return;
        setRouteData(route);
        lastRouteOriginRef.current = routeOrigin;
        toast.success(
          wasReroute
            ? `Route updated · ${formatDistance(route.distance)} · ${formatDuration(route.duration)}`
            : `Route to ${destLoc.label} · ${formatDistance(route.distance)} · ${formatDuration(route.duration)}`
        );

        const map = mapRef.current?.getMap();
        if (!map) return;

        // On a mid-walk re-route keep the camera on the user instead of
        // zooming back out to the full route bounds.
        if (wasReroute && userLocation) {
          map.easeTo({ center: [userLocation.lng, userLocation.lat], duration: 800 });
        } else {
          fitRouteBounds(map, routeOrigin, destLoc);
        }
      })
      .catch(() => toast.error("Could not load route. Check your Mapbox token."))
      .finally(() => setLoadingRoute(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDestination, userLocation?.lat, userLocation?.lng, routeData]);

  // Auto-advance turn-by-turn steps like real maps: the closest step becomes
  // active as you walk into it. Monotonic (never jumps back on GPS wobble),
  // reset to 0 whenever a new route is fetched.
  const userLat = userLocation?.lat;
  const userLng = userLocation?.lng;
  useEffect(() => {
    if (!routeData || userLat == null || userLng == null || !selectedDestination) return;
    if (routeData.steps.length === 0) return;
    const raw = currentStepIndex(routeData.steps, userLat, userLng);
    if (raw < 0) return; // too far from every step — re-route logic handles it
    const prev = useNavigationStore.getState().currentStepIndex;
    const next = Math.min(Math.max(raw, prev), routeData.steps.length - 1);
    if (next !== prev) setCurrentStepIndex(next);
  }, [userLat, userLng, routeData, selectedDestination, setCurrentStepIndex]);

  // Live camera follow — as the user walks, glide the camera to their
  // position in every navigation view (only while follow is enabled).
  // Turn-by-turn uses heading-up rotation like real maps: the map turns so
  // the direction of travel points up. Overview stays north-up.
  const prevFixRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastCamBearingRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isNavigating || !isFollowingUser || !userLocation) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (viewMode === "ar-simulation") {
      try {
        const position = mapboxgl.MercatorCoordinate.fromLngLat(
          [userLocation.lng, userLocation.lat],
          1.7
        );
        const cam = map.getFreeCameraOptions();
        cam.position = position;
        cam.setPitchBearing(85, map.getBearing());
        map.setFreeCameraOptions(cam);
      } catch { /* ignore — map may not be ready */ }
      return;
    }

    if (viewMode === "turn-by-turn") {
      // Prefer the device compass heading; otherwise derive travel bearing
      // from consecutive fixes (needs > 4 m to beat GPS noise).
      let travel: number | null =
        userLocation.heading != null && !Number.isNaN(userLocation.heading)
          ? userLocation.heading
          : null;
      const prev = prevFixRef.current;
      if (travel == null && prev) {
        const moved = haversineDistance(prev.lat, prev.lng, userLocation.lat, userLocation.lng);
        if (moved > 4) {
          travel = calculateBearing(prev.lat, prev.lng, userLocation.lat, userLocation.lng);
        }
      }
      prevFixRef.current = { lat: userLocation.lat, lng: userLocation.lng };

      // Smooth the rotation: ignore wobbles under 8°, take the shortest turn.
      let bearing = map.getBearing();
      if (travel != null) {
        const last = lastCamBearingRef.current ?? bearing;
        const diff = ((travel - last + 540) % 360) - 180;
        bearing = Math.abs(diff) > 8 ? last + diff : last;
        lastCamBearingRef.current = bearing;
      }
      map.easeTo({
        center: [userLocation.lng, userLocation.lat],
        bearing,
        duration: 1000,
      });
      return;
    }

    lastCamBearingRef.current = null;
    map.easeTo({
      center: [userLocation.lng, userLocation.lat],
      duration: 1000,
    });
  }, [userLocation?.lat, userLocation?.lng, isNavigating, isFollowingUser, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // AR markers — create on enter, remove on exit
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (viewMode !== "ar-simulation") return;

    // Determine which locations to show — selected dest + remaining as ghost markers
    const locations = selectedDestination
      ? CAMPUS_LOCATIONS.filter((l) => l.id === selectedDestination)
      : [...CAMPUS_LOCATIONS];

    locations.forEach((loc) => {
      const dist = haversineDistance(
        origin.lat, origin.lng,
        loc.lat, loc.lng
      );

      const el = document.createElement("div");
      el.className = "ar-nav-arrow";
      el.style.borderColor = loc.color + "99";
      el.style.boxShadow = `0 0 20px ${loc.color}4d, 0 0 60px ${loc.color}1a`;
      el.innerHTML = `
        <div class="ar-arrow-icon">➤</div>
        <div class="ar-arrow-label">${loc.label}</div>
        <div class="ar-arrow-distance">${formatDistance(dist)}</div>
      `;

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([loc.lng, loc.lat])
        .setOffset([0, -60])
        .addTo(map);

      arMarkersRef.current.push(marker);
    });

    return () => {
      arMarkersRef.current.forEach((m) => m.remove());
      arMarkersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedDestination, userLocation?.lat, userLocation?.lng]);

  // Camera + fog + pan-lock transitions per viewMode
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // 2d-map reset runs even when routeData is null (e.g. after clearNavigation)
    if (viewMode === "2d-map") {
      if (transitioningRef.current) map.stop();
      transitioningRef.current = true;
      map.once("moveend", () => { transitioningRef.current = false; });
      map.easeTo({ pitch: 0, bearing: 0, zoom: 15, duration: 1500 });
      try { map.setFog({}); } catch { /* ignore */ }
      try { map.setTerrain(null); } catch { /* ignore */ }
      map.dragPan.enable();
      map.scrollZoom.enable();
      return;
    }

    if (!routeData) return;

    // Ignore if a transition is already in flight — prevents rapid-click queuing
    if (transitioningRef.current) {
      map.stop();  // cancel any in-progress easeTo
    }
    transitioningRef.current = true;
    map.once("moveend", () => { transitioningRef.current = false; });

    const destLoc = CAMPUS_LOCATIONS.find((l) => l.id === selectedDestination);

    if (viewMode === "route-overview" && destLoc) {
      try { map.setTerrain(null); } catch { /* ignore */ }
      try { map.setFog({}); } catch { /* ignore */ }
      fitRouteBounds(map, origin, destLoc);
      map.dragPan.enable();
      map.scrollZoom.enable();
    } else if (viewMode === "turn-by-turn") {
      // Sidebar unmounts when entering this mode — resize so the canvas fills the
      // now-wider container before the camera animation uses the new dimensions.
      map.resize();
      // Set terrain before camera animation so it doesn't interrupt easeTo
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", { type: "raster-dem", url: "mapbox://mapbox.mapbox-terrain-dem-v1", tileSize: 512, maxzoom: 14 });
      }
      try { map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 }); } catch { /* ignore */ }
      try { map.setFog({}); } catch { /* ignore */ }
      map.easeTo({
        pitch: 60,
        bearing: firstStepBearing,
        zoom: 18,
        center: [origin.lng, origin.lat],
        duration: 2000,
      });
      map.dragPan.enable();
      map.scrollZoom.enable();
    } else if (viewMode === "ar-simulation") {
      // Same resize needed — sidebar also unmounts in AR mode.
      map.resize();
      // No terrain in AR mode: MercatorCoordinate altitude is above sea level, and
      // terrain exaggeration would push the ground mesh above the camera at 1.7 m.
      try { map.setTerrain(null); } catch { /* ignore */ }
      map.setFog(arFog);
      map.easeTo({
        pitch: 85,
        zoom: 20,
        center: [origin.lng, origin.lat],
        duration: 2500,
      });
      // After the zoom/pitch animation, snap the camera to true eye level (1.7 m).
      // setFreeCameraOptions is instantaneous — doing it inside moveend avoids a
      // jarring mid-animation jump.
      map.once("moveend", () => {
        const position = mapboxgl.MercatorCoordinate.fromLngLat(
          [origin.lng, origin.lat],
          1.7
        );
        const cam = map.getFreeCameraOptions();
        cam.position = position;
        cam.setPitchBearing(85, map.getBearing());
        map.setFreeCameraOptions(cam);
      });
      map.dragPan.disable();
      map.scrollZoom.disable();
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStyleToggle = useCallback(() => setIsSatellite((p) => !p), []);
  const handleRecenter = useCallback(() => {
    const map = mapRef.current?.getMap();
    const loc = useNavigationStore.getState().userLocation;
    setFollowingUser(true);
    if (map && loc) {
      map.easeTo({ center: [loc.lng, loc.lat], zoom: viewMode === "ar-simulation" ? 20 : 18, duration: 1000 });
    }
  }, [setFollowingUser, viewMode]);

  const isFullscreen = viewMode === "turn-by-turn" || viewMode === "ar-simulation";

  return (
    <div
      className="relative flex-1"
      style={{ width: "100%", height: "100vh" }}
    >
      <LoadingOverlay isLoading={loadingRoute} />

      {/* Mobile Menu Toggle */}
      {!isFullscreen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 z-40 w-10 h-10 rounded-full flex items-center justify-center bg-[#091328]/90 backdrop-blur-md border border-white/10 text-white md:hidden shadow-lg"
        >
          <Menu size={20} />
        </button>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: 26.929,
          longitude: 80.9283,
          zoom: 16,
          pitch: 0,
          bearing: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={isSatellite ? STYLES.satellite : STYLES.street}
      >
        {!isAR && <NavigationControl position="bottom-right" />}
        <BuildingLayer />
        <RouteLayer />
        <UserLocationMarker mode={viewMode} bearing={arrowBearing} />
        {CAMPUS_LOCATIONS.map((loc) => (
          <DestinationPin
            key={loc.id}
            location={loc}
            onSelect={selectDestination}
          />
        ))}
      </Map>

      <MapStyleToggle isSatellite={isSatellite} onToggle={handleStyleToggle} />

      {/* Recenter button — appears while navigating when the user paused follow by dragging */}
      {isNavigating && !isFollowingUser && userLocation && (
        <button
          onClick={handleRecenter}
          aria-label="Recenter on my location"
          className="absolute bottom-40 right-4 z-40 w-11 h-11 rounded-full flex items-center justify-center bg-[#091328]/90 backdrop-blur-md border border-white/10 text-white shadow-lg hover:brightness-125 transition-all"
        >
          <LocateFixed size={20} />
        </button>
      )}
    </div>
  );
}
