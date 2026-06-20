// ---------------------------------------------------------------------------
// overpass.js
//
// The ONE live signal in the app. Everything else is hand-authored; this layer
// asks OpenStreetMap "how many lingering amenities are within ~400m of this
// point?" and uses the answer to nudge the Encounter axis up or down.
//
// WHY ONLY ENCOUNTER, AND WHY OSM:
//   We picked this pairing deliberately. OSM tags cafes, benches, parks, and
//   restaurants densely and consistently — they're exactly the "invitations to
//   linger" the Encounter axis is about. OSM does NOT reliably tag whether a
//   business is a chain, or building heights, or street widths, so trying to
//   live-source the other four axes would mean building fragile heuristics on
//   sparse data and making the score *less* trustworthy. Knowing what an API
//   can and can't cleanly return — before designing the feature around it — is
//   the whole point of confining the live layer to one well-supported axis.
//
// DESIGN RULE: this layer is *enhancement, never dependency*. If Overpass is
// slow, rate-limited, or offline, the app must keep working on authored data
// alone. Every failure path returns null and the UI silently falls back.
// ---------------------------------------------------------------------------

// Public Overpass endpoint. Keyless and CORS-friendly — the reason we chose it
// for a project that has to "just run" when deployed to GitHub Pages.
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Search radius in meters. ~400m ≈ a 5-minute walk, the canonical "human
// scale" / walkable distance used throughout the walkability literature.
const RADIUS_M = 400;

// The amenities that signal lingering / encounter. Each entry is an OSM
// tag filter. We count how many distinct such features sit within the radius.
const LINGER_FILTERS = [
  'node["amenity"="cafe"]',
  'node["amenity"="restaurant"]',
  'node["amenity"="bench"]',
  'node["amenity"="bar"]',
  'node["amenity"="fast_food"]',      // counts, but see weighting note below
  'node["leisure"="park"]',
  'way["leisure"="park"]',
  'node["amenity"="marketplace"]',
];

/**
 * Build the Overpass QL query string for a given lat/lon.
 * `[out:json][timeout:25]` keeps the server-side query bounded; we also apply
 * our own client-side timeout below in case the network (not the query) hangs.
 */
function buildQuery(lat, lon) {
  const around = `(around:${RADIUS_M},${lat},${lon})`;
  const body = LINGER_FILTERS.map((f) => `${f}${around};`).join("\n");
  return `[out:json][timeout:25];\n(\n${body}\n);\nout count;`;
}

/**
 * fetch with a hard client-side timeout via AbortController, so a stalled
 * request can never leave the UI spinning forever.
 */
async function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);   // always clear, success or failure
  }
}

/**
 * Query OSM for the count of lingering amenities near a point.
 * Returns a Number (the count) on success, or null on ANY failure — the
 * caller treats null as "no live data, use authored score as-is."
 */
export async function fetchLingerCount(lat, lon) {
  try {
    const query = buildQuery(lat, lon);
    const res = await fetchWithTimeout(
      OVERPASS_URL,
      {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: query,
      },
      12000 // 12s ceiling — generous for Overpass, short enough to fail fast
    );

    if (!res.ok) return null;            // HTTP error → graceful fallback
    const data = await res.json();

    // `out count` returns elements whose tags include a total. We defensively
    // walk the structure instead of assuming a fixed shape (the API lesson:
    // always check field existence before property access).
    const counts = (data.elements || [])
      .map((el) => Number(el?.tags?.total))
      .filter((n) => Number.isFinite(n));

    if (counts.length === 0) return null;
    // Sum across the count buckets Overpass returns for our union query.
    return counts.reduce((a, b) => a + b, 0);
  } catch (err) {
    // AbortError (timeout), network error, JSON parse error — all land here.
    // We swallow it on purpose: live data is optional by design.
    console.warn("Overpass lookup failed, falling back to authored score:", err);
    return null;
  }
}

/**
 * Translate a raw amenity count into an Encounter adjustment in [-2, +2].
 *
 * WHY A BOUNDED NUDGE, NOT A REPLACEMENT: the authored score reflects judgment
 * the API can't see (quality, frontage, whether the cafes face the street or a
 * parking lot). So live data *adjusts* rather than *overrides* — a dense
 * cluster of lingering amenities can lift Encounter by up to 2, a barren area
 * can drop it by up to 2, and the authored value anchors everything in between.
 *
 * Thresholds are deliberately simple and legible; they're the kind of thing
 * you'd tune against ground truth and document in the README.
 */
export function lingerAdjustment(count) {
  if (count === null) return 0;          // no data → no change
  if (count >= 40) return 2;             // dense, lively surroundings
  if (count >= 20) return 1;
  if (count >= 8)  return 0;             // ordinary — authored score stands
  if (count >= 3)  return -1;
  return -2;                             // near-barren — pulls Encounter down
}

export const OVERPASS_META = { RADIUS_M };
