"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ResearchNode, RunStats } from "./types";

interface Props {
  node: ResearchNode | null;
  stats: RunStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-ink-secondary" style={{ fontSize: "var(--meta-text-secondary)" }}>
        {label}
      </span>
      <span
        className="text-ink font-mono text-right break-all"
        style={{ fontSize: "var(--meta-text-secondary)" }}
      >
        {value}
      </span>
    </div>
  );
}

export function NodeInspector({ node, stats, open, onOpenChange }: Props) {
  const remaining = stats ? Math.max(0, stats.budget - stats.spent) : 0;
  const budgetTerm = Math.min(1, remaining / 10) * 0.1;
  const noveltyTerm = node ? node.novelty * 0.4 : 0;
  const qualityTerm = node ? node.quality * 0.5 : 0;
  const score = noveltyTerm + qualityTerm + budgetTerm;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle style={{ fontSize: "var(--meta-text-h2)" }}>
            {node ? `Node #${String(node.node_id).padStart(2, "0")}` : "Node inspector"}
          </SheetTitle>
        </SheetHeader>
        {!node && (
          <p className="text-ink-secondary mt-4" style={{ fontSize: "var(--meta-text-body)" }}>
            Click any node in the tree to inspect it.
          </p>
        )}
        {node && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              {node.failure ? (
                <Badge className="bg-alert text-white">FAIL</Badge>
              ) : node.result ? (
                <Badge className="bg-positive text-white">ok</Badge>
              ) : node.node_id === 0 ? (
                <Badge variant="secondary">seed</Badge>
              ) : (
                <Badge variant="outline">frontier</Badge>
              )}
              {node.failure && (
                <span
                  className="text-alert-red font-mono"
                  style={{ fontSize: "var(--meta-text-caption)" }}
                >
                  {node.failure}
                </span>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-ink mb-1" style={{ fontSize: "var(--meta-text-secondary)" }}>
                Hypothesis
              </h3>
              <p className="font-mono text-ink" style={{ fontSize: "var(--meta-text-body)" }}>
                {node.hypothesis}
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-ink mb-1" style={{ fontSize: "var(--meta-text-secondary)" }}>
                Experiment config
              </h3>
              <Row label="sparsity_top" value={String(node.config.sparsity_top)} />
              <Row label="lr" value={String(node.config.lr)} />
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-ink mb-1" style={{ fontSize: "var(--meta-text-secondary)" }}>
                Simulated result
              </h3>
              {node.result ? (
                <>
                  <Row label="loss (simulated)" value={node.result.loss.toFixed(3)} />
                  <Row label="cost (fake $)" value={`$${node.cost_usd.toFixed(2)}`} />
                  <Row label="novelty (toy score)" value={node.novelty.toFixed(3)} />
                  <Row label="quality (toy score)" value={node.quality.toFixed(3)} />
                </>
              ) : (
                <p className="text-ink-secondary" style={{ fontSize: "var(--meta-text-secondary)" }}>
                  {node.node_id === 0
                    ? "The seed is never executed — it is only expanded."
                    : "Not executed yet — still on the frontier."}
                </p>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-ink mb-1" style={{ fontSize: "var(--meta-text-secondary)" }}>
                Score breakdown
              </h3>
              <Row label="novelty × 0.4" value={noveltyTerm.toFixed(3)} />
              <Row label="quality × 0.5" value={qualityTerm.toFixed(3)} />
              <Row label="budget term × 0.1" value={budgetTerm.toFixed(3)} />
              <Separator className="my-1" />
              <Row label="score" value={score.toFixed(3)} />
              <p className="text-ink-secondary mt-1" style={{ fontSize: "var(--meta-text-caption)", lineHeight: 1.45 }}>
                The search scores nodes at push time with the then-remaining
                budget; this breakdown uses the final remaining budget
                (${remaining.toFixed(2)}).
              </p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
