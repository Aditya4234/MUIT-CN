import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "@/utils/logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("emits structured JSON lines", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("hello", { route: "library" });
    expect(spy).toHaveBeenCalledOnce();
    const line = String(spy.mock.calls[0][0]);
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe("info");
    expect(parsed.msg).toBe("hello");
    expect(parsed.route).toBe("library");
    expect(parsed.ts).toBeDefined();
  });

  it("routes errors to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.error("boom");
    expect(spy).toHaveBeenCalledOnce();
  });
});
