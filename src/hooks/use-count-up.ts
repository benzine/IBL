"use client";

import { useEffect, useRef, useState } from "react";

const EASE = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Counts up when the element enters the viewport, with the luxe ease.
 * Honors reduced motion by jumping straight to the value.
 */
export function useCountUp(target: number, duration = 1800, decimals = 0) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.documentElement.dataset.motion === "reduced" ||
        document.documentElement.dataset.a11y === "epilepsy");
    if (reduce) {
      const t = setTimeout(() => setValue(target), 0);
      started.current = true;
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / duration);
            setValue(target * EASE(p));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return { ref, formatted, value };
}

/** Live ticking value that keeps counting in real time after mount (pulse layer). */
export function useLiveCounter(
  perSecond: number,
  base: number,
  decimals = 0
) {
  const [value, setValue] = useState(base);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setValue(base + perSecond * elapsed);
    }, 1000);
    return () => clearInterval(id);
  }, [perSecond, base]);
  const formatted = value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return { value, formatted };
}
