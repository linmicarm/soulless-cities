// ---------------------------------------------------------------------------
// marta.js  —  Intown MARTA rail data for the map overlay + nearest-station.
//
// SCOPE: the intown stations (plus a couple just past the core so the lines
// don't dead-end abruptly). Full 38-station system includes far suburban stops
// (North Springs, Doraville, Indian Creek) that fall outside this guide's
// intown frame, so they're intentionally omitted from the drawn diagram.
//
// MARTA's four lines: Red + Gold share the North-South trunk; Blue + Green
// share the East-West trunk; everything crosses at Five Points (the only
// four-line transfer). Brand colors below are MARTA's actual line colors.
//
// Coordinates are real station locations (lat, lon). Used for:
//   1. drawing the colored line polylines on the Leaflet map
//   2. plotting station dots
//   3. computing each neighborhood's nearest station + walking distance
// ---------------------------------------------------------------------------

export const LINE_COLORS = {
  red:   "#E11A2C",  // Red Line
  gold:  "#C8A93A",  // Gold Line
  blue:  "#0067B1",  // Blue Line
  green: "#00A65D",  // Green Line
};

// Intown stations with coordinates. `lines` lists which services stop here.
export const STATIONS = [
  // ---- North-South trunk (Red + Gold), north to south through the core ----
  { id: "lindbergh",      name: "Lindbergh Center",  lat: 33.8237, lon: -84.3694, lines: ["red", "gold"] },
  { id: "arts-center",    name: "Arts Center",       lat: 33.7892, lon: -84.3873, lines: ["red", "gold"] },
  { id: "midtown",        name: "Midtown",           lat: 33.7807, lon: -84.3863, lines: ["red", "gold"] },
  { id: "north-ave",      name: "North Avenue",      lat: 33.7715, lon: -84.3870, lines: ["red", "gold"] },
  { id: "civic-center",   name: "Civic Center",      lat: 33.7662, lon: -84.3876, lines: ["red", "gold"] },
  { id: "peachtree-ctr",  name: "Peachtree Center",  lat: 33.7591, lon: -84.3877, lines: ["red", "gold"] },
  { id: "five-points",    name: "Five Points",       lat: 33.7538, lon: -84.3916, lines: ["red", "gold", "blue", "green"] },
  { id: "garnett",        name: "Garnett",           lat: 33.7480, lon: -84.3960, lines: ["red", "gold"] },
  { id: "west-end",       name: "West End",          lat: 33.7363, lon: -84.4135, lines: ["red", "gold"] },

  // ---- East-West trunk (Blue + Green), west to east through the core ----
  { id: "ashby",          name: "Ashby",             lat: 33.7563, lon: -84.4176, lines: ["blue", "green"] },
  { id: "vine-city",      name: "Vine City",         lat: 33.7566, lon: -84.4035, lines: ["blue", "green"] },
  { id: "dome-gwcc",      name: "GWCC / CNN Center",  lat: 33.7570, lon: -84.3964, lines: ["blue", "green"] },
  // (Five Points is the crossing — already listed above)
  { id: "georgia-state",  name: "Georgia State",     lat: 33.7505, lon: -84.3858, lines: ["blue", "green"] },
  { id: "king-memorial",  name: "King Memorial",     lat: 33.7497, lon: -84.3742, lines: ["blue", "green"] },
  { id: "inman-park-stn", name: "Inman Park / Reynoldstown", lat: 33.7573, lon: -84.3526, lines: ["blue", "green"] },
  { id: "edgewood-stn",   name: "Edgewood / Candler Park", lat: 33.7619, lon: -84.3402, lines: ["blue", "green"] },
  { id: "east-lake-stn",  name: "East Lake",         lat: 33.7650, lon: -84.3128, lines: ["blue"] },
];

// Ordered station id lists per line, so we can draw each line as a polyline
// in the correct sequence. (Red and Gold share the same intown trunk here.)
export const LINE_PATHS = {
  red:   ["lindbergh", "arts-center", "midtown", "north-ave", "civic-center", "peachtree-ctr", "five-points", "garnett", "west-end"],
  gold:  ["lindbergh", "arts-center", "midtown", "north-ave", "civic-center", "peachtree-ctr", "five-points", "garnett", "west-end"],
  blue:  ["ashby", "vine-city", "dome-gwcc", "five-points", "georgia-state", "king-memorial", "inman-park-stn", "edgewood-stn", "east-lake-stn"],
  green: ["ashby", "vine-city", "dome-gwcc", "five-points", "georgia-state", "king-memorial", "inman-park-stn", "edgewood-stn"],
};

// --- distance helper: haversine, returns meters --------------------------
// Used for "nearest station + walk distance." Real great-circle distance, not
// a flat approximation, so it stays accurate across the metro.
export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius, meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Find the nearest station to a point. Returns { station, meters, minutes }.
 * Walking time assumes ~80 m/min (a relaxed urban walking pace), rounded.
 * NOTE: this is straight-line distance, so it's a floor on the real walk —
 * we label it "as the crow flies" in the UI to stay honest about that.
 */
export function nearestStation(lat, lon) {
  let best = null;
  for (const s of STATIONS) {
    const m = haversineMeters(lat, lon, s.lat, s.lon);
    if (!best || m < best.meters) best = { station: s, meters: m };
  }
  if (!best) return null;
  return { ...best, minutes: Math.max(1, Math.round(best.meters / 80)) };
}