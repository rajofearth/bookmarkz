"use client";

import {
  FolderIcon,
  SearchIcon,
  ImageIcon,
  Upload,
  Sun,
  LogInIcon,
} from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const FEATURES = [
  {
    icon: FolderIcon,
    title: "Folders & organization",
    description: "Organize links into nested folders. Drag and drop to keep everything tidy.",
  },
  {
    icon: SearchIcon,
    title: "Search",
    description: "Find any bookmark quickly with instant search across titles and URLs.",
  },
  {
    icon: ImageIcon,
    title: "Auto metadata",
    description: "Favicons and preview images fetched automatically for every link.",
  },
  {
    icon: Upload,
    title: "Browser import",
    description: "Import your existing bookmarks from Chrome, Firefox, or any browser export.",
  },
  {
    icon: Sun,
    title: "Light & dark theme",
    description: "Switch between light and dark mode, or follow your system preference.",
  },
  {
    icon: LogInIcon,
    title: "Google & GitHub sign-in",
    description: "Sign in with Google or GitHub. No passwords to remember.",
  },
] as const;

interface LandingFeaturesProps {
  prefersReducedMotion?: boolean;
}

export function LandingFeatures({
  prefersReducedMotion = false,
}: LandingFeaturesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const stagger = prefersReducedMotion ? 0 : 0.06;
  const duration = prefersReducedMotion ? 0 : 0.4;

  return (
    <section
      id="features"
      ref={ref}
      className="px-6 py-20 lg:py-28 scroll-mt-20"
    >
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-2xl sm:text-3xl font-semibold text-center text-foreground"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Everything you need
        </motion.h2>
        <motion.p
          className="mt-3 text-muted-foreground text-center max-w-xl mx-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{
            duration,
            delay: stagger,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          Save, organize, and find your links with ease.
        </motion.p>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="rounded-lg border border-border bg-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration,
                delay: 0.1 + i * stagger,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted mb-4">
                <feature.icon className="size-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
