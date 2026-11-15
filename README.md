# Deep Research Orchestrator

**Live demo:** https://deep-research-orchestrator-demo.vercel.app

A best-first tree search over research experiments: expand a hypothesis, pay for it out of a budget, score it on novelty × quality, and keep going until the budget or the depth runs out. The search is real, deterministic and tested. The experiments it plans are simulated, and the demo says so on the page.

```text
$ python main.py
=== autonomous research agent: tree search (budget $30) ===
    [ok ] node #01  hypo='sparsity top-4'  loss=2.762  $=1.46  cum=$1.46
    [ok ] node #02  hypo='sparsity top-8'  loss=2.726  $=1.35  cum=$2.81
...
nodes explored : 26
budget spent   : $5.57 of $30.00
failed nodes   : 0
(writer + reviewer + red-team steps would run here; stubbed for the scaffold)
```

## What is actually implemented

| Piece | Where | Status |
|---|---|---|
| Best-first tree search with budget accounting, depth limit and a quality/novelty score | [`main.py`](main.py) | real, stdlib only, runs in under a second |
| A line-by-line TypeScript port of the same algorithm for the browser demo | [`demo/lib/treesearch.ts`](demo/lib/treesearch.ts) | real; CPython differences documented in [`demo/PORT_NOTES.md`](demo/PORT_NOTES.md) |
| 22 parity tests over scoring, budget cutoffs, expansion order and determinism | [`demo/lib/treesearch.test.ts`](demo/lib/treesearch.test.ts) | real; `npm test` in `demo/` prints `22 passed, 0 failed` |
| Seeded PRNG so one question always produces one trace | [`demo/lib/prng.ts`](demo/lib/prng.ts) | real |
| The demo console (Next.js 14, animated trace, node inspector) | [`demo/`](demo) | real UI over the ported engine |

## What is simulated, on purpose

- The LLM planner, the writer, the reviewer and the red-team stage are **stubs**. The trace ends by saying so.
- The "experiments" return synthetic loss and dollar figures from a seeded RNG. No GPU, no PyTorch, no web search.
- The deployed console carries a **SIMULATED** label and states that no research happens behind it.

That boundary is the point of the project: the orchestration primitive is separable from the expensive parts, so it can be built, tested and replayed without a compute bill. It is not a research product and it produces no research findings.

## Why the tree search is the interesting part

Depth-first exploration of agent ideas spends the whole budget on the first branch that looks promising. Breadth-first exploration spends it evenly and never goes deep. Best-first with an explicit priority function is the smallest thing that does neither: it keeps a frontier, expands the node with the best expected value, and stops on a budget rather than on a hunch.

Three details that make it behave:

1. **Budget is a first-class cost, not a counter.** Each node carries a dollar cost, and expansion stops when the *cumulative* spend crosses the budget. A cheap unproductive branch is allowed; an expensive one is not.
2. **Score is a product, not a sum.** `novelty × quality` means a very novel but low-quality idea cannot buy its way to the top, which is what a sum would let it do.
3. **Failed nodes are kept.** A failed experiment is information; dropping it from the frontier is how agents repeat the same mistake three times.

## Run it

```bash
# the algorithm, in Python, no dependencies
python main.py

# the demo console
cd demo
npm install
npm run dev        # http://localhost:3000

cd demo
npm test           # 22 parity tests
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

CI runs all four commands on Node 20, 22 and 24, and runs `python main.py` on Python 3.12.

## Repository layout

```
main.py                     the algorithm, dependency-free
demo/lib/treesearch.ts      TypeScript port used by the console
demo/lib/treesearch.test.ts 22 parity tests, no test framework required
demo/lib/prng.ts            seeded PRNG (mulberry32)
demo/app/                   Next.js app: trace animation, node inspector
demo/PORT_NOTES.md          every deliberate difference from the Python original
docs/                       architecture, engineering decisions, evaluation notes, limitations
```

## What this does not claim

- No measured research quality, because no research runs.
- No benchmark numbers for the tree search against other planners.
- No production hardening: this is a scaffold that shows the primitive, not a service.

The earlier revision of this README showed a fabricated 12-page research report, invented subtask counts and an invented 89% scraping success rate. None of that was ever produced by this code, so it has been removed rather than qualified.
