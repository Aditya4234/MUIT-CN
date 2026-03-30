"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { SearchResults } from "./SearchResults";
import { useNavigationStore } from "@/store/navigationStore";
import { CAMPUS_LOCATIONS } from "@/constants/locations";
import type { CampusLocation } from "@/types";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const results = useSearch(query);
  const { selectDestination, clearNavigation, selectedDestination } = useNavigationStore();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(loc: CampusLocation) {
    setQuery(loc.label);
    setOpen(false);
    selectDestination(loc.id);
  }

  function handleClear() {
    setQuery("");
    setOpen(false);
    clearNavigation();
  }

  const selectedLoc = selectedDestination
    ? CAMPUS_LOCATIONS.find((l) => l.id === selectedDestination)
    : null;

  return (
    <div
      ref={containerRef}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
    >
      <div className="relative">
        <div className="flex items-center bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-gray-200 dark:border-zinc-700 px-4 py-3 gap-3">
          {selectedLoc ? (
            <span className="text-lg">{selectedLoc.icon}</span>
          ) : (
            <Search size={18} className="text-gray-400 flex-shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search campus locations..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
          />
          {(query || selectedDestination) && (
            <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
              <X size={16} />
            </button>
          )}
        </div>

        {open && query.length > 0 && (
          <SearchResults results={results} onSelect={handleSelect} />
        )}
      </div>
    </div>
  );
}
