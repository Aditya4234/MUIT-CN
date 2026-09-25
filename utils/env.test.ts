import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { validateClientEnv } from "@/utils/env";

const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL };
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.unstubAllEnvs();
});

describe("validateClientEnv", () => {
  it("accepts a fully populated env", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test.test");
    expect(() => validateClientEnv()).not.toThrow();
  });

  it("throws a readable error when the Mapbox token is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test.test");
    expect(() => validateClientEnv()).toThrow(/NEXT_PUBLIC_MAPBOX_TOKEN/);
  });

  it("treats Sentry DSN as optional", () => {
    vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test.test");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    const env = validateClientEnv();
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBe("");
  });
});
