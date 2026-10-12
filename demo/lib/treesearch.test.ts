/**
 * Parity tests for the TypeScript port of main.py.
 * Run:  npx tsx lib/treesearch.test.ts   (from demo-src/)
 * Exit code 0 = all pass, 1 = any failure.
 */
import {
  createNode,
  expand,
  nodeScore,
  pyRound,
  runExperiment,
  treeSearch,
  verify,
  bestBranch,
  type ResearchNode,
  type TreeSearchResult,
} from "./treesearch";
import { SeededRng, type RngLike } from "./prng";

const SEED = "investigate sparsity patterns in attention maps of sub-1B transformers";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}: ${(e as Error).message}`);
  }
}

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

function approx(a: number, b: number, msg: string, eps = 1e-9): void {
  if (Math.abs(a - b) > eps) throw new Error(`${msg}: got ${a}, want ${b}`);
}

function serialize(r: TreeSearchResult): string {
  return JSON.stringify({
    events: r.events,
    nodes: [...r.nodes.values()],
    spent: r.spent,
    budgetExhausted: r.budgetExhausted,
    best: bestBranch(r.nodes).map((n) => n.node_id),
  });
}

// ---------------------------------------------------------------- determinism

test("determinism: same rngSeed twice -> byte-identical trace", () => {
  const a = serialize(treeSearch(SEED, { rngSeed: 7 }));
  const b = serialize(treeSearch(SEED, { rngSeed: 7 }));
  assert(a === b, "traces differ for identical seed");
});

test("determinism: different rngSeed -> different trace", () => {
  const a = serialize(treeSearch(SEED, { rngSeed: 7 }));
  const b = serialize(treeSearch(SEED, { rngSeed: 8 }));
  assert(a !== b, "seed had no effect (suspicious)");
});

test("SeededRng: same seed -> same stream, values in [0,1)", () => {
  const r1 = new SeededRng(7);
  const r2 = new SeededRng(7);
  for (let i = 0; i < 20; i++) {
    const v = r1.random();
    assert(v >= 0 && v < 1, `random() out of range: ${v}`);
    assert(v === r2.random(), `stream diverged at draw ${i}`);
  }
  const g1 = new SeededRng(7);
  const g2 = new SeededRng(7);
  for (let i = 0; i < 6; i++) {
    assert(g1.gauss(0, 0.05) === g2.gauss(0, 0.05), `gauss diverged at ${i}`);
  }
});

// ---------------------------------------------------------------- expand

test("expand: exactly 5 children, exact hypothesis strings, ids, parents", () => {
  const root = createNode(0, null, SEED, { sparsity_top: 8, lr: 3e-4 });
  const kids = expand(root, 1);
  assert(kids.length === 5, `expected 5 children, got ${kids.length}`);
  const hyps = kids.map((k) => k.hypothesis);
  const want = [
    "sparsity top-4",
    "sparsity top-8",
    "sparsity top-16",
    "lr=0.0003", // Python str(3e-4)
    "lr=0.001", // Python str(1e-3)
  ];
  assert(
    JSON.stringify(hyps) === JSON.stringify(want),
    `hypotheses mismatch: ${JSON.stringify(hyps)}`,
  );
  assert(
    JSON.stringify(kids.map((k) => k.node_id)) === "[1,2,3,4,5]",
    "child ids must be sequential from nextId",
  );
  assert(kids.every((k) => k.parent === 0), "all children must point at parent");
  // config = {...parent config, varied dim} — the untouched dim is inherited
  assert(
    kids[0].config.sparsity_top === 4 && kids[0].config.lr === 3e-4,
    "sparsity child must inherit parent lr",
  );
  assert(
    kids[3].config.sparsity_top === 8 && kids[3].config.lr === 3e-4,
    "lr child must inherit parent sparsity_top",
  );
  assert(
    kids[4].config.sparsity_top === 8 && kids[4].config.lr === 1e-3,
    "lr=0.001 child config wrong",
  );
  // defaults
  for (const k of kids) {
    assert(
      k.novelty === 0.5 && k.quality === 0 && k.cost_usd === 0 &&
        k.failure === null && k.result === null,
      "child defaults must be novelty=0.5 quality=0 cost=0 failure=null result=null",
    );
  }
});

// ---------------------------------------------------------------- score

test("score formula on fixture node", () => {
  const n = createNode(0, null, "s", { sparsity_top: 8, lr: 3e-4 });
  n.novelty = 0.5;
  n.quality = 0.8;
  // 0.5*0.4 + 0.8*0.5 + min(1, 5/10)*0.1 = 0.2 + 0.4 + 0.05
  approx(nodeScore(n, 5), 0.65, "score(remaining=5)");
  approx(nodeScore(n, 0), 0.6, "score(remaining=0): budget term is 0");
  approx(nodeScore(n, 100), 0.7, "score(remaining=100): budget term capped at 0.1");
  approx(nodeScore(n, -3), 0.5 * 0.4 + 0.8 * 0.5 + -0.03, "score(negative remaining) follows formula");
});

// ---------------------------------------------------------------- runExperiment

test("runExperiment: field ranges and 3-decimal rounding", () => {
  const rng = new SeededRng(7);
  const n = createNode(1, 0, "sparsity top-4", { sparsity_top: 4, lr: 3e-4 });
  runExperiment(n, rng);
  assert(n.result !== null, "result must be set");
  const loss = n.result!.loss;
  assert(
    Math.abs(loss * 1000 - Math.round(loss * 1000)) < 1e-6,
    `loss not rounded to 3 decimals: ${loss}`,
  );
  assert(n.cost_usd >= 1.2 && n.cost_usd < 1.6, `cost out of range: ${n.cost_usd}`);
  assert(n.novelty >= 0.4 && n.novelty <= 0.7, `novelty out of range: ${n.novelty}`);
  assert(
    n.quality >= 0 && n.quality <= 1,
    `quality out of range: ${n.quality}`,
  );
  assert(
    n.result!.sparsity_top === 4 && n.result!.lr === 3e-4,
    "result must echo sparsity_top and lr",
  );
  // quality uses RAW loss: recompute from an unrounded loss to cross-check
  // is not possible post-hoc; instead check the defining relation loosely:
  // quality == 0 OR quality == max(0, 1-(rawLoss-2.5)/1.5) with rawLoss ~= loss
  if (n.failure === null) {
    const q = 1 - (loss - 2.5) / 1.5;
    assert(
      Math.abs(n.quality - Math.max(0, q)) < 0.001,
      `quality inconsistent with loss: q=${n.quality} loss=${loss}`,
    );
  } else {
    assert(n.failure === "oom_killed_by_cgroup" && n.quality === 0, "failure shape wrong");
  }
});

// ---------------------------------------------------------------- verify

test("verify: failure -> false", () => {
  const n = createNode(1, 0, "h", { sparsity_top: 8, lr: 3e-4 });
  n.failure = "oom_killed_by_cgroup";
  n.result = { loss: 2.7, sparsity_top: 8, lr: 3e-4 };
  assert(verify(n) === false, "failed node must not verify");
  assert(n.failure === "oom_killed_by_cgroup", "existing failure must be preserved");
});

test("verify: loss > 4.0 -> loss_diverged", () => {
  const n = createNode(1, 0, "h", { sparsity_top: 8, lr: 3e-4 });
  n.result = { loss: 4.001, sparsity_top: 8, lr: 3e-4 };
  assert(verify(n) === false, "diverged loss must not verify");
  assert(n.failure === "loss_diverged", `failure must be loss_diverged, got ${n.failure}`);
});

test("verify: loss == 4.0 boundary passes (strict >)", () => {
  const n = createNode(1, 0, "h", { sparsity_top: 8, lr: 3e-4 });
  n.result = { loss: 4.0, sparsity_top: 8, lr: 3e-4 };
  assert(verify(n) === true, "loss == 4.0 must verify (Python uses > 4.0)");
});

test("verify: healthy node -> true", () => {
  const n = createNode(1, 0, "h", { sparsity_top: 8, lr: 3e-4 });
  n.result = { loss: 2.7, sparsity_top: 8, lr: 3e-4 };
  assert(verify(n) === true, "healthy node must verify");
  assert(n.failure === null, "failure must stay null");
});

test("verify: missing result defaults loss to 99 -> loss_diverged", () => {
  const n = createNode(1, 0, "h", { sparsity_top: 8, lr: 3e-4 });
  assert(verify(n) === false, "result-less node must not verify");
  assert(n.failure === "loss_diverged", "missing result -> loss_diverged (Python .get('loss', 99))");
});

// ---------------------------------------------------------------- pyRound

test("pyRound: round-half-to-even", () => {
  assert(pyRound(2.5, 0) === 2, "2.5 -> 2");
  assert(pyRound(3.5, 0) === 4, "3.5 -> 4");
  assert(pyRound(0.125, 2) === 0.12, "0.125 -> 0.12");
  assert(pyRound(2.675, 2) === 2.67 || pyRound(2.675, 2) === 2.68, "2.675 must round deterministically");
});

// ---------------------------------------------------------------- tree search

test("treeSearch: budget=0 runs nothing, root only", () => {
  const r = treeSearch(SEED, { rngSeed: 7, budget: 0 });
  assert(r.events.length === 0, `expected 0 events, got ${r.events.length}`);
  assert(r.nodes.size === 1, `expected only root, got ${r.nodes.size}`);
  assert(r.budgetExhausted === true, "budgetExhausted must be true");
  const root = r.nodes.get(0)!;
  assert(root.result === null, "root must never be executed");
});

test("treeSearch: budget=1.2 runs exactly one experiment then stops", () => {
  // each experiment costs >= 1.2, so after one, spent >= budget -> break
  const r = treeSearch(SEED, { rngSeed: 7, budget: 1.2 });
  assert(r.events.length === 1, `expected 1 event, got ${r.events.length}`);
  assert(r.spent >= r.budget, "spent must reach budget before break");
  assert(r.budgetExhausted === true, "budgetExhausted must be true");
});

test("treeSearch: maxNodes respected (5-at-a-time overshoot, matches Python)", () => {
  const r = treeSearch(SEED, { rngSeed: 7, maxNodes: 6 });
  // 1 (root) -> expand -> 6 nodes; guard `6 < 6` is false -> stop. Exactly 6.
  assert(r.nodes.size === 6, `expected exactly 6 nodes, got ${r.nodes.size}`);
  const d = treeSearch(SEED, { rngSeed: 7 }); // defaults: maxNodes 24
  // Guard is checked per-pop and each expansion pushes 5 at once:
  // 1 -> 6 -> 11 -> 16 -> 21 -> 26. Python ground truth prints "nodes explored : 26".
  // (Pinned to rngSeed 7 + mulberry32: 4 successful expansions, no budget break.)
  assert(d.nodes.size === 26, `expected 26 nodes (Python prints 26), got ${d.nodes.size}`);
  assert(
    d.nodes.size <= d.maxNodes + 4,
    "overshoot past maxNodes is bounded by a single 5-child expansion",
  );
});

test("treeSearch: root invariants (never executed, seed hypothesis, novelty=1 quality=0.5)", () => {
  const r = treeSearch(SEED, { rngSeed: 7 });
  const root = r.nodes.get(0)!;
  assert(root.hypothesis === SEED, "root hypothesis must be the seed string");
  assert(root.novelty === 1.0 && root.quality === 0.5, "root novelty/quality wrong");
  assert(
    root.config.sparsity_top === 8 && root.config.lr === 3e-4,
    "root config wrong",
  );
  assert(root.result === null && root.cost_usd === 0, "root must not be executed");
  assert(
    r.events.every((e) => e.node_id !== 0),
    "no trace event may reference the root",
  );
});

test("treeSearch: event shape and cumulative accounting", () => {
  const r = treeSearch(SEED, { rngSeed: 7 });
  assert(r.events.length > 0, "default run must emit events");
  let cum = 0;
  for (const e of r.events) {
    assert(e.flag === "ok" || e.flag === "FAIL", `bad flag ${e.flag}`);
    assert(typeof e.loss === "number", "loss must be a number");
    assert(e.cost >= 1.2 && e.cost < 1.6, `event cost out of range: ${e.cost}`);
    cum += e.cost;
    approx(e.cumulative, cum, `cumulative mismatch at node ${e.node_id}`, 1e-9);
    const node = r.nodes.get(e.node_id)!;
    assert(node.hypothesis === e.hypothesis, "event hypothesis must match node");
  }
  approx(r.spent, cum, "spent must equal sum of event costs");
});

/** Scripted RNG: cycles draws; gauss consumes nothing (deterministic loss). */
function scriptedRng(draws: number[]): RngLike {
  let i = 0;
  const take = () => draws[i++ % draws.length];
  return {
    random: () => take(),
    uniform: (a: number, b: number) => a + (b - a) * take(),
    gauss: () => 0,
  };
}

test("treeSearch: failed nodes are never expanded (scripted oom failures)", () => {
  // per experiment draws: uniform(cost) -> uniform(novelty) -> random(fail check)
  // fail check 0.05 < 0.1 forces EVERY experiment to oom-fail, deterministically.
  const r = treeSearch(SEED, {
    rng: scriptedRng([0.5, 0.5, 0.05]),
    budget: 30,
    maxNodes: 24,
  });
  assert(r.events.length === 5, `expected 5 events (root's children), got ${r.events.length}`);
  assert(
    r.events.every((e) => e.flag === "FAIL"),
    "all events must be FAIL under the scripted RNG",
  );
  const failedIds = new Set(
    [...r.nodes.values()].filter((n) => n.failure !== null).map((n) => n.node_id),
  );
  assert(failedIds.size === 5, `expected 5 failed nodes, got ${failedIds.size}`);
  for (const n of r.nodes.values()) {
    assert(
      !(n.parent !== null && failedIds.has(n.parent)),
      `node ${n.node_id} was expanded from failed node ${n.parent}`,
    );
    assert(
      n.failure === "oom_killed_by_cgroup" || n.node_id === 0,
      `non-root node ${n.node_id} should carry the oom failure`,
    );
  }
  assert(r.nodes.size === 6, `no expansion means 1 root + 5 children, got ${r.nodes.size}`);
  assert(bestBranch(r.nodes).length === 0, "no successes -> empty best branch");
  // flag/failure consistency on the default-seed run too
  const d = treeSearch(SEED, { rngSeed: 7 });
  for (const e of d.events) {
    const n = d.nodes.get(e.node_id)!;
    assert(
      (e.flag === "FAIL") === (n.failure !== null),
      `flag/failure mismatch at node ${e.node_id}`,
    );
  }
});

