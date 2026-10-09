"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ERAS, type Era } from "@/lib/data/eras";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { T } from "./t";

const MIN_YEAR = 1830;
const MAX_YEAR = 2026;
const RAIL_MIN = 1830;
const RAIL_MAX = 2030;
const EASE_LUXE: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** years per frame above which the time lapse overlay kicks in */
const FAST_THRESHOLD = 2.6;
/** the scroll track: 8 era slices x 62.5svh of travel + the 100svh stage */
const SLICES = ERAS.length;

/* ---------- scroll → year mapping ----------
   Each era owns an equal slice of the track so every card gets the same
   screen time. Inside a slice the reel holds the era's opening beat, glides
   through its years, then holds again before the next era lands — a film
   reel with beats, not a spreadsheet. */
const BOUNDS = (() => {
  const b: number[] = ERAS.map((e) => e.range[0]);
  b.push(MAX_YEAR);
  return b;
})();

const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** the year the reel should sit at for a given track progress */
function yearAtProgress(p: number): number {
  const s = Math.min(SLICES - 1, Math.max(0, Math.floor(p * SLICES)));
  const local = p * SLICES - s;
  const shaped = smoothstep(Math.min(1, Math.max(0, (local - 0.08) / 0.84)));
  return BOUNDS[s] + (BOUNDS[s + 1] - BOUNDS[s]) * shaped;
}

/** inverse of the dwell curve, by bisection: the track progress whose
    resting year equals y. Used by rail drags and keyboard jumps. */
function progressForYear(y: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (yearAtProgress(mid) < y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** the scroll progress that parks the reel on era i's opening beat */
const eraHomeProgress = (i: number) => Math.min(1 - 1e-4, (i + 0.04) / SLICES);

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const eraMid = (e: Era) => (e.range[0] + e.range[1]) / 2;
const yearToPct = (y: number) => ((y - RAIL_MIN) / (RAIL_MAX - RAIL_MIN)) * 100;
/** resting position on the first era tick */
const INITIAL_YEAR = MIN_YEAR;

/* ---------- grade awareness ---------- */

type Grade = "light" | "abyss" | "sepia";

/** Follows the live data-theme so the time lapse renders as light or ink. */
function useGrade(): Grade {
  const [grade, setGrade] = useState<Grade>("light");
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const t = root.dataset.theme;
      setGrade(t === "sepia" ? "sepia" : t === "abyss" || t === "oled" ? "abyss" : "light");
    };
    const t0 = window.setTimeout(sync, 0);
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      window.clearTimeout(t0);
      mo.disconnect();
    };
  }, []);
  return grade;
}

/* The era temperature wash. On paper it is printed color, pressed harder
   to survive the bright sheet; in the abyss it stays a luminous glow. */
const BLOB_REST: Record<Grade, number> = { abyss: 0.08, light: 0.12, sepia: 0.12 };
const BLOB_FAST: Record<Grade, number> = { abyss: 0.22, light: 0.28, sepia: 0.26 };

/** the era whose range contains the year, the later era wins overlaps */
function eraForYear(y: number): Era {
  if (y < ERAS[0].range[0]) return ERAS[0];
  let found = ERAS[ERAS.length - 1];
  for (const e of ERAS) {
    if (y >= e.range[0] && y <= e.range[1]) found = e;
  }
  return found;
}

const EraFrame = memo(function EraFrame({ era }: { era: Era }) {
  const [broken, setBroken] = useState(false);
  const duoStyle = { "--duo-a": era.palette[0], "--duo-b": era.palette[1] } as CSSProperties;
  return (
    <div className="duotone diag-cut-both h-full w-full" style={duoStyle}>
      {era.image && !broken ? (
        <img
          src={era.image}
          alt={`${era.title}, ${era.year}`}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div
          className="absolute inset-0 grid place-items-center"
          style={{ background: `linear-gradient(140deg, ${era.palette[0]}, ${era.palette[1]}88)` }}
        >
          <span className="h-display text-outline text-5xl md:text-7xl">{era.year}</span>
        </div>
      )}
    </div>
  );
});

