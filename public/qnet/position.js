// SPDX-License-Identifier: MIT
//
// Mutable bitboard position with make/unmake. The rules are exactly docs/RULES.md (and the web
// game's own gameLogic.ts); tests replay the shared parity fixtures through this class.

import {
  MOVE_BOARD, MOVE_CELL, POP, WIN,
  Z_ACTIVE_HI, Z_ACTIVE_LO, Z_PIECE_HI, Z_PIECE_LO, Z_SIDE_HI, Z_SIDE_LO,
} from './tables.js';

export const FREE = 9; // `active` value meaning "any open board"
export const ONGOING = -1;
export const X_WINS = 0;
export const O_WINS = 1;
export const DRAWN = 2;
const STACK_WIDTH = 8;
const MAX_STACK = 96;

/** Result of a game whose every board is closed: line of boards already handled by the caller. */
function countWinner(wonX, wonO) {
  const x = POP[wonX];
  const o = POP[wonO];
  return x === o ? DRAWN : x > o ? X_WINS : O_WINS;
}

export class Position {
  constructor() {
    /** bb[side * 9 + board] = 9-bit mask of that side's marks on that board (side 0 = X). */
    this.bb = new Uint16Array(18);
    /** won[side] = mask of boards won by side. */
    this.won = new Int32Array(2);
    this.drawn = 0; // mask of full boards with no line
    this.active = FREE;
    this.side = 0; // side to move: 0 = X, 1 = O
    this.winner = ONGOING;
    this.hashLo = 0;
    this.hashHi = 0;
    this.sp = 0;
    this.stack = new Int32Array(MAX_STACK * STACK_WIDTH);
    this.#rehash();
  }

  /** Mask of closed (won or drawn) boards. */
  get closed() {
    return this.won[0] | this.won[1] | this.drawn;
  }

  #rehash() {
    let lo = Z_ACTIVE_LO[this.active] ^ (this.side ? Z_SIDE_LO : 0);
    let hi = Z_ACTIVE_HI[this.active] ^ (this.side ? Z_SIDE_HI : 0);
    for (let side = 0; side < 2; side++) {
      for (let b = 0; b < 9; b++) {
        for (let c = 0; c < 9; c++) {
          if ((this.bb[side * 9 + b] >> c) & 1) {
            lo ^= Z_PIECE_LO[side * 81 + b * 9 + c];
            hi ^= Z_PIECE_HI[side * 81 + b * 9 + c];
          }
        }
      }
    }
    this.hashLo = lo;
    this.hashHi = hi;
  }

  /**
   * Parse `<81 cells .XO>|<9 boards .XOD>|<active digit or ->|<X|O>|<winner .XOD>`. Board and
   * game results are recomputed from the cells (the text's copies are not trusted).
   */
  static fromCompact(text) {
    const parts = text.split('|');
    if (parts.length !== 5 || parts[0].length !== 81) throw new Error(`bad compact state: ${text}`);
    const pos = new Position();
    for (let i = 0; i < 81; i++) {
      const ch = parts[0][i];
      if (ch === '.') continue;
      if (ch !== 'X' && ch !== 'O') throw new Error(`bad cell ${ch}`);
      pos.bb[(ch === 'X' ? 0 : 9) + ((i / 9) | 0)] |= 1 << i % 9;
    }
    for (let b = 0; b < 9; b++) {
      const x = pos.bb[b];
      const o = pos.bb[9 + b];
      if (WIN[x]) pos.won[0] |= 1 << b;
      else if (WIN[o]) pos.won[1] |= 1 << b;
      else if ((x | o) === 511) pos.drawn |= 1 << b;
    }
    if (WIN[pos.won[0]]) pos.winner = X_WINS;
    else if (WIN[pos.won[1]]) pos.winner = O_WINS;
    else if (pos.closed === 511) pos.winner = countWinner(pos.won[0], pos.won[1]);
    if (parts[3] !== 'X' && parts[3] !== 'O') throw new Error(`bad player ${parts[3]}`);
    pos.side = parts[3] === 'X' ? 0 : 1;
    const a = parts[2] === '-' ? FREE : Number(parts[2]);
    if (!(a === FREE || (Number.isInteger(a) && a >= 0 && a < 9))) throw new Error(`bad active ${parts[2]}`);
    // A stale pointer at a closed board, or a finished game, means free choice (as in the rules).
    pos.active = pos.winner !== ONGOING || (pos.closed >> a) & 1 ? FREE : a;
    pos.#rehash();
    return pos;
  }

  toCompact() {
    let cells = '';
    for (let b = 0; b < 9; b++) {
      for (let c = 0; c < 9; c++) {
        cells += (this.bb[b] >> c) & 1 ? 'X' : (this.bb[9 + b] >> c) & 1 ? 'O' : '.';
      }
    }
    let boards = '';
    for (let b = 0; b < 9; b++) {
      boards += (this.won[0] >> b) & 1 ? 'X' : (this.won[1] >> b) & 1 ? 'O' : (this.drawn >> b) & 1 ? 'D' : '.';
    }
    const active = this.active === FREE ? '-' : String(this.active);
    const winner = ['.', 'X', 'O', 'D'][this.winner + 1] ?? '.';
    // winner index: -1 -> '.', 0 -> X, 1 -> O, 2 -> D
    return `${cells}|${boards}|${active}|${this.side ? 'O' : 'X'}|${winner}`;
  }

  /**
   * Write the legal moves (flat indices, ascending) to buf[off...]; returns how many.
   * @param {Int32Array} buf
   * @param {number} off
   */
  generate(buf, off) {
    if (this.winner !== ONGOING) return 0;
    let boards = this.active !== FREE ? 1 << this.active : ~this.closed & 511;
    let n = off;
    while (boards) {
      const lsb = boards & -boards;
      boards ^= lsb;
      const b = 31 - Math.clz32(lsb);
      let empty = ~(this.bb[b] | this.bb[9 + b]) & 511;
      while (empty) {
        const bit = empty & -empty;
        empty ^= bit;
        buf[n++] = b * 9 + 31 - Math.clz32(bit);
      }
    }
    return n - off;
  }

  /** Play a LEGAL move (callers must only pass generated moves). */
  make(move) {
    const side = this.side;
    const b = MOVE_BOARD[move];
    const c = MOVE_CELL[move];
    const st = this.stack;
    const sp = this.sp * STACK_WIDTH;
    st[sp] = this.active;
    st[sp + 1] = this.won[0];
    st[sp + 2] = this.won[1];
    st[sp + 3] = this.drawn;
    st[sp + 4] = this.winner;
    st[sp + 5] = this.hashLo;
    st[sp + 6] = this.hashHi;
    st[sp + 7] = move;
    this.sp++;

    const nb = this.bb[side * 9 + b] | (1 << c);
    this.bb[side * 9 + b] = nb;
    let wonLine = false;
    if (WIN[nb]) {
      this.won[side] |= 1 << b;
      wonLine = true;
    } else if ((nb | this.bb[(side ^ 1) * 9 + b]) === 511) {
      this.drawn |= 1 << b;
    }

    const closed = this.won[0] | this.won[1] | this.drawn;
    let winner = ONGOING;
    if (wonLine && WIN[this.won[side]]) winner = side;
    else if (closed === 511) winner = countWinner(this.won[0], this.won[1]);
    const active = winner !== ONGOING || (closed >> c) & 1 ? FREE : c;

    this.hashLo ^= Z_PIECE_LO[side * 81 + move] ^ Z_ACTIVE_LO[st[sp]] ^ Z_ACTIVE_LO[active] ^ Z_SIDE_LO;
    this.hashHi ^= Z_PIECE_HI[side * 81 + move] ^ Z_ACTIVE_HI[st[sp]] ^ Z_ACTIVE_HI[active] ^ Z_SIDE_HI;
    this.winner = winner;
    this.active = active;
    this.side = side ^ 1;
  }

  unmake() {
    this.sp--;
    const st = this.stack;
    const sp = this.sp * STACK_WIDTH;
    const move = st[sp + 7];
    this.side ^= 1;
    this.bb[this.side * 9 + MOVE_BOARD[move]] &= ~(1 << MOVE_CELL[move]);
    this.active = st[sp];
    this.won[0] = st[sp + 1];
    this.won[1] = st[sp + 2];
    this.drawn = st[sp + 3];
    this.winner = st[sp + 4];
    this.hashLo = st[sp + 5];
    this.hashHi = st[sp + 6];
  }

  /** Number of empty cells on open boards (upper bound on remaining plies). */
  get playableCells() {
    let n = 0;
    let open = ~this.closed & 511;
    while (open) {
      const lsb = open & -open;
      open ^= lsb;
      const b = 31 - Math.clz32(lsb);
      n += 9 - POP[this.bb[b] | this.bb[9 + b]];
    }
    return n;
  }
}

