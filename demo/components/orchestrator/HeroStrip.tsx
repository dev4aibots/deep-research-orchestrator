"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";

const Ballpit = dynamic(() => import("@/components/Ballpit"), {
  ssr: false,
  loading: () => null,
});

export function HeroStrip({ onRun }: { onRun: () => void }) {
  const [motionOk, setMotionOk] = useState(false);
  const [ambientOn, setAmbientOn] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotionOk(!mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMotionOk(!e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <section className="relative overflow-hidden bg-card border-b border-divider">
      {/* Ambient Ballpit field — Meta blue tints only. Paused/omitted when
          the user prefers reduced motion (DESIGN.md §4). */}
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
          className="font-semibold text-link mb-2"
          style={{ fontSize: "var(--meta-text-secondary)" }}
        >
          dev4aibots / deep-research-orchestrator
        </p>
        <h2
          className="font-bold text-ink-header max-w-[22ch]"
          style={{
            fontSize: "var(--meta-text-hero)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            textWrap: "balance",
          }}
        >
          Watch a tree search spend its experiment budget
        </h2>
        <p
          className="text-ink-secondary mt-3 max-w-[60ch]"
          style={{ fontSize: "var(--meta-text-body)", lineHeight: 1.5 }}
        >
          Best-first search over experiment configs, run by the real ported
          algorithm — every metric it reports is simulated, nothing runs
          anywhere.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={onRun} size="lg">
            <Play className="mr-2 h-4 w-4" />
            Run search
          </Button>
          <span
            className="text-ink-secondary"
            style={{ fontSize: "var(--meta-text-caption)" }}
          >
            default budget $30 · same seed → identical trace
          </span>
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
