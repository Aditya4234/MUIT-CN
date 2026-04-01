In the turn-by-turn navigation mode (Mode 3), fix the following 3 UI issues. Do NOT touch any logic, routing, or non-Mode-3 UI components.

---

ISSUE 1 — Map has blank space on the right side
The map container is not stretching to full viewport width during navigation mode. Ensure the map fills 100% of the viewport width and height (width: 100vw, height: 100vh, no margins or offsets). Check if any parent container, sidebar, or panel is still reserving space on the right and remove it when Mode 3 is active.

---

ISSUE 2 — Top navigation panels are congested
The "Turn-by-turn navigation" info bar and the "Walk north / Then: Turn left" instruction card are stacked too closely and feel cramped. Fix:
- Add at least 8px gap between the two cards
- Reduce vertical padding inside each card slightly if needed
- Ensure both cards are horizontally centered, max-width ~420px, with clean drop shadows
- Do NOT change font sizes or colors, only spacing and layout

---

ISSUE 3 — Destination card icon looks generic
In the bottom destination card ("Administration Block"), replace the current generic building emoji/icon with a professional alternative:
- Preferred: Use a clean SVG icon or a Lucide icon (e.g., `<Building2>` from lucide-react) styled to match the card's color scheme
- If no icon library is available, remove the icon entirely and left-align the text cleanly
- Do NOT use emoji as a replacement

---

Constraints:
- Only modify Mode 3 / navigation mode components
- Do not change any colors, fonts, or map logic
- Test that the map still renders correctly after the container fix