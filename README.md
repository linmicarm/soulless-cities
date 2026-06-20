# Non-Place Detector — An Intown Atlanta Field Guide

A map-based guide that ranks intown Atlanta neighborhoods by how *alive* they
feel, using the urbanist Marc Augé's idea of the **non-place**: a space built
for movement and transaction rather than belonging. Each of 29 destinations is
scored on five axes of "placeness," plotted on a MARTA-styled transit map, and
the interface itself drains from warm Atlanta color toward cold concrete grey as
a place slides toward non-place — the design enacts its own argument.

<img width="1893" height="938" alt="image" src="https://github.com/user-attachments/assets/218ea7db-7651-497a-860b-5c734f924a44" />

**Live:** `https://linmicarm.github.io/soulless-cities/`
**Stack:** Vanilla HTML / CSS / JavaScript (ES modules), Leaflet, OpenStreetMap Overpass API. No framework, no backend, no build step.

---

## What it does

- **Ranks 29 intown neighborhoods** on a 0–100 "Placeness Score" built from five
  weighted axes (Human Scale, Encounter, Friction, Uniqueness, Street Engagement).
- **Maps them** on a Leaflet map overlaid with the four MARTA rail lines and their
  intown stations, with markers colored by verdict band.
- **Shows the nearest MARTA station** and an approximate walk time for each place.
- **Filters** by side of town (Downtown / Midtown / Eastside / Westside) and by
  vibe (Living Place / Hybrid / Non-Place), and **sorts** by score, A–Z, or side.
- **Compares any two places** head-to-head across all five axes.
- **Pulls one live signal** from OpenStreetMap (count of nearby lingering
  amenities) to nudge the Encounter axis.
- **Shareable deep-links** (`?place=cabbagetown`) open straight to a place.
- A **spectrum bar** plots all 29 places at once, like a route diagram of aliveness.

---

## Architecture decisions

| Decision | Why |
| --- | --- |
| **Vanilla JS over React** | Portfolio already has several React + Vite projects; a clean vanilla build demonstrates DOM manipulation, state, and module structure that React abstracts away. The app's interactivity is bounded (select → score → render + one API call), so React would carry weight it didn't need. Bonus: sidesteps the GitHub Pages `basename`/`base` routing config entirely. |
| **ES modules, no bundler** | `data/`, `lib/`, and `main.js` stay cleanly separated and import each other directly via `<script type="module">`. Reads like structured engineering without a build step to maintain. |
| **Hybrid data model (authored core + one live signal)** | A recruiter clicking the link cold needs it to *always* work, so the backbone is hand-authored JSON. The live OSM layer is enhancement only. This also let the written analysis (the part that shows judgment) carry the project. |
| **Weighted score, not a flat average** | Augé's thesis is that belonging is what a non-place lacks, so Encounter + Uniqueness + Human Scale are weighted heavier than Friction + Street Engagement. The weights encode the argument instead of pretending all signals matter equally. Exposed and commented in `lib/scoring.js`. |
| **Live data confined to the Encounter axis** | OSM tags cafes, benches, parks, and markets densely and consistently, but does *not* reliably tag chains, building heights, or street widths. Live-sourcing the other four axes would mean fragile heuristics on sparse data, making the score *less* trustworthy. Knowing what the API can't cleanly return drove the scope. |
| **Leaflet + OSM/CARTO tiles** | Keyless and CORS-friendly, so the map "just runs" on GitHub Pages with no billing or referrer setup. A light CARTO basemap keeps the MARTA lines and markers legible on top. |
| **MARTA as the visual system** | MARTA is the literal infrastructure of "intown," which makes it the right organizing metaphor for a guide about intown places. The four line colors, the orange/yellow/blue brand blocks, and the station data all reinforce the concept rather than just decorating it. |
| **Draining aesthetic carries the thesis** | Living places render warm, tilted, and colorful; non-places desaturate to blue-grey, straighten, and flatten. The interface losing its Atlanta-ness as a place becomes "anywhere" is the core idea made visible. |

---

## Problems → Fix → Lesson

