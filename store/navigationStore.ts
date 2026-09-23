import { create } from "zustand";
import type { ViewMode, NavigationRoute, ManeuverStep } from "@/types";

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export type LocationStatus = "idle" | "locating" | "tracking" | "denied" | "unavailable";

/** Where the current userLocation came from. */
export type LocationSource = "gps" | "ip" | null;

export interface IpInfo {
  city: string | null;
  region: string | null;
  country: string | null;
  isp: string | null;
  distanceFromCampusKm: number | null;
}

interface NavigationState {
  selectedDestination: string | null;
  hoveredLocation: string | null;
  viewMode: ViewMode;
  routeData: NavigationRoute | null;
  navSteps: ManeuverStep[];
  isSidebarOpen: boolean;
  userLocation: UserLocation | null;
  locationStatus: LocationStatus;
  locationSource: LocationSource;
  ipInfo: IpInfo | null;
  isFollowingUser: boolean;
  /** Index of the active turn-by-turn step — advances automatically as you walk. */
  currentStepIndex: number;
  selectDestination: (id: string) => void;
  setHoveredLocation: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setRouteData: (data: NavigationRoute) => void;
  setSidebarOpen: (open: boolean) => void;
  setUserLocation: (loc: UserLocation, source?: LocationSource) => void;
  setLocationStatus: (status: LocationStatus) => void;
  setIpInfo: (info: IpInfo | null) => void;
  setFollowingUser: (following: boolean) => void;
  setCurrentStepIndex: (index: number) => void;
  clearNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  selectedDestination: null,
  hoveredLocation: null,
  viewMode: "2d-map",
  routeData: null,
  navSteps: [],
  isSidebarOpen: false,
  userLocation: null,
  locationStatus: "idle",
  locationSource: null,
  ipInfo: null,
  isFollowingUser: true,
  currentStepIndex: 0,

  selectDestination: (id) =>
    set({ selectedDestination: id, viewMode: "route-overview", isSidebarOpen: false }),

  setHoveredLocation: (id) =>
    set((state) => state.hoveredLocation === id ? state : { hoveredLocation: id }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setRouteData: (data) =>
    set({ routeData: data, navSteps: data.steps, currentStepIndex: 0 }),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  setUserLocation: (loc, source = "gps") =>
    set({ userLocation: loc, locationStatus: "tracking", locationSource: source }),

  setLocationStatus: (status) => set({ locationStatus: status }),

  setIpInfo: (info) => set({ ipInfo: info }),

  setFollowingUser: (following) => set({ isFollowingUser: following }),

  setCurrentStepIndex: (index) =>
    set((state) => (state.currentStepIndex === index ? state : { currentStepIndex: index })),

  clearNavigation: () =>
    set({
      selectedDestination: null,
      hoveredLocation: null,
      viewMode: "2d-map",
      routeData: null,
      navSteps: [],
      currentStepIndex: 0,
      isSidebarOpen: false,
    }),
}));
