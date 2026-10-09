"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor tilt for cards. Disabled for motor impaired and reduced motion profiles.
 * The card follows the pointer under a short ease (tight tracking, no entry pop)
 * and settles home under the house luxe curve when the pointer leaves, so the
 * motion never snaps. The inline transition is scoped to transform only and the
 * motor profile's `transition: none !important` sheet rule still wins over it.
 */
export function useTilt(max = 7) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const FOLLOW = "transform 150ms cubic-bezier(0.33, 1, 0.68, 1)";
    const SETTLE = "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)";

    const onEnter = () => {
      if (document.documentElement.dataset.a11y === "motor") return;
      el.style.transition = FOLLOW;
    };
    const onMove = (e: PointerEvent) => {
      if (document.documentElement.dataset.a11y === "motor") return;
      if (
        document.documentElement.dataset.motion === "reduced" ||
        document.documentElement.dataset.a11y === "epilepsy"
      )
        return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-4px)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transition = SETTLE;
      el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)";
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [max]);

  return ref;
}

/**
 * Magnetic attraction for buttons, radius in px.
 */
export function useMagnetic(strength = 0.32, radius = 120) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (document.documentElement.dataset.a11y === "motor") return;
      if (
        document.documentElement.dataset.motion === "reduced" ||
        document.documentElement.dataset.a11y === "epilepsy"
      )
        return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
        });
      } else {
        el.style.transform = "translate(0, 0)";
      }
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = "translate(0, 0)";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [strength, radius]);

  return ref;
}
