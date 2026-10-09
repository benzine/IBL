"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Check, CirclePlay, Pause, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { T } from "@/components/home/t";
import { CLUSTERS, CLUSTER_MAP, GROUP, type ClusterId } from "@/lib/brand";
import { PEOPLE, SENIORITY_FILTERS, type Person } from "@/lib/data/people";
import { useApp } from "@/store/app-store";
import { useReveal } from "@/hooks/use-reveal";

const STORY_MS = 30_000;
const INK = "#212979";
/** Brand teal resolves through the theme var, deep on paper, bright on abyss */
const TEAL = "var(--ibl-teal)";
/** Small teal text leans toward ink on paper (and toward light on abyss) so
 *  14px accents like the Met chip keep AA contrast on the ivory glass. */
const TEAL_TEXT = "color-mix(in srgb, var(--ibl-teal) 72%, var(--foreground))";
const LUXE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* Paper-grade rules, scoped to this section (dark grades stay untouched).
   .mosaic-lift presses a soft ink shadow under cards on flat ivory,
   .duo-deepen multiplies an ink veil over the screen-blend duotone so portraits
   keep lithographic density on paper (masked away from the label band),
   .mosaic-pill draws a firmer hairline so quiet filter pills stay tactile. */
const PAPER_GRADE_CSS = `
html[data-theme="light"] .mosaic-lift,
html[data-theme="sepia"] .mosaic-lift {
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--foreground) 10%, transparent),
    0 22px 55px -30px color-mix(in srgb, var(--foreground) 26%, transparent);
  transition: box-shadow 0.7s var(--ease-luxe);
}
.duo-deepen { opacity: 0; transition: opacity 0.7s var(--ease-luxe); }
html[data-theme="light"] .duo-deepen,
html[data-theme="sepia"] .duo-deepen { opacity: 1; }
html[data-theme="light"] .mosaic-pill,
html[data-theme="sepia"] .mosaic-pill {
  border-color: color-mix(in srgb, var(--foreground) 22%, transparent);
}
/* Paper grade: the live dot trades its luminous halo for a pressed teal ring */
html[data-theme="light"] .live-dot.hud-dot::after,
html[data-theme="sepia"] .live-dot.hud-dot::after {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ibl-teal) 22%, transparent);
}
/* Card label captions lean toward ink on paper so roles read as printed
   metadata, never as disabled grey over the photo shelf */
html[data-theme="light"] .mosaic-card-cap,
html[data-theme="sepia"] .mosaic-card-cap {
  color: color-mix(in srgb, var(--muted-foreground) 40%, var(--foreground));
}
`;

/** The visitor asked for stillness, or their device did. */
function useReducedMotionFlag(): boolean {
  const stored = useApp((s) => s.reducedMotion);
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () =>
      setFlag(
        mq.matches ||
          document.documentElement.dataset.motion === "reduced" ||
          document.documentElement.dataset.a11y === "epilepsy"
      );
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return stored || flag;
}

function fmtClock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function duoVars(clusterColor: string): CSSProperties {
  return { "--duo-a": INK, "--duo-b": clusterColor } as CSSProperties;
}

