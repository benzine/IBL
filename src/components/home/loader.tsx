"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/brand";
import { useApp } from "@/store/app-store";

/* The four cluster colours, in the order the site tells their story. */
const CLUSTER_THREAD = ["#4BBDC8", "#EE6C2B", "#2FA96E", "#D63384"];

const INK_QUIET = "color-mix(in srgb, var(--muted-foreground) 45%, var(--foreground))";

/**
 * The loading screen is the house itself waking. The official mark
 * assembles on a clean sheet, the four clusters thread their colours
 * beneath it, and a teal wipe, the colour of the square in the logo,
 * opens the experience. Skippable with Escape or a tap, instant for
 * reduced motion and repeat visits within the session.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const reduced = useApp((s) => s.reducedMotion);
  const [phase, setPhase] = useState<"mark" | "wipe" | "gone">("mark");

  useEffect(() => {
    if (sessionStorage.getItem("ibl-loaded") === "1" || reduced) {
      sessionStorage.setItem("ibl-loaded", "1");
      onDone();
      return;
    }
    const timers = [
      window.setTimeout(() => setPhase("wipe"), 2050),
      window.setTimeout(() => {
        sessionStorage.setItem("ibl-loaded", "1");
        onDone();
      }, 2600),
    ];
    const skip = () => {
      timers.forEach((t) => window.clearTimeout(t));
      sessionStorage.setItem("ibl-loaded", "1");
      onDone();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [onDone, reduced]);

  if (phase === "gone") return null;

  return (
    <motion.div
      className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      {/* a whisper of the paper grain, the sheet the house is printed on */}
      <div aria-hidden className="grain pointer-events-none absolute inset-0" />

      <span className="sr-only">IBL Group, loading the experience</span>

      {/* house captions */}
      <p
        aria-hidden
        className="caption absolute top-10 left-1/2 w-full -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.42em] sm:top-12"
        style={{ color: INK_QUIET }}
      >
        IBL Group
      </p>
      <p
        aria-hidden
        className="caption absolute bottom-10 left-1/2 w-full -translate-x-1/2 text-center text-[10px] uppercase tracking-[0.42em] sm:bottom-12"
        style={{ color: INK_QUIET }}
      >
        Port Louis · 20°09′S 57°30′E
      </p>

      {/* the official mark assembling, the same dedication as ever */}
      <div className="relative" aria-hidden>
        <motion.svg
          viewBox="0 0 99.205 67.949"
          className="h-[clamp(4.9rem,11vw,8.6rem)] w-auto text-foreground"
          initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: EASE.luxe, delay: 0.15 }}
        >
          <g fill="currentColor">
            <motion.path
              d="M44.629,39.539H28.7V30.912c4.061-1.241,9.067-1.534,15.928-1.183,3.219.167,5.175,1.985,5.38,4.88.2,2.749-2.36,4.931-5.38,4.931m9.56-16.407c2.4-2.589,4.387-5.337,4.387-9.622C58.576,6.605,52.533,0,43.419,0H18.249V21.016A35.206,35.206,0,0,1,28.7,17.369V10.117H43.293A4.8,4.8,0,0,1,48,15a4.8,4.8,0,0,1-4.711,4.88H37.229c-10.411,0-19.493,3.057-27.111,12.007V13.792H0V49.6H10.118a92.772,92.772,0,0,1,8.128-11.567V49.6H44.629c8.892,0,16.09-6.219,16.09-14.993a12.645,12.645,0,0,0-6.53-11.476"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.3 }}
            />
            <g transform="translate(35.751 -0.001)">
              <motion.path
                d="M39.752,39.526V0H29.3V49.6H63.453V39.526Z"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.43 }}
              />
            </g>
          </g>
          <motion.rect
            width="11"
            height="11"
            style={{ fill: "var(--ibl-teal)", transformBox: "fill-box", transformOrigin: "center" }}
            initial={{ scale: 0, rotate: -16 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.85, ease: EASE.luxe, delay: 0.05 }}
          />
          <g fill="currentColor" opacity="0.92">
            {[
              { d: "M3.567,28.139v6.872H2.183V28.139H0V26.9H5.749v1.241Z", t: "translate(0.001 32.82)" },
              { d: "M4.524,30.959c0,1.67.311,3.077,2.076,3.077s2.076-1.408,2.076-3.077S8.365,28.013,6.6,28.013s-2.076,1.277-2.076,2.946m-1.454,0c0-2.278.715-4.114,3.53-4.114s3.53,1.836,3.53,4.114c0,2.3-.715,4.234-3.53,4.234s-3.53-1.932-3.53-4.234", t: "translate(3.746 32.755)" },
              { d: "M6.886,30.959c0-2.278.715-4.114,3.53-4.114a9.371,9.371,0,0,1,2.815.428l-.311,1.17a9.154,9.154,0,0,0-2.4-.36c-1.694,0-2.185,1.206-2.185,2.875,0,1.789.491,2.993,2.185,2.993a2.936,2.936,0,0,0,1.323-.309v-1.6H10.441v-1.23h2.791V34.6a7.346,7.346,0,0,1-2.815.6c-2.815,0-3.53-1.907-3.53-4.234", t: "translate(8.402 32.755)" },
              { d: "M15.876,28.139H11.929v2.051h3.41v1.241h-3.41V33.77h4.007v1.241H10.545V26.9h5.331Z", t: "translate(12.868 32.82)" },
              { d: "M17.133,28.139v6.872H15.75V28.139H13.567V26.9h5.748v1.241Z", t: "translate(16.555 32.82)" },
              { d: "M16.79,35.009V26.9h1.383v3.293h3.459V26.9h1.383v8.11H21.632V31.43H18.173v3.579Z", t: "translate(20.487 32.821)" },
              { d: "M25.749,28.139H21.8v2.051h3.41v1.241H21.8V33.77h4.007v1.241H20.418V26.9h5.331Z", t: "translate(24.914 32.82)" },
              { d: "M24.922,30.751h1.814a1.215,1.215,0,0,0,1.37-1.312,1.2,1.2,0,0,0-1.323-1.3H24.922Zm3.268,4.258-1.814-3.031H24.922v3.031H23.539V26.9h3.4a2.387,2.387,0,0,1,2.589,2.54,2.217,2.217,0,0,1-1.705,2.327L29.8,35.009Z", t: "translate(28.722 32.821)" },
            ].map((letter, i) => (
              <g key={i} transform={letter.t}>
                <motion.path
                  d={letter.d}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE.luxe, delay: 0.55 + i * 0.05 }}
                />
              </g>
            ))}
          </g>
        </motion.svg>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="caption absolute -bottom-8 left-0 w-full text-center text-[10px] uppercase tracking-[0.42em]"
          style={{ color: INK_QUIET }}
        >
          Since 1830
        </motion.p>

        {/* the four clusters, threading their colours under the house */}
        <div className="absolute -bottom-[3.4rem] left-1/2 flex -translate-x-1/2 items-center gap-2.5">
          {CLUSTER_THREAD.map((color, i) => (
            <motion.span
              key={color}
              className="block h-[3px] w-9 rounded-full"
              style={{ background: color, transformOrigin: "left center" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.45, ease: EASE.luxeInOut, delay: 1.05 + i * 0.14 }}
            />
          ))}
        </div>
      </div>

      {/* Teal wipe exit, the colour of the square in the mark */}
      {phase === "wipe" && (
        <motion.div
          className="absolute inset-0 origin-top bg-teal"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.55, ease: EASE.luxeInOut }}
          style={{ zIndex: 1 }}
        />
      )}
    </motion.div>
  );
}
