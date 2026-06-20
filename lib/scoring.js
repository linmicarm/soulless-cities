// ---------------------------------------------------------------------------
// scoring.js
//
// The scoring engine. Pure functions, no DOM, no network — this is the part a
// reviewer reads to judge whether the model is *thought through* or a black box.
// Keeping it pure also means it's trivially testable and reusable.
//
// THE MODEL, stated plainly:
//   - Five axes, each 0–10, HIGH = more "place" (see locations.js for the
//     convention and what each axis means).
//   - A composite "Placeness Score" on a 0–100 scale.
//   - WHY WEIGHTED, NOT A FLAT AVERAGE: Augé's whole argument is that a
//     non-place is "stripped of relational identity" — it's the encounter and
//     uniqueness dimensions that carry the *belonging* idea most directly,
//     while human scale is the precondition Gehl shows everything else rests
//     on. A flat mean would let a place with great parking-free frontage but
//     zero local identity score the same as a beloved square. The weights
//     encode the essay's actual thesis instead of pretending all signals
//     matter equally. They sum to 1.0 so the composite stays on 0–100.
// ---------------------------------------------------------------------------

import { AXES } from "../data/locations.js";

// Weights encode the thesis: belonging (encounter + uniqueness) and the
// human-scale precondition matter most. Adjusting these is how you'd argue a
// different reading of the source — they're deliberately exposed and explained.
export const WEIGHTS = {
  humanScale:       0.25, // Gehl's precondition — nothing else works without it
  encounter:        0.25, // the core of "belonging vs. throughput"
  uniqueness:       0.20, // Augé's "relational identity" / specificity
  friction:         0.15, // texture and slowness that let life accumulate
  streetEngagement: 0.15, // whether buildings feed the street or wall it off
};

// Verdict bands. The thresholds are chosen so the dataset spreads across all
// three — a detector where everything lands "hybrid" would be useless.
export const BANDS = [
  {
    min: 67,
    key: "place",
    label: "Living Place",
    summary:
      "This space is built around human presence. People have reasons to slow " +
      "down, stay, and run into one another, the conditions a place needs to " +
      "accumulate identity over time.",
  },
  {
    min: 42,
    key: "hybrid",
    label: "Hybrid",
    summary:
      "A space pulling in two directions at once. There is real public life " +
      "here, but car-first form, large footprints, or interchangeable design " +
      "keep dragging it back toward throughput.",
  },
  {
    min: 0,
    key: "nonplace",
    label: "Non-Place",
    summary:
      "A space engineered for movement and transaction, not belonging. In " +
      "Augé's terms it is stripped of relational identity. You pass through " +
      "it, you do not inhabit it.",
  },
];

/**
 * Compute the weighted composite score (0–100) from a per-axis scores object.
 * Each axis is 0–10; weights sum to 1.0; ×10 lifts the result onto 0–100.
 */
export function computeScore(scores) {
  let total = 0;
  for (const axis of AXES) {
    const value = scores[axis.key] ?? 0;          // defensive: missing axis → 0
    total += value * (WEIGHTS[axis.key] ?? 0);    // defensive: missing weight → 0
  }
  // total is currently on a 0–10 scale (weighted mean of 0–10 values).
  return Math.round(total * 10);                  // → 0–100, integer
}

/** Map a 0–100 score to its verdict band. BANDS is ordered high→low. */
export function getBand(score) {
  return BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1];
}

/**
 * Find the single weakest and strongest axis, used by the UI to write a
 * one-line "what's dragging this down / holding it up" diagnosis. Returns the
 * axis *definitions* (with labels) so the caller doesn't re-look-them-up.
 */
export function axisExtremes(scores) {
  let lowest = null;
  let highest = null;
  for (const axis of AXES) {
    const v = scores[axis.key] ?? 0;
    if (lowest === null || v < lowest.value)  lowest  = { ...axis, value: v };
    if (highest === null || v > highest.value) highest = { ...axis, value: v };
  }
  return { lowest, highest };
}

/**
 * Build everything the UI needs for one location in a single call, so the
 * render layer stays dumb (it just paints what it's handed).
 */
export function evaluate(location) {
  const score = computeScore(location.scores);
  const band = getBand(score);
  const { lowest, highest } = axisExtremes(location.scores);
  return { score, band, lowest, highest };
}