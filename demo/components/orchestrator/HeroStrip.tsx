"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pause, Play } from "lucide-react";

const Ballpit = dynamic(() => import("@/components/Ballpit"), {
  ssr: false,
  loading: () => null,
});

interface Props {
  seed: string;
  onSeedChange: (seed: string) => void;
  onRun: () => void;
  running: boolean;
  budget: number;
}

export function HeroStrip({ seed, onSeedChange, onRun, running, budget }: Props) {
  const [motionOk, setMotionOk] = useState(false);
  const [ambientOn, setAmbientOn] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotionOk(!mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMotionOk(!e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onRun();
  };

  return (
    <section className="relative overflow-hidden bg-card border-b border-divider">
      {/* Ambient Ballpit field, Meta blue tints only; paused when the user
          prefers reduced motion (design/DESIGN.md section 4). */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {motionOk && ambientOn && (
          <Ballpit
            className="opacity-60"
            count={70}
            colors={[0x0668e1, 0x1877f2, 0x77a7ff, 0xebf5ff, 0x2b7fff]}
            size0={0.7}
            minSize={0.4}
            maxSize={1}
            gravity={0.4}
            friction={0.998}
            maxVelocity={0.1}
            followCursor={false}
          />
        )}
      </div>

      <div className="relative max-w-[1200px] mx-auto px-4 py-10 md:py-14">
        <p
          className="font-semibold text-link mb-3"
          style={{ fontSize: "var(--fs-body)" }}
        >
          <a
            href="https://github.com/dev4aibots/deep-research-orchestrator"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            dev4aibots / deep-research-orchestrator
          </a>
        </p>
        <h2
          className="font-display font-bold text-ink-header"
          style={{
            fontSize: "var(--fs-hero)",
            lineHeight: 1.05,
            maxWidth: "22ch",
            textWrap: "balance",
          }}
        >
          Ask a hard question. Watch the search spend its budget.
        </h2>
        <p
          className="text-ink-secondary mt-4"
          style={{ fontSize: "var(--fs-lead)", lineHeight: 1.5, maxWidth: "56ch" }}
        >
          Type a research question. The search grows a tree of experiment ideas
          from it. Every number is simulated, so the same question always
          grows the same tree.
        </p>

        <form
          onSubmit={submit}
          className="mt-6 max-w-[640px] rounded-lg border border-divider bg-card p-3 shadow-card"
        >
          <Label htmlFor="hero-seed" className="sr-only">
            Type your question
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="hero-seed"
              value={seed}
              onChange={(e) => onSeedChange(e.target.value)}
              placeholder="Type your question: why do small transformers memorize noise?"
              maxLength={500}
              className="flex-1"
              style={{ fontSize: "var(--fs-body)" }}
            />
            <Button
              type="submit"
              size="lg"
              disabled={running || seed.trim().length === 0}
              aria-describedby="hero-budget-note"
            >
              <Play className="mr-2 h-4 w-4" />
              {running ? "Running…" : "Run the search"}
            </Button>
          </div>
          <p
            id="hero-budget-note"
            className="text-ink-secondary mt-2 px-1"
            style={{ fontSize: "var(--fs-caption)" }}
          >
            Runs on a ${budget} pretend budget. Same question, same seed, same tree.
          </p>
        </form>

        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAmbientOn((v) => !v)}
            aria-label={ambientOn ? "pause ambient motion" : "resume ambient motion"}
            className="text-ink-secondary"
          >
            {ambientOn ? <Pause className="mr-1 h-3 w-3" /> : <Play className="mr-1 h-3 w-3" />}
            {ambientOn ? "Pause motion" : "Resume motion"}
          </Button>
        </div>
      </div>
    </section>
  );
}
