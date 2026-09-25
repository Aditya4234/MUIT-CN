import { describe, it, expect, beforeEach } from "vitest";
import { useNavigationStore } from "@/store/navigationStore";

beforeEach(() => {
  useNavigationStore.getState().clearNavigation();
});

describe("navigationStore", () => {
  it("starts in 2d-map idle state", () => {
    const s = useNavigationStore.getState();
    expect(s.viewMode).toBe("2d-map");
    expect(s.selectedDestination).toBeNull();
    expect(s.routeData).toBeNull();
  });

  it("selectDestination moves to route-overview", () => {
    useNavigationStore.getState().selectDestination("library");
    const s = useNavigationStore.getState();
    expect(s.selectedDestination).toBe("library");
    expect(s.viewMode).toBe("route-overview");
  });

  it("setRouteData stores steps and resets the step index", () => {
    const store = useNavigationStore.getState();
    store.setRouteData({
      geometry: {
        type: "LineString",
        coordinates: [
          [77.2, 28.6],
          [77.201, 28.6],
        ],
      },
      distance: 100,
      duration: 60,
      steps: [
        {
          instruction: "Head east",
          distance: 100,
          duration: 60,
          maneuver: { type: "depart", bearing_after: 90 },
          coordinates: [
            [77.2, 28.6],
            [77.201, 28.6],
          ],
        },
      ],
    });
    const s = useNavigationStore.getState();
    expect(s.navSteps).toHaveLength(1);
    expect(s.currentStepIndex).toBe(0);
  });

  it("clearNavigation resets to idle", () => {
    const store = useNavigationStore.getState();
    store.selectDestination("library");
    store.clearNavigation();
    const s = useNavigationStore.getState();
    expect(s.selectedDestination).toBeNull();
    expect(s.viewMode).toBe("2d-map");
    expect(s.navSteps).toHaveLength(0);
  });
});
