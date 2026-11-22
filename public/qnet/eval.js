// SPDX-License-Identifier: MIT
//
// Static evaluation. Hand-written features whose weights live in one parameter object, so they can
// be tuned by self-play (tools/tune.mjs) without touching the code. Scores are integers from the
// side to move's point of view; |score| stays far below the mate range used by the search.

import { FREE } from './position.js';
import { LINE_MASKS, POP, WINCELLS } from './tables.js';

/** Default weights. Names describe what each rewards; see buildLocalTable / evaluate. */
export const DEFAULT_PARAMS = Object.freeze({
  boardCentre: 4, // importance multiplier of the centre board (4 lines through it)
  boardCorner: 3, // corners (3 lines)
  boardEdge: 2, // edges (2 lines)
  ownBoard: 100, // owning a local board, times its importance
  localSingle: 1, // one mark on a line nobody else touches, inside an open board
  localPair: 6, // two marks and the third cell empty
  localFork: 12, // two or more such pairs in one board
  localCentre: 2, // owning the centre cell of an open board
  localCorner: 1,
  globalSingle: 8, // one won board on a line nobody else touches
  globalPair: 60, // two won boards and the third board still open
  globalFork: 45, // two or more such pairs
  freeChoice: 14, // the side to move may play anywhere
  sentWin: 18, // the side to move can win the board it was sent to (times its importance)
  sentBlockNeeded: 10, // the side to move is sent to a board where the opponent threatens to win
});

const CELL_CENTRE = 4;
const CELL_CORNERS = [0, 2, 6, 8];

/** Value of an open local board from X's point of view, for every (xMask << 9 | oMask). */
function buildLocalTable(p) {
  const table = new Int16Array(1 << 18);
  for (let x = 0; x < 512; x++) {
    for (let o = 0; o < 512; o++) {
      if (x & o) continue;
      let v = 0;
      let pairsX = 0;
      let pairsO = 0;
      for (const line of LINE_MASKS) {
        const lx = POP[line & x];
        const lo = POP[line & o];
        if (lo === 0 && lx > 0) {
          if (lx === 2) {
            v += p.localPair;
            pairsX++;
          } else v += p.localSingle;
        } else if (lx === 0 && lo > 0) {
          if (lo === 2) {
            v -= p.localPair;
            pairsO++;
          } else v -= p.localSingle;
        }
      }
      if (pairsX >= 2) v += p.localFork;
      if (pairsO >= 2) v -= p.localFork;
      if (x & (1 << CELL_CENTRE)) v += p.localCentre;
      else if (o & (1 << CELL_CENTRE)) v -= p.localCentre;
      for (const c of CELL_CORNERS) {
        if (x & (1 << c)) v += p.localCorner;
        else if (o & (1 << c)) v -= p.localCorner;
      }
      table[(x << 9) | o] = v;
    }
  }
  return table;
}

export class Evaluator {
  /** @param {Partial<typeof DEFAULT_PARAMS>} [overrides] */
  constructor(overrides = {}) {
    const p = { ...DEFAULT_PARAMS, ...overrides };
    this.params = p;
    this.local = buildLocalTable(p);
    // importance of each board: corners, edges, centre
    this.weight = Int32Array.from([
      p.boardCorner, p.boardEdge, p.boardCorner,
      p.boardEdge, p.boardCentre, p.boardEdge,
      p.boardCorner, p.boardEdge, p.boardCorner,
    ]);
  }

  /** Score for the side to move (positive = good for them). Not called on terminal positions. */
  evaluate(pos) {
    const p = this.params;
    const bb = pos.bb;
    const wonX = pos.won[0];
    const wonO = pos.won[1];
    const drawn = pos.drawn;
    const weight = this.weight;
    let s = 0;
    for (let b = 0; b < 9; b++) {
      const bit = 1 << b;
      if (wonX & bit) s += p.ownBoard * weight[b];
      else if (wonO & bit) s -= p.ownBoard * weight[b];
      else if (!(drawn & bit)) s += this.local[(bb[b] << 9) | bb[9 + b]] * weight[b];
    }
    let pairsX = 0;
    let pairsO = 0;
    for (let i = 0; i < 8; i++) {
      const line = LINE_MASKS[i];
      if (line & drawn) continue;
      const lx = POP[line & wonX];
      const lo = POP[line & wonO];
      if (lo === 0 && lx > 0) {
        if (lx === 2) {
          s += p.globalPair;
          pairsX++;
        } else s += p.globalSingle;
      } else if (lx === 0 && lo > 0) {
        if (lo === 2) {
          s -= p.globalPair;
          pairsO++;
        } else s -= p.globalSingle;
      }
    }
    if (pairsX >= 2) s += p.globalFork;
    if (pairsO >= 2) s -= p.globalFork;

    const me = pos.side;
    let tempo = 0;
    const a = pos.active;
    if (a === FREE) tempo = p.freeChoice;
    else {
      const mine = bb[me * 9 + a];
      const theirs = bb[(me ^ 1) * 9 + a];
      if (WINCELLS[(mine << 9) | theirs]) tempo += p.sentWin * weight[a];
      else if (WINCELLS[(theirs << 9) | mine]) tempo -= p.sentBlockNeeded * weight[a];
    }
    return me === 0 ? s + tempo : -s + tempo;
  }
}
