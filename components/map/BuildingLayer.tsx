"use client";

import { Layer, Source } from "react-map-gl/mapbox";
import { useNavigationStore } from "@/store/navigationStore";

export function BuildingLayer() {
  const { viewMode } = useNavigationStore();
  const visible = viewMode === "turn-by-turn" || viewMode === "ar-simulation";

  if (!visible) return null;

  return (
    <Source id="composite" type="vector" url="mapbox://mapbox.mapbox-streets-v8">
      <Layer
        id="3d-buildings"
        source="composite"
        source-layer="building"
        type="fill-extrusion"
        minzoom={14}
        filter={["==", "extrude", "true"]}
        paint={{
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "height"],
            0, "#1a1a2e",
            20, "#16213e",
            50, "#0f3460",
            100, "#1a4a7a",
          ],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.85,
        }}
      />
    </Source>
  );
}
