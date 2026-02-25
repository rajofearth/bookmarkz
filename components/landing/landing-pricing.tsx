"use client";

import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface LandingPricingProps {
  isAuthenticated: boolean;
  prefersReducedMotion?: boolean;
}

export function LandingPricing({
  isAuthenticated,
  prefersReducedMotion = false,
}: LandingPricingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const duration = prefersReducedMotion ? 0 : 0.45;

  return (
    <section ref={ref} className="px-6 py-20 lg:py-28 bg-muted/30">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
        <motion.h2
          className="text-2xl sm:text-3xl font-semibold text-foreground"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Simple pricing
        </motion.h2>
        <motion.p
          className="mt-4 text-muted-foreground"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration,
            delay: 0.06,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          Free for now. Paid plans coming soon.
        </motion.p>
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration,
            delay: 0.12,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <Button asChild size="lg" className="text-base">
            <Link href={isAuthenticated ? "/bookmarks" : "/auth"}>
              Get started free
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
