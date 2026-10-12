"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { ResearchNode, TraceEvent } from "./types";

interface Props {
  nodes: Record<string, ResearchNode> | null;
  events: TraceEvent[];
  revealed: number;
  bestBranch: number[];
  done: boolean;
  animating: boolean;
  paused: boolean;
  loading: boolean;
  onTogglePause: () => void;
  onReplay: () => void;
  selected: number | null;
  onSelect: (id: number) => void;
}

type Status = "root" | "ok" | "fail" | "frontier";

interface Layout {
  pos: Map<number, { x: number; y: number }>;
  width: number;
  height: number;
}

const X_GAP = 64;
const Y_GAP = 76;
const PAD = 44;
const R = 13;

function layoutTree(
  nodes: Record<string, ResearchNode>,
  visible: Set<number>,
): Layout {
  const children = new Map<number, number[]>();
  for (const n of Object.values(nodes)) {
    if (!visible.has(n.node_id)) continue;
    if (n.parent !== null && visible.has(n.parent)) {
      const list = children.get(n.parent) ?? [];
      list.push(n.node_id);
      children.set(n.parent, list);
    }
  }
  for (const list of children.values()) list.sort((a, b) => a - b);

  const pos = new Map<number, { x: number; y: number }>();
  let leaf = 0;
  let maxDepth = 0;
  const dfs = (id: number, depth: number): void => {
    maxDepth = Math.max(maxDepth, depth);
    const ch = children.get(id) ?? [];
    if (ch.length === 0) {
      pos.set(id, { x: leaf * X_GAP, y: depth * Y_GAP });
      leaf += 1;
    } else {
      for (const c of ch) dfs(c, depth + 1);
      const first = pos.get(ch[0])!;
      const last = pos.get(ch[ch.length - 1])!;
      pos.set(id, { x: (first.x + last.x) / 2, y: depth * Y_GAP });
    }
  };
  if (visible.has(0)) dfs(0, 0);
  return {
    pos,
    width: Math.max(1, leaf) * X_GAP + PAD * 2,
    height: (maxDepth + 1) * Y_GAP + PAD * 2,
  };
}

function LegendDot({ fill, stroke }: { fill: string; stroke?: string }) {
  return (
    <svg width="14" height="14" aria-hidden>
      <circle cx="7" cy="7" r="6" fill={fill} stroke={stroke ?? "none"} strokeWidth={stroke ? 2 : 0} />
    </svg>
  );
}

