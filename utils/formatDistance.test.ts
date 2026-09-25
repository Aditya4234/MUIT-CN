import { describe, it, expect } from "vitest";
import { formatDistance, formatDuration } from "@/utils/formatDistance";

describe("formatDistance", () => {
  it("formats sub-km distances in metres", () => {
    expect(formatDistance(850)).toBe("850m");
    expect(formatDistance(0)).toBe("0m");
  });

  it("formats km distances with one decimal", () => {
    expect(formatDistance(1500)).toBe("1.5 km");
    expect(formatDistance(1000)).toBe("1.0 km");
  });
});

describe("formatDuration", () => {
  it("rounds up to whole minutes", () => {
    expect(formatDuration(90)).toBe("2 min walk");
    expect(formatDuration(60)).toBe("1 min walk");
  });
});
