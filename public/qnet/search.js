// SPDX-License-Identifier: MIT
//
// Alpha-beta search: iterative deepening with aspiration windows, principal-variation search, a
// two-way transposition table, killer + history move ordering and late-move reductions.
//
// Scores are from the side to move's point of view. A forced game result scores MATE - ply (win)
// or -(MATE - ply) (loss), so faster wins and slower losses are preferred. A drawn game is 0.

import { Evaluator } from './eval.js';
import { FREE, ONGOING, Position } from './position.js';
import { MOVE_BOARD, MOVE_CELL, POP, WIN, WINCELLS } from './tables.js';

export const MATE = 30000;
export const MATE_BOUND = MATE - 200;
const INF = 31000;
const MAX_PLY = 96;
const NO_MOVE = 127;
const FORCED_MS = 50; // search budget when only one move is legal
const FORCED_NODES = 300_000;

const EXACT = 0;
const LOWER = 1;
const UPPER = 2;

// Move-ordering scores (higher is searched first).
const ORD_TT = 10_000_000;
const ORD_GAME_WIN = 1_000_000;
const ORD_BOARD_WIN = 20_000;
const ORD_BLOCK = 8_000;
const ORD_KILLER = 4_000;
const QUIET_LIMIT = 5_000; // anything below this may be reduced
const PEN_FREE_CHOICE = 3_000;
const PEN_GIVES_BOARD = 6_000;
const CELL_BONUS = Int32Array.from([15, 5, 15, 5, 30, 5, 15, 5, 15]);

class Aborted extends Error {}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class Searcher {
  /**
   * @param {{evaluator?: Evaluator, ttBits?: number, lmr?: boolean, leafWin?: boolean}} [opts]
   *   leafWin: score leaves where the mover can win the game on the spot as mates (default on).
   */
  constructor({ evaluator = new Evaluator(), ttBits = 22, lmr = true, leafWin = true } = {}) {
    this.evaluator = evaluator;
    this.lmr = lmr;
    this.leafWin = leafWin;
    this.ttMask = (1 << ttBits) - 1;
    this.ttKey = new Int32Array(1 << ttBits);
    this.ttData = new Int32Array(1 << ttBits);
    this.moves = new Int32Array(MAX_PLY * 81);
    this.scores = new Int32Array(MAX_PLY * 81);
    this.killers = new Int32Array(MAX_PLY * 2).fill(-1);
    this.history = new Int32Array(162);
    this.pos = new Position();
    this.nodes = 0;
    this.deadline = Infinity;
    this.nodeLimit = Infinity;
    this.rootDone = false;
    this.partial = null;
    this.lastOrigAlpha = 0;
  }

  clearTT() {
    this.ttKey.fill(0);
    this.ttData.fill(0);
  }

  // -- transposition table ---------------------------------------------------------------

