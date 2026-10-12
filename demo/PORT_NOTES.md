# PORT_NOTES: deep-research-orchestrator, Python to TypeScript

Source of truth: `../source/main.py` (dev4aibots/deep-research-orchestrator).
Port: `lib/treesearch.ts` + `lib/prng.ts`, tested by `lib/treesearch.test.ts`
(22/22 passing via `npx tsx lib/treesearch.test.ts`), served by
`app/api/run/route.ts`.

## Ported 1:1 (verified against main.py, including a live `python3 main.py` run)

| main.py | treesearch.ts | Notes |
|---|---|---|
| `Node` dataclass | `ResearchNode` + `createNode()` | Same fields/defaults: `novelty=0.5, quality=0.0, cost_usd=0.0, failure=None`, `result` null until executed |
| `score(remaining)` | `nodeScore(node, remainingBudget)` | `novelty*0.4 + quality*0.5 + min(1, remaining/10)*0.1`, same term order |
| `expand(node, next_id)` | `expand(node, nextId)` | 5 children: `sparsity top-{4,8,16}`, then `lr={3e-4,1e-3}`; child config = `{...parent.config, variedDim}` (untouched dim inherited) |
| `f"lr={lr}"` | `` `lr=${String(lr)}` `` | Python `str(3e-4)` → `"0.0003"`, `str(1e-3)` → `"0.001"`; JS `String()` matches for exactly these two values (asserted in tests) |
| `run_experiment` | `runExperiment` | Same formula incl. `0.0001 * abs(lr-3e-4) * 1000`; `result = {loss: round(loss,3), sparsity_top, lr}` |
| `verify` | `verify` | `failure → false`; `result.get("loss", 99) > 4.0 → failure="loss_diverged"`; strict `>`, so `loss == 4.0` passes |
| heap `(-score, counter, node_id)` | `MinHeap` | Min-heap on `(-score, insertionCounter, nodeId)`; score computed **at push time** (goes stale as budget is spent — same as Python) |
| `tree_search` loop | `treeSearch` | Pop → `spent >= budget` break → non-root runs experiment → emit event → failed nodes `continue` (never expanded) → expand + push |
| `best_branch` | `bestBranch` | Max `quality` among `result && !failure`; **first wins ties** (like Python `max()`); parent-chain walk reversed |
| `print` trace lines | `events[]` | `{flag: "ok"\|"FAIL", node_id, hypothesis, loss, cost, cumulative}` per executed node; root never emits an event |

## Subtle fidelity points (all deliberately preserved, all tested)

- **`quality` uses the RAW loss; `verify` uses the ROUNDED loss.** `quality = max(0, 1-(loss-2.5)/1.5)` is computed before rounding; the divergence check uses `result["loss"]` (rounded to 3 decimals).
- **`maxNodes` overshoots by design.** The guard `len(nodes) < max_nodes` is checked per-pop while each expansion pushes 5 nodes: 1→6→11→16→21→26. The real `python3 main.py` prints `nodes explored : 26` with `max_nodes=24` — the TS port reproduces exactly 26 (pinned test).
- **Budget guard placement.** Checked after pop, before running: `spent` can overshoot `budget` by one experiment's cost (each costs ≥ $1.20). `budget=1.2` deterministically runs exactly one experiment.
- **Root is never executed.** No experiment, no cost, no event, but it IS expandable and IS the start of every best branch.
- **RNG draw order per experiment:** `gauss(0,0.05)` → `uniform(0,0.4)` (cost) → `uniform(-0.1,0.2)` (novelty) → `random()` (10% oom check). Failure zeroes `quality` but keeps `result.loss`.
- **`round(loss, 3)`** reimplemented as round-half-to-even (`pyRound`).

## RNG decision: why not bit-identical to CPython

`main.py` uses `random.Random(7)`, CPython's Mersenne Twister with CPython's
integer-seed `init_by_array` seeding. Reproducing its exact stream in JS would
require reimplementing MT19937 *and* that seeding ritual. The demo does not do
this, per the build brief. Instead:

- `lib/prng.ts` implements **mulberry32** (32-bit, public-domain algorithm)
  behind a `SeededRng` class exposing the exact CPython call surface the
  algorithm uses: `random()`, `uniform(a,b)`, and `gauss(mu,sigma)` with the
  same second-deviate caching behaviour as `random.gauss()`.
- `rngSeed` (default **7**, mirroring `random.Random(7)`) is exposed through
  the API. **Contract: same seed → byte-identical trace** (asserted by test:
  `JSON.stringify` of two runs is character-identical). Different seed →
  different trace.
- **The numeric values will NOT match CPython's `random.Random(7)` output.**
  Anyone diffing against `python3 main.py` will see different losses/costs.
  Structure, counts, and all invariants match; the random stream does not.

## What the demo must NOT claim (UI copy rules)

The source repo is honest about being a scaffold, and the demo must be too:

1. **No web research happens.** `main.py` makes zero network calls. Do not use words like "research", "search the web", "sources", or "citations" for what the tree does.
2. **No LLM planning.** The planner is stubbed: children are proposed by fixed small-edit expansion (`sparsity top-{4,8,16}`, `lr={3e-4,1e-3}`), not by any model.
3. **No real experiments.** `run_experiment` fabricates metrics from a closed-form toy formula plus noise (`3.0 - 0.3*(1-|sp-8|/16) + noise`). There is no Docker, no sandbox, no PyTorch, no GPU. `cost_usd` is fake money.
4. **Novelty/quality are toy scores**, not peer review. `quality = max(0, 1-(loss-2.5)/1.5)` is arithmetic, not judgement.
5. **Failures are simulated** (`oom_killed_by_cgroup` at 10% draw, `loss_diverged` past 4.0); no container was harmed.
6. Say what it IS: *"an interactive visualisation of the best-first tree-search scaffold from dev4aibots/deep-research-orchestrator, running the real ported algorithm with simulated experiment metrics."*

## Known limits of this port

- Numeric traces differ from CPython (see RNG decision). Structural parity is tested; numeric parity is explicitly out of scope.
- `pyRound` implements round-half-to-even on the scaled float; CPython's `round()` is correctly-rounded decimal, so edge-case ties on adversarial inputs could differ by 0.001. No such case occurs in the tested traces.
- API-level guards (`budget ≤ 100000`, `maxNodes ≤ 2000`, `seed ≤ 500 chars`) are transport safety caps for the serverless function, not part of the algorithm.
