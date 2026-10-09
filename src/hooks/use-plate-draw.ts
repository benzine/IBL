"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The plate ink. Engineering plates (cluster flood drawings) draw themselves
 * onto the sheet when they scroll into view: every drawable is stamped with
 * pathLength=1, the returned class arms the dash (see globals.css), and an
 * IntersectionObserver inks it. After the linework settles the class is
 * dropped so conventions that are genuinely dashed (vapour, routes) return to
 * their dotted dress. Reduced-motion and epilepsy profiles are neutralized
 * purely in the sheet (animation: none, dashoffset 0, labels visible), so the
 * observer is always safe to arm.
 *
 * phase: "armed" (linework hidden, waiting for view) -> "inked" (drawing)
 * -> "done" (class dropped, natural styles).
 */
export function usePlateDraw<T extends SVGSVGElement>() {
  const ref = useRef<T | null>(null);
  const [phase, setPhase] = useState<"armed" | "inked" | "done">("armed");

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    svg.querySelectorAll("line, circle, rect, path, polyline").forEach((el) => {
      if (!el.getAttribute("pathLength")) el.setAttribute("pathLength", "1");
    });

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase("inked");
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(svg);
    return () => io.disconnect();
  }, []);

  /* drop the arming class once the ink has fully settled */
  useEffect(() => {
    if (phase !== "inked") return;
    const t = window.setTimeout(() => setPhase("done"), 2600);
    return () => window.clearTimeout(t);
  }, [phase]);

  const cls =
    phase === "done" ? "" : `plate-draw${phase === "inked" ? " is-inked" : ""}`;

  return { ref, cls };
}
