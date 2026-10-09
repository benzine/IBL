"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Assembly on scroll. Returns ref + visible flag.
 * Direction: n / e / s / w, elements assemble from cardinal directions.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(direction: "n" | "e" | "s" | "w" = "s", once = true) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  const offset =
    direction === "n"
      ? "translateY(-44px)"
      : direction === "e"
        ? "translateX(56px)"
        : direction === "s"
          ? "translateY(44px)"
          : "translateX(-56px)";

  const style: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translate(0,0)" : offset,
    transition: "opacity 1.05s var(--ease-luxe), transform 1.05s var(--ease-luxe)",
  };

  return { ref, visible, style };
}

/**
 * Tracks which section is active for the scroll progress bar cluster color.
 */
export function useSectionObserver(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.25) {
            setActive(e.target.id);
          }
        }
      },
      { threshold: [0.25, 0.5], rootMargin: "-12% 0px -40% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids.join(",")]);
  return active;
}