const EraText = memo(function EraText({ era }: { era: Era }) {
  const titleStyle: CSSProperties =
    era.typeStyle === "archival"
      ? { fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic", letterSpacing: "0.02em", fontWeight: 500 }
      : era.typeStyle === "midcentury"
        ? { fontWeight: 500, letterSpacing: "-0.01em" }
        : { fontWeight: 600, letterSpacing: "-0.035em" };
  return (
    <div>
      <h3 className="h-sub" style={titleStyle}>
        {era.title}
      </h3>
      <p className="mt-3 max-w-md leading-relaxed text-foreground/80 md:mt-4">{era.body}</p>
    </div>
  );
});

export function TimeMachineSection() {
  const reducedMotion = useApp((s) => s.reducedMotion);
  const a11y = useApp((s) => s.a11y);
  const fmReduce = useReducedMotion();
  const grade = useGrade();
  const reduce = Boolean(fmReduce) || reducedMotion || a11y === "epilepsy";

  const [cursor, setCursor] = useState(INITIAL_YEAR);
  const cursorRef = useRef(INITIAL_YEAR);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const [scrubbing, setScrubbing] = useState(false);
  const scrubbingRef = useRef(false);
  const [fast, setFast] = useState(false);
  const fastRef = useRef(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);

  /* the pinned stage's approach and engagement: approach climbs from 0 to 1
     as the stage slides into frame, engagement locks the moment the section
     is fully in the viewport — the pin — and the reel is armed */
  const [approach, setApproach] = useState(0);
  const approachRef = useRef(0);
  const [pinned, setPinned] = useState(false);
  const pinnedRef = useRef(false);
  const spinupRef = useRef<{ from: number; t0: number } | null>(null);
  /* the reel's opening cue, shown while the pin holds at 1830 */
  const [cue, setCue] = useState(false);
  const cueRef = useRef(false);

  /* geometry of the track, recomputed on resize and after layout settles */
  const geomRef = useRef({ top: 0, span: 1 });

  const setCursorSync = useCallback((y: number) => {
    const c = clamp(y, MIN_YEAR, MAX_YEAR);
    cursorRef.current = c;
    setCursor(c);
  }, []);

  const measure = useCallback(() => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const span = Math.max(1, rect.height - window.innerHeight);
    geomRef.current = { top, span };
  }, []);

  useEffect(() => {
    measure();
    const t = window.setTimeout(measure, 1200);
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  /* the heart: scroll drives the reel. A passive listener feeds a rAF loop
     that lerps the cursor toward the scroll's target year, so the counter,
     the rail handle and every era crossfade ride one buttery value. */
  const targetRef = useRef(INITIAL_YEAR);
  const [spinupVal, setSpinupVal] = useState<number | null>(null);

  useEffect(() => {
    let raf = 0;
    let prevCursor = cursorRef.current;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      /* the spin-up: on first pin the counter pre-rolls 1800 → 1830 like a
         projector reaching speed, then hands the reel to the scroll */
      const spin = spinupRef.current;
      if (spin) {
        const t = Math.min(1, (now - spin.t0) / 750);
        const eased = 1 - Math.pow(1 - t, 3);
        setSpinupVal(spin.from + (MIN_YEAR - spin.from) * eased);
        if (t >= 1) {
          spinupRef.current = null;
          setSpinupVal(null);
        }
      }

      if (!reduce && !draggingRef.current && !spinupRef.current) {
        const target = targetRef.current;
        const cur = cursorRef.current;
        if (Math.abs(target - cur) > 0.01) {
          setCursorSync(cur + (target - cur) * 0.16);
        } else if (cur !== target) {
          setCursorSync(target);
        }
      }

      const frameVel = cursorRef.current - prevCursor;
      prevCursor = cursorRef.current;

      const scrubNow =
        draggingRef.current || spinupRef.current !== null || Math.abs(frameVel) > 0.35;
      if (scrubNow !== scrubbingRef.current) {
        scrubbingRef.current = scrubNow;
        setScrubbing(scrubNow);
      }

      if (!reduce) {
        const isFast = !draggingRef.current && Math.abs(frameVel) > FAST_THRESHOLD;
        if (isFast !== fastRef.current) {
          fastRef.current = isFast;
          setFast(isFast);
        }
      } else if (fastRef.current) {
        fastRef.current = false;
        setFast(false);
      }
    };

    const onScroll = () => {
      const { top, span } = geomRef.current;
      const y = window.scrollY;
      const p = clamp((y - top) / span, 0, 1);
      targetRef.current = yearAtProgress(p);

      const approachNext = clamp(1 - (top - y) / window.innerHeight, 0, 1);
      if (Math.abs(approachNext - approachRef.current) > 0.004) {
        approachRef.current = approachNext;
        setApproach(approachNext);
      }

      const pinnedNow = y >= top - 4;
      if (pinnedNow && !pinnedRef.current) {
        pinnedRef.current = true;
        setPinned(true);
        /* arm the reel only if we arrive at the opening frame; a reload
           mid-track simply picks up where the scroll stands */
        if (p < 0.01 && !reduce) {
          spinupRef.current = { from: MIN_YEAR - 30, t0: performance.now() };
        }
      } else if (!pinnedNow && pinnedRef.current) {
        pinnedRef.current = false;
        setPinned(false);
      }

      const cueNow = pinnedNow && p < 0.015;
      if (cueNow !== cueRef.current) {
        cueRef.current = cueNow;
        setCue(cueNow);
      }

      if (reduce && !draggingRef.current) setCursorSync(targetRef.current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduce, setCursorSync]);

  /* the rail: dragging moves the page itself, so the hand on the rail and
     the scroll position can never disagree */
  const scrollToProgress = useCallback(
    (p: number, smooth = false) => {
      const { top, span } = geomRef.current;
      window.scrollTo({ top: top + clamp(p, 0, 1) * span, behavior: smooth && !reduce ? "smooth" : "auto" });
    },
    [reduce]
  );

  const yearFromClientX = useCallback((clientX: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
    return RAIL_MIN + pct * (RAIL_MAX - RAIL_MIN);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggingRef.current = true;
    setDragging(true);
    spinupRef.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
    const y = yearFromClientX(e.clientX);
    if (y !== undefined) scrollToProgress(progressForYear(clamp(y, MIN_YEAR, MAX_YEAR)));
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const y = yearFromClientX(e.clientX);
    if (y !== undefined) scrollToProgress(progressForYear(clamp(y, MIN_YEAR, MAX_YEAR)));
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const idx = ERAS.indexOf(eraForYear(cursorRef.current));
    let target: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      target = eraHomeProgress(Math.min(SLICES - 1, idx + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      target = eraHomeProgress(Math.max(0, idx - 1));
    } else if (e.key === "Home") {
      target = eraHomeProgress(0);
    } else if (e.key === "End") {
      target = eraHomeProgress(SLICES - 1);
    } else {
      return;
    }
    e.preventDefault();
    scrollToProgress(target, true);
  };

  const activeEra = eraForYear(cursor);
  const yearLabel =
    spinupVal !== null
      ? String(Math.round(spinupVal))
      : scrubbing
        ? String(Math.round(cursor))
        : activeEra.year;
  const handlePct = yearToPct(cursor);

  /* the stage content presents itself as the frame slides in, and the rail
     draws its line the moment the section owns the viewport */
  const present = clamp(approach * 1.15, 0, 1);
  const stageStyle: CSSProperties = {
    opacity: present,
    transform: `translateY(${(1 - present) * 34}px)`,
    transition: "opacity 0.18s linear, transform 0.18s linear",
  };

  return (
    <section
      id="timemachine"
      ref={sectionRef}
      className="relative h-[600svh]"
      aria-label="IBL time machine"
    >
      {/* the pinned stage: the section is fully in the viewport when it
          locks, and from there every turn of the wheel plays the reel */}
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        {/* era temperature blob */}
        <div
          aria-hidden
          className="ease-luxe pointer-events-none absolute -top-[20%] left-[-15%] h-[75vw] w-[75vw] rounded-full blur-[110px] transition-[background-color,opacity] duration-700 md:left-[25%]"
          style={{
            backgroundColor: activeEra.palette[1],
            opacity: fast && !reduce ? BLOB_FAST[grade] : BLOB_REST[grade],
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[88rem] flex-1 flex-col px-5 pt-[84px] sm:px-8 md:pt-[104px]">
          <div style={stageStyle}>
            <p className="eyebrow flex items-center gap-3">
              <span className="live-dot" aria-hidden />
              <T k="nav.history" />
            </p>
            <h2 className="h-display h-section mt-3 md:mt-4 !text-[clamp(1.7rem,3.6vw,3rem)]">
              <T k="timemachine.title" />
            </h2>
          </div>

          <div className="mx-auto grid w-full flex-1 grid-cols-1 items-center gap-6 py-4 md:gap-12 lg:grid-cols-2 lg:py-6">
            {/* year and era text */}
            <div className="min-h-0" style={stageStyle}>
              <div className="relative" style={{ height: "clamp(3.6rem, 11vw, 11rem)" }}>
                <AnimatePresence initial={false}>
                  <motion.span
                    key={yearLabel}
                    className="h-display h-mega tabular absolute top-0 left-0 whitespace-nowrap !text-[clamp(3.6rem,11vw,11rem)]"
                    initial={{ opacity: 0, y: scrubbing ? 0 : 14, filter: "blur(12px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(12px)" }}
                    transition={{ duration: scrubbing ? 0.12 : 0.45, ease: EASE_LUXE }}
                  >
                    {yearLabel}
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className="mt-4 min-h-[6.5rem] md:mt-6">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeEra.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: reduce ? 0.001 : 0.4, ease: EASE_LUXE }}
                  >
                    <EraText era={activeEra} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* era image */}
            <div className="relative min-h-0" style={stageStyle}>
              <div className="relative mx-auto h-[24svh] w-full max-w-[560px] overflow-hidden sm:h-[28svh] lg:aspect-[4/3] lg:h-auto">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={activeEra.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0.001 : 0.55, ease: EASE_LUXE }}
                  >
                    <EraFrame era={activeEra} />
                  </motion.div>
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={activeEra.id}
                  className="caption mt-3 hidden max-w-md sm:block"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0.001 : 0.3 }}
                >
                  {activeEra.detail}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* the scrubber */}
        <div className="relative z-10 mx-auto w-full max-w-[88rem] px-5 pb-20 sm:px-8 md:pb-24">
          <div
            ref={railRef}
            role="slider"
            tabIndex={0}
            data-cursor="SCROLL"
            aria-label="History scrubber"
            aria-valuemin={MIN_YEAR}
            aria-valuemax={MAX_YEAR}
            aria-valuenow={Math.round(cursor)}
            aria-valuetext={`${Math.round(cursor)}, ${activeEra.title}`}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            className="relative h-11 cursor-ew-resize touch-none select-none focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{
              opacity: present,
              transition: "opacity 0.18s linear",
            }}
          >
            <div className="hairline absolute top-1/2 right-0 left-0 -translate-y-1/2" aria-hidden />
            <div
              aria-hidden
              className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 rounded-full"
              style={{
                width: `${handlePct}%`,
                background: "var(--ibl-teal)",
                transformOrigin: "left center",
                transform: `translateY(-50%) scaleX(${pinned ? 1 : 0})`,
                transition: "transform 0.9s var(--ease-luxe), width 0.1s linear",
              }}
            />
            {ERAS.map((era) => {
              const pct = yearToPct(eraMid(era));
              const active = era.id === activeEra.id;
              return (
                <span
                  key={era.id}
                  aria-hidden
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pct}%` }}
                >
                  <span
                    className={cn("ease-luxe block w-px transition-all duration-500", active ? "h-4" : "h-2.5")}
                    style={{ background: active ? "var(--ibl-teal)" : "color-mix(in srgb, var(--foreground) 40%, transparent)" }}
                  />
                  <span
                    className={cn(
                      "caption absolute top-[calc(100%+2px)] left-1/2 hidden -translate-x-1/2 text-[0.6rem] whitespace-nowrap md:block",
                      active && "text-foreground"
                    )}
                  >
                    {era.year}
                  </span>
                </span>
              );
            })}
            <span
              aria-hidden
              className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${handlePct}%` }}
            >
              <span className="grid size-11 place-items-center">
                <span
                  className="ease-luxe block size-[18px] rounded-full transition-transform duration-300"
                  style={{
                    background: "var(--ibl-teal)",
                    boxShadow: "0 0 0 5px color-mix(in srgb, var(--ibl-teal) 22%, transparent)",
                    transform: dragging ? "scale(1.25)" : undefined,
                  }}
                />
              </span>
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ opacity: present }}>
            <p className="caption">
              Scroll to play the reel · drag the rail
              <span className="hidden md:inline"> · arrow keys step era by era</span>
            </p>
            {/* the scroll cue: visible only while the reel waits at 1830 */}
            <AnimatePresence>
              {cue && (
                <motion.span
                  key="scroll-cue"
                  className="caption flex items-center gap-2"
                  style={{ color: "color-mix(in srgb, var(--ibl-teal) 72%, var(--foreground))" }}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.5, ease: EASE_LUXE }}
                >
                  <motion.span
                    aria-hidden
                    className="inline-block h-3.5 w-[1.5px] rounded-full"
                    style={{ background: "var(--ibl-teal)" }}
                    animate={{ scaleY: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  Keep scrolling, the reel plays with you
                </motion.span>
              )}
            </AnimatePresence>
            <span role="status" className="sr-only">
              {pinned ? "Time machine engaged, scrolling plays the timeline" : ""}
            </span>
          </div>
        </div>

        {/* fast scrub time lapse. In the abyss the year is projected light
            (screen), on paper it is printed ink (multiply) so it never vanishes. */}
        <AnimatePresence>
          {fast && !reduce && (
            <motion.div
              key="timelapse"
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
              style={{ mixBlendMode: grade === "abyss" ? "screen" : "multiply" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <span
                className="h-display tabular text-[clamp(6rem,26vw,22rem)] leading-none"
                style={{ color: "var(--ibl-teal)" }}
              >
                {Math.round(cursor)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
