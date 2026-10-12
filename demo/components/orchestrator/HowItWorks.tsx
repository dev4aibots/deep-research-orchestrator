"use client";

import { motion } from "motion/react";
import { ArrowRight, FlaskConical, GitBranch, Scale, Trophy } from "lucide-react";

const STEPS = [
  {
    icon: FlaskConical,
    title: "Ask",
    text: "Your question becomes the seed of the tree: the idea everything else grows from.",
  },
  {
    icon: GitBranch,
    title: "Grow",
    text: "The search makes five small edits per idea: a new sparsity, a new learning rate.",
  },
  {
    icon: Scale,
    title: "Score",
    text: "Each idea is scored: 0.4 × novelty + 0.5 × quality + 0.1 × budget left.",
  },
  {
    icon: Trophy,
    title: "Pick",
    text: "The best score runs first. The winning chain of ideas is the answer.",
  },
];

/**
 * Editorial pipeline diagram, drawn as product UI, not a generic flowchart.
 * Four numbered steps on a warm wash band with a connector line; the numbers
 * carry the sequence so no motion is needed to read it.
 */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="rounded-lg border border-divider bg-card-flat px-4 py-8 md:px-8">
      <h2
        id="how-it-works"
        className="font-display font-bold text-ink"
        style={{ fontSize: "var(--fs-h2)", letterSpacing: "-0.02em" }}
      >
        How the search works
      </h2>
      <p
        className="text-ink-secondary mt-2"
        style={{ fontSize: "var(--fs-body)", lineHeight: 1.55, maxWidth: "62ch" }}
      >
        Four steps, repeated until the pretend budget runs out. No web research
        happens here: the “experiments” are simulated numbers from a fixed
        formula.
      </p>

      <ol className="mt-6 grid gap-6 md:grid-cols-4 md:gap-4">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.3, delay: Math.min(i, 7) * 0.06, ease: "easeOut" }}
            className="relative"
          >
            <div className="flex items-center gap-3">
              <span
                className="font-display font-bold text-link"
                style={{ fontSize: "var(--fs-h1)" }}
                aria-hidden
              >
                {i + 1}
              </span>
              <span
                className="flex items-center justify-center rounded-full bg-brand text-white w-9 h-9 shrink-0"
                aria-hidden
              >
                <s.icon size={18} strokeWidth={2} />
              </span>
              {i < STEPS.length - 1 && (
                <ArrowRight
                  className="ml-auto text-ink-disabled hidden md:block"
                  size={20}
                  aria-hidden
                />
              )}
            </div>
            <h3
              className="font-display font-semibold text-ink mt-3"
              style={{ fontSize: "var(--fs-lead)" }}
            >
              {s.title}
            </h3>
            <p
              className="text-ink-secondary mt-1"
              style={{ fontSize: "var(--fs-body)", lineHeight: 1.55 }}
            >
              {s.text}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
