// ---------------------------------------------------------------------------
// main.js — Intown Atlanta non-place field guide (MARTA edition)
//
// Sections:
//   1. helpers + state
//   2. filters (side + band) and SORT toggle
//   3. spectrum bar (all places as a route-diagram of aliveness)
//   4. ranked list
//   5. Leaflet map: basemap, MARTA line polylines, station dots, place markers
//   6. detail panel (incl. nearest MARTA station + COMPARE mode)
//   7. live Overpass nudge
//   8. deep-links (?place=, ?compare=) + boot
//
// Scoring lives in lib/scoring.js; live data in lib/overpass.js; transit data
// in data/marta.js. No framework: hand-written DOM throughout.
// ---------------------------------------------------------------------------

import { LOCATIONS, AXES, SIDES } from "./data/locations.js";
import { evaluate, computeScore, getBand, BANDS } from "./lib/scoring.js";
import { fetchLingerCount, lingerAdjustment, OVERPASS_META } from "./lib/overpass.js";
import { STATIONS, LINE_PATHS, LINE_COLORS, nearestStation } from "./data/marta.js";

// ---- 1. helpers + state ---------------------------------------------------
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v != null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}
const $ = (s) => document.querySelector(s);

const BAND_COLOR = { place: "#00A65D", hybrid: "#C8A93A", nonplace: "#8A95A0" };
const BAND_LABEL = { place: "Living Place", hybrid: "Hybrid", nonplace: "Non-Place" };

const SORTS = {
  score: { label: "Score", fn: (a, b) => b.score - a.score },
  az:    { label: "A to Z", fn: (a, b) => a.loc.name.localeCompare(b.loc.name) },
  side:  { label: "Side", fn: (a, b) => a.loc.side.localeCompare(b.loc.side) || b.score - a.score },
};

const state = {
  selectedId: null,
  sides: new Set(SIDES),
  bands: new Set(BANDS.map((b) => b.key)),
  sort: "score",
  compare: null,        // id of the place pinned for comparison, or null
  liveCache: new Map(),
  markers: new Map(),
  map: null,
};

const ENRICHED = LOCATIONS.map((loc) => ({ loc, ...evaluate(loc) }));
const byId = (id) => ENRICHED.find((e) => e.loc.id === id);

function visibleLocations() {
  return ENRICHED
    .filter((e) => state.sides.has(e.loc.side) && state.bands.has(e.band.key))
    .sort(SORTS[state.sort].fn);
}

// ---- 2. filters + sort ----------------------------------------------------
function renderControls() {
  const sideWrap = $("#side-filters");
  sideWrap.innerHTML = "";
  sideWrap.appendChild(el("span", { class: "ctl__label" }, "Side"));
  for (const side of SIDES)
    sideWrap.appendChild(chip(side, state.sides.has(side), () => toggleSet(state.sides, side)));

  const bandWrap = $("#band-filters");
  bandWrap.innerHTML = "";
  bandWrap.appendChild(el("span", { class: "ctl__label" }, "Vibe"));
  for (const b of BANDS)
    bandWrap.appendChild(chip(BAND_LABEL[b.key], state.bands.has(b.key), () => toggleSet(state.bands, b.key), `band-${b.key}`));

  const sortWrap = $("#sort-filters");
  sortWrap.innerHTML = "";
  sortWrap.appendChild(el("span", { class: "ctl__label" }, "Sort"));
  for (const [key, def] of Object.entries(SORTS))
    sortWrap.appendChild(chip(def.label, state.sort === key, () => setSort(key)));
}
function chip(label, active, onToggle, extra = "") {
  return el("button", {
    class: `chip ${extra} ${active ? "is-on" : ""}`,
    "aria-pressed": String(active), onClick: onToggle,
  }, label);
}
function toggleSet(set, key) {
  if (set.has(key) && set.size === 1) return; // keep at least one on
  set.has(key) ? set.delete(key) : set.add(key);
  refresh();
}
function setSort(key) { state.sort = key; refresh(); }

