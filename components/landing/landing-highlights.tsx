"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { FileCode2, Zap, Database, Search, Sparkles } from "lucide-react";

interface LandingHighlightsProps {
  prefersReducedMotion?: boolean;
}

export function LandingHighlights({
  prefersReducedMotion = false,
}: LandingHighlightsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const duration = prefersReducedMotion ? 0 : 0.5;
  const stagger = prefersReducedMotion ? 0 : 0.15;
  const ease = [0.25, 0.46, 0.45, 0.94] as const;

  return (
    <section
      ref={ref}
      className="px-6 py-12 lg:py-20"
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Import from any browser */}
          <motion.div
            className="h-full min-h-[280px] rounded-2xl border border-border bg-card p-8 relative overflow-hidden flex flex-col justify-end"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration, delay: 0, ease }}
          >
            {/* Floating icons */}
            <div className="absolute inset-0 top-0 h-40 flex items-center justify-center pointer-events-none">
              <div className="relative w-48 h-28">
                <div className="absolute top-4 left-4 w-12 h-12 bg-muted rounded-xl flex items-center justify-center border border-border transform -rotate-12 z-10">
                  <FileCode2 className="size-5 text-muted-foreground" />
                </div>
                <div className="absolute top-6 left-20 w-14 h-14 bg-muted/80 rounded-2xl flex items-center justify-center border border-border/50 z-20">
                  <Zap className="size-6 text-muted-foreground" />
                </div>
                <div className="absolute top-10 left-32 w-12 h-12 bg-muted/60 rounded-xl flex items-center justify-center border border-border/50 transform rotate-6 z-30">
                  <Database className="size-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="relative z-10 text-center">
              <h3 className="text-foreground font-medium mb-2">
                Import from any browser
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Already using another bookmark manager? Import from Chrome,
                Firefox, or any OPML export and pick up right where you left off.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Semantic search */}
          <motion.div
            className="h-full min-h-[280px] rounded-2xl border border-border bg-card p-8 relative overflow-hidden flex flex-col justify-end"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration, delay: stagger, ease }}
          >
            {/* Decorative overlay - search/context logos */}
            <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.05] pointer-events-none select-none flex flex-wrap items-center justify-center gap-6 p-4">
              <span className="text-2xl font-semibold text-foreground">
                Search
              </span>
              <span className="text-3xl font-semibold text-foreground italic">
                Find
              </span>
              <span className="text-xl font-bold tracking-wider text-foreground">
                Discover
              </span>
            </div>
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-20">
              <Search className="size-8 text-muted-foreground" />
              <Sparkles className="size-6 text-muted-foreground" />
            </div>
            <div className="relative z-10 text-center">
              <h3 className="text-foreground font-medium mb-2">
                Semantic search
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Find by meaning, not just keywords. Indexed on your device so
                your bookmarks stay private and search stays fast.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
