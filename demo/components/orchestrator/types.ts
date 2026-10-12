"use client";

export interface TraceEvent {
  flag: "ok" | "FAIL";
  node_id: number;
  hypothesis: string;
  loss: number;
  cost: number;
  cumulative: number;
}

export interface ResearchNode {
  node_id: number;
  parent: number | null;
  hypothesis: string;
  config: { sparsity_top: number; lr: number };
  result: { loss: number; sparsity_top: number; lr: number } | null;
  cost_usd: number;
  novelty: number;
  quality: number;
  failure: string | null;
}

export interface RunStats {
  nodesExplored: number;
  spent: number;
  budget: number;
  failed: number;
}

export interface RunResponse {
  events: TraceEvent[];
  nodes: Record<string, ResearchNode>;
  bestBranch: number[];
  budgetExhausted: boolean;
  stats: RunStats;
}

export type RunPhase = "idle" | "loading" | "animating" | "done" | "error";

export interface RunParams {
  seed: string;
  budget: number;
  maxNodes: number;
  rngSeed: number;
}

export async function postRun(params: RunParams): Promise<RunResponse> {
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(body?.detail)
      ? body.detail.map((d: { path?: string; message?: string }) => d.message ?? JSON.stringify(d)).join("; ")
      : (body?.detail ?? body?.error ?? `request failed (${res.status})`);
    throw new Error(String(detail));
  }
  return body as RunResponse;
}