// ---- 3. spectrum bar ------------------------------------------------------
// Every place as a dot positioned by score along a 0-100 track, colored by
// band. A route-diagram of aliveness. Clicking a dot selects that place.
function renderSpectrum() {
  const bar = $("#spectrum");
  bar.innerHTML = "";
  const track = el("div", { class: "spectrum__track" });
  // band threshold guides
  for (const b of BANDS.filter((x) => x.min > 0)) {
    track.appendChild(el("div", { class: "spectrum__tick", style: `left:${b.min}%` }));
  }
  for (const { loc, score, band } of ENRICHED) {
    const dot = el("button", {
      class: `spectrum__dot band-${band.key} ${loc.id === state.selectedId ? "is-sel" : ""}`,
      style: `left:${score}%`,
      title: `${loc.name} · ${score}`,
      onClick: () => selectLocation(loc.id, true),
      "aria-label": `${loc.name}, score ${score}`,
    });
    track.appendChild(dot);
  }
  bar.append(
    el("div", { class: "spectrum__ends" }, [
      el("span", {}, "Non-Place"),
      el("span", {}, "Living Place"),
    ]),
    track
  );
}

// ---- 4. list --------------------------------------------------------------
function renderList() {
  const list = $("#location-list");
  list.innerHTML = "";
  const vis = visibleLocations();
  $("#list-count").textContent = `${vis.length} place${vis.length === 1 ? "" : "s"}`;

  vis.forEach(({ loc, score, band }, i) => {
    list.appendChild(el("button", {
      class: `card band-${band.key} ${loc.id === state.selectedId ? "is-selected" : ""}`,
      style: `--i:${i}`,
      onClick: () => selectLocation(loc.id, true),
      "aria-pressed": String(loc.id === state.selectedId),
    }, [
      shieldBadge(score),
      el("span", { class: "card__txt" }, [
        el("span", { class: "card__name" }, loc.name),
        el("span", { class: "card__area" }, `${loc.area} · ${loc.side}`),
      ]),
      el("span", { class: "card__band" }, BAND_LABEL[band.key]),
    ]));
  });
}
function shieldBadge(score) {
  const wrap = el("span", { class: "shield" });
  wrap.innerHTML =
    `<svg viewBox="0 0 52 56" aria-hidden="true">` +
    `<path d="M26 2 C14 2 4 6 4 6 C4 22 6 40 26 54 C46 40 48 22 48 6 C48 6 38 2 26 2Z" ` +
    `fill="var(--shield)" stroke="var(--ink)" stroke-width="3"/></svg>` +
    `<span class="shield__num">${score}</span>`;
  return wrap;
}

// ---- 5. map ---------------------------------------------------------------
function initMap() {
  if (typeof L === "undefined") {
    const panel = $(".panel--map");
    if (panel) {
      panel.style.padding = "1.2rem";
      panel.innerHTML =
        '<p style="margin:0;color:var(--ink-soft);font-family:var(--font-body)">' +
        "Map could not load right now. The ranking and details below still work.</p>";
    }
    return;
  }

  const map = L.map("map", { scrollWheelZoom: false }).setView([33.758, -84.378], 12);
  // A light, low-saturation basemap so the MARTA lines + markers pop on top.
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19, attribution: "© OpenStreetMap contributors, © CARTO",
  }).addTo(map);
  state.map = map;

  // MARTA line polylines. Gold draws over Red with a slight offset so the
  // shared trunk reads as two lines, not one. (Drawn before markers so the
  // place markers sit on top.)
  drawLine("red", 0);
  drawLine("gold", 0.0006);   // tiny lon offset so it parallels Red visibly
  drawLine("blue", 0);
  drawLine("green", 0.0006);

  // Station dots (small, white-filled, line-colored ring).
  for (const s of STATIONS) {
    L.circleMarker([s.lat, s.lon], {
      radius: 3.5, color: "#333", weight: 1, fillColor: "#fff", fillOpacity: 1,
    }).bindTooltip(`${s.name} station`, { direction: "top" }).addTo(map);
  }

  // Place markers, colored by band.
  for (const { loc, score, band } of ENRICHED) {
    const m = L.circleMarker([loc.lat, loc.lon], markerStyle(band.key, false));
    m.bindTooltip(`${loc.name} · ${score}`, { direction: "top" });
    m.on("click", () => selectLocation(loc.id, false));
    m.addTo(map);
    state.markers.set(loc.id, m);
  }

  setTimeout(() => map.invalidateSize(), 200); // fix grid-sizing race
}
function drawLine(line, offset) {
  const pts = LINE_PATHS[line]
    .map((sid) => STATIONS.find((s) => s.id === sid))
    .filter(Boolean)
    .map((s) => [s.lat, s.lon + offset]);
  L.polyline(pts, { color: LINE_COLORS[line], weight: 4, opacity: 0.8 }).addTo(state.map);
}
function markerStyle(bandKey, selected) {
  return {
    radius: selected ? 11 : 7, color: "#181410",
    weight: selected ? 3 : 1.5,
    fillColor: BAND_COLOR[bandKey], fillOpacity: 0.95,
  };
}
function syncMarkers() {
  if (!state.map) return;
  const visIds = new Set(visibleLocations().map((e) => e.loc.id));
  for (const { loc, band } of ENRICHED) {
    const m = state.markers.get(loc.id);
    if (!m) continue;
    const on = state.map.hasLayer(m);
    if (visIds.has(loc.id) && !on) m.addTo(state.map);
    else if (!visIds.has(loc.id) && on) state.map.removeLayer(m);
    m.setStyle(markerStyle(band.key, loc.id === state.selectedId));
  }
}

