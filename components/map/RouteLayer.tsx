"use client";

import { Source, Layer } from "react-map-gl/mapbox";
import { useNavigationStore } from "@/store/navigationStore";

export function RouteLayer() {
  const { routeData } = useNavigationStore();
  if (!routeData) return null;

  return (
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
  );
}
