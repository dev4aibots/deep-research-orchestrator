"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ResearchNode, RunResponse, TraceEvent } from "./types";

interface Props {
  run: RunResponse | null;
  revealed: number;
}

function fmtEventLine(e: TraceEvent): string {
  const flag = e.flag === "ok" ? "ok " : "FAIL";
  const loss = e.loss.toFixed(3).padStart(5, " ");
  return `    [${flag}] node #${String(e.node_id).padStart(2, "0")}  hypo='${e.hypothesis}'  loss=${loss}  $=${e.cost.toFixed(2)}  cum=$${e.cumulative.toFixed(2)}`;
}

export function RunLog({ run, revealed }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  const lines: string[] = [];
  if (run) {
    const showAll = revealed >= run.events.length;
    lines.push(
      `=== research orchestrator: simulated tree search (budget $${run.stats.budget}) ===`,
      "",
    );
    for (let i = 0; i < Math.min(revealed, run.events.length); i++) {
      lines.push(fmtEventLine(run.events[i]));
    }
    if (!showAll) {
      // The trace reveals progressively while the search animates; say so
      // explicitly so a partial trace is never mistaken for the full one.
      lines.push(
        `    … revealing experiments (${Math.min(revealed, run.events.length)} of ${run.events.length} shown) …`,
      );
    }
    if (showAll) {
      lines.push("");
      if (run.budgetExhausted) {
        lines.push(`    BUDGET EXHAUSTED at $${run.stats.spent.toFixed(2)}`);
      }
      lines.push(`nodes explored : ${run.stats.nodesExplored}`);
      lines.push(
        `budget spent   : $${run.stats.spent.toFixed(2)} of $${run.stats.budget.toFixed(2)}`,
      );
      lines.push(`failed nodes   : ${run.stats.failed}`);
      lines.push("");
      lines.push(`best branch (length ${run.bestBranch.length}):`);
      for (const id of run.bestBranch) {
        const n: ResearchNode | undefined = run.nodes[String(id)];
        if (!n) continue;
        const loss = n.result ? n.result.loss.toFixed(3) : "?";
        lines.push(
          `  #${String(n.node_id).padStart(2, "0")} ${n.hypothesis}   q=${n.quality.toFixed(2)}  loss=${loss}`,
        );
      }
      lines.push("");
      lines.push("(writer + reviewer + red-team steps would run here; stubbed for the scaffold)");
    }
  }

  useEffect(() => {
    const viewport = rootRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    );
    if (!viewport) return;
    // Stick to the bottom only while the user is already near it; never yank
    // the scroll away from someone reading earlier lines mid-reveal.
    const nearBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 48;
    if (nearBottom) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "auto" });
    }
  }, [revealed, run]);

  return (
    <Card className="shadow-card du-editorial-report">
      <CardHeader className="pb-2">
        <CardTitle className="font-display du-sec-head" style={{ fontSize: "var(--fs-h3)" }}>
          Search log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea
          className="rounded-md bg-card-flat border border-divider"
          style={{ height: 280 }}
          ref={rootRef}
        >
          {lines.length === 0 ? (
            <p
              className="p-4 text-ink-secondary font-mono"
              style={{ fontSize: "var(--fs-body)" }}
            >
              {"$ waiting for a run"} — each line is one simulated experiment, written as the search runs.
            </p>
          ) : (
            <pre
              className="p-4 font-mono text-ink-secondary whitespace-pre-wrap"
              style={{ fontSize: "var(--fs-body)", lineHeight: 1.5 }}
              aria-live="polite"
            >
              {lines.map((l, i) => {
                const fail = l.includes("[FAIL]");
                const ok = l.includes("[ok ]");
                return (
                  <div
                    key={i}
                    className={`log-line ${fail ? "text-danger" : ok ? "text-ink" : ""}`}
                  >
                    {l || " "}
                  </div>
                );
              })}
            </pre>
          )}
        </ScrollArea>
        <p
          className="text-ink-secondary mt-2"
          style={{ fontSize: "var(--fs-caption)" }}
        >
          The trace reads like the original main.py output. Costs and losses
          are simulated; nothing really runs.
        </p>
      </CardContent>
    </Card>
  );
}
