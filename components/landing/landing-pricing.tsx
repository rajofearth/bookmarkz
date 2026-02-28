"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { LANDING_GRADIENT } from "./landing-constants";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

interface LandingPricingProps {
  isAuthenticated: boolean;
  prefersReducedMotion?: boolean;
}

export function LandingPricing({ isAuthenticated, prefersReducedMotion = false }: LandingPricingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const duration = prefersReducedMotion ? 0 : 0.45;

  return (
    <section ref={ref} id="pricing" className="relative px-6 py-20 lg:py-28 overflow-hidden isolate scroll-mt-20">
      <div className="absolute inset-0 z-0" aria-hidden>
        <Image src="/landing-bg.png" alt="" fill className="object-cover object-center" sizes="100vw" priority={false} />
      </div>
      <div className="absolute inset-0 z-[1]" style={{ background: LANDING_GRADIENT }} aria-hidden />
      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center rounded-2xl px-8 py-10 sm:px-10 sm:py-12 bg-background/70 backdrop-blur-md border border-border/40 shadow-xl shadow-black/5">
        <motion.h2
          className="text-2xl sm:text-3xl font-semibold text-foreground"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration, ease: EASE }}
        >
          Simple pricing
        </motion.h2>
        <motion.p
          className="mt-4 text-foreground/80"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration,
            delay: 0.06,
            ease: EASE,
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
            ease: EASE,
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
