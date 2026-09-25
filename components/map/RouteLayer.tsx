"use client";

import { useMemo } from "react";
import { Source, Layer } from "react-map-gl/mapbox";
import buffer from "@turf/buffer";
import { lineString } from "@turf/helpers";
import { useNavigationStore } from "@/store/navigationStore";
import { useRouteProgress } from "@/hooks/useRouteProgress";

export function RouteLayer() {
  const { routeData, viewMode } = useNavigationStore();
  const isAR = viewMode === "ar-simulation";
  const isTurnByTurn = viewMode === "turn-by-turn";

  // Shared live progress: the walked part goes dim, the part ahead stays
  // bright — so the path visibly shrinks as you walk.
  const progress = useRouteProgress();

  // Live geometry: remaining path when we have a fix, else the full route.
  // Arrived (< 5 m left) → hide the remaining line entirely.
  const liveCoords = useMemo(() => {
    if (progress && progress.remainingDistanceM < 5) return null;
    return (
      (progress && progress.remainingCoords.length >= 2
        ? progress.remainingCoords
        : (routeData?.geometry.coordinates as [number, number][] | undefined)) ?? null
    );
  }, [progress, routeData]);

  const traveledCoords = useMemo(
    () => (progress && progress.traveledCoords.length >= 2 ? progress.traveledCoords : null),
    [progress]
  );

  // Buffer the *remaining* route LineString into a 2 m-wide polygon for AR mode.
  // Recomputed only when the live geometry changes.
  const arPathPolygon = useMemo(() => {
    if (!liveCoords || liveCoords.length < 2) return null;
    return buffer(lineString(liveCoords), 0.002, { units: "kilometers" });
  }, [liveCoords]);

  if (!routeData || !liveCoords) return null;

  const remainingFeature = {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "LineString" as const, coordinates: liveCoords },
  };

  const traveledFeature = traveledCoords
    ? {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "LineString" as const, coordinates: traveledCoords },
      }
    : null;

  return (
    <>
      {/* Flat line — visible in modes 1–3, hidden in AR (extrusion takes over) */}
      {!isAR && (
        <>
          {/* Walked part — dimmed so progress is visible */}
          {traveledFeature && (
            <Source id="route-traveled" type="geojson" data={traveledFeature}>
              <Layer
                id="route-traveled-line"
                type="line"
                layout={{ "line-join": "round", "line-cap": "round" }}
                paint={{
                  "line-color": "#85adff",
                  "line-width": isTurnByTurn ? 7 : 5,
                  "line-opacity": 0.25,
                }}
              />
            </Source>
          )}
          <Source id="route" type="geojson" data={remainingFeature}>
            {/* Outer glow */}
            <Layer
              id="route-shadow"
              type="line"
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{
                "line-color": "#85adff",
                "line-width": isTurnByTurn ? 18 : 10,
                "line-opacity": isTurnByTurn ? 0.35 : 0.25,
                "line-blur": isTurnByTurn ? 6 : 4,
              }}
            />
            {/* Main route line — remaining path */}
            <Layer
              id="route-line"
              type="line"
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{
                "line-color": isTurnByTurn ? "#6e9fff" : "#85adff",
                "line-width": isTurnByTurn ? 7 : 5,
                "line-opacity": 0.95,
              }}
            />
          </Source>
        </>
      )}

      {/* 3D pathway — AR mode only */}
      {isAR && arPathPolygon && (
        <Source id="ar-path" type="geojson" data={arPathPolygon}>
          {/* Subtle base glow at ground level */}
          <Layer
            id="ar-path-base"
            type="fill-extrusion"
            paint={{
              "fill-extrusion-color": "#5516be",
              "fill-extrusion-height": 0.05,
              "fill-extrusion-base": 0,
              "fill-extrusion-opacity": 0.5,
              "fill-extrusion-emissive-strength": 1.0,
            }}
          />
          {/* Main raised pathway */}
          <Layer
            id="ar-path-extrusion"
            type="fill-extrusion"
            paint={{
              "fill-extrusion-color": "#ac8aff",
              "fill-extrusion-height": 0.3,
              "fill-extrusion-base": 0.05,
              "fill-extrusion-opacity": 0.75,
              "fill-extrusion-emissive-strength": 1.0,
            }}
          />
        </Source>
      )}

      {/* Neon centerline glow — AR mode only, drawn on top of the extrusion.
          Two stacked line layers: wide blurred halo + narrow bright core. */}
      {isAR && (
        <Source id="ar-route-line" type="geojson" data={remainingFeature}>
          {/* Outer soft halo */}
          <Layer
            id="ar-neon-halo"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": "#ac8aff",
              "line-width": 14,
              "line-blur": 10,
              "line-opacity": 0.45,
            }}
          />
          {/* Inner bright core */}
          <Layer
            id="ar-neon-core"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": "#dee5ff",
              "line-width": 2,
              "line-blur": 0,
              "line-opacity": 0.9,
            }}
          />
        </Source>
      )}
    </>
  );
}
