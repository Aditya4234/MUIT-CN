export const COLLEGE_GATE = {
  id: "gate",
  label: "College Gate",
  lat: 12.872848666834663,
  lng: 80.22596731088542,
  type: "user_location" as const,
  color: "#3b82f6",
};

export const CAMPUS_LOCATIONS = [
  {
    id: "admin",
    label: "Administration Block",
    lat: 12.873295385872186,
    lng: 80.22168752570319,
    color: "#3b82f6",
    icon: "🏛️",
    searchTerms: ["admin", "administration", "office", "block"],
  },
  {
    id: "library",
    label: "Library",
    lat: 12.873387474047385,
    lng: 80.21920382817343, // ⚠️ VERIFIED: 80.xxx NOT 0.xxx
    color: "#8b5cf6",
    icon: "📚",
    searchTerms: ["library", "books", "study", "reading"],
  },
  {
    id: "basketball",
    label: "Basketball Courts",
    lat: 12.871519179799405,
    lng: 80.22023647077431,
    color: "#f59e0b",
    icon: "🏀",
    searchTerms: ["basketball", "courts", "sports", "ground"],
  },
  {
    id: "canteen",
    label: "Canteen",
    lat: 12.872644437281318,
    lng: 80.21958245523395,
    color: "#22c55e",
    icon: "🍽️",
    searchTerms: ["canteen", "food", "cafeteria", "mess"],
  },
] as const;
