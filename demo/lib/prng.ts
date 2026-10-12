/**
 * Seeded PRNG for the deep-research-orchestrator demo.
 *
 * The Python source (main.py) uses `random.Random(7)` — CPython's Mersenne
 * Twister. Bit-matching CPython's stream in JS would require reimplementing
 * MT19937 *and* CPython's int-seed init_by_array algorithm; the demo
 * explicitly does NOT do that. Instead we use mulberry32, a small,
 * well-understood 32-bit PRNG, with a documented seed parameter.
 *
 * Determinism contract (the only one that matters here):
 *   same seed  ->  byte-identical trace, every run, on any machine.
 * Values will NOT match the numbers produced by CPython's random.Random(7).
 *
 * The method set mirrors the CPython calls made by run_experiment():
 *   random()          -> float in [0, 1)
 *   uniform(a, b)     -> a + (b - a) * random()
 *   gauss(mu, sigma)  -> Box-Muller with a cached second deviate, exactly
 *                        like CPython's random.gauss() (alternates between
 *                        consuming 2 draws and 0 draws per call).
 */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Minimal RNG surface consumed by the tree search. SeededRng implements it;
 * tests may substitute a scripted stub (structural typing).
 */
export interface RngLike {
  random(): number;
  uniform(a: number, b: number): number;
  gauss(mu: number, sigma: number): number;
}

export class SeededRng implements RngLike {
  private readonly next: () => number;
  private gaussNext: number | null = null;

  constructor(seed: number) {
    if (!Number.isInteger(seed) || seed < 0) {
      throw new Error(`SeededRng: seed must be a non-negative integer, got ${seed}`);
    }
    this.next = mulberry32(seed);
  }

  /** Float in [0, 1). Mirrors random.Random.random(). */
  random(): number {
    return this.next();
  }

  /** Mirrors random.Random.uniform(a, b). */
  uniform(a: number, b: number): number {
    return a + (b - a) * this.random();
  }

  /**
   * Mirrors random.Random.gauss(mu, sigma): polar/Box-Muller form with
   * caching of the second deviate (self.gauss_next in CPython).
   */
  gauss(mu = 0, sigma = 1): number {
    let z = this.gaussNext;
    this.gaussNext = null;
    if (z === null) {
      const x2pi = this.random() * (2 * Math.PI);
      const g2rad = Math.sqrt(-2.0 * Math.log(1.0 - this.random()));
      z = Math.cos(x2pi) * g2rad;
      this.gaussNext = Math.sin(x2pi) * g2rad;
    }
    return mu + z * sigma;
  }
}
