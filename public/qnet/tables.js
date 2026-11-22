// SPDX-License-Identifier: MIT
//
// Constant lookup tables shared by the rules, evaluation and search.
//
// Boards and cells use the repo-wide numbering (docs/RULES.md): board b and cell c are both 0-8 in
// row-major order and a move is the flat index b * 9 + c. A local board is a 9-bit mask.

/** The 8 winning lines as 9-bit masks (rows, columns, diagonals). */
export const LINE_MASKS = Int32Array.from([0b000000111, 0b000111000, 0b111000000, 0b001001001, 0b010010010, 0b100100100, 0b100010001, 0b001010100]);

/** WIN[mask] = 1 when the 9-bit mask contains a complete line. */
export const WIN = new Uint8Array(512);
/** POP[mask] = number of set bits. */
export const POP = new Uint8Array(512);
for (let m = 0; m < 512; m++) {
  for (const line of LINE_MASKS) if ((m & line) === line) WIN[m] = 1;
  let n = 0;
  for (let i = 0; i < 9; i++) n += (m >> i) & 1;
  POP[m] = n;
}

export const MOVE_BOARD = new Uint8Array(81);
export const MOVE_CELL = new Uint8Array(81);
for (let m = 0; m < 81; m++) {
  MOVE_BOARD[m] = (m / 9) | 0;
  MOVE_CELL[m] = m % 9;
}

/**
 * WINCELLS[(a << 9) | b] = mask of empty cells where a player owning mask `a` (opponent `b`) would
 * complete a line. Only meaningful for disjoint a and b; other entries stay 0.
 */
export const WINCELLS = new Uint16Array(1 << 18);
for (let a = 0; a < 512; a++) {
  for (let b = 0; b < 512; b++) {
    if (a & b) continue;
    const empty = ~(a | b) & 511;
    let cells = 0;
    for (let c = 0; c < 9; c++) {
      const bit = 1 << c;
      if (empty & bit && WIN[a | bit]) cells |= bit;
    }
    WINCELLS[(a << 9) | b] = cells;
  }
}

/** mulberry32: seedable PRNG returning floats in [0, 1); same generator as the fixture scripts. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Zobrist keys as two independent 32-bit words (JS has no fast 64-bit integers). Fixed seed, so
// hashes are identical across runs, processes and machines.
const rng = mulberry32(0x6b79756e);
const word = () => (rng() * 4294967296) | 0;
export const Z_PIECE_LO = Int32Array.from({ length: 162 }, word); // [side * 81 + move]
export const Z_PIECE_HI = Int32Array.from({ length: 162 }, word);
export const Z_ACTIVE_LO = Int32Array.from({ length: 10 }, word); // active board 0-8, 9 = free
export const Z_ACTIVE_HI = Int32Array.from({ length: 10 }, word);
export const Z_SIDE_LO = word();
export const Z_SIDE_HI = word();
