// SPDX-License-Identifier: MIT
//
// Web Worker entry: loads the net once, then answers {id, state, timeMs} with {id, move}.
// `state` is the compact text form (see docs/RULES.md). Any failure is reported as {id, error};
// the page then falls back to the site's built-in AI.

import { NetEvaluator, Position, Searcher } from './index.js';

let ready = null;
let searcher = null;

async function init() {
  const base = new URL('./', import.meta.url);
  const meta = await (await fetch(new URL('net.json', base))).json();
  const res = await fetch(new URL(`net.bin?v=${String(meta.sha256).slice(0, 12)}`, base));
  if (!res.ok) throw new Error(`net.bin: HTTP ${res.status}`);
  searcher = new Searcher({ evaluator: new NetEvaluator(meta, await res.arrayBuffer()), ttBits: 20 });
}

self.onmessage = async (event) => {
  const { id, type, state, timeMs } = event.data;
  try {
    ready ??= init();
    await ready;
    if (type === 'warmup') {
      self.postMessage({ id, ready: true });
      return;
    }
    const r = searcher.think(Position.fromCompact(state), { timeMs: timeMs ?? 1000, depth: 40 });
    self.postMessage({ id, move: r.move, score: r.score, depth: r.depth, nodes: r.nodes });
  } catch (err) {
    ready = null; // allow a retry on the next request
    self.postMessage({ id, error: String(err && err.message ? err.message : err) });
  }
};
