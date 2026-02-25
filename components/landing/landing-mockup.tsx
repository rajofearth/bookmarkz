"use client";

import Image from "next/image";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface LandingMockupProps {
  prefersReducedMotion?: boolean;
}

export function LandingMockup({
  prefersReducedMotion = false,
}: LandingMockupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const duration = prefersReducedMotion ? 0 : 0.6;
  const ease = [0.25, 0.46, 0.45, 0.94] as const;

  return (
    <section
      ref={ref}
      className="relative w-full py-12 md:py-24 overflow-hidden"
    >
      {/* Background with landing-bg.png and gradient overlay */}
      <div
        className="absolute inset-0 -z-10"
        aria-hidden
      >
        <Image
          src="/landing-bg.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, var(--background) 0%, transparent 20%, transparent 80%, var(--background) 100%)",
          }}
        />
      </div>

      {/* Video in rounded frame */}
      <div className="flex justify-center items-center px-4">
        <motion.div
          className="w-[90%] max-w-[800px] rounded-xl shadow-2xl overflow-hidden border border-border"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration, ease }}
        >
          <video
            src="https://framerusercontent.com/assets/oHMAfikoZHINE6M6DdwaAGRVCGo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto block"
          />
        </motion.div>
      </div>
    </section>
  );
}
