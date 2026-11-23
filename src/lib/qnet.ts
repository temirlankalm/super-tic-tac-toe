import { GameState, Move } from '@/types/game';
import { isMoveValid } from './gameLogic';

/**
 * Client for the qnet engine: a Web Worker (public/qnet/worker.js) that runs a bitboard
 * alpha-beta search with a learned evaluation, entirely in the browser. Nothing is sent to a
 * server. Every failure path resolves to `null` so the caller can fall back to the built-in AI.
 */

const WORKER_URL = '/qnet/worker.js';
const FIRST_REQUEST_EXTRA_MS = 12000; // net download + start-up
const REPLY_GRACE_MS = 3000;
const MAX_FAILURES = 2;

/** Clock-based budget: the worker spends a share of the remaining time (see engine time.js). */
export interface QnetClock {
  timeLeftMs: number;
  incrementMs?: number;
  ply?: number;
  overheadMs?: number;
  maxMs?: number;
}

interface WorkerReply {
  id: number;
  move?: number;
  ready?: boolean;
  error?: string;
}

interface Pending {
  resolve: (reply: WorkerReply) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let worker: Worker | null = null;
let failures = 0;
let warmed = false;
let nextId = 1;
const pending = new Map<number, Pending>();

/** Compact text form shared with the engine: 81 cells | 9 boards | active | player | winner. */
export function toCompact(state: GameState): string {
  const cells = state.cells.map((board) => board.map((c) => c ?? '.').join('')).join('');
  const boards = state.boardWinners.map((w) => (w === null ? '.' : w === 'TIE' ? 'D' : w)).join('');
  const active = state.activeBoard === null ? '-' : String(state.activeBoard);
  return `${cells}|${boards}|${active}|${state.currentPlayer}|.`;
}

function failAll(reason: string): void {
  for (const [id, p] of pending) {
    clearTimeout(p.timer);
    p.reject(new Error(reason));
    pending.delete(id);
  }
}

function dropWorker(reason: string): void {
  failures += 1;
  worker?.terminate();
  worker = null;
  warmed = false;
  failAll(reason);
}

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined' || failures >= MAX_FAILURES) return null;
  if (worker) return worker;
  try {
    const w = new Worker(WORKER_URL, { type: 'module' });
    w.onmessage = (event: MessageEvent<WorkerReply>) => {
      const p = pending.get(event.data.id);
      if (!p) return;
      clearTimeout(p.timer);
      pending.delete(event.data.id);
      if (event.data.error) p.reject(new Error(event.data.error));
      else p.resolve(event.data);
    };
    w.onerror = () => dropWorker('qnet worker crashed');
    worker = w;
    return w;
  } catch {
    failures = MAX_FAILURES;
    return null;
  }
}

function request(message: Record<string, unknown>, timeoutMs: number): Promise<WorkerReply> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error('qnet worker unavailable'));
  return new Promise<WorkerReply>((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      dropWorker('qnet worker timed out');
      reject(new Error('qnet worker timed out'));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    w.postMessage({ id, ...message });
  });
}

/** Start loading the engine and its net (call when the user picks the qnet level). */
export function warmUpQnet(): void {
  if (warmed) return;
  warmed = true;
  request({ type: 'warmup' }, FIRST_REQUEST_EXTRA_MS).catch(() => {
    warmed = false;
  });
}

/**
 * Let the engine think about `state` (the human to move) until the next request. Fire and forget:
 * no reply, no timeout, and failures are ignored. Does nothing before the engine has loaded.
 */
export function ponderQnet(state: GameState): void {
  if (!warmed || !worker) return;
  try {
    worker.postMessage({ id: 0, type: 'ponder', state: toCompact(state) });
  } catch {
    // pondering is best-effort
  }
}

/**
 * Ask the engine for a move in `state`. `budget` is either a fixed thinking time in ms or the
 * engine's remaining clock. Resolves to `null` when the engine is unavailable, slow, or returns
 * something the site's own rules reject.
 */
export async function getQnetMove(state: GameState, budget: number | QnetClock): Promise<Move | null> {
  try {
    const extra = warmed ? 0 : FIRST_REQUEST_EXTRA_MS;
    const message =
      typeof budget === 'number'
        ? { type: 'move', state: toCompact(state), timeMs: budget }
        : { type: 'move', state: toCompact(state), clock: budget };
    const waitMs = typeof budget === 'number' ? budget : Math.min(budget.maxMs ?? budget.timeLeftMs, budget.timeLeftMs);
    const reply = await request(message, waitMs + REPLY_GRACE_MS + extra);
    warmed = true;
    if (typeof reply.move !== 'number') return null;
    const boardIdx = Math.floor(reply.move / 9);
    const cellIdx = reply.move % 9;
    if (!isMoveValid(state, boardIdx, cellIdx)) return null;
    return { boardIdx, cellIdx, player: state.currentPlayer };
  } catch {
    return null;
  }
}
