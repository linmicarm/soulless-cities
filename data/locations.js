// ---------------------------------------------------------------------------
// locations.js  —  Intown Atlanta "where to go" dataset
//
// SCOPE: destination neighborhoods only — places with a real commercial /
// cultural node worth visiting. Purely residential pockets are intentionally
// left out so the guide answers "where should I go?" rather than listing every
// place someone lives.
//
// SCORING CONVENTION (unchanged): every axis 0–10, HIGH = more "place," LOW =
// more "non-place." Composite 0–100 via the weighted model in lib/scoring.js.
//
// FIELDS:
//   id, name, area     identity + the human-readable district label
//   side               "Downtown" | "Midtown" | "Eastside" | "Westside"
//                      — drives the filter UI and the map marker grouping
//   lat, lon           real coordinates (map markers + Overpass radius)
//   scores             the five authored axes (see AXES below)
//   blurb              one-line character sketch
//   signals            short evidence bullets shown in the detail panel
//
// EDITING NOTE: these scores are authored from reputation, not lived
// ground-truth — they're meant to be corrected. Each place is one object; tweak
// any number 0–10 and the composite + band + map color all update
// automatically. No other file needs to change.
// ---------------------------------------------------------------------------

export const AXES = [
  { key: "humanScale",       label: "Human Scale",       blurb: "Built for a person walking, or a car passing through?" },
  { key: "encounter",        label: "Encounter",         blurb: "Reasons to slow down, sit, and bump into people?" },
  { key: "friction",         label: "Friction",          blurb: "Narrow, irregular streets with texture, or pure throughput?" },
  { key: "uniqueness",       label: "Uniqueness",        blurb: "Could only exist here, or anywhere on Earth?" },
  { key: "streetEngagement", label: "Street Engagement", blurb: "Do buildings feed the sidewalk or wall it off behind parking?" },
];

export const SIDES = ["Downtown", "Midtown", "Eastside", "Westside"];

