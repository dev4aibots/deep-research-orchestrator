"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowRight, Trophy } from "lucide-react";
import type { ResearchNode } from "./types";

interface Props {
  branch: ResearchNode[];
  visibleCount: number; // how many steps of the branch are revealed yet
}

export function BestBranch({ branch, visibleCount }: Props) {
  const shown = branch.slice(0, visibleCount);
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle style={{ fontSize: "var(--meta-text-h3)" }}>
          Best branch walkthrough
        </CardTitle>
        <p
          className="text-ink-secondary"
          style={{ fontSize: "var(--meta-text-caption)" }}
        >
          Highest toy quality wins; each step edits one config knob.
        </p>
      </CardHeader>
      <CardContent>
        {branch.length === 0 && (
          <p
            className="text-ink-secondary"
            style={{ fontSize: "var(--meta-text-body)" }}
          >
            Runs after a search — the best-quality chain appears here.
          </p>
        )}
        {branch.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-stretch gap-2">
            {shown.map((n, i) => {
              const isLast = i === shown.length - 1;
              const isBest = visibleCount >= branch.length && i === branch.length - 1;
              return (
                <div key={n.node_id} className="flex flex-col md:flex-row items-stretch gap-2 flex-1 min-w-0">
                  <div
                    className={`flex-1 min-w-0 rounded-md border p-3 ${
                      isBest ? "border-link bg-accent" : "border-divider bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-mono text-ink-secondary"
                        style={{ fontSize: "var(--meta-text-caption)" }}
                      >
                        step {i}
                      </span>
                      {isBest && (
                        <Badge className="bg-primary text-primary-foreground">
                          <Trophy className="mr-1 h-3 w-3" /> best
                        </Badge>
                      )}
                    </div>
                    <p
                      className="font-semibold text-ink truncate font-mono"
                      style={{ fontSize: "var(--meta-text-secondary)" }}
                      title={n.hypothesis}
                    >
                      #{String(n.node_id).padStart(2, "0")} {n.hypothesis}
                    </p>
                    <p
                      className="text-ink-secondary font-mono mt-1"
                      style={{ fontSize: "var(--meta-text-caption)" }}
                    >
                      q={n.quality.toFixed(2)} · loss=
                      {n.result ? n.result.loss.toFixed(3) : "?"}
                    </p>
                  </div>
                  {!isLast && (
                    <div className="flex items-center justify-center text-ink-secondary">
                      <ArrowRight className="h-5 w-5 hidden md:block" />
                      <ArrowDown className="h-5 w-5 md:hidden" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
