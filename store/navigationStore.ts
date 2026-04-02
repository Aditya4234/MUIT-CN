import { create } from "zustand";
import type { ViewMode, NavigationRoute, ManeuverStep } from "@/types";

interface NavigationState {
  selectedDestination: string | null;
  hoveredLocation: string | null;
  viewMode: ViewMode;
  routeData: NavigationRoute | null;
  navSteps: ManeuverStep[];
  isSidebarOpen: boolean; // Added
  selectDestination: (id: string) => void;
  setHoveredLocation: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setRouteData: (data: NavigationRoute) => void;
  setSidebarOpen: (open: boolean) => void; // Added
  clearNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  selectedDestination: null,
  hoveredLocation: null,
  viewMode: "2d-map",
  routeData: null,
  navSteps: [],
  isSidebarOpen: false, // Added

  selectDestination: (id) =>
    set({ selectedDestination: id, viewMode: "route-overview", isSidebarOpen: false }),

  setHoveredLocation: (id) => set({ hoveredLocation: id }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setRouteData: (data) =>
    set({ routeData: data, navSteps: data.steps }),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }), // Added

  clearNavigation: () =>
    set({
      selectedDestination: null,
      hoveredLocation: null,
      viewMode: "2d-map",
      routeData: null,
      navSteps: [],
      isSidebarOpen: false, // Added
    }),
}));
