import type { Metadata } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import "./design-overlay.css";

export const metadata: Metadata = {
  title: "Deep Research Orchestrator — watch a tree search spend its budget",
  description:
    "Type a hard research question and watch a best-first tree search grow a tree of simulated experiments from it. Real algorithm, simulated metrics — same seed, same trace.",
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
