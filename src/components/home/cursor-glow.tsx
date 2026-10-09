"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Four cluster colors form a soft cursor aura. Desktop pointers only,
 * disabled for motor impaired visitors, reduced motion and touch.
 * On dark grades it stays a luminous, slowly rotating aura. On paper
 * grades a saturated glow would smear, so it widens and quiets into a
 * still watercolor wash pressed into the sheet, and the hue stops
 * rotating, watercolor does not spin. Grade is read from the html
 * data-theme attribute and followed live through a MutationObserver.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement | null>(null);
  const paperRef = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [paper, setPaper] = useState(false);

  /* follow the grade live */
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const p = root.dataset.theme === "light" || root.dataset.theme === "sepia";
      paperRef.current = p;
      setPaper(p);
    };
    const t = setTimeout(sync, 0);
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      clearTimeout(t);
      obs.disconnect();
    };
  }, []);

  useEffect(() => {
    const ok =
      window.matchMedia("(pointer: fine)").matches &&
      document.documentElement.dataset.a11y !== "motor" &&
      document.documentElement.dataset.motion !== "reduced" &&
      document.documentElement.dataset.a11y !== "epilepsy";
    const t = setTimeout(() => setEnabled(ok), 0);
    if (!ok) return () => clearTimeout(t);

    let x = innerWidth / 2;
    let y = innerHeight / 2;
    let cx = x;
    let cy = y;
    let raf = 0;
    let hue = 0;
    let lastX = NaN;
    let lastY = NaN;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
    };
    const loop = () => {
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      const el = ref.current;
      if (el) {
        const half = paperRef.current ? 360 : 260;
        const tx = Math.round((cx - half) * 10) / 10;
        const ty = Math.round((cy - half) * 10) / 10;
        /* write styles only when something actually moved, a still
           pointer must not repaint a 720px blended layer every frame */
        if (tx !== lastX || ty !== lastY) {
          el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
          lastX = tx;
          lastY = ty;
        }
        if (!paperRef.current) {
          hue = (hue + 0.15) % 360;
          el.style.rotate = `${hue}deg`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[5]"
      style={{
        width: paper ? "720px" : "520px",
        height: paper ? "720px" : "520px",
        opacity: paper ? 0.11 : 0.13,
        mixBlendMode: paper ? "multiply" : "screen",
        /* cluster hues resolve through the CSS vars so colorblind corrected
           profiles stay honest even in this decorative wash */
        background:
          "conic-gradient(from 0deg, var(--cluster-retail) 0deg, var(--cluster-cbd) 90deg, var(--cluster-industrials) 180deg, var(--cluster-services) 270deg, var(--cluster-retail) 360deg)",
        filter: paper ? "blur(110px) saturate(0.8)" : "blur(72px)",
        borderRadius: "9999px",
      }}
    />
  );
}
