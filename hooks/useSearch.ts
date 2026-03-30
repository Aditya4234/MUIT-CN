import { useMemo } from "react";
import { CAMPUS_LOCATIONS } from "@/constants/locations";
import type { CampusLocation } from "@/types";

export function useSearch(query: string): CampusLocation[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CAMPUS_LOCATIONS.filter((loc) => {
      if (loc.label.toLowerCase().includes(q)) return true;
      return loc.searchTerms.some((term) => term.toLowerCase().includes(q));
    }) as unknown as CampusLocation[];
  }, [query]);
}
