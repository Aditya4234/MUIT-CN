"use client";

import { useMemo } from "react";
import { Source, Layer } from "react-map-gl/mapbox";
import buffer from "@turf/buffer";
import { lineString } from "@turf/helpers";
import { useNavigationStore } from "@/store/navigationStore";

export function RouteLayer() {
  const { routeData, viewMode } = useNavigationStore();
  const isAR = viewMode === "ar-simulation";

  // Buffer the route LineString into a 2 m-wide polygon for AR mode.
  // Computed once per route — not on every render.
  const arPathPolygon = useMemo(() => {
    if (!routeData) return null;
    const coords = routeData.geometry.coordinates as [number, number][];
    const line = lineString(coords);
    return buffer(line, 0.002, { units: "kilometers", joinStyle: "round" });
  }, [routeData]);

  if (!routeData) return null;

  return (
    <>
      {/* Flat line — visible in modes 1–3, hidden in AR (extrusion takes over) */}
      {!isAR && (
        <Source
          id="route"
          type="geojson"
          data={{
            type: "Feature",
            properties: {},
            geometry: routeData.geometry,
          }}
        >
          {/* Glow / shadow underneath */}
          <Layer
            id="route-shadow"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": "#4285F4",
              "line-width": 10,
              "line-opacity": 0.25,
              "line-blur": 4,
            }}
          />
          {/* Main route line */}
          <Layer
            id="route-line"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": "#4285F4",
              "line-width": 5,
              "line-opacity": 0.9,
            }}
          />
        </Source>
      )}

      {/* 3D pathway — AR mode only */}
      {isAR && arPathPolygon && (
        <Source id="ar-path" type="geojson" data={arPathPolygon}>
          {/* Subtle base glow at ground level */}
          <Layer
            id="ar-path-base"
            type="fill-extrusion"
            paint={{
              "fill-extrusion-color": "#1d4ed8",
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
              "fill-extrusion-color": "#3b82f6",
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
        <Source
          id="ar-route-line"
          type="geojson"
          data={{
            type: "Feature",
            properties: {},
            geometry: routeData.geometry,
          }}
        >
          {/* Outer soft halo */}
          <Layer
            id="ar-neon-halo"
            type="line"
            layout={{ "line-join": "round", "line-cap": "round" }}
            paint={{
              "line-color": "#3b82f6",
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
              "line-color": "#bfdbfe",
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
