"use client";

import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type DotLoaderProps = {
  frames: number[][];
  dotClass?: string;
  duration?: number;
  play?: boolean;
  repeatCount?: number;
  size?: number;
};

const GRID_SIZE = 7;
const TOTAL_DOTS = GRID_SIZE * GRID_SIZE;

export function DotLoader({
  frames,
  dotClass,
  duration = 100,
  play = true,
  repeatCount = -1,
  size = 3,
}: DotLoaderProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const loopsRef = useRef(0);
  const dotsRef = useRef<Array<HTMLSpanElement | null>>([]);

  const normalizedFrames = useMemo(
    () =>
      frames.length > 0
        ? frames
        : [Array.from({ length: TOTAL_DOTS }, (_, i) => i)],
    [frames],
  );

  useEffect(() => {
    if (!play) {
      return;
    }
    const timerId = window.setInterval(() => {
      setFrameIndex((value) => {
        const next = (value + 1) % normalizedFrames.length;
        if (next === 0) {
          loopsRef.current += 1;
          if (repeatCount >= 0 && loopsRef.current >= repeatCount) {
            window.clearInterval(timerId);
            return value;
          }
        }
        return next;
      });
    }, duration);
    return () => window.clearInterval(timerId);
  }, [duration, normalizedFrames.length, play, repeatCount]);

  useEffect(() => {
    const activeDots = new Set(normalizedFrames[frameIndex] ?? []);
    for (let i = 0; i < TOTAL_DOTS; i += 1) {
      const dot = dotsRef.current[i];
      if (!dot) continue;
      gsap.to(dot, {
        opacity: activeDots.has(i) ? 1 : 0.12,
        scale: activeDots.has(i) ? 1 : 0.8,
        duration: 0.18,
        ease: "power2.out",
      });
    }
  }, [frameIndex, normalizedFrames]);

  return (
    <span
      className="inline-grid gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      aria-hidden
    >
      {Array.from({ length: TOTAL_DOTS }, (_, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: static fixed grid index
          key={index}
          ref={(element) => {
            dotsRef.current[index] = element;
          }}
          className={cn("rounded-full bg-current", dotClass)}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            opacity: 0.12,
          }}
        />
      ))}
    </span>
  );
}
