// SPDX-License-Identifier: MIT
//
// Web Worker entry: loads the net once, then answers messages from the page.
//
//   {id, state, timeMs}            search for timeMs (default 1000) and reply {id, move, score, ...}
//   {id, state, clock}             same, but the budget comes from the clock:
//                                  clock = {timeLeftMs, incrementMs?, ply?, overheadMs?, maxMs?}
//   {id, type: 'ponder', state}    think about `state` (the opponent to move) in the background
//                                  until the next message arrives; no reply. Fills the
//                                  transposition table so the next real search starts deeper.
//   {id, type: 'warmup'}           load the net and reply {id, ready: true}
//
// `state` is the compact text form (see docs/RULES.md). Any failure is reported as {id, error};
// the page then falls back to the site's built-in AI.

import { NetEvaluator, Position, Searcher, allocateTime } from './index.js';

const PONDER_SLICE_MS = 60; // the worker answers a real request at most this late while pondering
const PONDER_MAX_MS = 20_000; // stop pondering after this long (an idle human should not cost battery)

let ready = null;
let searcher = null;
let ponderToken = 0;

async function init() {
  const base = new URL('./', import.meta.url);
  const meta = await (await fetch(new URL('net.json', base))).json();
  const res = await fetch(new URL(`net.bin?v=${String(meta.sha256).slice(0, 12)}`, base));
  if (!res.ok) throw new Error(`net.bin: HTTP ${res.status}`);
  searcher = new Searcher({ evaluator: new NetEvaluator(meta, await res.arrayBuffer()), ttBits: 20 });
}

/** One ponder slice, then yield to the event loop so a new message can stop us. */
function ponderSlice(pos, token, until) {
  if (token !== ponderToken || performance.now() > until) return;
  let r;
  try {
    r = searcher.think(pos, { timeMs: PONDER_SLICE_MS, depth: 40 });
  } catch {
    return; // pondering is best-effort
  }
  if (r.forced || r.depth >= 40) return;
  setTimeout(() => ponderSlice(pos, token, until), 0);
}

self.onmessage = async (event) => {
  const { id, type, state, timeMs, clock } = event.data;
  ponderToken++; // any message stops a running ponder after its current slice
  try {
    ready ??= init();
    await ready;
    if (type === 'warmup') {
      self.postMessage({ id, ready: true });
      return;
    }
    const pos = Position.fromCompact(state);
    if (type === 'ponder') {
      if (pos.winner === -1) ponderSlice(pos, ponderToken, performance.now() + PONDER_MAX_MS);
      return;
    }
    const budget = clock ? Math.min(allocateTime(clock), clock.maxMs ?? Infinity) : (timeMs ?? 1000);
    const r = searcher.think(pos, { timeMs: budget, depth: 40 });
    self.postMessage({ id, move: r.move, score: r.score, depth: r.depth, nodes: r.nodes, forced: r.forced, budgetMs: budget });
  } catch (err) {
    if (type !== 'ponder') ready = null; // allow a retry on the next request
    self.postMessage({ id, error: String(err && err.message ? err.message : err) });
  }
};
