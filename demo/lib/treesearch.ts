/**
 * TypeScript port of dev4aibots/deep-research-orchestrator main.py.
 *
 * Faithful 1:1 port of the REAL algorithm: best-first tree search over
 * experiment nodes with budgeted expansion, simulated sandboxed execution,
 * and a novelty x quality x budget scoring function.
 *
 * Pure functions, no I/O. Printing from main.py is replaced by a collected
 * `events` array so a UI can animate the trace step by step.
 *
 * DELIBERATE DIFFERENCES from CPython (documented, see PORT_NOTES.md):
 *  - RNG: mulberry32 via SeededRng instead of random.Random(7).
 *    Same seed -> byte-identical trace in JS; values do NOT match CPython.
 *  - round(loss, 3): reimplemented as round-half-to-even (pyRound).
 */

import { SeededRng, type RngLike } from "./prng";

// ---------------------------------------------------------------------------
// types
// ---------------------------------------------------------------------------

export interface ExperimentConfig {
  sparsity_top: number;
  lr: number;
}

export interface ExperimentResult {
  loss: number;
  sparsity_top: number;
  lr: number;
}

export interface ResearchNode {
  node_id: number;
  parent: number | null;
  hypothesis: string;
  config: ExperimentConfig;
  result: ExperimentResult | null; // null until run_experiment executes
  cost_usd: number;
  novelty: number;
  quality: number;
  failure: string | null;
}

export interface TraceEvent {
  flag: "ok" | "FAIL";
  node_id: number;
  hypothesis: string;
  loss: number;
  cost: number;
  cumulative: number;
}

export interface TreeSearchOptions {
  /** Seed for the internal PRNG. Default 7 (mirrors random.Random(7)). */
  rngSeed?: number;
  /** Explicit RNG instance; overrides rngSeed when provided. */
  rng?: RngLike;
  /** Dollar budget. Default 30. */
  budget?: number;
  /** Maximum nodes ever pushed (root counts). Default 24. */
  maxNodes?: number;
}

export interface TreeSearchResult {
  nodes: Map<number, ResearchNode>;
  events: TraceEvent[];
  budget: number;
  spent: number;
  maxNodes: number;
  /** True when the loop stopped because spent >= budget (mirrors the Python print). */
  budgetExhausted: boolean;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Python round(x, ndigits): round-half-to-even on the scaled value. */
export function pyRound(x: number, ndigits: number): number {
  const m = 10 ** ndigits;
  const n = x * m;
  const f = Math.floor(n);
  const d = n - f;
  if (d < 0.5) return f / m;
  if (d > 0.5) return (f + 1) / m;
  return (f % 2 === 0 ? f : f + 1) / m;
}

export function createNode(
  node_id: number,
  parent: number | null,
  hypothesis: string,
  config: ExperimentConfig,
): ResearchNode {
  return {
    node_id,
    parent,
    hypothesis,
    config: { ...config },
    result: null,
    cost_usd: 0.0,
    novelty: 0.5,
    quality: 0.0,
    failure: null,
  };
}

/** score(remaining) = novelty*0.4 + quality*0.5 + min(1, remaining/10)*0.1 */
export function nodeScore(node: ResearchNode, remainingBudget: number): number {
  const budgetWeight = Math.min(1.0, remainingBudget / 10.0);
  return node.novelty * 0.4 + node.quality * 0.5 + budgetWeight * 0.1;
}

// ---------------------------------------------------------------------------
// stub planner — propose children by small-edit expansion
// ---------------------------------------------------------------------------

/**
 * 5 children: sparsity_top in {4, 8, 16}, then lr in {3e-4, 1e-3}.
 * Hypothesis strings use Python str() formatting: "lr=0.0003", "lr=0.001".
 */
export function expand(node: ResearchNode, nextId: number): ResearchNode[] {
  const children: ResearchNode[] = [];
  for (const sp of [4, 8, 16]) {
    children.push(
      createNode(nextId, node.node_id, `sparsity top-${sp}`, {
        ...node.config,
        sparsity_top: sp,
      }),
    );
    nextId += 1;
  }
  for (const lr of [3e-4, 1e-3]) {
    children.push(
      createNode(nextId, node.node_id, `lr=${String(lr)}`, {
        ...node.config,
        lr,
      }),
    );
    nextId += 1;
  }
  return children;
}

// ---------------------------------------------------------------------------
// sandbox execution — stubbed; fake but reproducible metrics
// ---------------------------------------------------------------------------

export function runExperiment(node: ResearchNode, rng: RngLike): void {
  const sp = node.config.sparsity_top ?? 8;
  const lr = node.config.lr ?? 3e-4;
  const idealSp = 8;
  // fabricate a loss based on hyperparams (smaller sparsity better to a point)
  let loss =
    3.0 - 0.3 * (1 - Math.abs(sp - idealSp) / 16) + rng.gauss(0, 0.05);
  loss += 0.0001 * Math.abs(lr - 3e-4) * 1000; // == 0.1 * |lr - 3e-4|
  node.result = { loss: pyRound(loss, 3), sparsity_top: sp, lr };
  node.cost_usd = 1.2 + rng.uniform(0, 0.4);
  // NOTE: quality uses the RAW loss, not the rounded one (faithful to main.py)
  node.quality = Math.max(0.0, 1.0 - (loss - 2.5) / 1.5);
  node.novelty = 0.5 + rng.uniform(-0.1, 0.2);
  // simulate occasional failure
  if (rng.random() < 0.1) {
    node.failure = "oom_killed_by_cgroup";
    node.quality = 0.0;
  }
}

// ---------------------------------------------------------------------------
// verify step — sanity check results before scoring
// ---------------------------------------------------------------------------

export function verify(node: ResearchNode): boolean {
  if (node.failure) return false;
  // NOTE: uses the ROUNDED loss from result (defaults to 99 when absent)
  if ((node.result?.loss ?? 99) > 4.0) {
    node.failure = "loss_diverged";
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// min-heap ordered by (-score, insertionCounter, node_id)
// ---------------------------------------------------------------------------

interface HeapEntry {
  negScore: number;
  counter: number;
  nodeId: number;
}

function entryLess(a: HeapEntry, b: HeapEntry): boolean {
  if (a.negScore !== b.negScore) return a.negScore < b.negScore;
  if (a.counter !== b.counter) return a.counter < b.counter;
  return a.nodeId < b.nodeId;
}

class MinHeap {
  private a: HeapEntry[] = [];
  get size(): number {
    return this.a.length;
  }
  push(e: HeapEntry): void {
    this.a.push(e);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!entryLess(this.a[i], this.a[p])) break;
      [this.a[i], this.a[p]] = [this.a[p], this.a[i]];
      i = p;
    }
  }
  pop(): HeapEntry | undefined {
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length > 0 && last !== undefined) {
      this.a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let m = i;
        if (l < this.a.length && entryLess(this.a[l], this.a[m])) m = l;
        if (r < this.a.length && entryLess(this.a[r], this.a[m])) m = r;
        if (m === i) break;
        [this.a[i], this.a[m]] = [this.a[m], this.a[i]];
        i = m;
      }
    }
    return top;
  }
}

