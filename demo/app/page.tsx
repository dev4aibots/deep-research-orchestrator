"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig } from "motion/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TopBar } from "@/components/orchestrator/TopBar";
import { HeroStrip } from "@/components/orchestrator/HeroStrip";
import { HowItWorks } from "@/components/orchestrator/HowItWorks";
import { ControlPanel } from "@/components/orchestrator/ControlPanel";
import { TreeExplorer } from "@/components/orchestrator/TreeExplorer";
import { NodeInspector } from "@/components/orchestrator/NodeInspector";
import { RunLog } from "@/components/orchestrator/RunLog";
import { BestBranch } from "@/components/orchestrator/BestBranch";
import { StatCards } from "@/components/orchestrator/StatCards";
import {
  postRun,
  type RunParams,
  type RunPhase,
  type RunResponse,
} from "@/components/orchestrator/types";

const DEFAULTS: RunParams = {
  seed: "investigate sparsity patterns in attention maps of sub-1B transformers",
  budget: 30,
  maxNodes: 24,
  rngSeed: 7,
};

const STEP_MS = 280;

export default function Page() {
  const [params, setParams] = useState<RunParams>(DEFAULTS);
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [run, setRun] = useState<RunResponse | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async () => {
    const seed = params.seed.trim();
    if (!seed) return;
    setError(null);
    setRun(null);
    setRevealed(0);
    setPaused(false);
    setSelected(null);
    setPhase("loading");
    try {
      const data = await postRun({ ...params, seed });
      setRun(data);
      setPhase("animating");
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "run failed");
      setPhase("error");
    }
  }, [params]);

  // Step the reveal animation forward while running.
  useEffect(() => {
    if (phase !== "animating" || paused || !run) return;
    if (revealed >= run.events.length) {
      setPhase("done");
      return;
    }
    const t = setTimeout(() => setRevealed((r) => r + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [phase, paused, run, revealed]);

  const replay = useCallback(() => {
    if (!run) return;
    setRevealed(0);
    setPaused(false);
    setPhase("animating");
  }, [run]);

  const reset = useCallback(() => {
    setParams(DEFAULTS);
    setRun(null);
    setPhase("idle");
    setRevealed(0);
    setPaused(false);
    setError(null);
    setSelected(null);
  }, []);

  const branch = useMemo(() => {
    if (!run) return [];
    return run.bestBranch
      .map((id) => run.nodes[String(id)])
      .filter((n) => n !== undefined);
  }, [run]);

  const branchVisible =
    phase === "done" ? branch.length : Math.min(branch.length, revealed + 1);

  const animating = phase === "animating";
  const busy = phase === "loading" || animating;

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <TopBar />
        <HeroStrip
          seed={params.seed}
          onSeedChange={(seed) => setParams((p) => ({ ...p, seed }))}
          onRun={runSearch}
          running={busy}
        />

        <main className="max-w-[1200px] mx-auto px-4 py-6 space-y-5">
          {error && (
            <div
              role="alert"
              className="rounded-md border border-alert bg-card p-4"
            >
              <p className="font-semibold text-danger" style={{ fontSize: "var(--fs-body)" }}>
                The search couldn&apos;t start
              </p>
              <p
                className="text-ink-secondary font-mono mt-1"
                style={{ fontSize: "var(--fs-body)" }}
              >
                {error}
              </p>
              <p
                className="text-ink-secondary mt-1"
                style={{ fontSize: "var(--fs-caption)" }}
              >
                Fix the question above and press Run the search again.
              </p>
            </div>
          )}

          <HowItWorks />

          <div ref={resultsRef} className="scroll-mt-[72px] grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
            <ControlPanel
              params={params}
              onChange={setParams}
              onRun={runSearch}
              onReset={reset}
              running={busy}
            />
            <TreeExplorer
              nodes={run?.nodes ?? null}
              events={run?.events ?? []}
              revealed={revealed}
              bestBranch={run?.bestBranch ?? []}
              done={phase === "done"}
              animating={animating}
              paused={paused}
              loading={phase === "loading"}
              onTogglePause={() => setPaused((p) => !p)}
              onReplay={replay}
              selected={selected}
              onSelect={(id) => setSelected(id)}
            />
          </div>

          <StatCards run={run} phase={phase} />

          <div className="grid gap-5 lg:grid-cols-2">
            <RunLog run={run} revealed={revealed} />
            <BestBranch branch={branch} visibleCount={branchVisible} />
          </div>

          <footer className="border-t border-divider pt-4 pb-8">
            <p
              className="text-ink-secondary"
              style={{ fontSize: "var(--fs-caption)", lineHeight: 1.6, maxWidth: "72ch" }}
            >
              This demo visualizes the best-first tree-search scaffold from{" "}
              <a
                href="https://github.com/dev4aibots/deep-research-orchestrator"
                target="_blank"
                rel="noreferrer"
                className="font-mono underline hover:no-underline"
              >dev4aibots/deep-research-orchestrator</a>,
              running the real ported algorithm. Every experiment metric is
              simulated: no web research happens, no model plans the ideas, no
              real experiments run, and no money is spent. Same seed →
              identical trace.
            </p>
          </footer>
        </main>

        <NodeInspector
          node={selected !== null && run ? (run.nodes[String(selected)] ?? null) : null}
          stats={run?.stats ?? null}
          open={selected !== null}
          onOpenChange={(o) => {
            if (!o) setSelected(null);
          }}
        />
      </TooltipProvider>
    </MotionConfig>
  );
}
