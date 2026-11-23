// SPDX-License-Identifier: MIT
//
// Learned evaluation: sparse one-hot features -> embedding sum -> optional small MLP. Weights come
// from training/train.py (float32, little-endian) plus a JSON description. Plain JS, no
// dependencies, so it runs unchanged in Node and in a browser Web Worker.

import { FEATURE_SETS } from './features.js';

const CLAMP = 2800; // keeps scores well inside the mate range

export class NetEvaluator {
  /**
   * @param {{format: number, spec: string, num_features: number, hidden: number, hidden2: number, scale: number}} meta
   * @param {ArrayBuffer | ArrayBufferView} weights float32 little-endian
   */
  constructor(meta, weights) {
    if (meta.format !== 1) throw new Error(`unsupported net format ${meta.format}`);
    const set = FEATURE_SETS[meta.spec];
    if (!set || meta.num_features !== set.numFeatures) {
      throw new Error(`net was trained for features "${meta.spec}", which this engine does not have`);
    }
    const NUM_FEATURES = set.numFeatures;
    this.extract = set.extract;
    this.perPosition = set.perPosition;
    const buf = ArrayBuffer.isView(weights) ? weights.buffer.slice(weights.byteOffset, weights.byteOffset + weights.byteLength) : weights;
    const w = new Float32Array(buf);
    const H = meta.hidden;
    const H2 = meta.hidden2;
    // linear (H2 = 0, H = 1): emb[F] + bias[1]; MLP: emb[F*H] + b1[H] + w2[H*H2] + b2[H2] + w3[H2] + b3[1]
    const expected = H2 === 0 ? NUM_FEATURES + 1 : NUM_FEATURES * H + H + H * H2 + H2 + H2 + 1;
    if (H2 === 0 && H !== 1) throw new Error('linear nets must have hidden = 1');
    if (w.length !== expected) throw new Error(`net weights have ${w.length} floats, expected ${expected}`);
    this.meta = meta;
    this.scale = meta.scale;
    this.H = H;
    this.H2 = H2;
    let o = 0;
    this.emb = w.subarray(o, (o += NUM_FEATURES * H));
    this.b1 = w.subarray(o, (o += H));
    if (H2 > 0) {
      this.w2 = w.subarray(o, (o += H * H2));
      this.b2 = w.subarray(o, (o += H2));
      this.w3 = w.subarray(o, (o += H2));
      this.b3 = w[o];
    }
    this.feat = new Int32Array(set.perPosition);
    this.acc = new Float64Array(H);
    this.hid = new Float64Array(Math.max(H2, 1));
  }

  /** Score for the side to move, in the same integer units the search uses. */
  evaluate(pos) {
    const feat = this.feat;
    this.extract(pos, feat);
    const n = this.perPosition;
    const emb = this.emb;
    const H = this.H;
    let y;
    if (this.H2 === 0) {
      // linear model: H = 1, bias stored in b1[0]
      y = this.b1[0];
      for (let i = 0; i < n; i++) y += emb[feat[i]];
    } else {
      const acc = this.acc;
      for (let h = 0; h < H; h++) acc[h] = this.b1[h];
      for (let i = 0; i < n; i++) {
        const base = feat[i] * H;
        for (let h = 0; h < H; h++) acc[h] += emb[base + h];
      }
      const H2 = this.H2;
      const hid = this.hid;
      for (let j = 0; j < H2; j++) hid[j] = this.b2[j];
      for (let h = 0; h < H; h++) {
        const a = acc[h];
        if (a <= 0) continue; // ReLU
        const row = h * H2;
        for (let j = 0; j < H2; j++) hid[j] += a * this.w2[row + j];
      }
      y = this.b3;
      for (let j = 0; j < H2; j++) if (hid[j] > 0) y += hid[j] * this.w3[j];
    }
    const s = Math.round(y * this.scale);
    return s > CLAMP ? CLAMP : s < -CLAMP ? -CLAMP : s;
  }
}

/** Node helper: load `<base>.json` + `<base>.bin`. */
export async function loadNetFromFiles(base) {
  const { readFile } = await import('node:fs/promises');
  const meta = JSON.parse(await readFile(`${base}.json`, 'utf8'));
  const bin = await readFile(`${base}.bin`);
  return new NetEvaluator(meta, bin);
}
