import type { FogSpecification } from "mapbox-gl";

export const arFog: FogSpecification = {
  range: [1.5, 10], // fog only starts well away from camera; was [-1,2] which fogged immediately
  "horizon-blend": 0.06, // very subtle horizon haze to hide map edge; was 0.4
  color: "#0d1b2a", // dark blue-black near fog instead of white washout
  "high-color": "#1a3a5c",
  "space-color": "#000814",
  "star-intensity": 0.12,
};
