/**
 * type-scale.ts: fluid type scale for the Meta-identity redesign.
 *
 * Wiring note (DESIGN-SYSTEM.md §1): the shared contract asks for
 * `getTypeScale()` vendored from AleksandrHovhannisyan/fluid-type-scale-calculator
 * (MIT). That repo is not installed in this sandbox, so this file implements the
 * calculator's documented math directly (the Utopia fluid formula):
 *
 *   clamp(MIN, MIN + (MAX-MIN) * ((100vw - MIN_VW) / (MAX_VW - MIN_VW)), MAX)
 *
 * i.e. linear interpolation between a minimum size at 320px viewport and a
 * maximum size at 1200px viewport. Ratio 1.25, base 15px (the Facebook body
 * size), steps -1..5, within the section 2 cap. All sizes resolve through clamp(); no
 * breakpoint font-size overrides anywhere.
 */

/** Build a single fluid clamp() expression between two px sizes. */
export function fluidClamp(
  minPx: number,
  maxPx: number,
  minVw = 320,
  maxVw = 1200,
): string {
  const min = minPx.toFixed(2);
  const max = maxPx.toFixed(2);
  const slope = ((maxPx - minPx) / (maxVw - minVw)).toFixed(5);
  const intercept = (minPx - minVw * (maxPx - minPx) / (maxVw - minVw)).toFixed(2);
  return `clamp(${min}px, ${intercept}px + ${slope} * 100vw, ${max}px)`;
}

export interface TypeScaleOptions {
  /** base body size in px (default 15, the Facebook body size) */
  base?: number;
  /** scale ratio (default 1.25, inside the 1.200-1.333 band) */
  ratio?: number;
  /** how far below the base the ramp goes (default 1 → caption) */
  stepsBelow?: number;
  /** how far above the base the ramp goes (default 5 → hero) */
  stepsAbove?: number;
  /** fluid swing: sizes shrink to `1 - swing` at 320px and grow to `1 + swing` at 1200px */
  swing?: number;
}

/** Generate the named ramp. Returns CSS clamp() strings keyed by token name. */
export function getTypeScale(opts: TypeScaleOptions = {}): Record<string, string> {
  const {
    base = 15,
    ratio = 1.25,
    stepsBelow = 1,
    stepsAbove = 5,
    swing = 0.08,
  } = opts;
  const names = ["caption", "body", "lead", "h3", "h2", "h1", "hero"] as const;
  const out: Record<string, string> = {};
  for (let i = -stepsBelow; i <= stepsAbove; i++) {
    const size = base * Math.pow(ratio, i);
    const name = names[i + stepsBelow];
    out[name] = fluidClamp(size * (1 - swing), size * (1 + swing));
  }
  return out;
}

/** The demo's generated ramp (names → clamp expressions). */
export const TYPE_SCALE = getTypeScale();
