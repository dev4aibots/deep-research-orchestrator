/**
 * POST /api/run — executes the ported best-first tree search (lib/treesearch.ts)
 * and returns the FULL trace so the UI can animate it step by step.
 *
 * Request body (JSON):
 *   { "seed": string, "budget"?: number, "maxNodes"?: number, "rngSeed"?: number }
 *
 * Response (JSON):
 *   {
 *     "events": [
 *       { "flag": "ok"|"FAIL", "node_id": 1, "hypothesis": "sparsity top-4",
 *         "loss": 2.793, "cost": 1.59, "cumulative": 1.59 }, ...
 *     ],
 *     "nodes": {
 *       "0": { "node_id": 0, "parent": null, "hypothesis": "...",
 *               "config": { "sparsity_top": 8, "lr": 0.0003 },
 *               "result": null, "cost_usd": 0, "novelty": 1.0,
 *               "quality": 0.5, "failure": null }, ...
 *     },
 *     "bestBranch": [0, 4],
 *     "budgetExhausted": false,
 *     "stats": { "nodesExplored": 26, "spent": 5.66, "budget": 30, "failed": 0 }
 *   }
 *
 * The computation is pure and synchronous; defaults mirror main.py
 * (budget 30, maxNodes 24, rngSeed 7).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  treeSearch,
  bestBranch,
  type ResearchNode,
} from "../../../lib/treesearch";

export const runtime = "nodejs";

const BodySchema = z.object({
  seed: z.string().min(1, "seed must be a non-empty string").max(500),
  budget: z.number().positive("budget must be positive").max(100000).default(30),
  maxNodes: z.number().int().min(1).max(2000).default(24),
  rngSeed: z.number().int().min(0).max(2 ** 31 - 1).default(7),
});

type Body = z.infer<typeof BodySchema>;

function badRequest(detail: unknown) {
  return NextResponse.json({ error: "invalid_request", detail }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return badRequest("request body must be valid JSON");
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return badRequest(
      parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    );
  }
  const { seed, budget, maxNodes, rngSeed }: Body = parsed.data;

  try {
    const result = treeSearch(seed, { budget, maxNodes, rngSeed });

    const nodes: Record<number, ResearchNode> = {};
    for (const [id, node] of result.nodes) {
      nodes[id] = node;
    }

    const branch = bestBranch(result.nodes);
    const failed = [...result.nodes.values()].filter(
      (n) => n.failure !== null,
    ).length;

    return NextResponse.json({
      events: result.events,
      nodes,
      bestBranch: branch.map((n) => n.node_id),
      budgetExhausted: result.budgetExhausted,
      stats: {
        nodesExplored: result.nodes.size,
        spent: result.spent,
        budget: result.budget,
        failed,
      },
    });
  } catch (err) {
    console.error("[api/run] tree search failed:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
