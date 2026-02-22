"use client";

import { useEffect, useMemo, useState } from "react";
import { DotLoader } from "@/components/gsap/dot-loader";
import { cn } from "@/lib/utils";

export type DotFlowItem = {
  title: string;
  frames: number[][];
  duration?: number;
  repeatCount?: number;
};

interface DotFlowProps {
  isPlaying: boolean;
  items: DotFlowItem[];
  className?: string;
}

export function DotFlow({ isPlaying, items, className }: DotFlowProps) {
  const [index, setIndex] = useState(0);

  const safeItems = useMemo(
    () => items.filter((item) => item.frames.length > 0),
    [items],
  );
  const active = safeItems[index] ?? safeItems[0];

  useEffect(() => {
    if (!isPlaying || safeItems.length <= 1) {
      return;
    }
    const timerId = window.setInterval(() => {
      setIndex((value) => (value + 1) % safeItems.length);
    }, 750);
    return () => window.clearInterval(timerId);
  }, [isPlaying, safeItems.length]);

  if (!active) {
    return null;
  }

  const titleKey = `${index}-${active.title}`;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <DotLoader
        frames={active.frames}
        duration={active.duration ?? 120}
        repeatCount={active.repeatCount ?? -1}
        play={isPlaying}
        size={2.75}
      />
      <span key={titleKey} className="text-xs text-muted-foreground">
        {active.title}
      </span>
    </span>
  );
}
