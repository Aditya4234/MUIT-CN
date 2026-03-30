import { CampusMap } from "@/components/map/CampusMap";
import { SearchBar } from "@/components/search/SearchBar";
import { NavigationInfoPanel } from "@/components/navigation/NavigationInfoPanel";

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden relative">
      <CampusMap />
      <SearchBar />
      <NavigationInfoPanel />
    </main>
  );
}
