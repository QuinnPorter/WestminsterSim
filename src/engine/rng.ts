/** Seeded PRNG (mulberry32). The state lives in GameState.rngState so a save
 *  fully determines the future. All engine randomness must go through an Rng. */

export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  /** current internal state, for persisting */
  get state(): number {
    return this.s;
  }

  /** uniform float in [0, 1) */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** true with probability p */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** normal sample (Box-Muller) */
  normal(mean = 0, sd = 1): number {
    const u = Math.max(this.next(), 1e-12);
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  /** weighted pick; weights need not sum to 1 */
  pickWeighted<T>(items: readonly T[], weightOf: (item: T) => number): T {
    let total = 0;
    for (const item of items) total += Math.max(weightOf(item), 0);
    if (total <= 0) return this.pick(items);
    let r = this.next() * total;
    for (const item of items) {
      r -= Math.max(weightOf(item), 0);
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  }

  shuffle<T>(arr: readonly T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