// ---- 6. detail (+ nearest station + compare) ------------------------------
function renderDetail(loc, liveInfo = null) {
  const panel = $("#detail");

  // If compare is active and a different place is pinned, render the compare
  // view instead of the single-place view.
  if (state.compare && state.compare !== loc.id) {
    renderCompare(loc, byId(state.compare).loc);
    return;
  }

  const adjusted = { ...loc.scores };
  let delta = 0;
  if (liveInfo && liveInfo.adjustment !== 0) {
    delta = liveInfo.adjustment;
    adjusted.encounter = Math.max(0, Math.min(10, loc.scores.encounter + delta));
  }
  const score = computeScore(adjusted);
  const band = getBand(score);
  panel.className = `panel panel--detail band-${band.key}`;
  panel.innerHTML = "";

  const near = nearestStation(loc.lat, loc.lon);
  const stationLine = near
    ? `Nearest rail: ${near.station.name} · about ${near.minutes} min walk (${Math.round(near.meters)} m as the crow flies)`
    : "No nearby MARTA rail station";

  const gauge = el("div", { class: `gauge band-${band.key}`, style: `--score:${score}` }, [
    el("div", { class: "gauge__ring" }, [
      el("span", { class: "gauge__num" }, String(score)),
      el("span", { class: "gauge__out" }, "/100"),
    ]),
    el("div", {}, [
      el("span", { class: "gauge__band" }, BAND_LABEL[band.key]),
      el("p", { class: "gauge__summary" }, band.summary),
    ]),
  ]);

  const axes = el("div", { class: "axes" }, AXES.map((axis) => {
    const v = adjusted[axis.key];
    const live = axis.key === "encounter" && delta !== 0;
    return el("div", { class: "axis" }, [
      el("div", { class: "axis__head" }, [
        el("span", { class: "axis__label" }, axis.label),
        el("span", { class: "axis__val" }, live ? `${v}/10 (${delta > 0 ? "+" : ""}${delta} live)` : `${v}/10`),
      ]),
      el("div", { class: "axis__track" }, [
        el("div", { class: `axis__fill ${live ? "axis__fill--live" : ""}`, style: `width:${v * 10}%` }),
      ]),
      el("p", { class: "axis__blurb" }, axis.blurb),
    ]);
  }));

  const signals = el("ul", { class: "signals" }, loc.signals.map((s) => el("li", {}, s)));

  const actions = el("div", { class: "actions" }, [
    el("button", { class: "btn btn--live", id: "live-btn", onClick: () => runLive(loc.id) },
      liveInfo ? `Live: ${liveInfo.count} lingering spots within ${OVERPASS_META.RADIUS_M}m` : "Check live data nearby (OpenStreetMap)"),
    el("button", { class: "btn btn--compare", onClick: () => startCompare(loc.id) }, "Compare with another place"),
    el("button", { class: "btn btn--share", onClick: () => shareLink(loc.id) }, "Copy link"),
  ]);

  panel.append(
    el("p", { class: "detail__kicker" }, `${loc.side} · ${loc.area}`),
    el("h2", { class: "detail__name" }, loc.name),
    el("p", { class: "detail__blurb" }, loc.blurb),
    el("p", { class: "detail__station" }, stationLine),
    gauge,
    el("h3", { class: "detail__sub" }, "The five axes"),
    axes,
    el("h3", { class: "detail__sub" }, "What we noticed"),
    signals,
    actions,
    el("p", { class: "live__note" }, "Live data counts cafes, benches, parks and markets nearby and nudges Encounter. Optional. The verdict works without it."),
  );
}

