"use client";

import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function LandingFooter() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer
      ref={ref}
      className="border-t border-border px-6 py-12 bg-background"
    >
      <motion.div
        className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4 }}
      >
        <Link
          href="/"
          className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
        >
          Bukmarks
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/auth"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </a>
        </div>
      </motion.div>
      <motion.p
        className="mt-6 max-w-4xl mx-auto text-center text-xs text-muted-foreground/70"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        Made with care for keeping the web organized.
      </motion.p>
    </footer>
  );
}
