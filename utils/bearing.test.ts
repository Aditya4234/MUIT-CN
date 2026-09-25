import { describe, it, expect } from "vitest";
import { calculateBearing, haversineDistance } from "@/utils/bearing";

describe("calculateBearing", () => {
  it("returns 0° when heading due north", () => {
    expect(calculateBearing(0, 0, 1, 0)).toBeCloseTo(0, 0);
  });

  it("returns 90° when heading due east", () => {
    expect(calculateBearing(0, 0, 0, 1)).toBeCloseTo(90, 0);
  });

  it("returns 180° when heading due south", () => {
    expect(calculateBearing(1, 0, 0, 0)).toBeCloseTo(180, 0);
  });

  it("returns 270° when heading due west", () => {
    expect(calculateBearing(0, 1, 0, 0)).toBeCloseTo(270, 0);
  });

  it("always normalises into [0, 360)", () => {
    const b = calculateBearing(28.6, 77.2, 28.61, 77.21);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe("haversineDistance", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistance(28.6, 77.2, 28.6, 77.2)).toBeCloseTo(0, 6);
  });

  it("matches ~111 km per degree of latitude", () => {
    expect(haversineDistance(0, 0, 1, 0)).toBeCloseTo(111194, -2);
  });

  it("is symmetric", () => {
    const a = haversineDistance(28.6, 77.2, 28.61, 77.21);
    const b = haversineDistance(28.61, 77.21, 28.6, 77.2);
    expect(a).toBeCloseTo(b, 6);
  });
});
