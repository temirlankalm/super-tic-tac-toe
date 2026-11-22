// SPDX-License-Identifier: MIT
//
// Sparse input features for the learned evaluation (mover-relative: "mine" is the side to move).
// Feature ids index rows of one embedding table; the layout is versioned so trained weights and
// this code can be checked against each other (FEATURE_SPEC is stored in every weights file).
//
//   local  : 9 boards x 19,686 ids  base-3 pattern of the board (cells: empty/mine/theirs), or one
//                                   of 3 ids (mine won / theirs won / drawn) for a closed board
//   global : 262,144 ids            base-4 pattern of the nine board results (open/mine/theirs/drawn)
//   sent   : 9 x 19,686 + 1 ids     board the mover is sent to x that board's local pattern; the
//                                   last id means "free choice"

import { FREE } from './position.js';
import { POP } from './tables.js';

export const LOCAL_PATTERNS = 19683 + 3; // 3^9 cell patterns + 3 closed-board ids
export const NUM_FEATURES_PER_POSITION = 11;
const LOCAL_BASE = 0;
const GLOBAL_BASE = 9 * LOCAL_PATTERNS;
const SENT_BASE = GLOBAL_BASE + 262144;
export const NUM_FEATURES = SENT_BASE + 9 * LOCAL_PATTERNS + 1;
export const FEATURE_SPEC = `kyunet-features-v1:local9x${LOCAL_PATTERNS}+global4^9+sent9x${LOCAL_PATTERNS}+1`;

const CLOSED_MINE = 19683;
const CLOSED_THEIRS = 19684;
const CLOSED_DRAWN = 19685;

// P3[(mine << 9) | theirs] = base-3 pattern (empty 0, mine 1, theirs 2) of a local board.
const P3 = new Uint16Array(1 << 18);
for (let a = 0; a < 512; a++) {
  for (let b = 0; b < 512; b++) {
    if (a & b) continue;
    let v = 0;
    let pow = 1;
    for (let i = 0; i < 9; i++) {
      v += pow * ((a >> i) & 1 ? 1 : (b >> i) & 1 ? 2 : 0);
      pow *= 3;
    }
    P3[(a << 9) | b] = v;
  }
}
// base-4 digit tables for the board-result pattern
const G_MINE = new Uint32Array(512);
const G_THEIRS = new Uint32Array(512);
const G_DRAWN = new Uint32Array(512);
for (let m = 0; m < 512; m++) {
  for (let i = 0; i < 9; i++) {
    if ((m >> i) & 1) {
      G_MINE[m] += 4 ** i;
      G_THEIRS[m] += 2 * 4 ** i;
      G_DRAWN[m] += 3 * 4 ** i;
    }
  }
}

/**
 * Write the NUM_FEATURES_PER_POSITION feature ids of `pos` (relative to the side to move) into
 * out[0..10]. Terminal positions are not meaningful inputs.
 * @param {import('./position.mjs').Position} pos
 * @param {Int32Array} out
 */
export function extractFeatures(pos, out) {
  const me = pos.side;
  const bb = pos.bb;
  const wonMine = pos.won[me];
  const wonTheirs = pos.won[me ^ 1];
  const drawn = pos.drawn;
  for (let b = 0; b < 9; b++) {
    const bit = 1 << b;
    let p;
    if (wonMine & bit) p = CLOSED_MINE;
    else if (wonTheirs & bit) p = CLOSED_THEIRS;
    else if (drawn & bit) p = CLOSED_DRAWN;
    else p = P3[(bb[me * 9 + b] << 9) | bb[(me ^ 1) * 9 + b]];
    out[b] = LOCAL_BASE + b * LOCAL_PATTERNS + p;
    if (b === pos.active) out[10] = SENT_BASE + b * LOCAL_PATTERNS + p;
  }
  out[9] = GLOBAL_BASE + G_MINE[wonMine] + G_THEIRS[wonTheirs] + G_DRAWN[drawn];
  if (pos.active === FREE) out[10] = NUM_FEATURES - 1;
}

export { POP };
