"use client";

import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";

export function TopBar() {
  return (
    <header
      className="sticky top-0 bg-card border-b border-divider"
      style={{ height: "var(--meta-header-height)", zIndex: "var(--meta-z-sticky)" }}
    >
      <div className="max-w-[1200px] mx-auto h-full px-4 flex items-center gap-3">
        <span
          className="flex items-center justify-center rounded-full bg-brand text-white shrink-0 w-9 h-9"
          aria-hidden
        >
          <FlaskConical size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h1
            className="font-bold text-ink leading-tight truncate"
            style={{ fontSize: "var(--meta-text-h3)" }}
          >
            Research Orchestrator
          </h1>
          <p
            className="text-ink-secondary truncate"
            style={{ fontSize: "var(--meta-text-caption)" }}
          >
            best-first tree search over experiment configs — simulated scaffold
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-warning text-ink-secondary"
            style={{ fontSize: "var(--meta-text-caption)" }}
          >
            simulated metrics
          </Badge>
        </div>
      </div>
    </header>
  );
}
