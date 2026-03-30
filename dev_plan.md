# AR/VR Campus Navigation System — Development Plan V4 (Final)
### Claude Code Edition · Four-Mode Mapbox-Native Architecture · Zero External 3D Engines

---

## Table of Contents

1. [Project Description](#1-project-description)
2. [Campus Coordinates & Map Reference](#2-campus-coordinates--map-reference)
3. [Four View Modes — The Core Architecture](#3-four-view-modes--the-core-architecture)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture](#5-system-architecture)
6. [Feature Breakdown](#6-feature-breakdown)
7. [Project File Structure](#7-project-file-structure)
8. [Claude Code Setup — Before You Write a Single Line](#8-claude-code-setup--before-you-write-a-single-line)
9. [CLAUDE.md — The Project Brain](#9-claudemd--the-project-brain)
10. [Phase-by-Phase Build Guide (With Claude Code Prompts)](#10-phase-by-phase-build-guide-with-claude-code-prompts)
11. [Claude Code Workflow Patterns](#11-claude-code-workflow-patterns)
12. [Environment & Configuration](#12-environment--configuration)
13. [Deployment to Vercel — A to Z](#13-deployment-to-vercel--a-to-z)
14. [Portfolio Presentation Strategy](#14-portfolio-presentation-strategy)
15. [POC Scope Boundaries](#15-poc-scope-boundaries)
16. [Timeline Estimate](#16-timeline-estimate)

---

## 1. Project Description

### Overview

The **AR/VR Campus Navigation System** is a real-time, map-driven web application that replicates the core experience of a published research paper on augmented reality campus navigation. The original system was built as a confidential university in-house project using Flutter and Mapbox API. This web-based POC faithfully recreates the navigation experience — from a flat 2D map to a mission-control route overview to Google Maps-style turn-by-turn navigation to an immersive AR simulation — entirely within a single Mapbox GL JS instance, with no native app installation, no WebXR, and no external 3D engines.

The key architectural insight: all four view modes are progressive camera transformations within one Mapbox GL JS map. The pitch gradually increases from 0° (flat) to 45° (overview) to 60° (navigation) to 85° (AR simulation). The 3D buildings, fog, sky, and terrain are all native Mapbox features. The AR wayfinding arrows are CSS-transformed HTML markers floating in the 3D space. There is no engine swap, no canvas replacement, no separate rendering context. The user watches a single map transform from a flat utility view to an immersive street-level AR experience.

### The Problem It Solves

Navigating a large, unfamiliar college campus is a real friction point for new students, visitors, and staff. This system provides a purpose-built campus navigation tool with real verified coordinates, real walking routes, and an AR-enhanced directional experience that shows the user exactly where to go.

### Why a POC?

The original system was developed as a **university confidential in-house project**. The source code is not accessible. Since the research paper is published, this POC exists to **demonstrate the concept, UX, and technical architecture** to recruiters. All data uses real but non-sensitive campus coordinates. The four-mode navigation flow faithfully mirrors the real system's behaviour.

### Core Concept: Static Live Location

The **College Gate** is the user's static live location — the fixed origin point. In the real Flutter system, this was live GPS. In this POC, it is anchored at the gate coordinates and does not move. All navigation flows begin here.

- **Mode 1 (2D Map):** Pulsing blue dot
- **Mode 2 (Route Overview):** Pulsing blue dot with route line
- **Mode 3 (Turn-by-Turn):** Directional arrow (CSS, rotated to bearing)
- **Mode 4 (AR Simulation):** Directional arrow at eye level with holographic AR markers

---

## 2. Campus Coordinates & Map Reference

Exact, verified coordinates. Do not modify without re-verifying on satellite imagery.

### Live Location — College Gate (Static Origin)

| Field        | Value                        |
|--------------|------------------------------|
| Label        | College Gate (Your Location) |
| Latitude     | `12.872848666834663`         |
| Longitude    | `80.22596731088542`          |

### Navigation Destination Nodes

| # | Label                | Latitude                  | Longitude                 | Colour Code    |
|---|----------------------|---------------------------|---------------------------|----------------|
| 1 | Administration Block | `12.873295385872186`      | `80.22168752570319`       | `#3b82f6` Blue |
| 2 | Library              | `12.873387474047385`      | `80.21920382817343`       | `#8b5cf6` Purple |
| 3 | Basketball Courts    | `12.871519179799405`      | `80.22023647077431`       | `#f59e0b` Amber |
| 4 | Canteen              | `12.872644437281318`      | `80.21958245523395`       | `#22c55e` Green |

> ⚠️ **CRITICAL BUG:** Library longitude must be `80.21920382817343`. A known copy error drops the `80.` prefix, placing the marker in the Gulf of Guinea. Verify before every commit.

### JavaScript Constants — Single Source of Truth

```typescript
// constants/locations.ts

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
];
```

---

## 3. Four View Modes — The Core Architecture

All four modes live inside a single Mapbox GL JS `Map` instance. Each mode is a camera + layer configuration change — no engine swaps, no canvas replacements. The progression is a continuous tilt from flat to immersive.

### Mode 1: 2D Map (Idle State)

**Pitch: 0° · Bearing: 0° (north-up) · Zoom: 15**

The default state when the app loads. A clean, flat, utilitarian map focused on legibility and broad geographic context. Identical to opening Google Maps for the first time.

- North-up orientation, flat perspective
- Mapbox Standard style (or dark-v11)
- Gate rendered as pulsing blue dot
- 4 destination markers with colour-coded pins
- Search bar visible at top
- No route, no 3D, no fog

**Triggered by:** App load, or clearing navigation.

### Mode 2: Route Overview (Mission Control)

**Pitch: 45° · Bearing: calculated to orient route forward · Zoom: auto (fitBounds)**

When the user selects a destination, the camera tilts to 45° and frames the entire route from gate to destination. The moderate pitch gives depth — buildings begin to show volume, the route has visual weight. The bearing is calculated so the route runs "upward" on screen (gate at bottom, destination at top), giving directional intuition.

- Camera uses `fitBounds([gateCoords, destCoords], { padding: 100, pitch: 45, bearing: routeBearing })`
- Mapbox Directions API walking route rendered as blue animated polyline
- Route info panel slides up: destination name, distance, walk time
- Two action buttons appear: **"Start Navigation"** and **"AR View"**
- Buildings start to show 3D presence at 45° pitch

**Triggered by:** Selecting a destination from search bar or tapping a marker.

### Mode 3: Turn-by-Turn Navigation (Driver's Eye)

**Pitch: 60° · Bearing: aligned to route heading · Zoom: 18**

The camera descends into a driver's/walker's eye perspective. 3D building extrusions provide depth and spatial context. The pulsing gate dot transforms into a directional arrow aligned to the route. Turn-by-turn instructions appear at the top of the screen, extracted from the Directions API response.

- Camera transition via `easeTo({ pitch: 60, bearing: firstStepBearing, zoom: 18, center: gateCoords, duration: 2000 })`
- Gate marker: pulsing dot → CSS directional arrow rotated to `bearing_after`
- 3D buildings activate (Mapbox Standard's built-in 3D, or manual `fill-extrusion` layer)
- Turn instruction overlay at top: maneuver icon + instruction text + distance to next turn
- Navigation info bar at bottom: total distance, time, destination
- **"Exit Navigation"** button reverses camera to Mode 2

**Triggered by:** Clicking "Start Navigation" button.

**Why 60° pitch:** Industry standard for navigation apps. At 60° you see enough road ahead for the next turn while buildings have enough vertical presence for depth. Lower (45°) still feels like a map. Higher (70°+) loses route preview. Google Maps navigation uses approximately 60°.

### Mode 4: AR Simulation (Street-Level Immersive)

**Pitch: 85° (Mapbox maximum) · Bearing: mouse/device-driven · Zoom: 20+**

The standout mode. The camera pushes to near-horizontal, placing the user's "eyes" at street level inside Mapbox's 3D digital twin of the campus. A sky/atmosphere layer with dense fog hides the horizon line, transforming the flat map into an immersive "world." The camera center is locked to the gate — the user cannot pan. Instead, mouse movement (desktop) or device orientation (mobile) is mapped to `map.setBearing()`, enabling a **360° panoramic look-around** from the static gate position.

AR navigation elements are rendered as **CSS-transformed HTML markers** floating at eye level (offset upward from ground), styled with holographic effects (glow, transparency, subtle pulse). These act as wayfinding arrows pointing toward the destination — exactly what you'd see through a phone camera in a real AR navigation app.

**Camera:**
```javascript
map.easeTo({
  pitch: 85,
  zoom: 20,
  center: [COLLEGE_GATE.lng, COLLEGE_GATE.lat],
  duration: 2500
});
```

**Fog (hides horizon, creates "world" feel):**
```javascript
map.setFog({
  'range': [-1, 2],
  'horizon-blend': 0.4,
  'color': '#e0e8f0',
  'high-color': '#a0c4e8',
  'space-color': '#d0e4f5',
  'star-intensity': 0
});
```

**360° Look-Around (mouse):**
```javascript
map.getCanvas().addEventListener('mousemove', (e) => {
  const bearing = ((e.clientX / window.innerWidth) - 0.5) * 360;
  map.setBearing(bearing);
});
```

**360° Look-Around (mobile device orientation):**
```javascript
window.addEventListener('deviceorientation', (e) => {
  if (e.alpha !== null) map.setBearing(e.alpha);
});
```

**Lock panning:**
```javascript
map.dragPan.disable();
map.scrollZoom.disable(); // optional: lock zoom too
```

**AR floating arrows (CSS HTML Markers):**
```javascript
const arrowEl = document.createElement('div');
arrowEl.className = 'ar-nav-arrow';
arrowEl.innerHTML = `
  <div class="ar-arrow-icon">➤</div>
  <div class="ar-arrow-label">Library</div>
  <div class="ar-arrow-distance">450m</div>
`;

new mapboxgl.Marker({ element: arrowEl, anchor: 'center' })
  .setLngLat([dest.lng, dest.lat])
  .setOffset([0, -60]) // float above ground
  .addTo(map);
```

**AR CSS styling (holographic effect):**
```css
.ar-nav-arrow {
  background: rgba(59, 130, 246, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(59, 130, 246, 0.5);
  border-radius: 12px;
  padding: 12px 20px;
  color: white;
  text-align: center;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1);
  animation: ar-pulse 2s ease-in-out infinite;
}

@keyframes ar-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
}
```

**What the user experiences:** Standing at the gate, surrounded by 3D campus buildings, looking around freely. A glowing holographic arrow floats in the distance pointing toward the Library. The fog creates atmosphere. The buildings provide depth. It feels like AR — but it's pure Mapbox.

**Triggered by:** Clicking "AR View" button. **"Exit AR"** button restores Mode 2.

---

## 4. Tech Stack

| Layer            | Technology                              | Why                                                    |
|------------------|-----------------------------------------|--------------------------------------------------------|
| Framework        | **Next.js 14** (App Router)             | Vercel-native deployment, file-based routing           |
| Language         | **TypeScript**                          | Type safety for coordinates, route data, state         |
| Styling          | **Tailwind CSS**                        | Rapid UI, dark mode, responsive                        |
| Map Engine       | **Mapbox GL JS v3** (`mapbox-gl`)       | ALL rendering — 2D, 3D buildings, fog, sky, camera, markers, route lines, AR simulation |
| React Map Wrapper| **react-map-gl**                        | React integration for Mapbox GL JS                     |
| State Management | **Zustand**                             | Lightweight global state for navigation                |
| Animation        | **Framer Motion**                       | UI panel transitions (not map transitions — Mapbox handles those) |
| Notifications    | **Sonner**                              | Toast alerts                                           |
| Icons            | **Lucide React**                        | Clean icon set                                         |
| Fonts            | **Geist** (Next.js default)             | Portfolio-ready                                        |
| Deployment       | **Vercel**                              | Zero-config CI/CD from GitHub                          |

### What Is NOT in the Stack

| Removed                  | Why                                                                    |
|--------------------------|------------------------------------------------------------------------|
| React Three Fiber        | AR mode is Mapbox-native. No separate 3D canvas needed.                |
| @react-three/drei        | No Three.js scene components needed.                                   |
| three (Three.js)         | Not required. Mapbox's WebGL handles all 3D rendering.                 |
| AR.js / A-Frame          | No WebXR. AR simulation uses Mapbox pitch 85° + fog + CSS markers.     |

**The entire project runs on a single rendering engine: Mapbox GL JS.** This means one WebGL context, one coordinate system, one set of APIs, and no inter-engine synchronisation issues.

---

## 5. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                  SINGLE MAPBOX GL JS INSTANCE                    │
│                  (one map, four camera states)                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    SEARCH BAR                            │    │
│  │    [Search campus locations...    🔍]                    │    │
│  └──────────────────────┬───────────────────────────────────┘    │
│                         │ selects destination                    │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              VIEW MODE STATE MACHINE                     │    │
│  │                                                          │    │
│  │  MODE 1         MODE 2          MODE 3        MODE 4     │    │
│  │  2D Map    →  Route Overview → Turn-by-Turn → AR Sim     │    │
│  │  pitch 0°     pitch 45°       pitch 60°      pitch 85°   │    │
│  │  bearing 0°   bearing: route  bearing: step  bearing: ↻  │    │
│  │  zoom 15      zoom: fitBounds zoom 18        zoom 20+    │    │
│  │  flat map     tilted + route  3D + arrow     fog + AR    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   MAP LAYERS                             │    │
│  │  • Base tiles (Standard or dark-v11)                     │    │
│  │  • Route polyline (GeoJSON Source + Line Layer)          │    │
│  │  • 3D buildings (fill-extrusion / Standard built-in)     │    │
│  │  • Fog + sky (setFog API)                                │    │
│  │  • HTML Markers (gate dot/arrow + destination pins)      │    │
│  │  • AR CSS Markers (holographic arrows, Mode 4 only)      │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   ZUSTAND STORE                          │    │
│  │  selectedDestination · viewMode · routeData · navSteps   │    │
│  └──────────────────────┬───────────────────────────────────┘    │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐    │
│  │               MAPBOX API CALLS                           │    │
│  │  Map Tiles · Directions API · Satellite · Geocoding      │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Navigation Data Flow

```
App Load → MODE 1 (2D flat map, pitch 0°, gate pulsing)
    │
    ├── User selects destination (search bar / marker tap)
    │       │
    │       ▼
    │   Directions API → route + steps
    │       │
    │       ▼
    │   MODE 2 (Route Overview, pitch 45°, route line, fitBounds)
    │       │
    │       ├── [Start Navigation] → MODE 3 (pitch 60°, arrow, 3D buildings, turn instructions)
    │       │       │
    │       │       └── [Exit Navigation] → MODE 2
    │       │
    │       └── [AR View] → MODE 4 (pitch 85°, fog, 360° look-around, AR markers)
    │               │
    │               └── [Exit AR] → MODE 2
    │
    └── [Clear / New Search] → MODE 1
```

---

## 6. Feature Breakdown

### F1 — Search Bar & Destination Selection
- Google Maps-style fixed search bar at top (z-50)
- Autocomplete dropdown with 4 campus destinations
- Fuzzy search matching against `searchTerms` array
- Map marker tap also selects destination
- Clear button resets to Mode 1

### F2 — Mode 1: 2D Map (Idle)
- Mapbox GL JS full-viewport map, pitch 0°, north-up
- Mapbox Standard style (built-in 3D buildings, lighting presets) or dark-v11
- Gate: pulsing blue CSS dot at gate coordinates
- Destinations: 4 colour-coded markers with popups (name + distance from gate)
- Satellite/Street toggle (Standard ↔ Standard Satellite)

### F3 — Mode 2: Route Overview (Mission Control)
- Mapbox Directions API walking route as blue animated `line` layer
- `fitBounds` with pitch 45° and calculated bearing (route runs "upward")
- Route info panel (bottom): destination name + icon, distance, walk time
- Two action buttons: **"Start Navigation"** (blue) + **"AR View"** (gradient)
- Camera transition via `easeTo()` with duration

### F4 — Mode 3: Turn-by-Turn Navigation (Driver's Eye)
- Camera: `easeTo({ pitch: 60, bearing: firstStepBearing, zoom: 18, duration: 2000 })`
- Gate marker transforms: pulsing dot → CSS directional arrow (rotated SVG)
- 3D building extrusion visible (Standard's built-in or manual `fill-extrusion`)
- Turn instruction overlay (top): maneuver icon + instruction + distance
- Navigation info bar (bottom): total distance, time, destination
- **"Exit Navigation"** → `easeTo` back to Mode 2 camera

### F5 — Mode 4: AR Simulation (Street-Level Immersive)
- Camera: `easeTo({ pitch: 85, zoom: 20, center: gate, duration: 2500 })`
- `map.setFog()` with dense horizon-blend to hide map edge
- `map.dragPan.disable()` — lock position, user can only look around
- `setBearing()` driven by mouse movement (desktop) or DeviceOrientation (mobile)
- AR markers: CSS-transformed HTML Mapbox Markers with holographic styling
  - Floating directional arrow + destination label + distance
  - Semi-transparent, glowing, pulsing animation
  - Offset upward from ground to float at eye level
- AR HUD overlay: corner brackets, "AR Navigation" badge, compass indicator
- **"Exit AR"** → re-enable dragPan, `easeTo` back to Mode 2, remove fog, remove AR markers

### F6 — Map Style Controls
- Satellite/Street toggle (top-right)
- Mapbox Standard `lightPreset` options (day/dusk/dawn/night) — optional enhancement
- Dark mode: Tailwind `dark:` classes on all UI panels

### F7 — Mobile Responsive
- Search bar: full width on mobile
- Info panel: bottom sheet with rounded top corners
- Action buttons: full width stacked on mobile
- AR mode: touch-based bearing (swipe left/right to look around)
- Mode 4 device orientation support (tilt phone to look around)

---

## 7. Project File Structure

```
campus-navigation-poc/
├── CLAUDE.md                              ← Claude Code project brain
├── public/
│   └── assets/
│       └── arrow.svg                      ← Directional arrow for navigation mode
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                     ← Root layout, fonts, metadata, Sonner provider
│   │   ├── page.tsx                       ← Main page (single page app — map + all modes)
│   │   └── globals.css                    ← Tailwind base + pulse + AR holographic styles
│   │
│   ├── components/
│   │   ├── search/
│   │   │   ├── SearchBar.tsx              ← Google Maps-style search with autocomplete
│   │   │   └── SearchResults.tsx          ← Dropdown with campus location matches
│   │   │
│   │   ├── map/
│   │   │   ├── CampusMap.tsx              ← Mapbox GL JS wrapper — ALL modes live here
│   │   │   ├── UserLocationMarker.tsx     ← Pulsing blue dot (Mode 1-2) / arrow (Mode 3-4)
│   │   │   ├── DestinationPin.tsx         ← Colour-coded campus location markers + popups
│   │   │   ├── RouteLayer.tsx             ← Directions API route polyline (GeoJSON + Line Layer)
│   │   │   ├── BuildingLayer.tsx          ← 3D fill-extrusion for buildings (Mode 3-4)
│   │   │   └── MapStyleToggle.tsx         ← Satellite / Street toggle
│   │   │
│   │   ├── navigation/
│   │   │   ├── NavigationControls.tsx     ← "Start Navigation" + "AR View" buttons
│   │   │   ├── TurnByTurnOverlay.tsx      ← Turn instruction banner at top
│   │   │   ├── NavigationInfoPanel.tsx    ← Bottom panel: distance, time, destination
│   │   │   └── RouteSteps.tsx             ← List of maneuver steps
│   │   │
│   │   ├── ar/
│   │   │   ├── ARMarker.tsx              ← Holographic CSS arrow marker for AR mode
│   │   │   ├── ARHudOverlay.tsx          ← Corner brackets, AR badge, compass
│   │   │   └── ARControls.tsx            ← 360° look-around logic (mouse + device orientation)
│   │   │
│   │   └── ui/
│   │       ├── ModeIndicator.tsx          ← Current mode badge
│   │       ├── LoadingOverlay.tsx         ← Spinner while Directions API loads
│   │       └── Toast.tsx                  ← Sonner wrapper
│   │
│   ├── constants/
│   │   └── locations.ts                   ← ALL coordinates (single source of truth)
│   │
│   ├── store/
│   │   └── navigationStore.ts             ← Zustand: destination, viewMode, routeData, navSteps
│   │
│   ├── hooks/
│   │   ├── useDirections.ts               ← Mapbox Directions API call + response parsing
│   │   ├── useViewMode.ts                 ← Camera transitions between modes
│   │   └── useSearch.ts                   ← Search filtering + fuzzy match
│   │
│   ├── utils/
│   │   ├── bearing.ts                     ← Compass bearing between two coordinates
│   │   ├── formatDistance.ts              ← "450m" / "1.2 km" / "6 min walk"
│   │   └── fogConfig.ts                   ← Fog presets for each mode
│   │
│   └── types/
│       └── index.ts                       ← TypeScript interfaces
│
├── .env.local                             ← NEXT_PUBLIC_MAPBOX_TOKEN
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 8. Claude Code Setup — Before You Write a Single Line

### Step 1: Install Claude Code(Already done- skip this step)

```bash
node --version          # need 18+
npm install -g @anthropic-ai/claude-code
claude --version
```

### Step 2: Authenticate(Already done-skip this step)

```bash
# Pro/Max subscription → browser auth
claude
# Or API key
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### Step 3: Scaffold the Project (Already done- check again)

```bash
npx create-next-app@latest campus-navigation-poc \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd campus-navigation-poc

# Core dependencies — note: NO Three.js, NO React Three Fiber
npm install mapbox-gl react-map-gl zustand framer-motion lucide-react sonner

# Dev dependencies
npm install -D @types/mapbox-gl

# Verify
npm run dev
```

### Step 4: Git + GitHub(Already done, can check for verification)

```bash
git init
git add .
git commit -m "init: project scaffold"
gh repo create campus-navigation-poc --public --push --source .
```

### Step 5: Initialize Claude Code

```bash
cd campus-navigation-poc
claude
/init
```

Then **replace** the generated CLAUDE.md with the one in Section 9.

### Step 6: VS Code Workflow

- **Terminal 1:** `npm run dev` (always running)
- **Terminal 2:** `claude` (your agentic assistant)

Claude Code reads and writes files directly. Changes appear in VS Code in real time.

---

## 9. CLAUDE.md — The Project Brain

Copy this file to your project root. Claude Code reads it at the start of every session.

```markdown
# Campus Navigation POC

Web-based AR/VR campus navigation system. Next.js 14 + TypeScript + Mapbox GL JS. Portfolio POC showcasing a published research paper. ALL rendering happens inside a single Mapbox GL JS instance — no external 3D engines.

## Commands

- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Production build
- `npm run lint` — ESLint check

## Architecture

- `/src/app/page.tsx` — Single page app, all modes on one page
- `/src/components/map/` — Mapbox GL JS map, markers, route layer, buildings
- `/src/components/navigation/` — Turn-by-turn UI overlays
- `/src/components/ar/` — AR simulation markers, HUD overlay, 360° controls
- `/src/components/search/` — Search bar and autocomplete
- `/src/components/ui/` — Shared UI components
- `/src/constants/locations.ts` — Single source of truth for ALL coordinates
- `/src/store/navigationStore.ts` — Zustand store
- `/src/hooks/` — useDirections, useViewMode, useSearch
- `/src/utils/` — bearing calc, formatters, fog presets

## Critical Rules

- ALL coordinates come from `constants/locations.ts` — never hardcode lat/lng
- Library longitude is `80.21920382817343` — NOT `0.219...`
- Every component using browser APIs MUST have `"use client"` directive
- Mapbox token: `process.env.NEXT_PUBLIC_MAPBOX_TOKEN` — never hardcode
- Directions API coordinate order: `longitude,latitude` (lng first, lat second)
- URL: `https://api.mapbox.com/directions/v5/mapbox/walking/{lng1},{lat1};{lng2},{lat2}?geometries=geojson&steps=true&access_token={token}`
- NO Three.js, NO React Three Fiber, NO AR.js — everything is Mapbox GL JS native
- AR markers are CSS-styled HTML elements passed to `new mapboxgl.Marker({ element })`

## Four View Modes (State Machine)

Zustand `viewMode` controls all camera and layer state:
1. `"2d-map"` — pitch 0°, bearing 0°, zoom 15, no route, no 3D
2. `"route-overview"` — pitch 45°, bearing calculated, zoom fitBounds, blue route line
3. `"turn-by-turn"` — pitch 60°, bearing from route step, zoom 18, 3D buildings, arrow, turn instructions
4. `"ar-simulation"` — pitch 85°, bearing from mouse/device, zoom 20+, fog, AR markers, drag disabled

Transitions:
- App load → 2d-map
- Select destination → route-overview
- [Start Navigation] → turn-by-turn → [Exit] → route-overview
- [AR View] → ar-simulation → [Exit AR] → route-overview
- [Clear] → 2d-map

## Camera Config Per Mode

| Mode            | Pitch | Bearing          | Zoom      | Fog  | 3D Buildings | AR Markers |
|-----------------|-------|------------------|-----------|------|--------------|------------|
| 2d-map          | 0°    | 0° (north)       | 15        | Off  | Off          | Off        |
| route-overview  | 45°   | Route direction  | fitBounds | Off  | Subtle       | Off        |
| turn-by-turn    | 60°   | Step bearing     | 18        | Off  | On           | Off        |
| ar-simulation   | 85°   | Mouse/device     | 20+       | On   | On           | On         |

## Fog Config (AR Mode Only)

```js
map.setFog({
  'range': [-1, 2],
  'horizon-blend': 0.4,
  'color': '#e0e8f0',
  'high-color': '#a0c4e8',
  'space-color': '#d0e4f5',
  'star-intensity': 0
});
```

## Colour Codes

- Gate / User location: `#3b82f6` (blue)
- Admin Block: `#3b82f6` (blue)
- Library: `#8b5cf6` (purple)
- Basketball Courts: `#f59e0b` (amber)
- Canteen: `#22c55e` (green)
- Route polyline: `#4285F4` (Google Maps blue)

## Conventions

- Named exports (except page.tsx default)
- Tailwind for styling — no separate CSS files except globals.css for keyframes
- Framer Motion for UI panel transitions only (NOT map camera — Mapbox handles that)
- Sonner for toasts
- All TypeScript, no `any`, interfaces in `types/index.ts`
- Use `react-map-gl` wrapper components (Map, Marker, Source, Layer)
- Map camera transitions use Mapbox `easeTo()` — not Framer Motion

## When Compacting

Preserve: the four view modes with pitch values, coordinate values, Directions API URL format, fog config, and current phase being worked on.
```

---

## 10. Phase-by-Phase Build Guide (With Claude Code Prompts)

---

### Phase 1 — Project Setup + Mapbox Map + Markers (Day 1)

**Duration with Claude Code: ~2–3 hours**

**Manual prep:**
```bash
echo "NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoixxxxxxxxx" > .env.local
echo "NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token_here" > .env.example
```

**Claude Code Prompt 1 — Constants + Types + Config:**

```
Create three files:

1. src/constants/locations.ts — Export COLLEGE_GATE and CAMPUS_LOCATIONS with all coordinates and searchTerms as specified in CLAUDE.md. Include TypeScript "as const" assertions where appropriate.

2. src/types/index.ts — Define interfaces:
   - CampusLocation (id, label, lat, lng, color, icon, searchTerms)
   - ViewMode = "2d-map" | "route-overview" | "turn-by-turn" | "ar-simulation"
   - NavigationRoute (geometry: GeoJSON.LineString, distance: number, duration: number, steps: ManeuverStep[])
   - ManeuverStep (instruction: string, distance: number, duration: number, maneuver: { type: string, modifier?: string, bearing_after: number })

3. next.config.js — Add webpack alias for mapbox-gl to suppress SSR warnings:
   config.resolve.alias["mapbox-gl"] = "mapbox-gl/dist/mapbox-gl.js"
```

**Claude Code Prompt 2 — Base Map + Markers:**

```
Build the Mapbox map foundation for Mode 1 (2D flat map):

1. src/components/map/CampusMap.tsx — "use client". react-map-gl Map component. Token from env. Initial view: lat 12.8725, lng 80.2220, zoom 15, pitch 0, bearing 0. Style "mapbox://styles/mapbox/dark-v11". Full viewport height. Include NavigationControl bottom-right. Accept a mapRef via useRef so other components can call map methods.

2. src/components/map/UserLocationMarker.tsx — Mapbox Marker at COLLEGE_GATE coordinates. Renders a custom HTML div: 18px blue (#3b82f6) circle, 3px white border, border-radius 50%, with CSS pulsing box-shadow animation. The component should accept a `mode` prop — when mode is "turn-by-turn" or "ar-simulation", render a directional arrow SVG instead of the pulsing dot. The arrow should accept a `bearing` prop for rotation via CSS transform.

3. src/components/map/DestinationPin.tsx — Reusable marker for each CampusLocation. Colour-coded pin with emoji icon. On click, shows a Popup with location name, coordinates, and distance from gate (calculate using Haversine).

4. src/components/map/MapStyleToggle.tsx — Toggle button (top-right, z-40) switching between "mapbox://styles/mapbox/dark-v11" and "mapbox://styles/mapbox/satellite-streets-v12". Use Lucide Map and Globe icons.

5. Add pulsing CSS keyframe animation to globals.css.

6. Update src/app/page.tsx to render CampusMap with all markers and style toggle.

All 5 points (gate + 4 destinations) must be visible. Gate must pulse continuously.
```

**Checkpoint:** `npm run dev` → map loads, gate pulses, 4 pins visible, satellite toggle works.

```bash
git add . && git commit -m "feat: mapbox map with markers, pulsing gate, satellite toggle"
```

---

### Phase 2 — Search + Directions API + Route Overview Mode (Day 2)

**Duration with Claude Code: ~2–3 hours**

**Claude Code Prompt 3 — Zustand Store:**

```
Create src/store/navigationStore.ts — Zustand store:

State:
- selectedDestination: string | null (location id)
- viewMode: "2d-map" | "route-overview" | "turn-by-turn" | "ar-simulation"
- routeData: NavigationRoute | null
- navSteps: ManeuverStep[]

Actions:
- selectDestination(id: string) — sets destination and viewMode to "route-overview"
- setViewMode(mode: ViewMode)
- setRouteData(data: NavigationRoute) — sets routeData, extracts navSteps from data.steps
- clearNavigation() — resets all to initial state (destination null, viewMode "2d-map", routeData null, navSteps empty)

Use types from types/index.ts.
```

**Claude Code Prompt 4 — Directions + Search + Route Layer:**

```
Build the search and route system:

1. src/hooks/useDirections.ts — async function getDirections(destLat, destLng) that calls Mapbox Directions API. CRITICAL: URL uses lng,lat order. Returns NavigationRoute with geometry, distance, duration, and parsed steps. Parse steps from route.legs[0].steps.

2. src/utils/formatDistance.ts — formatDistance(meters): returns "450m" or "1.2 km". formatDuration(seconds): returns "6 min walk".

3. src/utils/bearing.ts — calculateBearing(lat1, lng1, lat2, lng2): returns compass bearing in degrees using Haversine formula. Also calculateRouteBearing(gateCoords, destCoords) for the overall route direction.

4. src/hooks/useSearch.ts — takes query string, filters CAMPUS_LOCATIONS by matching label and searchTerms. Case-insensitive. Returns matches.

5. src/components/search/SearchBar.tsx — Fixed at top (z-50). Google Maps style: rounded input, Lucide Search icon left, clear button right. On focus shows SearchResults. On selecting result: calls selectDestination from Zustand.

6. src/components/search/SearchResults.tsx — Dropdown below search bar. Each result: emoji, name, colour dot. Click selects.

7. src/components/map/RouteLayer.tsx — When routeData exists in store, render route as react-map-gl Source (GeoJSON) + Layer (line type). Color "#4285F4", width 6, opacity 0.85, round join/cap.

8. src/components/navigation/NavigationInfoPanel.tsx — Bottom panel (Framer Motion slide up) when destination selected. Shows: destination icon + name, formatted distance, walk time. Colour-coded left border. Two buttons: "Start Navigation" (blue) and "AR View" (purple gradient).

9. src/components/navigation/NavigationControls.tsx — The two action buttons. "Start Navigation" sets viewMode to "turn-by-turn". "AR View" sets viewMode to "ar-simulation". Only visible when routeData exists.

10. Update CampusMap.tsx — When selectedDestination changes: call getDirections(), setRouteData(), then transition camera to Mode 2: fitBounds([gateCoords, destCoords]) with padding 100, pitch 45, bearing from calculateRouteBearing. Also: clicking a DestinationPin selects that destination.

The flow: search or click marker → Directions API → route draws → camera tilts to 45° → info panel slides up → buttons appear.
```

**Checkpoint:** Search "library" → route draws, camera tilts to 45°, info panel shows distance/time.

```bash
git add . && git commit -m "feat: search, directions API, route overview mode (pitch 45°)"
```

---

### Phase 3 — Turn-by-Turn Navigation Mode (Day 3)

**Duration with Claude Code: ~2–3 hours**

**Claude Code Prompt 5 — Mode 3 Implementation:**

```
Build turn-by-turn navigation mode. When viewMode changes to "turn-by-turn":

1. src/hooks/useViewMode.ts — Hook that watches viewMode in Zustand and applies camera transitions via mapRef:
   - "2d-map": easeTo pitch 0, bearing 0, zoom 15, duration 1500
   - "route-overview": fitBounds with pitch 45, bearing from route, duration 1500
   - "turn-by-turn": easeTo pitch 60, bearing from first navStep bearing_after, zoom 18, center on gate, duration 2000
   - "ar-simulation": easeTo pitch 85, zoom 20, center on gate, duration 2500

2. Update UserLocationMarker.tsx — Already built with mode prop. Now ensure: in "turn-by-turn" mode, render SVG arrow instead of dot. Arrow is a triangle/chevron shape, blue fill, white border, drop shadow. Rotated via CSS transform to match first step's bearing_after.

3. src/components/map/BuildingLayer.tsx — Mapbox fill-extrusion layer using "building" source-layer from "composite" source. fill-extrusion-color #aaa, height from feature "height" property, base from "min_height", opacity 0.6. Only render when viewMode is "turn-by-turn" or "ar-simulation".

4. src/components/navigation/TurnByTurnOverlay.tsx — Fixed banner at top (z-40, below search bar). Shows: maneuver icon (Lucide ArrowUp, CornerUpLeft, CornerUpRight based on maneuver type/modifier), instruction text from first step, distance to next turn. Styled: dark semi-transparent bg, white text, icon left. Only visible in "turn-by-turn" mode.

5. Update NavigationInfoPanel.tsx — In "turn-by-turn" mode, replace the two action buttons with a single "Exit Navigation" button that sets viewMode back to "route-overview".

6. Wire useViewMode hook into CampusMap.tsx to handle all camera transitions.

Camera swoop from 45° to 60° should feel cinematic. This is the hero demo moment.
```

**Checkpoint:** "Start Navigation" → camera swoops to 60°, arrow points toward destination, 3D buildings visible, turn instruction at top.

```bash
git add . && git commit -m "feat: turn-by-turn mode (pitch 60°, 3D buildings, arrow, instructions)"
```

---

### Phase 4 — AR Simulation Mode (Day 4)

**Duration with Claude Code: ~3–4 hours**

**Claude Code Prompt 6 — Mode 4 Implementation:**

```
Build the AR simulation mode. This is the standout feature. When viewMode changes to "ar-simulation":

1. src/utils/fogConfig.ts — Export fog presets:
   - arFog: { range: [-1, 2], 'horizon-blend': 0.4, color: '#e0e8f0', 'high-color': '#a0c4e8', 'space-color': '#d0e4f5', 'star-intensity': 0 }
   - clearFog: null (used to remove fog)

2. src/components/ar/ARControls.tsx — "use client". Logic for 360° look-around:
   - Accepts mapRef
   - On mount in ar-simulation mode:
     a) Disable map.dragPan
     b) Add mousemove listener to map canvas: bearing = ((e.clientX / window.innerWidth) - 0.5) * 360, call map.setBearing(bearing)
     c) Add DeviceOrientationEvent listener for mobile: map.setBearing(e.alpha)
   - On cleanup/exit: re-enable dragPan, remove listeners
   - Export as hook: useARControls(mapRef, isActive)

3. src/components/ar/ARMarker.tsx — Creates a Mapbox Marker with custom HTML element for AR holographic arrow:
   - Accepts: destination CampusLocation, distance number
   - Creates a div with class "ar-nav-arrow"
   - Content: directional arrow icon (➤ or SVG), destination label, formatted distance
   - setOffset([0, -60]) to float above ground level
   - Returns Mapbox Marker instance (caller adds to map and removes on mode exit)

4. Add AR holographic CSS to globals.css:
   - .ar-nav-arrow: semi-transparent blue background (rgba(59,130,246,0.15)), backdrop-filter blur(8px), 1px solid rgba border, rounded corners, white text, glowing box-shadow, ar-pulse animation
   - .ar-arrow-icon: large font size, directional arrow character or SVG
   - @keyframes ar-pulse: alternating box-shadow intensity

5. src/components/ar/ARHudOverlay.tsx — HTML overlay (NOT Mapbox layer) positioned over the map:
   - Four corner bracket elements (CSS borders) like a camera viewfinder
   - "AR Navigation" badge at top center
   - Destination name + distance at bottom
   - Optional: subtle horizontal scan line animation (CSS)
   - Only visible when viewMode is "ar-simulation"

6. Update useViewMode.ts — When entering ar-simulation:
   a) easeTo pitch 85, zoom 20, center gate, duration 2500
   b) Apply arFog via map.setFog()
   c) Create AR markers for selected destination (and optionally all 4 destinations)
   When exiting ar-simulation:
   a) Remove fog via map.setFog(null) or map.setFog({})
   b) Remove AR markers from map
   c) Re-enable dragPan
   d) easeTo back to route-overview camera

7. Update NavigationInfoPanel.tsx — In ar-simulation mode, show "Exit AR" button that sets viewMode to "route-overview".

8. Update page.tsx — Render ARHudOverlay conditionally when viewMode is "ar-simulation".

The experience: user clicks "AR View" → camera swoops to 85° → fog envelops the horizon → buildings tower around them → they move mouse/phone to look around → glowing AR arrows float toward the Library. It should feel like AR without being AR.
```

**Checkpoint:** "AR View" → pitch 85°, fog hides horizon, mouse controls bearing, holographic arrow points toward destination, HUD overlay visible.

```bash
git add . && git commit -m "feat: AR simulation mode (pitch 85°, fog, 360° look-around, holographic markers)"
```

---

### Phase 5 — Polish + Responsive + QA (Day 5)

**Duration with Claude Code: ~2 hours**

**Claude Code Prompt 7 — Final Polish:**

```
Final polish pass:

1. src/components/ui/ModeIndicator.tsx — Badge showing current mode: "2D Map" / "Route Overview" / "Navigating" / "AR Simulation" with appropriate icon. Position top-left below search bar.

2. Add Sonner toasts:
   - Destination selected: "Route to {name} loaded · {distance}"
   - Navigation started: "Turn-by-turn navigation"
   - AR mode: "AR Simulation — look around to explore"
   - Provider in layout.tsx

3. src/components/ui/LoadingOverlay.tsx — Spinner while Directions API loads.

4. Mobile responsive:
   - SearchBar: full width, smaller padding on mobile
   - NavigationInfoPanel: bottom sheet style (rounded top, drag handle)
   - Buttons: full width stacked on mobile
   - AR mode mouse → touch: track touch position for bearing on mobile
   - AR HUD: scale corner brackets for smaller screens

5. Dark mode: verify all panels work with Tailwind dark: classes.

6. Framer Motion: slide-up for info panel, fade for mode indicator, fade for AR HUD.

7. Edge cases:
   - No destination → hide action buttons and info panel
   - Directions API failure → toast error, keep map functional
   - Clear search → full reset to Mode 1
   - Rapid mode switching → debounce easeTo calls

8. Run npm run build — fix all TypeScript errors.
```

```bash
git add . && git commit -m "feat: polish, responsive, dark mode, transitions, edge cases"
```

---

### Phase 6 — Deploy + README + Demo Video (Day 5–6)

**Duration: ~2 hours**

**Claude Code Prompt 8 — README:**

```
Create README.md:

1. Title: "AR/VR Campus Navigation System — POC"
2. Subtitle: "Web-based proof-of-concept · Published Research Paper Demo"
3. Live Demo + Demo Video link placeholders
4. "What It Does" — explain four view modes with pitch values
5. "Architecture" — single Mapbox GL JS instance, no external 3D engines
6. Tech Stack table
7. "Research Paper" link placeholder
8. "Confidentiality Note" — POC of university in-house Flutter project
9. "How to Run Locally" — clone, install, env, dev
10. Screenshot placeholders for each mode
```

**Deploy:**
```bash
npm install -g vercel
vercel login
vercel
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN
vercel --prod
```

---

## 11. Claude Code Workflow Patterns

### Session Management
```bash
claude                    # Start session
/compact Preserve four view modes and current phase
/clear                    # Fresh start between phases
/btw What's Mapbox maxPitch?   # Quick question, no context pollution
```

### Debugging
```bash
claude "npm run build has TypeScript errors. Fix all of them."
claude "The route line isn't showing. Check RouteLayer.tsx and verify the GeoJSON source format."
claude "AR mode fog isn't hiding the horizon. Check the setFog config values."
```

### Git
```bash
claude "Review all changes and commit with a conventional commit message."
claude "Show which components exist vs what's in the CLAUDE.md file structure."
```

### Prompt Tips
1. Reference modes by name: "2d-map", "route-overview", "turn-by-turn", "ar-simulation"
2. Reference coordinates via `constants/locations.ts` — never paste raw values
3. For AR mode, prompt one piece at a time: fog first, then bearing control, then markers, then HUD
4. Let Claude fix its own work: "Run npm run build and fix all errors"
5. Use `/compact` between phases to keep context fresh

---

## 12. Environment & Configuration

### .env.local
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoixxxxxx...
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "mapbox-gl": "mapbox-gl/dist/mapbox-gl.js",
    };
    return config;
  },
};
module.exports = nextConfig;
```

### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        campus: {
          admin: "#3b82f6",
          library: "#8b5cf6",
          basketball: "#f59e0b",
          canteen: "#22c55e",
          gate: "#3b82f6",
          route: "#4285F4",
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## 13. Deployment to Vercel — A to Z

### CLI Deploy
```bash
npm install -g vercel
vercel login
vercel                                    # Preview
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN   # Set token
vercel --prod                             # Production
```

### GitHub Auto CI/CD
Push to GitHub → Import to Vercel → Add env var → Every `git push` auto-deploys.

### Post-Deploy Checklist
- [ ] Map loads (no console token errors)
- [ ] All 5 markers at correct positions (check Library longitude!)
- [ ] Gate pulses blue
- [ ] Search autocomplete works
- [ ] Route draws on destination select (Mode 2, pitch 45°)
- [ ] "Start Navigation" → pitch 60°, arrow, 3D buildings, turn instructions (Mode 3)
- [ ] "Exit Navigation" → returns to Mode 2
- [ ] "AR View" → pitch 85°, fog, 360° look-around, holographic markers (Mode 4)
- [ ] AR mouse look-around works (desktop)
- [ ] "Exit AR" → returns to Mode 2, fog clears
- [ ] Satellite/Street toggle works across all modes
- [ ] Mobile layout correct
- [ ] Dark mode renders properly

### Mapbox Token Security
Dashboard → Access Tokens → Edit → Add URL restrictions:
- `https://your-app.vercel.app`
- `http://localhost:3000`

---

## 14. Portfolio Presentation Strategy

### What to Highlight

- **Published research paper demo** — working proof of published academic work
- **Four-mode progressive architecture** — 0° → 45° → 60° → 85° pitch progression in a single Mapbox instance
- **AR without AR** — 85° pitch + fog + setBearing + CSS markers = AR experience with zero WebXR dependencies. Works everywhere.
- **Single rendering engine** — no Three.js, no canvas swaps. All four modes in one Mapbox GL JS map. That's an architectural decision worth explaining.
- **Mapbox GL JS mastery** — Directions API, fill-extrusion, setFog, setBearing, easeTo, fitBounds, satellite tiles, custom HTML markers
- **Real coordinates, real routes** — verified on satellite imagery, real Directions API walking paths
- **Smart engineering tradeoff** — chose reliability over complexity. No broken AR demos.

### Demo Script (60 seconds)

1. Open live URL → flat dark map, gate pulsing blue **(Mode 1)**
2. Search "Library" → camera tilts to 45°, blue route draws **(Mode 2)**
3. "Real Mapbox Directions API walking route — not a straight line"
4. Click "Start Navigation" → camera swoops to 60°, 3D buildings rise, arrow appears **(Mode 3)**
5. "Turn-by-turn instructions, directional arrow — Google Maps navigation"
6. Click "AR View" → camera pushes to 85°, fog rolls in, buildings tower around **(Mode 4)**
7. Move mouse → camera rotates 360° → holographic arrow points toward Library
8. "This is AR simulation using Mapbox's 3D digital twin. No WebXR, no camera, works in any browser"
9. Back to map → toggle satellite → real campus aerial imagery
10. "Published research paper. Confidential Flutter original. Public web POC. Four view modes in one map."

---

## 15. POC Scope Boundaries

| Feature                              | POC (This Repo)                          | Real System (Flutter)    |
|--------------------------------------|------------------------------------------|--------------------------|
| Campus map with real coordinates     | ✅ Mapbox GL JS                          | ✅ Mapbox Flutter        |
| Search bar destination selection     | ✅ 4 locations                           | ✅ Full campus           |
| Walking route (Directions API)       | ✅ Real routes                           | ✅ Real routes           |
| 2D map view                         | ✅ pitch 0°                              | ✅ Yes                   |
| Route overview with tilt            | ✅ pitch 45°                             | ✅ Yes                   |
| Turn-by-turn navigation view        | ✅ pitch 60°, static at gate             | ✅ pitch 60°, live GPS   |
| 3D building extrusion               | ✅ fill-extrusion                        | ✅ Yes                   |
| Turn-by-turn instructions           | ✅ From Directions API steps             | ✅ Yes                   |
| Directional arrow                   | ✅ CSS, static bearing                   | ✅ Live compass          |
| AR navigation simulation            | ✅ pitch 85°, fog, CSS holographic markers | ✅ Live camera + ARCore |
| 360° look-around                    | ✅ setBearing via mouse/device           | ✅ Live device sensors   |
| Satellite / Street toggle           | ✅ Yes                                   | ✅ Yes                   |
| Live GPS tracking                   | ❌ Static at gate                        | ✅ Real-time             |
| Real camera AR overlay              | ❌ Mapbox 3D digital twin                | ✅ ARCore/ARKit          |
| User authentication                 | ❌ Not needed                            | ✅ Yes                   |

---

## 16. Timeline Estimate

| Phase | Task                                                        | With Claude Code |
|-------|-------------------------------------------------------------|------------------|
| Setup | Scaffold + deps + CLAUDE.md + Git + Vercel                  | 1 hr             |
| 1     | Mapbox map + markers + satellite toggle (Mode 1)            | 2–3 hrs          |
| 2     | Search + Directions API + Route Overview (Mode 2)           | 2–3 hrs          |
| 3     | Turn-by-Turn navigation (Mode 3)                            | 2–3 hrs          |
| 4     | AR Simulation — fog, 360°, holographic markers (Mode 4)     | 3–4 hrs          |
| 5     | Polish, responsive, dark mode, QA                           | 2 hrs            |
| 6     | Deploy + README + demo video                                | 1–2 hrs          |
| **Total** |                                                         | **~13–18 hrs**   |

**Recommended pace:** 2 focused sessions per day → **done in 3–4 days**

---

## Pre-Build Checklist

- [ ] Node.js 18+ installed
- [ ] Claude Code installed and authenticated
- [ ] Mapbox account created + public token ready
- [ ] GitHub repo created
- [ ] Next.js project scaffolded (NO Three.js, NO React Three Fiber in dependencies)
- [ ] `.env.local` has `NEXT_PUBLIC_MAPBOX_TOKEN`
- [ ] `npm run dev` works
- [ ] CLAUDE.md from Section 9 copied to project root
- [ ] VS Code open: Terminal 1 = `npm run dev`, Terminal 2 = `claude`
- [ ] Mapbox token URL restrictions set (Vercel domain + localhost)

---

*Document Version: 4.0 (Final — Four-Mode Mapbox-Native Architecture) · March 2026 · Status: Pre-Build*