export const LOCATIONS = [
  // ---------------------------------------------------------------- EASTSIDE
  {
    id: "little-five-points", name: "Little Five Points", area: "L5P", side: "Eastside",
    lat: 33.7648, lon: -84.3494,
    scores: { humanScale: 9, encounter: 9, friction: 8, uniqueness: 9, streetEngagement: 9 },
    blurb: "Atlanta's counterculture corner, record stores, the Vortex, street performers, zero chains.",
    signals: ["Dense pedestrian commercial node where Inman & Candler Park meet", "Independent shops front the sidewalk directly", "Constant street life and people-watching", "Unmistakably specific, could be nowhere else"],
  },
  {
    id: "inman-park", name: "Inman Park", area: "Inman Park", side: "Eastside",
    lat: 33.7592, lon: -84.3527,
    scores: { humanScale: 8, encounter: 8, friction: 7, uniqueness: 8, streetEngagement: 8 },
    blurb: "Atlanta's first streetcar suburb, Victorian homes, BeltLine access, walkable commercial pockets.",
    signals: ["Historic streetcar-era street grid", "BeltLine brings steady foot and bike traffic", "Restaurants and bars open onto the street", "Layered, century-old neighborhood identity"],
  },
  {
    id: "cabbagetown", name: "Cabbagetown", area: "Cabbagetown", side: "Eastside",
    lat: 33.7497, lon: -84.3614,
    scores: { humanScale: 9, encounter: 7, friction: 9, uniqueness: 9, streetEngagement: 7 },
    blurb: "A tiny former mill village of shotgun houses, murals, and impossibly narrow streets.",
    signals: ["Mill-village blocks at extreme human scale", "Krog Street Tunnel murals, hyper-specific identity", "Narrow, irregular streets slow everything down", "Tight-knit, walkable, unrepeatable"],
  },
  {
    id: "krog-street-market", name: "Krog Street Market", area: "Inman Park / O4W", side: "Eastside",
    lat: 33.7536, lon: -84.3636,
    scores: { humanScale: 8, encounter: 9, friction: 6, uniqueness: 8, streetEngagement: 7 },
    blurb: "A warehouse turned food hall, stitched directly into the Eastside BeltLine trail.",
    signals: ["Adaptive reuse of an industrial building", "BeltLine delivers constant pedestrian flow", "Dense cluster of independent food vendors", "Some edges still face rail and parking"],
  },
  {
    id: "old-fourth-ward", name: "Old Fourth Ward / Ponce City Market", area: "O4W", side: "Eastside",
    lat: 33.7726, lon: -84.3654,
    scores: { humanScale: 6, encounter: 8, friction: 5, uniqueness: 8, streetEngagement: 6 },
    blurb: "The Sears building reborn as a mixed-use hall, alive inside and on the BeltLine, huge and parked behind.",
    signals: ["Historic structure with unmistakable identity", "High encounter density inside and on the BeltLine", "Enormous footprint works against fine-grained texture", "A large parking deck still mediates car arrival"],
  },
  {
    id: "east-atlanta-village", name: "East Atlanta Village", area: "EAV", side: "Eastside",
    lat: 33.7407, lon: -84.3439,
    scores: { humanScale: 8, encounter: 8, friction: 7, uniqueness: 8, streetEngagement: 7 },
    blurb: "A dense, scruffy, beloved indie node of bars, music venues, and late-night life.",
    signals: ["Compact walkable village core", "Venues and bars keep it alive after dark", "Almost entirely independent businesses", "Strong, specific neighborhood character"],
  },
  {
    id: "kirkwood", name: "Kirkwood", area: "Kirkwood", side: "Eastside",
    lat: 33.7507, lon: -84.3236,
    scores: { humanScale: 7, encounter: 6, friction: 6, uniqueness: 7, streetEngagement: 7 },
    blurb: "A revived bungalow neighborhood with a small, genuine walkable main street at Hosea + Oakview.",
    signals: ["Compact historic commercial node", "Local restaurants front the sidewalk", "Walkable from surrounding bungalow streets", "Distinct small-town-in-the-city feel"],
  },
  {
    id: "candler-park", name: "Candler Park", area: "Candler Park", side: "Eastside",
    lat: 33.7647, lon: -84.3389,
    scores: { humanScale: 7, encounter: 6, friction: 6, uniqueness: 6, streetEngagement: 6 },
    blurb: "Leafy and human-scaled, with a small commercial strip and a namesake park.",
    signals: ["Walkable residential-to-commercial blend", "Park anchors public life", "Local storefronts, few chains", "Quiet but genuinely pedestrian"],
  },
  {
    id: "edgewood", name: "Edgewood Ave corridor", area: "Sweet Auburn / Edgewood", side: "Eastside",
    lat: 33.7547, lon: -84.3722,
    scores: { humanScale: 6, encounter: 7, friction: 5, uniqueness: 7, streetEngagement: 6 },
    blurb: "A nightlife-heavy stretch of bars and restaurants linking downtown to the Eastside.",
    signals: ["Active street wall of bars and eateries", "Strong after-dark encounter density", "Mostly local, idiosyncratic venues", "Wide roadway cuts the friction somewhat"],
  },
  {
    id: "reynoldstown", name: "Reynoldstown", area: "Reynoldstown", side: "Eastside",
    lat: 33.7464, lon: -84.3556,
    scores: { humanScale: 6, encounter: 6, friction: 5, uniqueness: 7, streetEngagement: 6 },
    blurb: "A historic railroad neighborhood transforming fast along the Southside BeltLine.",
    signals: ["Historic working-class roots, specific identity", "BeltLine spur fuels new pedestrian life", "Mix of old housing and new infill", "Still patchy, some dead street edges"],
  },
  {
    id: "ormewood-park", name: "Ormewood Park", area: "Ormewood Park", side: "Eastside",
    lat: 33.7311, lon: -84.3489,
    scores: { humanScale: 6, encounter: 5, friction: 5, uniqueness: 6, streetEngagement: 5 },
    blurb: "A quiet bungalow neighborhood with a small but growing cluster of neighborhood spots.",
    signals: ["Walkable residential streets", "Emerging small commercial node", "Local, low-key businesses", "Limited destination density so far"],
  },
  {
    id: "poncey-highland", name: "Poncey-Highland", area: "Poncey-Highland", side: "Eastside",
    lat: 33.7727, lon: -84.3528,
    scores: { humanScale: 7, encounter: 7, friction: 6, uniqueness: 7, streetEngagement: 6 },
    blurb: "Home to the Plaza Theatre and Manuel's Tavern, between Ponce and Virginia-Highland.",
    signals: ["Historic landmarks anchor identity", "Walkable to Ponce City Market and the BeltLine", "Independent institutions, not chains", "Ponce de Leon's width breaks some friction"],
  },
  {
    id: "virginia-highland", name: "Virginia-Highland", area: "Va-Hi", side: "Eastside",
    lat: 33.7813, lon: -84.3528,
    scores: { humanScale: 8, encounter: 7, friction: 7, uniqueness: 7, streetEngagement: 8 },
    blurb: "A pre-war streetcar neighborhood whose commercial node still works the old way.",
    signals: ["Streetcar-era block sizes keep it walkable", "Shops and cafes open onto the sidewalk", "Residential and commercial blend", "Street parking, not vast lots, out front"],
  },
  {
    id: "east-lake", name: "East Lake", area: "East Lake", side: "Eastside",
    lat: 33.7480, lon: -84.3060,
    scores: { humanScale: 5, encounter: 4, friction: 4, uniqueness: 5, streetEngagement: 4 },
    blurb: "Largely residential and golf-anchored, with limited walkable destination density.",
    signals: ["Quiet, mostly residential fabric", "Few clustered destinations", "Some local spots near the MARTA station", "Car-oriented in much of the area"],
  },

  // ---------------------------------------------------------------- DOWNTOWN
  {
    id: "castleberry-hill", name: "Castleberry Hill", area: "Castleberry Hill", side: "Downtown",
    lat: 33.7430, lon: -84.4015,
    scores: { humanScale: 6, encounter: 5, friction: 6, uniqueness: 8, streetEngagement: 5 },
    blurb: "A loft-and-gallery arts district in old warehouses just southwest of downtown.",
    signals: ["Historic warehouse architecture, strong character", "Art-walk culture creates periodic street life", "Independent galleries and lofts", "Quieter between events; some dead frontage"],
  },
  {
    id: "fairlie-poplar", name: "Fairlie-Poplar", area: "Fairlie-Poplar", side: "Downtown",
    lat: 33.7587, lon: -84.3911,
    scores: { humanScale: 7, encounter: 5, friction: 7, uniqueness: 7, streetEngagement: 5 },
    blurb: "Downtown's most intact historic district, early skyscrapers and narrow walkable streets, often underused.",
    signals: ["Fine-grained pre-war street grid", "Genuinely walkable historic bones", "Distinct early-20th-century architecture", "Underactivated, empties after work"],
  },
  {
    id: "sweet-auburn", name: "Sweet Auburn", area: "Sweet Auburn", side: "Downtown",
    lat: 33.7556, lon: -84.3742,
    scores: { humanScale: 6, encounter: 6, friction: 5, uniqueness: 9, streetEngagement: 5 },
    blurb: "One of the most historically significant Black commercial districts in America, deep identity, physically scarred by the Connector.",
    signals: ["Profound cultural and historic specificity", "MLK sites and the Municipal Market draw visitors", "Highway construction severed parts of the fabric", "Reviving, but with gaps in the street wall"],
  },
  {
    id: "five-points", name: "Five Points", area: "Five Points", side: "Downtown",
    lat: 33.7540, lon: -84.3915,
    scores: { humanScale: 5, encounter: 4, friction: 5, uniqueness: 5, streetEngagement: 4 },
    blurb: "The historic heart and transit hub of downtown, busy by day with commuters, hollow after hours.",
    signals: ["Major MARTA transfer point, pure throughput", "Heavy daytime transit flow, little lingering", "Empties dramatically after working hours", "Plaza redesign underway to add real public life"],
  },
  {
    id: "peachtree-center", name: "Peachtree Center", area: "Peachtree Center", side: "Downtown",
    lat: 33.7600, lon: -84.3870,
    scores: { humanScale: 3, encounter: 3, friction: 3, uniqueness: 3, streetEngagement: 3 },
    blurb: "A convention-and-hotel megastructure zone, skybridges and atriums pull life off the street entirely.",
    signals: ["Skybridge network bypasses the sidewalk", "Built for conventions, not residents", "Interchangeable corporate-hotel character", "Street level often blank and inactive"],
  },
  {
    id: "centennial-yards", name: "Centennial Yards / Gulch", area: "South Downtown", side: "Downtown",
    lat: 33.7530, lon: -84.3950,
    scores: { humanScale: 3, encounter: 3, friction: 2, uniqueness: 3, streetEngagement: 2 },
    blurb: "A vast rail-gulch redevelopment, currently more construction and parking than place.",
    signals: ["Enormous superblock site over the rail gulch", "Little fine-grained street life yet", "Master-planned all at once", "Parking and infrastructure dominate today"],
  },
  {
    id: "centennial-park", name: "Centennial Olympic Park district", area: "Downtown", side: "Downtown",
    lat: 33.7603, lon: -84.3933,
    scores: { humanScale: 4, encounter: 5, friction: 3, uniqueness: 5, streetEngagement: 3 },
    blurb: "The '96 Olympics legacy park ringed by big-ticket attractions, destination-dense but tourist-oriented and car-bordered.",
    signals: ["Major attractions cluster around the park", "Tourist foot traffic, less daily local life", "Wide roads and big blocks reduce friction", "Attractions set back from the street"],
  },

  // ----------------------------------------------------------------- MIDTOWN
  {
    id: "midtown-core", name: "Midtown Core", area: "Midtown", side: "Midtown",
    lat: 33.7838, lon: -84.3836,
    scores: { humanScale: 5, encounter: 6, friction: 4, uniqueness: 4, streetEngagement: 5 },
    blurb: "Atlanta's densest corridor outside downtown, real sidewalk life at some podiums, dead frontage at others.",
    signals: ["Genuine pedestrian activity along Peachtree", "Tower podiums sometimes engage, sometimes blank", "Wide arterials cut the friction it builds", "Increasingly interchangeable glass architecture"],
  },
  {
    id: "tech-square", name: "Technology Square", area: "Georgia Tech", side: "Midtown",
    lat: 33.7766, lon: -84.3890,
    scores: { humanScale: 6, encounter: 5, friction: 4, uniqueness: 4, streetEngagement: 5 },
    blurb: "GT's lively academic-commercial bridge over the Connector, busy with students, bounded by highway.",
    signals: ["Student density creates real daytime life", "Bridges the Connector to link campus and Midtown", "Institutional, somewhat generic architecture", "Highway edges limit walkable continuity"],
  },
  {
    id: "atlantic-station", name: "Atlantic Station", area: "Atlantic Station", side: "Midtown",
    lat: 33.7920, lon: -84.3960,
    scores: { humanScale: 5, encounter: 5, friction: 3, uniqueness: 2, streetEngagement: 4 },
    blurb: "A master-planned 'town center' on a former steel mill, mimics a walkable district but assembled from a template.",
    signals: ["Walkable-by-design, but the same chains as any mall", "Assembled all at once, no accumulated history", "Massive structured parking underpins it", "Could be dropped into a dozen other cities"],
  },
  {
    id: "ansley-park", name: "Ansley Park", area: "Ansley Park", side: "Midtown",
    lat: 33.7945, lon: -84.3760,
    scores: { humanScale: 6, encounter: 3, friction: 6, uniqueness: 6, streetEngagement: 4 },
    blurb: "A curvilinear early garden-suburb, beautiful and walkable, but almost purely residential.",
    signals: ["Historic curvilinear street design", "Pleasant to walk, little to walk to", "Strong architectural identity", "Few commercial destinations"],
  },

  // ----------------------------------------------------------------- WESTSIDE
  {
    id: "westside-provisions", name: "Westside Provisions District", area: "Westside", side: "Westside",
    lat: 33.7903, lon: -84.4117,
    scores: { humanScale: 6, encounter: 6, friction: 4, uniqueness: 6, streetEngagement: 5 },
    blurb: "Upscale adaptive-reuse retail and dining in former meatpacking buildings on Howell Mill.",
    signals: ["Industrial buildings reused with character", "Clustered dining creates encounter", "Howell Mill's width breaks pedestrian flow", "Surface parking still mediates arrival"],
  },
  {
    id: "marietta-street-artery", name: "Marietta Street Artery", area: "Westside", side: "Westside",
    lat: 33.7820, lon: -84.4080,
    scores: { humanScale: 5, encounter: 5, friction: 5, uniqueness: 6, streetEngagement: 4 },
    blurb: "A former industrial arts corridor, galleries and studios in warehouses, gradually activating.",
    signals: ["Warehouse arts spaces with real character", "Periodic art-driven street life", "Wide, fast roadway in stretches", "Activation still uneven block to block"],
  },
  {
    id: "knight-park-howell", name: "Knight Park / Howell Station", area: "Westside", side: "Westside",
    lat: 33.7840, lon: -84.4180,
    scores: { humanScale: 6, encounter: 3, friction: 6, uniqueness: 6, streetEngagement: 4 },
    blurb: "A small historic railroad-worker neighborhood, intact and walkable, but mostly residential.",
    signals: ["Intact historic worker housing", "Tight, walkable streets", "Strong specific identity", "Very few commercial destinations"],
  },
  {
    id: "blandtown", name: "Blandtown", area: "Westside", side: "Westside",
    lat: 33.7960, lon: -84.4240,
    scores: { humanScale: 4, encounter: 4, friction: 3, uniqueness: 4, streetEngagement: 3 },
    blurb: "A rapidly redeveloping former industrial area, new townhomes and breweries amid warehouses and wide roads.",
    signals: ["Industrial-to-residential transition", "A few breweries and destinations emerging", "Car-oriented, wide-road fabric", "Little continuous street wall yet"],
  },
];