"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/store/app-store";

/**
 * The scroll progress bar fills with the active cluster color.
 * Cluster sections tint it, everything else keeps brand teal
 * warmed by the active lens temperature. Colors resolve through
 * CSS vars so paper grades, colorblind profiles and lens themes
 * all stay honest.
 */
const CLUSTER_COLORS: Record<string, string> = {
  clusters: "var(--cluster-retail)",
  map: "var(--cluster-cbd)",
  mosaic: "var(--cluster-industrials)",
  planet: "var(--cluster-cbd)",
  investors: "var(--cluster-retail)",
  constellation: "var(--cluster-retail)",
  timemachine: "#C9A35A",
  pulse: "var(--ibl-teal)",
  newsroom: "var(--cluster-services)",
  trust: "var(--cluster-services)",
};

/* The fill's breath follows the grade. Dark grades keep the luminous halo,
   paper grades get a thin printed bleed under the rule instead of a glow. */
const PROGRESS_CSS = `
.progress-fill {
  box-shadow: 0 0 12px color-mix(in srgb, var(--fill, var(--ibl-teal)) 45%, var(--background));
}
html[data-theme="light"] .progress-fill,
html[data-theme="sepia"] .progress-fill {
  box-shadow: 0 1px 6px color-mix(in srgb, var(--fill, var(--ibl-teal)) 38%, var(--background));
}
`;

export function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);
  const [color, setColor] = useState("var(--ibl-teal)");
  const lens = useApp((s) => s.lens);

  const lensTemp: Record<string, string> = {
    investor: "var(--cluster-retail)",
    talent: "var(--cluster-industrials)",
    partner: "var(--cluster-cbd)",
    press: "var(--cluster-services)",
  };

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(h > 0 ? Math.min(1, window.scrollY / h) : 0);
        const mid = window.innerHeight / 2;
        let found = "hero";
        document.querySelectorAll("section[id]").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top <= mid && r.bottom >= mid) found = el.id;
        });
        setColor(CLUSTER_COLORS[found] ?? lensTemp[lens] ?? "var(--ibl-teal)");
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [lens]);

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px]"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <style>{PROGRESS_CSS}</style>
      {/* hairline track, visible on paper and on abyss */}
      <div className="absolute inset-0 bg-foreground/[0.08]" />
      <div
        className="progress-fill relative h-full origin-left"
        style={{
          transform: `scaleX(${progress})`,
          background: `linear-gradient(90deg, var(--ibl-teal), ${color})`,
          ["--fill" as string]: color,
          transition: "background 0.6s var(--ease-luxe)",
        }}
      />
    </div>
  );
}
