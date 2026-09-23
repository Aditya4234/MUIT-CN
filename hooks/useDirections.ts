import type { NavigationRoute, ManeuverStep } from "@/types";
import { COLLEGE_GATE } from "@/constants/locations";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export async function getDirections(
  destLat: number,
  destLng: number,
  origin?: { lat: number; lng: number }
): Promise<NavigationRoute> {
  const from = origin ?? COLLEGE_GATE;
  // Directions API uses lng,lat order
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/` +
    `${from.lng},${from.lat};${destLng},${destLat}` +
    `?geometries=geojson&steps=true&overview=full&access_token=${TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Directions API error: ${res.status}`);

  const data = await res.json();
  const route = data.routes[0];
  const leg = route.legs[0];

  const steps: ManeuverStep[] = leg.steps.map((s: {
    maneuver: { instruction: string; type: string; modifier?: string; bearing_after: number };
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }) => ({
    instruction: s.maneuver.instruction,
    distance: s.distance,
    duration: s.duration,
    maneuver: {
      type: s.maneuver.type,
      modifier: s.maneuver.modifier,
      bearing_after: s.maneuver.bearing_after,
    },
    coordinates: s.geometry?.coordinates ?? [],
  }));

  return {
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
    steps,
  };
}
