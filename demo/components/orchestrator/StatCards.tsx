"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { RunResponse, RunPhase } from "./types";

interface Props {
  run: RunResponse | null;
  phase: RunPhase;
}

export function StatCards({ run, phase }: Props) {
  const loading = phase === "loading";
  const stats = run?.stats ?? null;
  const budgetPct = stats && stats.budget > 0 ? (stats.spent / stats.budget) * 100 : 0;
  const bestLosses = (run?.bestBranch ?? [])
    .map((id) => run!.nodes[String(id)]?.result?.loss)
    .filter((l): l is number => typeof l === "number");
  const bestLoss = bestLosses.length ? Math.min(...bestLosses) : null;

  const cards = [
    {
      label: "Ideas tried",
      value: stats ? String(stats.nodesExplored) : "–",
      sub: null as React.ReactNode,
    },
    {
      label: "Budget spent (simulated)",
      value: stats ? `$${stats.spent.toFixed(2)}` : "–",
      sub: stats ? (
        <div className="mt-2">
          {/* Decorative: the "$X.XX" value and "of $Y budget" text already
              convey this to assistive tech. aria-hidden keeps the progressbar
              (including its visually-hidden fallback glyph) out of the AX tree. */}
          <Progress value={Math.min(100, budgetPct)} aria-hidden="true" />
          <p
            className="text-ink-secondary mt-1"
            style={{ fontSize: "var(--fs-caption)" }}
          >
            of ${stats.budget.toFixed(2)} budget
          </p>
        </div>
      ) : null,
    },
    {
      label: "Failed ideas (simulated)",
      value: stats ? String(stats.failed) : "–",
      sub:
        stats && stats.failed > 0 ? (
          <Badge className="bg-alert-bg text-ink mt-2">
            {stats.failed} {stats.failed === 1 ? "failure" : "failures"}
          </Badge>
        ) : stats ? (
          <Badge className="bg-positive-bg text-ink mt-2">none</Badge>
        ) : null,
    },
    {
      label: "Best loss (simulated)",
      value: bestLoss !== null ? bestLoss.toFixed(3) : "–",
      sub: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="shadow-card">
          <CardContent className="pt-4">
            {loading ? (
              <>
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </>
            ) : (
              <>
                <p
                  className="text-ink-secondary"
                  style={{ fontSize: "var(--fs-body)" }}
                >
                  {c.label}
                </p>
                <p
                  className="font-display font-bold text-ink mt-1"
                  style={{ fontSize: "var(--fs-h1)" }}
                >
                  {c.value}
                </p>
                {c.sub}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
