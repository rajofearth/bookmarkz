"use client";

import gsap from "gsap";
import Flip from "gsap/Flip";
import { type ComponentProps, useLayoutEffect, useMemo, useRef } from "react";

gsap.registerPlugin(Flip);

type FlipRevealItemProps = {
  flipKey: string;
} & ComponentProps<"div">;

export const FlipRevealItem = ({ flipKey, ...props }: FlipRevealItemProps) => {
  return <div data-flip={flipKey} {...props} />;
};

type FlipRevealProps = {
  keys: string[];
  showClass?: string;
  hideClass?: string;
} & ComponentProps<"div">;

export const FlipReveal = ({
  keys,
  hideClass = "",
  showClass = "",
  ...props
}: FlipRevealProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const previousStateRef = useRef<Flip.FlipState | null>(null);

  const isShow = (key: string | null) =>
    !!key && (keys.includes("all") || keys.includes(key));

  const keysSignature = useMemo(() => keys.join("|"), [keys]);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const items = Array.from(
      wrapper.querySelectorAll<HTMLDivElement>("[data-flip]"),
    );

    if (!items.length) {
      previousStateRef.current = null;
      return;
    }

    items.forEach((item) => {
      const key = item.getAttribute("data-flip");
      if (isShow(key)) {
        if (showClass) item.classList.add(showClass);
        if (hideClass) item.classList.remove(hideClass);
      } else {
        if (showClass) item.classList.remove(showClass);
        if (hideClass) item.classList.add(hideClass);
      }
    });

    if (previousStateRef.current) {
      Flip.from(previousStateRef.current, {
        duration: 0.45,
        scale: true,
        ease: "power1.inOut",
        stagger: 0.03,
        absolute: true,
      });
    }

    previousStateRef.current = Flip.getState(items);
  }, [hideClass, keysSignature, showClass]);

  return <div {...props} ref={wrapperRef} />;
};
