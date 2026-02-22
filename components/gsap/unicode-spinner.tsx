"use client";

import { useEffect, useMemo, useState } from "react";
import spinners from "unicode-animations";

type UnicodeSpinnerName = keyof typeof spinners;

interface UnicodeSpinnerProps {
  name?: UnicodeSpinnerName;
  className?: string;
}

export function UnicodeSpinner({
  name = "braille",
  className,
}: UnicodeSpinnerProps) {
  const spinner = useMemo(() => spinners[name], [name]);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setFrameIndex((value) => (value + 1) % spinner.frames.length);
    }, spinner.interval);
    return () => window.clearInterval(intervalId);
  }, [spinner.frames.length, spinner.interval]);

  return (
    <span aria-hidden className={className}>
      {spinner.frames[frameIndex]}
    </span>
  );
}
