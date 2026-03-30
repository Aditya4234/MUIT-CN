import { create } from "zustand";
import type { ViewMode, NavigationRoute, ManeuverStep } from "@/types";

interface NavigationState {
  selectedDestination: string | null;
  viewMode: ViewMode;
  routeData: NavigationRoute | null;
  navSteps: ManeuverStep[];
  selectDestination: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setRouteData: (data: NavigationRoute) => void;
  clearNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  selectedDestination: null,
  viewMode: "2d-map",
  routeData: null,
  navSteps: [],

  selectDestination: (id) =>
    set({ selectedDestination: id, viewMode: "route-overview" }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setRouteData: (data) =>
    set({ routeData: data, navSteps: data.steps }),

  clearNavigation: () =>
    set({
      selectedDestination: null,
      viewMode: "2d-map",
      routeData: null,
      navSteps: [],
    }),
}));
