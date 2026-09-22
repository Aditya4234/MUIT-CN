"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import { toast } from "sonner";
import { Menu } from "lucide-react";
import { CAMPUS_LOCATIONS, COLLEGE_GATE } from "@/constants/locations";
import { useNavigationStore } from "@/store/navigationStore";
import { getDirections } from "@/hooks/useDirections";
import { useARControls } from "@/hooks/useARControls";
import { calculateBearing, haversineDistance } from "@/utils/bearing";
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

function fitRouteBounds(map: mapboxgl.Map, dest: { lat: number; lng: number }) {
  const bearing = calculateBearing(COLLEGE_GATE.lat, COLLEGE_GATE.lng, dest.lat, dest.lng);
  map.fitBounds(
    [
      [Math.min(COLLEGE_GATE.lng, dest.lng), Math.min(COLLEGE_GATE.lat, dest.lat)],
      [Math.max(COLLEGE_GATE.lng, dest.lng), Math.max(COLLEGE_GATE.lat, dest.lat)],
    ],
    { padding: { top: 120, bottom: 220, left: 80, right: 80 }, pitch: 45, bearing, duration: 1500 }
  );
}

export function CampusMap() {
  const mapRef = useRef<MapRef>(null);
  const arMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const transitioningRef = useRef(false);  // guard against rapid mode switches
  const [isSatellite, setIsSatellite] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const {
    viewMode,
    navSteps,
    selectedDestination,
    routeData,
    selectDestination,
    setRouteData,
    setSidebarOpen,
  } = useNavigationStore();

  const firstStepBearing = navSteps[0]?.maneuver.bearing_after ?? 0;
  const isAR = viewMode === "ar-simulation";

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
    ? calculateBearing(COLLEGE_GATE.lat, COLLEGE_GATE.lng, dest.lat, dest.lng)
    : 0;

  // Mode 4: arrow points toward destination relative to current camera bearing.
  // Mode 3: map is rotated to firstStepBearing, so 0° points forward.
  const arrowBearing = viewMode === "ar-simulation" ? destBearing - mapBearing : 0;

  // 360° look-around for AR mode
  useARControls(mapRef, isAR);

  // Fetch route + transition to Mode 2 when destination changes
  useEffect(() => {
    if (!selectedDestination) return;
    const dest = CAMPUS_LOCATIONS.find((l) => l.id === selectedDestination);
    if (!dest) return;

    setLoadingRoute(true);
    getDirections(dest.lat, dest.lng)
      .then((route) => {
        setRouteData(route);
        toast.success(
          `Route to ${dest.label} · ${formatDistance(route.distance)} · ${formatDuration(route.duration)}`
        );

        const map = mapRef.current?.getMap();
        if (!map) return;

        fitRouteBounds(map, dest);
      })
      .catch(() => toast.error("Could not load route. Check your Mapbox token."))
      .finally(() => setLoadingRoute(false));
  }, [selectedDestination]); // eslint-disable-line react-hooks/exhaustive-deps

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
        COLLEGE_GATE.lat, COLLEGE_GATE.lng,
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
  }, [viewMode, selectedDestination]);

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

    const dest = CAMPUS_LOCATIONS.find((l) => l.id === selectedDestination);

    if (viewMode === "route-overview" && dest) {
      try { map.setTerrain(null); } catch { /* ignore */ }
      try { map.setFog({}); } catch { /* ignore */ }
      fitRouteBounds(map, dest);
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
        center: [COLLEGE_GATE.lng, COLLEGE_GATE.lat],
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
        center: [COLLEGE_GATE.lng, COLLEGE_GATE.lat],
        duration: 2500,
      });
      // After the zoom/pitch animation, snap the camera to true eye level (1.7 m).
      // setFreeCameraOptions is instantaneous — doing it inside moveend avoids a
      // jarring mid-animation jump.
      map.once("moveend", () => {
        const position = mapboxgl.MercatorCoordinate.fromLngLat(
          [COLLEGE_GATE.lng, COLLEGE_GATE.lat],
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
    </div>
  );
}