test("treeSearch: node ids are dense 0..N-1 (next_id increments by 5)", () => {
  const r = treeSearch(SEED, { rngSeed: 7 });
  const ids = [...r.nodes.keys()].sort((a, b) => a - b);
  assert(
    JSON.stringify(ids) === JSON.stringify(ids.map((_, i) => i)),
    "node ids must be dense from 0",
  );
});

// ---------------------------------------------------------------- bestBranch

test("bestBranch: valid root->best chain, best = max quality non-failed", () => {
  const r = treeSearch(SEED, { rngSeed: 7 });
  const branch = bestBranch(r.nodes);
  assert(branch.length > 0, "branch must be non-empty");
  assert(branch[0].node_id === 0, "branch must start at root");
  for (let i = 1; i < branch.length; i++) {
    assert(
      branch[i].parent === branch[i - 1].node_id,
      `chain broken at index ${i}`,
    );
    assert(branch[i].failure === null, "branch must not contain failed nodes");
    assert(branch[i].result !== null, "branch nodes must have results");
  }
  const last = branch[branch.length - 1];
  const contenders = [...r.nodes.values()].filter(
    (n) => n.result !== null && n.failure === null,
  );
  const maxQ = Math.max(...contenders.map((n) => n.quality));
  approx(last.quality, maxQ, "branch must end at max-quality node");
});

