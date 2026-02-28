"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { ROADMAP_ITEMS, type RoadmapStatus } from "@/lib/roadmap-data";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const STATUS_LABELS: Record<RoadmapStatus, string> = {
  done: "Done",
  "in-progress": "In progress",
  planned: "Planned",
};

interface LandingRoadmapProps {
  prefersReducedMotion?: boolean;
}

export function LandingRoadmap({
  prefersReducedMotion = false,
}: LandingRoadmapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const duration = prefersReducedMotion ? 0 : 0.4;
  const stagger = prefersReducedMotion ? 0 : 0.08;

  return (
    <section ref={ref} className="px-6 py-20 lg:py-28">
      <div className="max-w-2xl mx-auto">
        <motion.p
          className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration, ease: EASE }}
        >
          Product roadmap
        </motion.p>
        <motion.h1
          className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration, delay: stagger * 0.5, ease: EASE }}
        >
          What we&apos;re building
        </motion.h1>
        <motion.p
          className="mt-4 text-base text-muted-foreground text-center max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration, delay: stagger, ease: EASE }}
        >
          From quick saves in your browser to full sync across devices. Here&apos;s the plan.
        </motion.p>

        <div className="mt-16 space-y-6">
          {ROADMAP_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              className="rounded-lg border border-border p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration,
                delay: 0.1 + i * stagger,
                ease: EASE,
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground">
                  <item.icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {item.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-wide px-2 py-0.5 shrink-0"
                    >
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
