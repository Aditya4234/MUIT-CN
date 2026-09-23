import { haversineDistance } from "./bearing";
import type { ManeuverStep } from "@/types";

export interface RouteProgress {
  /** Closest point on the route, as [lng, lat]. */
  nearest: [number, number];
  /** Perpendicular distance (metres) from user to route. */
  distanceFromRouteM: number;
  /** Route coords still ahead: [nearest, ...coords after it]. */
  remainingCoords: [number, number][];
  /** Coords already covered: [...coords before it, nearest]. */
  traveledCoords: [number, number][];
  /** Approx. metres left along the route. */
  remainingDistanceM: number;
  /** 0 (start) → 1 (arrived). */
  progressRatio: number;
}

type LngLat = [number, number];

const EARTH_M = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;

/** Equirectangular projection (metres) — plenty accurate at campus scale. */
function project(lat: number, lng: number, refLat: number): { x: number; y: number } {
  return {
    x: toRad(lng) * EARTH_M * Math.cos(toRad(refLat)),
    y: toRad(lat) * EARTH_M,
  };
}

/**
 * Snaps the user position onto the route polyline and splits it into
 * traveled / remaining parts. Returns null when the route is unusable.
 */
export function computeRouteProgress(
  routeCoords: LngLat[],
  userLat: number,
  userLng: number
): RouteProgress | null {
  if (!routeCoords || routeCoords.length < 2) return null;

  const ref = project(userLat, userLng, userLat);

  let bestDist = Infinity;
  let bestPoint: LngLat = routeCoords[0];
  let bestSegIdx = 0;

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const p0 = routeCoords[i];
    const p1 = routeCoords[i + 1];
    const q0 = project(p0[1], p0[0], userLat);
    const q1 = project(p1[1], p1[0], userLat);
    const vx = q0.x - ref.x;
    const vy = q0.y - ref.y;
    const wx = q1.x - ref.x;
    const wy = q1.y - ref.y;

    const dx = wx - vx;
    const dy = wy - vy;
    const lenSq = dx * dx + dy * dy;

    // Segment projection factor, clamped to the segment
    let t = 0;
    if (lenSq > 0) t = Math.min(1, Math.max(0, -(vx * dx + vy * dy) / lenSq));

    const cx = vx + t * dx;
    const cy = vy + t * dy;
    const dist = Math.sqrt(cx * cx + cy * cy);

    if (dist < bestDist) {
      bestDist = dist;
      bestSegIdx = i;
      bestPoint = [p0[0] + t * (p1[0] - p0[0]), p0[1] + t * (p1[1] - p0[1])];
    }
  }

  const remainingCoords: LngLat[] = [bestPoint, ...routeCoords.slice(bestSegIdx + 1)];
  const traveledCoords: LngLat[] = [...routeCoords.slice(0, bestSegIdx + 1), bestPoint];

  const segLen = (p: LngLat, q: LngLat) =>
    haversineDistance(p[1], p[0], q[1], q[0]);

  let remainingDistanceM = 0;
  for (let i = 0; i < remainingCoords.length - 1; i++) {
    remainingDistanceM += segLen(remainingCoords[i], remainingCoords[i + 1]);
  }
  let totalM = remainingDistanceM;
  for (let i = 0; i < traveledCoords.length - 1; i++) {
    totalM += segLen(traveledCoords[i], traveledCoords[i + 1]);
  }

  return {
    nearest: bestPoint,
    distanceFromRouteM: bestDist,
    remainingCoords: remainingCoords.length >= 2 ? remainingCoords : [],
    traveledCoords: traveledCoords.length >= 2 ? traveledCoords : [],
    remainingDistanceM,
    progressRatio: totalM > 0 ? Math.min(1, Math.max(0, 1 - remainingDistanceM / totalM)) : 0,
  };
}

/** True when the user has wandered off the planned path. */
export function isOffRoute(progress: RouteProgress | null, thresholdM = 35): boolean {
  return progress != null && progress.distanceFromRouteM > thresholdM;
}

/** Min distance (metres) from a point to a polyline. */
function distanceToPolyline(
  coords: [number, number][],
  userLat: number,
  userLng: number
): number {
  if (coords.length === 0) return Infinity;
  if (coords.length === 1) {
    return haversineDistance(userLat, userLng, coords[0][1], coords[0][0]);
  }
  const ref = project(userLat, userLng, userLat);
  let best = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const q0 = project(coords[i][1], coords[i][0], userLat);
    const q1 = project(coords[i + 1][1], coords[i + 1][0], userLat);
    const vx = q0.x - ref.x;
    const vy = q0.y - ref.y;
    const dx = q1.x - q0.x;
    const dy = q1.y - q0.y;
    const lenSq = dx * dx + dy * dy;
    let t = 0;
    if (lenSq > 0) t = Math.min(1, Math.max(0, -(vx * dx + vy * dy) / lenSq));
    const cx = vx + t * dx;
    const cy = vy + t * dy;
    const d = Math.sqrt(cx * cx + cy * cy);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Which navigation step the user is currently on — the closest step whose
 * geometry is within snap range. Like real maps: steps advance automatically
 * as you walk and never jump back on GPS wobble (caller keeps the max).
 */
export function currentStepIndex(
  steps: ManeuverStep[],
  userLat: number,
  userLng: number,
  snapM = 40
): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < steps.length; i++) {
    const coords = steps[i].coordinates;
    if (!coords || coords.length === 0) continue;
    const d = distanceToPolyline(coords, userLat, userLng);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  // Too far from every step (e.g. off-route) → don't advance blindly
  if (bestDist > snapM) return -1;
  return bestIdx;
}
