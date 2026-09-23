export interface CampusLocation {
  id: string;
  label: string;
  lat: number;
  lng: number;
  color: string;
  icon: string;
  marked: boolean;
  searchTerms: readonly string[];
}

export type ViewMode = "2d-map" | "route-overview" | "turn-by-turn" | "ar-simulation";

export interface ManeuverStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
    bearing_after: number;
  };
  /** Step polyline as [lng, lat] pairs — used to auto-advance steps as you walk. */
  coordinates: [number, number][];
}

export interface NavigationRoute {
  geometry: GeoJSON.LineString;
  distance: number;
  duration: number;
  steps: ManeuverStep[];
}
