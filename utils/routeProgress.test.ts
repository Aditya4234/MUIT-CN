import { describe, it, expect } from "vitest";
import { computeRouteProgress, isOffRoute, currentStepIndex } from "@/utils/routeProgress";
import type { ManeuverStep } from "@/types";

// Straight route: 3 points along the equator (~111 m apart each)
const ROUTE: [number, number][] = [
  [77.2, 28.6],
  [77.201, 28.6],
  [77.202, 28.6],
];

const step = (coords: [number, number][]): ManeuverStep => ({
  instruction: "Head east",
  distance: 100,
  duration: 60,
  maneuver: { type: "depart", bearing_after: 90 },
  coordinates: coords,
});

describe("computeRouteProgress", () => {
  it("returns null for unusable routes", () => {
    expect(computeRouteProgress([], 28.6, 77.2)).toBeNull();
    expect(computeRouteProgress([[77.2, 28.6]], 28.6, 77.2)).toBeNull();
  });

  it("snaps a user standing on the route with ~0 distance", () => {
    const p = computeRouteProgress(ROUTE, 28.6, 77.2005);
    expect(p).not.toBeNull();
    expect(p!.distanceFromRouteM).toBeLessThan(5);
    expect(p!.progressRatio).toBeGreaterThan(0);
    expect(p!.progressRatio).toBeLessThan(1);
  });

  it("reports full remaining distance at the start", () => {
    const p = computeRouteProgress(ROUTE, 28.6, 77.2);
    expect(p).not.toBeNull();
    expect(p!.progressRatio).toBeCloseTo(0, 1);
    expect(p!.remainingCoords.length).toBeGreaterThanOrEqual(2);
  });
});

describe("isOffRoute", () => {
  it("flags users far from the route", () => {
    const p = computeRouteProgress(ROUTE, 28.61, 77.21);
    expect(isOffRoute(p)).toBe(true);
  });

  it("does not flag users on the route", () => {
    const p = computeRouteProgress(ROUTE, 28.6, 77.2005);
    expect(isOffRoute(p)).toBe(false);
  });

  it("handles null progress safely", () => {
    expect(isOffRoute(null)).toBe(false);
  });
});

describe("currentStepIndex", () => {
  const steps = [step([ROUTE[0], ROUTE[1]]), step([ROUTE[1], ROUTE[2]])];

  it("picks the closest step", () => {
    expect(currentStepIndex(steps, 28.6, 77.2002)).toBe(0);
    expect(currentStepIndex(steps, 28.6, 77.2018)).toBe(1);
  });

  it("returns -1 when far from every step", () => {
    expect(currentStepIndex(steps, 29.0, 78.0)).toBe(-1);
  });
});
