"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Play, RotateCcw } from "lucide-react";
import type { RunParams } from "./types";

interface Props {
  params: RunParams;
  onChange: (p: RunParams) => void;
  onRun: () => void;
  onReset: () => void;
  running: boolean;
}

const EXPANSION_PREVIEW = [
  "sparsity top-4",
  "sparsity top-8",
  "sparsity top-16",
  "lr=0.0003",
  "lr=0.001",
];

export function ControlPanel({ params, onChange, onRun, onReset, running }: Props) {
  const sliderVal = (v: number | readonly number[]) => (Array.isArray(v) ? v[0] : v);
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle style={{ fontSize: "var(--meta-text-h3)" }}>
          Search controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="seed">Seed hypothesis</Label>
          <Input
            id="seed"
            value={params.seed}
            onChange={(e) => onChange({ ...params, seed: e.target.value })}
            placeholder="a hypothesis to explore"
            maxLength={500}
            className="font-mono"
            style={{ fontSize: "var(--meta-text-secondary)" }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="budget">Budget (simulated $)</Label>
            <span
              className="font-semibold text-ink"
              style={{ fontSize: "var(--meta-text-secondary)" }}
            >
              ${params.budget}
            </span>
          </div>
          <Slider
            id="budget"
            min={1}
            max={1000}
            step={1}
            value={params.budget}
            onValueChange={(v) => onChange({ ...params, budget: sliderVal(v) })}
            aria-label="budget in simulated dollars"
          />
          <p
            className="text-ink-secondary"
            style={{ fontSize: "var(--meta-text-caption)" }}
          >
            Search stops when spend ≥ budget. One experiment may overshoot it.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="maxnodes">Max nodes</Label>
            <span
              className="font-semibold text-ink"
              style={{ fontSize: "var(--meta-text-secondary)" }}
            >
              {params.maxNodes}
            </span>
          </div>
          <Slider
            id="maxnodes"
            min={1}
            max={200}
            step={1}
            value={params.maxNodes}
            onValueChange={(v) => onChange({ ...params, maxNodes: sliderVal(v) })}
            aria-label="max nodes"
          />
          <p
            className="text-ink-secondary"
            style={{ fontSize: "var(--meta-text-caption)" }}
          >
            The guard is checked per pop; each expansion adds 5, so counts may
            overshoot this number.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rngseed">RNG seed</Label>
          <Input
            id="rngseed"
            type="number"
            min={0}
            max={2147483647}
            value={params.rngSeed}
            onChange={(e) =>
              onChange({
                ...params,
                rngSeed: Math.max(0, Math.min(2147483647, Number(e.target.value) || 0)),
              })
            }
            className="w-40"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={onRun} disabled={running || params.seed.trim().length === 0} className="flex-1">
            <Play className="mr-2 h-4 w-4" />
            {running ? "Running…" : "Run search"}
          </Button>
          <Button variant="secondary" onClick={onReset} disabled={running} aria-label="reset controls">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <div>
          <h3
            className="font-semibold text-ink mb-2"
            style={{ fontSize: "var(--meta-text-secondary)" }}
          >
            Dry-run plan — what the first expansion will do
          </h3>
          <ol
            className="list-decimal list-inside space-y-1 text-ink-secondary font-mono"
            style={{ fontSize: "var(--meta-text-caption)" }}
          >
            {EXPANSION_PREVIEW.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
          <p
            className="text-ink-secondary mt-2"
            style={{ fontSize: "var(--meta-text-caption)", lineHeight: 1.45 }}
          >
            Children are proposed by fixed small-edit expansion — no LLM
            planner. Best-first order by score =
            0.4·novelty + 0.5·quality + 0.1·budget-weight. Failures are
            simulated (10% draw), never expanded.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