/** Number of leaf positions after `depth` plies (move-generation correctness check). */
export function perft(pos, depth, buf = new Int32Array(96 * 81), ply = 0) {
  if (depth === 0 || pos.winner !== ONGOING) return 1;
  const n = pos.generate(buf, ply * 81);
  let total = 0;
  for (let i = 0; i < n; i++) {
    pos.make(buf[ply * 81 + i]);
    total += perft(pos, depth - 1, buf, ply + 1);
    pos.unmake();
  }
  return total;
}

/**
 * The same position seen through one of the 8 symmetries of the 9x9 grid (rotations and a
 * reflection). Ultimate tic-tac-toe is invariant under all of them, so this is exact data
 * augmentation: legal moves, outcomes and evaluations correspond one-to-one.
 * @param {Position} pos
 * @param {number} t 0-7: bits 0-1 = quarter turns, bit 2 = mirror first
 */
export function symmetric(pos, t) {
  const map = (r, c, n) => {
    if (t & 4) c = n - 1 - c;
    for (let k = 0; k < (t & 3); k++) [r, c] = [c, n - 1 - r];
    return [r, c];
  };
  const cells = new Array(81).fill('.');
  for (let b = 0; b < 9; b++) {
    for (let c = 0; c < 9; c++) {
      const ch = (pos.bb[b] >> c) & 1 ? 'X' : (pos.bb[9 + b] >> c) & 1 ? 'O' : '.';
      if (ch === '.') continue;
      const [r2, c2] = map(3 * ((b / 3) | 0) + ((c / 3) | 0), 3 * (b % 3) + (c % 3), 9);
      cells[9 * (3 * ((r2 / 3) | 0) + ((c2 / 3) | 0)) + 3 * (r2 % 3) + (c2 % 3)] = ch;
    }
  }
  let active = '-';
  if (pos.active !== FREE) {
    const [r2, c2] = map((pos.active / 3) | 0, pos.active % 3, 3);
    active = String(3 * r2 + c2);
  }
  return Position.fromCompact(`${cells.join('')}|${'.'.repeat(9)}|${active}|${pos.side ? 'O' : 'X'}|.`);
}
