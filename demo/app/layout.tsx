import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Orchestrator — simulated tree search",
  description:
    "Interactive visualisation of the best-first tree-search scaffold from dev4aibots/deep-research-orchestrator, running the real ported algorithm with simulated experiment metrics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
