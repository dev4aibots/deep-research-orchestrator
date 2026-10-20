"use client";

import { useEffect, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
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
  // auto-animate only when the user has not asked for reduced motion
  const [motionOk, setMotionOk] = useState(false);
  const [parent] = useAutoAnimate({ duration: 200, easing: "ease-out" });
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotionOk(!mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMotionOk(!e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return (
    <Card className="shadow-card du-editorial-report">
      <CardHeader className="pb-2">
        <CardTitle className="font-display du-sec-head" style={{ fontSize: "var(--fs-h3)" }}>
          Best chain of ideas
        </CardTitle>
        <p
          className="text-ink-secondary"
          style={{ fontSize: "var(--fs-caption)" }}
        >
          The highest-scoring chain of small edits, in the order the search picked them.
        </p>
      </CardHeader>
      <CardContent>
        {branch.length === 0 && (
          <p
            className="text-ink-secondary"
            style={{ fontSize: "var(--meta-text-body)" }}
          >
            The winning chain appears here once a search finishes.
          </p>
        )}
        {branch.length > 0 && (
          <div ref={motionOk ? parent : undefined} className="flex flex-col md:flex-row md:items-stretch gap-2">
            {shown.map((n, i) => {
              const isLast = i === shown.length - 1;
              const isBest = visibleCount >= branch.length && i === branch.length - 1;
              return (
                <div key={n.node_id} className="branch-step flex flex-col md:flex-row items-stretch gap-2 flex-1 min-w-0" style={{ "--i": i } as React.CSSProperties}>
                  <div
                    className={`flex-1 min-w-0 rounded-md border p-3 ${
                      isBest ? "border-link bg-accent" : "border-divider bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-mono text-ink-secondary"
                        style={{ fontSize: "var(--fs-caption)" }}
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
                      style={{ fontSize: "var(--fs-body)" }}
                      title={n.hypothesis}
                    >
                      #{String(n.node_id).padStart(2, "0")} {n.hypothesis}
                    </p>
                    <p
                      className="text-ink-secondary font-mono mt-1"
                      style={{ fontSize: "var(--fs-caption)" }}
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