function Pill({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={
        active
          ? {
              borderColor: "color-mix(in srgb, var(--ibl-teal) 62%, transparent)",
              background: "color-mix(in srgb, var(--ibl-teal) 14%, transparent)",
              color: "var(--foreground)",
            }
          : undefined
      }
      className={`mosaic-pill glass min-h-11 rounded-full px-4 py-2 text-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 ${
        active ? "" : "text-muted-foreground"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

/** The thirty second story, revealed word by word. */
function StoryPlayer({ person, onEnded }: { person: Person; onEnded: () => void }) {
  const reduced = useReducedMotionFlag();
  const words = useMemo(() => person.story.split(" "), [person.story]);
  const perWord = STORY_MS / Math.max(1, words.length);

  const metFaces = useApp((s) => s.metFaces);
  const metFace = useApp((s) => s.metFace);
  const isMet = metFaces.includes(person.id);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(reduced ? STORY_MS : 0);
  const [ended, setEnded] = useState(false);

  const playingRef = useRef(false);
  const playedRef = useRef(0);
  const resumeRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    if (reduced) {
      const t = window.setTimeout(() => {
        setElapsed(STORY_MS);
        setPlaying(false);
      }, 0);
      return () => window.clearTimeout(t);
    }
    resumeRef.current = performance.now();
    playingRef.current = true;
    const kick = window.setTimeout(() => setPlaying(true), 0);
    const id = window.setInterval(() => {
      const now = performance.now();
      if (playingRef.current && resumeRef.current !== null) {
        playedRef.current += now - resumeRef.current;
        resumeRef.current = now;
      }
      const t = Math.min(STORY_MS, playedRef.current);
      setElapsed(t);
      if (t >= STORY_MS && !endedRef.current) {
        endedRef.current = true;
        setEnded(true);
        playingRef.current = false;
        setPlaying(false);
        onEndedRef.current();
      }
    }, 120);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(id);
    };
  }, [reduced]);

  const toggle = useCallback(() => {
    if (reduced || endedRef.current) return;
    const now = performance.now();
    if (playingRef.current) {
      if (resumeRef.current !== null) playedRef.current += now - resumeRef.current;
      resumeRef.current = null;
      playingRef.current = false;
      setPlaying(false);
    } else {
      resumeRef.current = now;
      playingRef.current = true;
      setPlaying(true);
    }
  }, [reduced]);

  const shown = reduced ? words.length : Math.min(words.length, Math.floor(elapsed / perWord));
  const progress = reduced ? 1 : Math.min(1, elapsed / STORY_MS);
  const R = 26;
  const CIRC = 2 * Math.PI * R;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== " " && e.code !== "Space") return;
    const t = e.target as HTMLElement;
    if (["BUTTON", "A", "TEXTAREA", "INPUT", "SELECT", "LABEL"].includes(t.tagName)) return;
    if (reduced) return;
    e.preventDefault();
    toggle();
  };

  const rootRef = useRef<HTMLDivElement | null>(null);

  // Take focus so the space bar drives the story while the player is focused.
  useEffect(() => {
    const id = window.setTimeout(() => rootRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [person.id]);

  const cluster = CLUSTER_MAP[person.cluster];

  return (
    <div
      ref={rootRef}
      onKeyDown={onKeyDown}
      tabIndex={-1}
      aria-label={`${person.name}, thirty second story player. Space toggles play.`}
      className="flex max-h-[86vh] flex-col overflow-y-auto outline-none sm:max-h-[80vh] sm:flex-row"
    >
      <div
        className="duotone relative aspect-[3/4] w-full shrink-0 overflow-hidden sm:aspect-auto sm:h-full sm:min-h-[420px] sm:w-[42%]"
        style={duoVars(cluster.color)}
      >
        <span
          className="absolute inset-0"
          style={{ background: `linear-gradient(150deg, ${INK}, ${cluster.color} 170%)` }}
          aria-hidden
        />
        <img
          src={person.image}
          alt={`${person.name}, ${person.role}`}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.opacity = "0";
          }}
        />
        {/* Paper grade: an ink veil pressed into the duotone for print density */}
        <span
          aria-hidden
          className="duo-deepen pointer-events-none absolute inset-0 z-[1] mix-blend-multiply"
          style={{
            background: `linear-gradient(168deg, rgba(33,41,121,0.34), rgba(33,41,121,0.20) 52%, rgba(10,14,35,0.38))`,
            maskImage: "linear-gradient(to top, transparent 14%, black 36%)",
            WebkitMaskImage: "linear-gradient(to top, transparent 14%, black 36%)",
          }}
        />
      </div>

      <div className="flex-1 p-5 sm:p-6">
        <p className="eyebrow">
          {person.role} · {person.country}
        </p>
        <DialogTitle className="font-display mt-2 text-2xl italic leading-tight tracking-tight sm:text-[1.9rem]">
          {person.storyTitle}
        </DialogTitle>
        <DialogDescription className="caption mt-2">
          {person.name}. Thirty seconds, read as it is spoken. Portrait from the group's leadership directory.
        </DialogDescription>

        <p className="mt-4 text-[0.95rem] leading-[1.7]">
          {words.map((w, i) => (
            <span
              key={i}
              className="transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                /* Ghosted words mix toward the page, so unrevealed text stays a
                   visible whisper on paper instead of vanishing at low opacity. */
                color:
                  i < shown
                    ? "var(--foreground)"
                    : "color-mix(in srgb, var(--foreground) 32%, var(--background))",
              }}
            >
              {w}{" "}
            </span>
          ))}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="relative grid size-[60px] place-items-center">
            <svg viewBox="0 0 60 60" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="30" cy="30" r={R} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2.5" />
              <circle
                cx="30"
                cy="30"
                r={R}
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progress)}
                style={{ stroke: TEAL, transition: "stroke-dashoffset 0.2s linear" }}
              />
            </svg>
            <button
              type="button"
              onClick={toggle}
              disabled={reduced || ended}
              aria-label={ended ? "Story finished" : playing ? "Pause the story" : "Play the story"}
              className="glass relative z-10 grid size-11 place-items-center rounded-full transition-transform duration-300 hover:scale-105 disabled:cursor-default"
            >
              {ended ? (
                <Check className="size-5" style={{ color: TEAL }} aria-hidden />
              ) : playing ? (
                <Pause className="size-5" aria-hidden />
              ) : (
                <Play className="size-5 translate-x-0.5" aria-hidden />
              )}
            </button>
          </div>

          <div className="min-w-[110px] flex-1">
            <p className="tabular text-sm font-medium">
              {fmtClock(elapsed)} <span className="text-muted-foreground">/ {fmtClock(STORY_MS)}</span>
            </p>
            <p className="caption">
              {reduced
                ? "Shown at once, reduced motion"
                : ended
                  ? "Story complete"
                  : playing
                    ? "Playing"
                    : "Paused"}
            </p>
          </div>

          {isMet ? (
            <span
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-teal/40 bg-teal/10 px-4 text-sm"
              style={{ color: TEAL_TEXT }}
            >
              <BadgeCheck className="size-4" aria-hidden /> Met
            </span>
          ) : (
            <Button
              variant="outline"
              className="min-h-11 rounded-full"
              onClick={() => {
                metFace(person.id);
                toast(`You have met ${person.name}`);
              }}
            >
              <BadgeCheck className="size-4" aria-hidden />
              Mark as met
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PeopleMosaicSection() {
  const metFaces = useApp((s) => s.metFaces);
  const metFace = useApp((s) => s.metFace);

  const [country, setCountry] = useState("all");
  const [cluster, setCluster] = useState<"all" | ClusterId>("all");
  const [seniority, setSeniority] = useState("all");
  const [active, setActive] = useState<Person | null>(null);
  const [completedId, setCompletedId] = useState<string | null>(null);

  const countries = useMemo(() => Array.from(new Set(PEOPLE.map((p) => p.country))), []);
  const filtered = useMemo(
    () =>
      PEOPLE.filter(
        (p) =>
          (country === "all" || p.country === country) &&
          (cluster === "all" || p.cluster === cluster) &&
          (seniority === "all" || p.seniority === seniority)
      ),
    [country, cluster, seniority]
  );

  const { ref: headerRef, style: headerStyle } = useReveal<HTMLDivElement>("s");

  const metCount = metFaces.length;
  const metPct = (metCount / GROUP.team) * 100;

  const closeStory = (open: boolean) => {
    if (!open) {
      if (active && completedId === active.id) metFace(active.id);
      setActive(null);
      setCompletedId(null);
    }
  };

  return (
    <section id="mosaic" className="scroll-mt-24 py-20 sm:py-28" aria-labelledby="mosaic-title">
      <style>{PAPER_GRADE_CSS}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} style={headerStyle}>
          <p className="eyebrow">The people</p>
          <h2 id="mosaic-title" className="h-section mt-3 font-semibold tracking-tight">
            <T k="mosaic.title" />
          </h2>
          <p className="caption mt-4 max-w-2xl">
            <T k="mosaic.blurb" />
          </p>
        </div>

        {/* Met counter, the quiet trophy of the visit */}
        <div className="mosaic-lift glass mt-8 rounded-2xl p-5 sm:p-6 md:flex md:items-end md:gap-10">
          <div className="flex-1">
            <p className="eyebrow flex items-center gap-3">
              <T k="mosaic.met" />
              <span className="live-dot hud-dot" aria-hidden />
              <span className="sr-only">live</span>
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <motion.span
                key={metCount}
                initial={{ scale: 1.35 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.55, ease: LUXE }}
                style={{ transformOrigin: "bottom left" }}
                className="h-display tabular text-6xl sm:text-7xl"
              >
                {metCount}
              </motion.span>
              <span className="caption text-base">
                <T k="mosaic.of" />
              </span>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:w-72">
            <div className="relative h-[3px] overflow-hidden rounded-full bg-foreground/10">
              <div
                className="rule-cluster absolute inset-y-0 left-0"
                style={{ width: `${Math.min(100, metPct)}%` }}
              />
            </div>
            <p className="caption tabular mt-2">
              {metPct.toFixed(3)}% of {GROUP.team.toLocaleString("en-US")}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 space-y-2 sm:space-y-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5" role="group" aria-label="Filter by country">
            <Pill active={country === "all"} onClick={() => setCountry("all")}>
              All countries
            </Pill>
            {countries.map((c) => (
              <Pill key={c} active={country === c} onClick={() => setCountry(c)}>
                {c}
              </Pill>
            ))}
            <p className="caption tabular ml-auto pl-4" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? "face" : "faces"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5" role="group" aria-label="Filter by cluster">
            <Pill active={cluster === "all"} onClick={() => setCluster("all")}>
              All clusters
            </Pill>
            {CLUSTERS.map((c) => (
              <Pill key={c.id} active={cluster === c.id} onClick={() => setCluster(c.id)}>
                <span className="inline-flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden />
                  {c.short}
                </span>
              </Pill>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5" role="group" aria-label="Filter by seniority">
            {SENIORITY_FILTERS.map((f) => (
              <Pill key={f.value} active={seniority === f.value} onClick={() => setSeniority(f.value)}>
                {f.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* The living mosaic */}
        <div className="mt-8 grid grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {filtered.map((p, i) => {
            const tall = filtered.length > 1 && (i % 5 === 1 || i % 5 === 3);
            const c = CLUSTER_MAP[p.cluster];
            const met = metFaces.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                data-cursor="MEET"
                onClick={() => setActive(p)}
                aria-label={`Play the thirty second story of ${p.name}, ${p.role}, ${p.country}`}
                className={`duotone lift group relative block w-full overflow-hidden rounded-xl text-left ${
                  tall ? "row-span-2 h-full min-h-[16rem]" : "aspect-[3/4]"
                }`}
                style={duoVars(c.color)}
              >
                <span
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(150deg, ${INK}, ${c.color} 170%)` }}
                  aria-hidden
                />
                <img
                  src={p.image}
                  alt={`${p.name}, ${p.role}`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0";
                  }}
                />
                {/* Paper grade: ink veil for lithographic density, masked away from
                    the name band so the label keeps its ivory shelf */}
                <span
                  aria-hidden
                  className="duo-deepen pointer-events-none absolute inset-0 z-[1] mix-blend-multiply"
                  style={{
                    background: `linear-gradient(168deg, rgba(33,41,121,0.34), rgba(33,41,121,0.20) 52%, rgba(10,14,35,0.38))`,
                    maskImage: "linear-gradient(to top, transparent 24%, black 46%)",
                    WebkitMaskImage: "linear-gradient(to top, transparent 24%, black 46%)",
                  }}
                />
                {met && (
                  <span
                    className="glass absolute left-3 top-3 z-[2] grid size-7 place-items-center rounded-full"
                    style={{ color: TEAL }}
                    title="Met"
                  >
                    <BadgeCheck className="size-4" aria-hidden />
                    <span className="sr-only">Already met</span>
                  </span>
                )}
                <span
                  className="glass absolute right-3 top-3 z-[2] grid size-9 place-items-center rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden
                >
                  <CirclePlay className="size-5" />
                </span>
                <span className="absolute inset-x-0 bottom-0 z-[2] block p-3 sm:p-4">
                  <span className="flex items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                    <span className="text-sm font-medium leading-tight">{p.name}</span>
                  </span>
                  <span className="caption mosaic-card-cap mt-1 block">{p.role} · {p.country}</span>
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="caption col-span-full py-16 text-center">No one matches yet, widen the filters.</p>
          )}
        </div>
      </div>

      <Dialog open={active !== null} onOpenChange={closeStory}>
        <DialogContent className="glass-strong gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg md:overflow-y-auto max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:rounded-t-3xl max-md:border-b-0">
          {active ? <StoryPlayer person={active} onEnded={() => setCompletedId(active.id)} /> : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