// Compare two places side by side across the five axes.
function renderCompare(a, b) {
  const panel = $("#detail");
  panel.className = "panel panel--detail panel--compare";
  panel.innerHTML = "";
  const ea = byId(a.id), eb = byId(b.id);

  const head = el("div", { class: "cmp__head" }, [
    el("h2", { class: "detail__name" }, "Head to head"),
    el("button", { class: "btn btn--exit", onClick: exitCompare }, "Exit compare"),
  ]);

  const cols = el("div", { class: "cmp__cols" }, [a, b].map((loc) => {
    const e = byId(loc.id);
    return el("div", { class: `cmp__col band-${e.band.key}` }, [
      el("span", { class: "cmp__score" }, String(e.score)),
      el("span", { class: "cmp__name" }, loc.name),
      el("span", { class: "cmp__band" }, BAND_LABEL[e.band.key]),
    ]);
  }));

  const rows = el("div", { class: "cmp__rows" }, AXES.map((axis) => {
    const va = a.scores[axis.key], vb = b.scores[axis.key];
    return el("div", { class: "cmp__row" }, [
      el("div", { class: "cmp__cell cmp__cell--a" }, [
        el("div", { class: "cmp__bar cmp__bar--a", style: `width:${va * 10}%` }),
        el("span", { class: "cmp__num" }, String(va)),
      ]),
      el("div", { class: "cmp__axis" }, axis.label),
      el("div", { class: "cmp__cell cmp__cell--b" }, [
        el("div", { class: "cmp__bar cmp__bar--b", style: `width:${vb * 10}%` }),
        el("span", { class: "cmp__num" }, String(vb)),
      ]),
    ]);
  }));

  panel.append(head, cols, rows,
    el("p", { class: "live__note" }, `Comparing ${a.name} against ${b.name}. Pick a different place from the list or map to swap the right-hand side.`));
}
function startCompare(id) { state.compare = id; refresh(); }
function exitCompare() { state.compare = null; renderDetail(LOCATIONS.find((l) => l.id === state.selectedId)); }

// ---- 7. live Overpass -----------------------------------------------------
async function runLive(id) {
  const loc = LOCATIONS.find((l) => l.id === id);
  const btn = $("#live-btn");
  if (!btn) return;
  btn.disabled = true; btn.textContent = "Checking OpenStreetMap…";
  const count = await fetchLingerCount(loc.lat, loc.lon);
  if (count === null) { btn.disabled = false; btn.textContent = "Live data unavailable. Try again"; return; }
  const adjustment = lingerAdjustment(count);
  state.liveCache.set(id, { count, adjustment });
  renderDetail(loc, { count, adjustment });
}

// ---- 8. deep-links + selection + boot -------------------------------------
function shareLink(id) {
  const url = `${location.origin}${location.pathname}?place=${id}`;
  const done = () => {
    const btn = document.querySelector(".btn--share");
    if (btn) { btn.textContent = "Link copied"; setTimeout(() => (btn.textContent = "Copy link"), 1500); }
  };
  if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(done);
  else done();
}

function selectLocation(id, fromCard) {
  state.selectedId = id;
  const loc = LOCATIONS.find((l) => l.id === id);
  // keep the URL shareable as you browse (no history spam: replaceState)
  const params = new URLSearchParams(location.search);
  params.set("place", id);
  history.replaceState(null, "", `${location.pathname}?${params}`);

  renderSpectrum();
  renderList();
  syncMarkers();
  renderDetail(loc, state.liveCache.get(id) || null);
  if (state.map) state.map.panTo([loc.lat, loc.lon], { animate: true });
  if (fromCard) $("#detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function refresh() {
  renderControls();
  renderSpectrum();
  renderList();
  syncMarkers();
  const vis = visibleLocations();
  if (!vis.some((e) => e.loc.id === state.selectedId) && vis.length) {
    selectLocation(vis[0].loc.id, false);
  } else if (state.selectedId) {
    renderDetail(LOCATIONS.find((l) => l.id === state.selectedId), state.liveCache.get(state.selectedId) || null);
  }
}

function init() {
  renderControls();
  renderSpectrum();
  initMap();
  renderList();
  syncMarkers();

  // Deep-link: ?place=<id> opens straight to that card; ?compare=<a>,<b> too.
  const params = new URLSearchParams(location.search);
  const compareParam = params.get("compare");
  const placeParam = params.get("place");
  let startId = visibleLocations()[0]?.loc.id;
  if (placeParam && byId(placeParam)) startId = placeParam;
  if (compareParam) {
    const [a, b] = compareParam.split(",");
    if (byId(a) && byId(b)) { state.compare = b; startId = a; }
  }
  if (startId) selectLocation(startId, false);
}
document.addEventListener("DOMContentLoaded", init);