export function TreeExplorer(props: Props) {
  const { nodes, events, revealed, bestBranch, done } = props;

  const view = useMemo(() => {
    if (!nodes) return null;
    const executed = new Map<number, "ok" | "FAIL">();
    const executedSet = new Set<number>();
    for (let i = 0; i < revealed && i < events.length; i++) {
      executed.set(events[i].node_id, events[i].flag);
      executedSet.add(events[i].node_id);
    }
    // Frontier: children of the root and of executed-ok nodes, not executed.
    const expanded = new Set<number>([0]);
    for (const [id, flag] of executed) if (flag === "ok") expanded.add(id);
    const visible = new Set<number>([0]);
    for (const n of Object.values(nodes)) {
      if (executedSet.has(n.node_id)) {
        visible.add(n.node_id);
      } else if (n.parent !== null && expanded.has(n.parent)) {
        visible.add(n.node_id);
      }
    }
    const status = new Map<number, Status>();
    for (const id of visible) {
      if (id === 0) status.set(id, "root");
      else if (executed.has(id)) status.set(id, executed.get(id) === "ok" ? "ok" : "fail");
      else status.set(id, "frontier");
    }
    const layout = layoutTree(nodes, visible);
    const best = new Set<number>(done ? bestBranch : []);
    return { visible, status, layout, best, nodeById: nodes };
  }, [nodes, events, revealed, bestBranch, done]);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle style={{ fontSize: "var(--fs-h3)" }}>
            Search graph
          </CardTitle>
          {props.animating && (
            <div className="ml-auto flex items-center gap-2">
              <span
                className="text-ink-secondary font-mono"
                style={{ fontSize: "var(--fs-caption)" }}
              >
                step {Math.min(revealed, events.length)} / {events.length}
              </span>
              <Button size="sm" variant="secondary" onClick={props.onTogglePause} aria-label={props.paused ? "resume" : "pause"}>
                {props.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button size="sm" variant="secondary" onClick={props.onReplay} aria-label="replay">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}
          {props.done && (
            <Button size="sm" variant="secondary" onClick={props.onReplay} className="ml-auto">
              <RotateCcw className="mr-1 h-4 w-4" /> Replay
            </Button>
          )}
        </div>
        {props.animating && (
          <Progress
            value={events.length ? (Math.min(revealed, events.length) / events.length) * 100 : 0}
            className="mt-2"
          />
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
          {[
            { label: "ok", fill: "var(--meta-brand-primary)" },
            { label: "FAIL", fill: "var(--meta-alert-red)" },
            { label: "frontier", fill: "var(--meta-wash)", stroke: "var(--meta-divider)" },
            { label: "seed", fill: "var(--meta-brand-fb)" },
          ].map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-1.5 text-ink-secondary"
              style={{ fontSize: "var(--fs-caption)" }}
            >
              <LegendDot fill={l.fill} stroke={l.stroke} /> {l.label}
            </span>
          ))}
          <span
            className="flex items-center gap-1.5 text-ink-secondary"
            style={{ fontSize: "var(--fs-caption)" }}
          >
            <svg width="14" height="14" aria-hidden>
              <circle cx="7" cy="7" r="6" fill="none" stroke="var(--meta-blue-link)" strokeWidth={3} />
            </svg>
            best branch
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {props.loading && (
          <div className="px-4 pb-4 space-y-3">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}
        {!props.loading && !view && (
          <div className="px-4 pb-8 pt-4 text-center">
            <p
              className="text-ink-secondary"
              style={{ fontSize: "var(--fs-body)" }}
            >
              No search yet. Type a question above, then press <strong>Run the search</strong>.
            </p>
          </div>
        )}
        {!props.loading && view && (
          <div
            className="overflow-auto border-t border-divider"
            style={{ maxHeight: 560 }}
          >
            <svg
              width={Math.max(view.layout.width, 320)}
              height={view.layout.height}
              role="img"
              aria-label="search tree"
              style={{ display: "block" }}
            >
              <g transform={`translate(${PAD},${PAD - Y_GAP / 4})`}>
                {/* edges */}
                {[...view.visible].map((id) => {
                  const n = view.nodeById[id];
                  if (n.parent === null || !view.visible.has(n.parent)) return null;
                  const a = view.layout.pos.get(n.parent)!;
                  const b = view.layout.pos.get(id)!;
                  const onBest =
                    view.best.has(id) && view.best.has(n.parent);
                  return (
                    <line
                      key={`e-${id}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={onBest ? "var(--meta-blue-link)" : "var(--meta-divider)"}
                      strokeWidth={onBest ? 2.5 : 1.25}
                    />
                  );
                })}
                {/* nodes */}
                {[...view.visible].map((id) => {
                  const n = view.nodeById[id];
                  const p = view.layout.pos.get(id)!;
                  const st = view.status.get(id)!;
                  const isBest = view.best.has(id);
                  const fill =
                    st === "root"
                      ? "var(--meta-brand-fb)"
                      : st === "ok"
                        ? "var(--meta-brand-primary)"
                        : st === "fail"
                          ? "var(--meta-alert-red)"
                          : "var(--meta-wash)";
                  const selected = props.selected === id;
                  return (
                    <g
                      key={id}
                      className="node-enter"
                      transform={`translate(${p.x},${p.y})`}
                      onClick={() => props.onSelect(id)}
                      style={{ cursor: "pointer" }}
                      role="button"
                      tabIndex={0}
                      aria-label={`node ${id}: ${n.hypothesis}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") props.onSelect(id);
                      }}
                    >
                      <title>
                        #{id} {n.hypothesis}
                        {n.result ? ` · loss=${n.result.loss}` : ""}
                        {n.failure ? ` · FAIL: ${n.failure}` : ""}
                      </title>
                      {isBest && (
                        <circle r={R + 5} fill="none" stroke="var(--meta-blue-link)" strokeWidth={3} />
                      )}
                      {selected && (
                        <circle r={R + 9} fill="none" stroke="var(--meta-text-secondary)" strokeWidth={1.5} strokeDasharray="4 3" />
                      )}
                      <circle
                        r={R}
                        fill={fill}
                        stroke={st === "frontier" ? "var(--meta-divider)" : "none"}
                        strokeWidth={1.5}
                      />
                      {st === "fail" && (
                        <g transform="translate(14,-22)">
                          <rect width="42" height="18" rx="4" fill="var(--meta-alert-bg)" />
                          <text
                            x="21"
                            y="13"
                            textAnchor="middle"
                            fill="var(--meta-text-primary)"
                            fontWeight={700}
                            style={{ fontSize: "var(--fs-caption)" }}
                            fontFamily="var(--meta-font-ui)"
                          >
                            FAIL
                          </text>
                        </g>
                      )}
                      <text
                        y={R + 16}
                        textAnchor="middle"
                        fill="var(--meta-text-secondary)"
                        fontFamily="var(--meta-font-mono)"
                        style={{ fontSize: "var(--fs-caption)" }}
                      >
                        #{String(id).padStart(2, "0")}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
