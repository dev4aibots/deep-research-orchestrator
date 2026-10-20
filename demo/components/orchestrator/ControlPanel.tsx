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
        <CardTitle className="font-display" style={{ fontSize: "var(--fs-h3)" }}>
          Search settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="budget">Pretend budget ($)</Label>
            <span
              className="font-semibold text-ink"
              style={{ fontSize: "var(--fs-body)" }}
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
            aria-label="pretend budget in dollars"
          />
          <p
            className="text-ink-secondary"
            style={{ fontSize: "var(--fs-caption)" }}
          >
            The search stops when spend reaches the budget. One experiment may
            push it slightly over.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="maxnodes">Ideas to try, at most</Label>
            <span
              className="font-semibold text-ink"
              style={{ fontSize: "var(--fs-body)" }}
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
            aria-label="maximum ideas to try"
          />
          <p
            className="text-ink-secondary"
            style={{ fontSize: "var(--fs-caption)" }}
          >
            Checked each time the search picks its next idea. Every pick adds
            five, so the count can land a little above this number.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rngseed">Random seed</Label>
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
          <p
            className="text-ink-secondary"
            style={{ fontSize: "var(--fs-caption)" }}
          >
            Change it for a different tree. Keep it to replay the same one.
          </p>
        </div>

        <div className="flex gap-2 pt-1">
          <Button onClick={onRun} disabled={running || params.seed.trim().length === 0} className="flex-1">
            <Play className="mr-2 h-4 w-4" />
            {running ? "Running…" : "Run the search"}
          </Button>
          <Button variant="secondary" onClick={onReset} disabled={running} aria-label="reset the search settings" title="Reset">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <div>
          <h3
            className="font-semibold text-ink mb-2"
            style={{ fontSize: "var(--fs-body)" }}
          >
            What the first five ideas will be
          </h3>
          <ol
            className="list-decimal list-inside space-y-1 text-ink-secondary font-mono"
            style={{ fontSize: "var(--fs-caption)" }}
          >
            {EXPANSION_PREVIEW.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
          <p
            className="text-ink-secondary mt-2"
            style={{ fontSize: "var(--fs-caption)", lineHeight: 1.5 }}
          >
            Ideas come from small fixed edits to one knob at a time — no model
            plans them. Ideas are picked best-first: 0.4 × novelty + 0.5 ×
            quality + 0.1 × budget left. About one in ten fails, and failed
            ideas are never picked again.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