// ---------------------------------------------------------------------------
// tree search — best-first with budget and max nodes
// ---------------------------------------------------------------------------

export function treeSearch(seed: string, opts: TreeSearchOptions = {}): TreeSearchResult {
  const rng = opts.rng ?? new SeededRng(opts.rngSeed ?? 7);
  const budget = opts.budget ?? 30;
  const maxNodes = opts.maxNodes ?? 24;

  const nodes = new Map<number, ResearchNode>();
  const frontier = new MinHeap();
  const events: TraceEvent[] = [];
  let counter = 0;
  let spent = 0.0;
  let budgetExhausted = false;

  const push = (node: ResearchNode): void => {
    nodes.set(node.node_id, node);
    counter += 1;
    const remaining = budget - spent; // score computed at PUSH time (stale later)
    frontier.push({
      negScore: -nodeScore(node, remaining),
      counter,
      nodeId: node.node_id,
    });
  };

  const root = createNode(0, null, seed, { sparsity_top: 8, lr: 3e-4 });
  root.novelty = 1.0;
  root.quality = 0.5;
  push(root);

  let nextId = 1;
  while (frontier.size > 0 && nodes.size < maxNodes) {
    const entry = frontier.pop();
    if (!entry) break;
    const cur = nodes.get(entry.nodeId);
    if (!cur) break;
    if (spent >= budget) {
      budgetExhausted = true; // Python prints "BUDGET EXHAUSTED at $..."
      break;
    }
    if (cur.node_id !== 0) {
      runExperiment(cur, rng);
      spent += cur.cost_usd;
      const ok = verify(cur);
      events.push({
        flag: ok ? "ok" : "FAIL",
        node_id: cur.node_id,
        hypothesis: cur.hypothesis,
        loss: cur.result!.loss,
        cost: cur.cost_usd,
        cumulative: spent,
      });
      if (!ok) continue; // failed nodes are NOT expanded
    }
    // expand the top promising nodes
    const children = expand(cur, nextId);
    nextId += children.length;
    for (const ch of children) push(ch);
  }

  return { nodes, events, budget, spent, maxNodes, budgetExhausted };
}

// ---------------------------------------------------------------------------
// best-branch selection
// ---------------------------------------------------------------------------

/**
 * Among nodes with a result and no failure, pick max quality
 * (first wins ties, like Python max()); walk the parent chain to the root.
 */
export function bestBranch(nodes: Map<number, ResearchNode>): ResearchNode[] {
  const done = [...nodes.values()].filter(
    (n) => n.result !== null && n.failure === null,
  );
  if (done.length === 0) return [];
  let best = done[0];
  for (const n of done) {
    if (n.quality > best.quality) best = n;
  }
  const chain: ResearchNode[] = [best];
  while (chain[chain.length - 1].parent !== null) {
    const p = nodes.get(chain[chain.length - 1].parent!);
    if (!p) break; // defensive; cannot happen in a well-formed tree
    chain.push(p);
  }
  return chain.reverse();
}