**Leaflet failure blanked the entire app.**
Fix: guarded `initMap()` so a missing `L` (CDN blocked, offline) renders a quiet
fallback note instead of throwing; guarded `syncMarkers()` and the `panTo` call
against a null map.
Lesson: an enhancement (the map) must never be load-bearing. The same
"degrade gracefully" rule the live API layer followed had to apply to the map too.

**Subresource Integrity hashes silently blocked Leaflet from loading.**
Fix: removed the `integrity` attributes from the Leaflet `<link>`/`<script>`.
Lesson: an SRI hash that doesn't byte-match what the CDN serves fails *silently* —
the browser just refuses the file with no obvious error. Only add SRI when you can
verify the exact hash for the exact served file.

**Map rendered grey because it sized before layout settled.**
Fix: `setTimeout(() => map.invalidateSize(), 200)` after init.
Lesson: Leaflet measures its container at init; inside a CSS grid that container
can still be 0-height for a frame. Force a resize recalculation once layout lands.

**A crowded "hybrid" middle made cards look samey.**
Fix: retuned band thresholds (67 / 42) for a more even spread.
Lesson: a detector where everything lands in one band is useless — but the middle
*should* stay the biggest bucket here, because most of intown genuinely is
in-between. Tune for legibility, not for a fake-even distribution.

**Yellow body washed out cream-tinted panels.**
Fix: switched panels to white and inactive chips to white once the body went MARTA
yellow.
Lesson: color tokens tuned against one background don't survive a background swap.
Re-check contrast every time the ground changes.

---

## What I learned

- **Scope a live API to what it can actually answer.** The single most important
  modeling decision was *not* using live data for four of five axes, because OSM
  can't cleanly support them. Restraint made the score more honest.
- **Graceful degradation is a feature, not a nicety.** Both the map and the live
  layer fail to a working core. That robustness is what lets the link be safely
  shared.
- **A weighted model is a thesis.** Choosing and documenting weights turned a
  scoring widget into an argument someone can read and disagree with.
- **An aesthetic can do conceptual work.** Tying the visual drain to the score
  made the design reinforce the idea instead of competing with it — and tying the
  whole palette to MARTA made "intown" literal.
- **Hand-writing the render layer** (no framework) clarified exactly what state the
  app holds and when the DOM needs to change.

---

## If I built it again

- **Externalize the scores to a JSON/CSV** and load them, so non-developers (or I)
  could tune the dataset without touching code, and so the model could eventually
  be community-sourced.
- **Add a small test suite** for `scoring.js` and `marta.js` (pure functions, easy
  to test) rather than relying on ad-hoc console checks.
- **Cache live Overpass results** to `sessionStorage` so re-selecting a place
  doesn't re-hit the API. (Left out here only because artifacts/Pages constraints
  made me wary of storage APIs; in a real deploy it's safe.)
- **Replace straight-line "nearest station" with real walking distance** via a
  routing API, and label it honestly either way.
- **Pull real MARTA GTFS data** for exact station coordinates and line geometry
  instead of hand-encoding the intown core.

---

## Running locally

ES modules require a server (opening `index.html` over `file://` won't work):

```bash
cd soulless-cities
python3 -m http.server 8000
# visit http://localhost:8000
```

## Project structure

```
soulless-cities/
├── index.html          # shell: masthead, spectrum, controls, map/list/detail, footer
├── styles.css          # MARTA color-block theme + the draining band system
├── main.js             # render + interaction: filters, map, list, detail, compare, deep-links
├── data/
│   ├── locations.js    # the 29 authored neighborhoods (scores, blurbs, signals, coords)
│   └── marta.js         # intown MARTA stations, line paths, nearest-station helper
└── lib/
    ├── scoring.js      # the weighted five-axis model + verdict bands (pure functions)
    └── overpass.js     # the one live signal: OSM lingering-amenity lookup for Encounter
```

---

## Credits & concept

Built around Marc Augé's *Non-Places: Introduction to an Anthropology of
Supermodernity* (1992) and Jan Gehl's studies of human-scale urban design. Map
tiles © OpenStreetMap contributors and © CARTO. MARTA rail data is approximate
and for orientation only. The scores are one person's reading of the city, meant
to be argued with.
