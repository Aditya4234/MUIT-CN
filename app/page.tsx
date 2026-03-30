import { CampusMap } from "@/components/map/CampusMap";
import { SearchBar } from "@/components/search/SearchBar";
import { NavigationInfoPanel } from "@/components/navigation/NavigationInfoPanel";
import { TurnByTurnOverlay } from "@/components/navigation/TurnByTurnOverlay";
import { ModeIndicator } from "@/components/ui/ModeIndicator";
import { ARHudOverlay } from "@/components/ar/ARHudOverlay";

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden relative">
      <CampusMap />
      <ARHudOverlay />
      <SearchBar />
      <ModeIndicator />
      <TurnByTurnOverlay />
      <NavigationInfoPanel />
    </main>
  );
}
