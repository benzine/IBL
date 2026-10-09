"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useApp } from "@/store/app-store";

const EASE_LUXE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* The site is a dive. Scrolling descends; this instrument reads your depth
   and carries you back to the surface. The ring drains as you rise, the
   meter counts the ascent live, and the label catches the light when you
   break the surface. */

/** page pixels per metre of rendered depth */
const PX_PER_M = 100;
const SURFACE_AT = 0.9; // fraction of the hero to swim past before the gauge appears

export function SurfaceControl() {
  const reducedMotion = useApp((s) => s.reducedMotion);
  const a11y = useApp((s) => s.a11y);
  const reduce = reducedMotion || a11y === "epilepsy";

  const [depthM, setDepthM] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const risingRef = useRef(false);
  const settlingRef = useRef(0);
  const [rising, setRising] = useState(false);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const depth = Math.max(0, y) / PX_PER_M;
      setDepthM(depth);
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
      setVisible(y > vh * SURFACE_AT);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        read();
      });
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* the ascent: hold the rising state until the motion settles, so the
     gauge can play the full return, not just the first frame */
  const ascend = () => {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    risingRef.current = true;
    setRising(true);
    const settle = () => {
      settlingRef.current = window.setTimeout(() => {
        if (Math.abs(window.scrollY) < 4) {
          risingRef.current = false;
          setRising(false);
        } else {
          settle();
        }
      }, 240);
    };
    settle();
  };
  useEffect(
    () => () => {
      if (settlingRef.current) window.clearTimeout(settlingRef.current);
    },
    []
  );

  const nearSurface = depthM < 20;
  const ringLen = 2 * Math.PI * 27;
  /* the thin arc keeps enough contrast on paper and on the abyss in one mix */
  const ringTint = "color-mix(in srgb, var(--ibl-teal) 62%, var(--foreground))";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.55, ease: EASE_LUXE }}
          /* On phones the gauge docks above the chat pill at the corner, clear
             of the reading column; on larger screens it rides the right edge
             at mid height where the layout keeps a clear margin */
          className="no-print fixed right-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2 md:right-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
        >
          <button
            type="button"
            onClick={ascend}
            aria-label={`Return to the surface, back to top. Currently ${Math.round(
              depthM
            )} metres down the page.`}
            title="Return to the surface"
            className="glass-strong group relative grid size-14 place-items-center rounded-full transition-transform duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 hover:-translate-y-0.5 md:size-16"
            style={{ background: "color-mix(in srgb, var(--popover) 92%, transparent)" }}
          >
            <svg
              viewBox="0 0 64 64"
              aria-hidden
              className="absolute inset-0 size-full -rotate-90"
            >
              <circle
                cx="32"
                cy="32"
                r="27"
                fill="none"
                stroke="color-mix(in srgb, var(--foreground) 16%, transparent)"
                strokeWidth="2"
              />
              <circle
                cx="32"
                cy="32"
                r="27"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={ringLen}
                strokeDashoffset={ringLen * (1 - (rising ? 0 : progress))}
                style={{
                  stroke: ringTint,
                  transition: "stroke-dashoffset 0.35s linear",
                }}
              />
            </svg>
            <ArrowUp
              className="size-5 transition-transform duration-500 group-hover:-translate-y-1"
              strokeWidth={1.75}
              aria-hidden
            />
          </button>

          {/* the depth readout, counting the ascent live */}
          <div aria-hidden className="flex flex-col items-center gap-0.5 select-none">
            <span className="tabular text-[0.7rem] leading-none font-medium">
              −{Math.round(depthM)}
              <span className="caption ml-0.5 text-[0.58rem]">m</span>
            </span>
            <span
              className="caption text-[0.52rem] uppercase tracking-[0.28em] transition-colors duration-700"
              style={{
                color: nearSurface
                  ? "color-mix(in srgb, var(--ibl-teal) 72%, var(--foreground))"
                  : "color-mix(in srgb, var(--muted-foreground) 55%, var(--foreground))",
              }}
            >
              {rising && !nearSurface ? "rising" : "depth"}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