test("bestBranch: empty when nothing succeeded", () => {
  const nodes = new Map<number, ResearchNode>();
  const root = createNode(0, null, SEED, { sparsity_top: 8, lr: 3e-4 });
  root.failure = "oom_killed_by_cgroup";
  root.result = { loss: 3.0, sparsity_top: 8, lr: 3e-4 };
  nodes.set(0, root);
  assert(bestBranch(nodes).length === 0, "all-failed tree -> empty branch");
});

// ---------------------------------------------------------------- sample trace

test("sample trace (printed, not asserted beyond non-empty)", () => {
  const r = treeSearch(SEED, { rngSeed: 7 });
  console.log("\n--- sample trace (rngSeed=7, budget=30, maxNodes=24) ---");
  for (const e of r.events.slice(0, 10)) {
    console.log(
      `    [${e.flag === "ok" ? "ok " : "FAIL"}] node #${String(e.node_id).padStart(2, "0")}  ` +
        `hypo='${e.hypothesis}'  loss=${e.loss}  $=${e.cost.toFixed(2)}  cum=$${e.cumulative.toFixed(2)}`,
    );
  }
  if (r.events.length > 10) console.log(`    ... (${r.events.length - 10} more events)`);
  const failedCount = [...r.nodes.values()].filter((n) => n.failure).length;
  console.log(`nodes explored : ${r.nodes.size}`);
  console.log(`budget spent   : $${r.spent.toFixed(2)} of $${r.budget.toFixed(2)}`);
  console.log(`failed nodes   : ${failedCount}`);
  const branch = bestBranch(r.nodes);
  console.log(`best branch (length ${branch.length}):`);
  for (const n of branch) {
    console.log(
      `  #${String(n.node_id).padStart(2, "0")} ${n.hypothesis}   q=${n.quality.toFixed(2)}  loss=${n.result?.loss ?? "?"}`,
    );
  }
  console.log("--- end sample trace ---\n");
  assert(r.events.length > 0, "sample trace empty");
});

// ---------------------------------------------------------------- summary

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
