"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import { toast } from "sonner";
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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const STYLES = {
  street: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

export function CampusMap() {
  const mapRef = useRef<MapRef>(null);
  const arMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [isSatellite, setIsSatellite] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const {
    viewMode,
    navSteps,
    selectedDestination,
    routeData,
    selectDestination,
    setRouteData,
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

  // Mode 3: map is already rotated to firstStepBearing, so arrow = 0° (points forward/up).
  // Mode 4: arrow points toward destination relative to current camera bearing.
  const arrowBearing =
    viewMode === "ar-simulation"   ? destBearing - mapBearing :
    viewMode === "turn-by-turn"    ? 0 :
    0;

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

        const routeBearing = calculateBearing(
          COLLEGE_GATE.lat, COLLEGE_GATE.lng,
          dest.lat, dest.lng
        );

        map.fitBounds(
          [
            [Math.min(COLLEGE_GATE.lng, dest.lng), Math.min(COLLEGE_GATE.lat, dest.lat)],
            [Math.max(COLLEGE_GATE.lng, dest.lng), Math.max(COLLEGE_GATE.lat, dest.lat)],
          ],
          {
            padding: { top: 120, bottom: 220, left: 80, right: 80 },
            pitch: 45,
            bearing: routeBearing,
            duration: 1500,
          }
        );
      })
      .catch(() => toast.error("Could not load route. Check your Mapbox token."))
      .finally(() => setLoadingRoute(false));
  }, [selectedDestination]); // eslint-disable-line react-hooks/exhaustive-deps

  // AR markers — create on enter, remove on exit
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Remove existing markers
    arMarkersRef.current.forEach((m) => m.remove());
    arMarkersRef.current = [];

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
    if (!map || !routeData) return;

    const dest = CAMPUS_LOCATIONS.find((l) => l.id === selectedDestination);

    if (viewMode === "2d-map") {
      map.easeTo({ pitch: 0, bearing: 0, zoom: 15, duration: 1500 });
      try { map.setFog({}); } catch { /* ignore */ }
      try { map.setTerrain(null); } catch { /* ignore */ }
      map.dragPan.enable();
      map.scrollZoom.enable();
    } else if (viewMode === "route-overview" && dest) {
      const routeBearing = calculateBearing(
        COLLEGE_GATE.lat, COLLEGE_GATE.lng,
        dest.lat, dest.lng
      );
      try { map.setTerrain(null); } catch { /* ignore */ }
      try { map.setFog({}); } catch { /* ignore */ }
      map.fitBounds(
        [
          [Math.min(COLLEGE_GATE.lng, dest.lng), Math.min(COLLEGE_GATE.lat, dest.lat)],
          [Math.max(COLLEGE_GATE.lng, dest.lng), Math.max(COLLEGE_GATE.lat, dest.lat)],
        ],
        {
          padding: { top: 120, bottom: 220, left: 80, right: 80 },
          pitch: 45,
          bearing: routeBearing,
          duration: 1500,
        }
      );
      map.dragPan.enable();
      map.scrollZoom.enable();
    } else if (viewMode === "turn-by-turn") {
      const firstBearing = firstStepBearing;
      // Set terrain before camera animation so it doesn't interrupt easeTo
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", { type: "raster-dem", url: "mapbox://mapbox.mapbox-terrain-dem-v1", tileSize: 512, maxzoom: 14 });
      }
      try { map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 }); } catch { /* ignore */ }
      try { map.setFog({}); } catch { /* ignore */ }
      map.easeTo({
        pitch: 60,
        bearing: firstBearing,
        zoom: 18,
        center: [COLLEGE_GATE.lng, COLLEGE_GATE.lat],
        duration: 2000,
      });
      map.dragPan.enable();
      map.scrollZoom.enable();
      toast.info("Turn-by-turn navigation");
    } else if (viewMode === "ar-simulation") {
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
      toast.info("AR Simulation — look around to explore");
    }
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStyleToggle = useCallback(() => setIsSatellite((p) => !p), []);

  return (
    <div className="relative w-full h-screen">
      {loadingRoute && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Loading route…</span>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: 12.8725,
          longitude: 80.222,
          zoom: 15,
          pitch: 0,
          bearing: 0,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={isSatellite ? STYLES.satellite : STYLES.street}
      >
        <NavigationControl position="bottom-right" />
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