  #probe() {
    const pos = this.pos;
    const i = pos.hashLo & this.ttMask;
    if (this.ttKey[i] === pos.hashHi && this.ttData[i] !== 0) return this.ttData[i];
    const j = i ^ 1;
    if (this.ttKey[j] === pos.hashHi && this.ttData[j] !== 0) return this.ttData[j];
    return 0;
  }

  #store(depth, flag, score, move, ply) {
    const pos = this.pos;
    if (score >= MATE_BOUND) score += ply;
    else if (score <= -MATE_BOUND) score -= ply;
    const data = ((score + 32768) & 0xffff) | (Math.min(depth, 63) << 16) | (flag << 22) | ((move < 0 ? NO_MOVE : move) << 24);
    const i = pos.hashLo & this.ttMask;
    const j = i ^ 1;
    let slot;
    if (this.ttKey[i] === pos.hashHi) slot = i;
    else if (this.ttKey[j] === pos.hashHi) slot = j;
    else slot = ((this.ttData[i] >> 16) & 63) <= ((this.ttData[j] >> 16) & 63) ? i : j; // keep the deeper entry
    this.ttKey[slot] = pos.hashHi;
    this.ttData[slot] = data;
  }

  // -- move ordering ---------------------------------------------------------------------

  #scoreMoves(off, n, ttMove, ply) {
    const pos = this.pos;
    const me = pos.side;
    const bb = pos.bb;
    const closed = pos.closed;
    const k0 = this.killers[ply * 2];
    const k1 = this.killers[ply * 2 + 1];
    const moves = this.moves;
    const scores = this.scores;
    for (let i = off; i < off + n; i++) {
      const move = moves[i];
      if (move === ttMove) {
        scores[i] = ORD_TT;
        continue;
      }
      const b = MOVE_BOARD[move];
      const c = MOVE_CELL[move];
      const mine = bb[me * 9 + b];
      const theirs = bb[(me ^ 1) * 9 + b];
      let sc = CELL_BONUS[c];
      const winsBoard = (WINCELLS[(mine << 9) | theirs] >> c) & 1;
      if (winsBoard) {
        sc += ORD_BOARD_WIN;
        if (WIN[pos.won[me] | (1 << b)]) sc += ORD_GAME_WIN;
      } else {
        if ((WINCELLS[(theirs << 9) | mine] >> c) & 1) sc += ORD_BLOCK;
        if (move === k0 || move === k1) sc += ORD_KILLER;
        sc += this.history[me * 81 + move];
      }
      // Where does this move send the opponent?
      if ((closed >> c) & 1 || (winsBoard && c === b)) sc -= PEN_FREE_CHOICE;
      else if (WINCELLS[(bb[(me ^ 1) * 9 + c] << 9) | bb[me * 9 + c]]) sc -= PEN_GIVES_BOARD;
      scores[i] = sc;
    }
  }

  // -- search ----------------------------------------------------------------------------

  /**
   * True when the side to move can win the game with its next move: by completing a line of
   * boards, or by closing the last open board while ahead on boards won (the count tiebreak).
   */
  #canWinNow() {
    const pos = this.pos;
    const me = pos.side;
    const bb = pos.bb;
    const won = pos.won[me];
    const open = ~pos.closed & 511;
    const boards = pos.active !== FREE ? 1 << pos.active : open;
    for (let b = 0; b < 9; b++) {
      if ((boards >> b) & 1 && WIN[won | (1 << b)] === 1 && WINCELLS[(bb[me * 9 + b] << 9) | bb[(me ^ 1) * 9 + b]] !== 0) return true;
    }
    if (POP[open] !== 1) return false;
    // One open board left: whoever closes it ends the game, decided by boards won.
    const b = 31 - Math.clz32(open);
    const mine = bb[me * 9 + b];
    const theirs = bb[(me ^ 1) * 9 + b];
    const lead = POP[won] - POP[pos.won[me ^ 1]];
    if (WINCELLS[(mine << 9) | theirs] !== 0) return lead + 1 > 0;
    return POP[mine | theirs] === 8 && lead > 0; // filling the last cell draws the board
  }

  #timeUp() {
    return now() > this.deadline;
  }

  #negamax(depth, alpha, beta, ply) {
    const pos = this.pos;
    if (pos.winner !== ONGOING) {
      if (pos.winner === 2) return 0;
      return pos.winner === pos.side ? MATE - ply : -(MATE - ply);
    }
    if ((++this.nodes & 1023) === 0 && (this.#timeUp() || this.nodes > this.nodeLimit)) throw new Aborted();
    if (depth <= 0 || ply >= MAX_PLY - 1) {
      // A leaf where the mover can complete a line of boards is a forced win one ply away: score
      // it exactly instead of trusting the static evaluation.
      if (this.leafWin && this.#canWinNow()) return MATE - ply - 1;
      return this.evaluator.evaluate(pos);
    }

    // mate-distance pruning
    if (alpha < -MATE + ply) alpha = -MATE + ply;
    if (beta > MATE - ply - 1) beta = MATE - ply - 1;
    if (alpha >= beta) return alpha;

    let ttMove = -1;
    const entry = this.#probe();
    if (entry !== 0) {
      const eDepth = (entry >> 16) & 63;
      const flag = (entry >> 22) & 3;
      const m = (entry >> 24) & 127;
      if (m !== NO_MOVE) ttMove = m;
      if (eDepth >= depth) {
        let s = (entry & 0xffff) - 32768;
        if (s >= MATE_BOUND) s -= ply;
        else if (s <= -MATE_BOUND) s += ply;
        if (flag === EXACT) return s;
        if (flag === LOWER) {
          if (s > alpha) alpha = s;
        } else if (s < beta) beta = s;
        if (alpha >= beta) return s;
      }
    }

    const off = ply * 81;
    const n = pos.generate(this.moves, off);
    this.#scoreMoves(off, n, ttMove, ply);

    const origAlpha = alpha;
    let best = -INF;
    let bestMove = -1;
    const moves = this.moves;
    const scores = this.scores;
    for (let i = 0; i < n; i++) {
      // selection sort step: bring the best remaining move to slot i
      let bi = off + i;
      for (let j = bi + 1; j < off + n; j++) if (scores[j] > scores[bi]) bi = j;
      const sc = scores[bi];
      const move = moves[bi];
      if (bi !== off + i) {
        moves[bi] = moves[off + i];
        scores[bi] = scores[off + i];
        moves[off + i] = move;
        scores[off + i] = sc;
      }

      pos.make(move);
      let score;
      if (i === 0) {
        score = -this.#negamax(depth - 1, -beta, -alpha, ply + 1);
      } else {
        let r = 0;
        if (this.lmr && depth >= 3 && i >= 3 && sc < QUIET_LIMIT) r = i >= 8 && depth >= 5 ? 2 : 1;
        score = -this.#negamax(depth - 1 - r, -alpha - 1, -alpha, ply + 1);
        if (score > alpha && r > 0) score = -this.#negamax(depth - 1, -alpha - 1, -alpha, ply + 1);
        if (score > alpha && score < beta) score = -this.#negamax(depth - 1, -beta, -alpha, ply + 1);
      }
      pos.unmake();

      if (score > best) {
        best = score;
        bestMove = move;
        if (score > alpha) {
          alpha = score;
          if (alpha >= beta) {
            if (sc < QUIET_LIMIT) this.#rewardQuiet(move, depth, ply);
            break;
          }
        }
      }
    }

    this.#store(depth, best <= origAlpha ? UPPER : best >= beta ? LOWER : EXACT, best, bestMove, ply);
    return best;
  }

  #rewardQuiet(move, depth, ply) {
    const k = ply * 2;
    if (this.killers[k] !== move) {
      this.killers[k + 1] = this.killers[k];
      this.killers[k] = move;
    }
    const h = this.pos.side * 81 + move;
    this.history[h] = Math.min(this.history[h] + depth * depth, 3_000);
  }

  /** Root search over an explicit, ordered move list; returns [bestMove, score]. */
  #root(rootMoves, depth, alpha, beta) {
    const pos = this.pos;
    let best = -INF;
    let bestIdx = 0;
    const origAlpha = alpha;
    for (let i = 0; i < rootMoves.length; i++) {
      pos.make(rootMoves[i]);
      let score;
      if (i === 0) score = -this.#negamax(depth - 1, -beta, -alpha, 1);
      else {
        score = -this.#negamax(depth - 1, -alpha - 1, -alpha, 1);
        if (score > alpha && score < beta) score = -this.#negamax(depth - 1, -beta, -alpha, 1);
      }
      pos.unmake();
      this.rootDone = true;
      if (score > best) {
        best = score;
        bestIdx = i;
        this.partial = { move: rootMoves[i], score };
        if (score > alpha) alpha = score;
        if (alpha >= beta) break;
      }
    }
    this.lastOrigAlpha = origAlpha;
    return [bestIdx, best];
  }

  /**
   * Choose a move. Searches at most `depth` plies, `timeMs` milliseconds and `nodes` nodes (the
   * last iteration that finishes wins; a partially searched one counts if its first move, the
   * previous best, completed).
   * @param {Position} root
   * @param {{depth?: number, timeMs?: number, nodes?: number}} [limits]
   */
  think(root, { depth = 64, timeMs = Infinity, nodes = Infinity } = {}) {
    if (root.winner !== ONGOING) throw new Error('no legal moves: the game is over');
    const start = now();
    this.deadline = start + timeMs;
    this.nodeLimit = nodes;
    this.nodes = 0;
    this.killers.fill(-1);
    for (let i = 0; i < this.history.length; i++) this.history[i] >>= 1;

    // The search works on a private copy so callers' positions are never mutated.
    this.pos = Position.fromCompact(root.toCompact());
    const buf = new Int32Array(81);
    const count = this.pos.generate(buf, 0);
    let rootMoves = Array.from(buf.subarray(0, count));
    // A forced move still gets a short search, so the reported score is real (not a fake 0) and
    // the transposition table is warm for the next move.
    const forced = count === 1;
    if (forced) {
      this.deadline = start + Math.min(timeMs, FORCED_MS);
      this.nodeLimit = Math.min(nodes, FORCED_NODES);
    }

    // initial order: same heuristic as inner nodes, TT move first
    this.moves.set(rootMoves, 0);
    const entry = this.#probe();
    const ttMove = entry !== 0 && ((entry >> 24) & 127) !== NO_MOVE ? (entry >> 24) & 127 : -1;
    this.#scoreMoves(0, count, ttMove, 0);
    const order = rootMoves.map((m, i) => [this.scores[i], m]).sort((a, b) => b[0] - a[0]);
    rootMoves = order.map(([, m]) => m);

    let result = { move: rootMoves[0], score: 0, depth: 0 };
    for (let d = 1; d <= depth; d++) {
      this.rootDone = false;
      this.partial = null;
      try {
        let alpha = -INF;
        let beta = INF;
        let delta = 40;
        if (d >= 5 && Math.abs(result.score) < MATE_BOUND) {
          alpha = result.score - delta;
          beta = result.score + delta;
        }
        let idx;
        let score;
        for (;;) {
          [idx, score] = this.#root(rootMoves, d, alpha, beta);
          if (score <= alpha && alpha > -INF) {
            alpha = Math.max(-INF, alpha - delta * 3);
          } else if (score >= beta && beta < INF) {
            beta = Math.min(INF, beta + delta * 3);
          } else break;
          delta *= 2;
        }
        const move = rootMoves[idx];
        rootMoves.splice(idx, 1);
        rootMoves.unshift(move);
        result = { move, score, depth: d };
        if (Math.abs(score) >= MATE_BOUND) break; // a forced result: deeper search cannot change it
      } catch (err) {
        if (!(err instanceof Aborted)) throw err;
        if (this.rootDone && this.partial && this.partial.move !== result.move) {
          result = { move: this.partial.move, score: this.partial.score, depth: result.depth };
        }
        break;
      }
      if (now() > this.deadline) break;
    }
    const ms = now() - start;
    return { ...result, nodes: this.nodes, ms, forced };
  }
}

export { FREE };
