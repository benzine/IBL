"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plane, Ship, Snowflake, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import { useApp } from "@/store/app-store";
import { CLUSTER_MAP, EASE, type ClusterId } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { T } from "./t";
import { BreakdownPopover, type BreakdownRow } from "./pulse-hud";

/* ==================================================================
   THE MOVEMENTS BOARD — a Solari split-flap departures board for the
   group's air, sea and land logistics. The board is an ink room in
   every grade: pressed into the sheet like the trust vault on paper,
   sitting as glass on the abyss grades. Rows write themselves in with
   the classic flap clatter, then live on — statuses advance, arrivals
   are replaced by fresh movements entering at the top, all in Port
   Louis mean time.
   ================================================================== */

const BOARD_CSS = `
.movements-board {
  background: linear-gradient(180deg, #18204A 0%, #10163A 100%);
  box-shadow:
    inset 0 1px 0 rgba(244, 239, 228, 0.07),
    inset 0 -34px 70px -46px rgba(6, 9, 26, 0.72),
    0 36px 90px -46px rgba(18, 24, 66, 0.6);
  transition: background 0.9s var(--ease-luxe), box-shadow 0.9s var(--ease-luxe);
}
/* The abyss grades: the sealed room opens into glass over the night ocean */
html[data-theme="abyss"] .movements-board,
html[data-theme="oled"] .movements-board {
  background: linear-gradient(180deg, rgb(18 24 66 / 0.5) 0%, rgb(12 17 44 / 0.38) 100%);
  box-shadow:
    inset 0 1px 0 rgba(244, 239, 228, 0.06),
    0 30px 80px -50px rgba(6, 9, 26, 0.6);
}
/* Paper grades: the board is pressed into the sheet, ink not glow */
html[data-theme="light"] .movements-board,
html[data-theme="sepia"] .movements-board {
  box-shadow:
    inset 0 1px 0 rgba(244, 239, 228, 0.08),
    inset 0 -34px 70px -46px rgba(0, 0, 0, 0.78),
    0 2px 6px -2px rgba(33, 41, 121, 0.1),
    0 34px 84px -36px rgba(33, 41, 121, 0.36);
}
/* Cream ink of the modules */
.movements-row { color: rgba(244, 239, 228, 0.92); }
.movements-code { color: rgba(244, 239, 228, 0.96); }
.movements-dim { color: rgba(244, 239, 228, 0.52); }
.movements-gold { color: #C9A35A; }
/* Paper grade: the live dot's halo becomes a pressed teal ring */
html[data-theme="light"] .live-dot.movements-dot::after,
html[data-theme="sepia"] .live-dot.movements-dot::after {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ibl-teal) 22%, transparent);
}
/* The popover wrapper must behave as a full-width grid cell */
.movements-row-wrap { display: block; }
.movements-row-wrap > button { display: block; width: 100%; }
`;

/* ---------- the split-flap engine ---------- */

const FLAP_TICK_MS = 55;
const FLAP_STAGGER_MS = 18;
const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function flapScramble(i: number, tick: number): string {
  return FLAP_CHARS[(i * 37 + tick * 19 + 7) % FLAP_CHARS.length];
}

interface FlapTextProps {
  text: string;
  className?: string;
  /** flaps only when true; reduced motion / epilepsy render static text */
  animate: boolean;
  /** per-row assembly stagger, applied once when the board writes itself in */
  delay?: number;
}

/**
 * One split-flap cell. Each character cycles through 2–4 random chars at
 * ~55 ms per step, staggered left to-right (~18 ms per char), before it
 * settles — the Solari clatter. The parent remounts the cell (key includes
 * the text) whenever the text changes, so a fresh clatter always begins.
 */
function FlapText({ text, className, animate, delay = 0 }: FlapTextProps) {
  const [settle, setSettle] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  /* captured per instance: the assembly stagger applies once, and the
     board-wide stagger window closing must never re-trigger settled rows */
  const delayRef = useRef(delay);

  useEffect(() => {
    delayRef.current = delay;
  }, [delay]);

  useEffect(() => {
    if (!animate) return;
    const plan = Array.from(
      text,
      (_, i) => i * FLAP_STAGGER_MS + (2 + Math.floor(Math.random() * 3)) * FLAP_TICK_MS
    );
    const total = Math.max(...plan, 0) + FLAP_TICK_MS;
    let n = 0;
    let id: number | undefined;
    const begin = () => {
      setSettle(plan);
      setElapsed(0);
      id = window.setInterval(() => {
        n += 1;
        setElapsed(n * FLAP_TICK_MS);
        if (n * FLAP_TICK_MS >= total) window.clearInterval(id);
      }, FLAP_TICK_MS);
    };
    const start = window.setTimeout(begin, delayRef.current);
    return () => {
      window.clearTimeout(start);
      if (id !== undefined) window.clearInterval(id);
    };
    /* delay deliberately not a dependency: it is read once per clatter */
  }, [text, animate]);

  if (!animate) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={cn("whitespace-pre", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((ch, i) => {
          const limit = settle[i];
          const settled = limit !== undefined && elapsed >= limit;
          const shown =
            settled || !/[A-Za-z0-9]/.test(ch)
              ? ch
              : flapScramble(i, Math.floor(elapsed / FLAP_TICK_MS));
          return (
            <span key={i} className={cn("inline-block tabular", !settled && "movements-dim")}>
              {/* a bare space collapses inside white-space:nowrap cells (the
                  status lamp), so flap modules carry a no-break space instead */}
              {shown === " " ? "\u00A0" : shown}
            </span>
          );
        })}
      </span>
    </span>
  );
}

/* ---------- the day's movements (all real companies and routes) ---------- */

type ModeId = "air" | "sea" | "land";
type StatusIdx = 0 | 1 | 2;

interface Movement {
  id: string;
  mode: ModeId;
  code: string;
  origin: string;
  destination: string;
  cargo: string;
  company: string;
  cluster: ClusterId;
  facts: BreakdownRow[];
  /** reefer rows carry the icy −22 °C language */
  cold?: boolean;
}

const MODE_ICONS: Record<ModeId, LucideIcon> = { air: Plane, sea: Ship, land: Truck };
const MODE_LABELS: Record<ModeId, string> = { air: "Air", sea: "Sea", land: "Land" };

const STATUS_LABELS = ["BOARDING", "UNDER WAY", "ARRIVED"];
const COLD_LABELS = ["PRE-COOL", "−22°C HOLD", "COLD LANDED"];
const STATUS_COLORS = ["#E3A72F", "#4BBDC8", "#2FA96E"];
const COLD_COLOR = "#7FD4E8";

function factRow(mv: Movement): BreakdownRow {
  return { label: "Cluster", value: CLUSTER_MAP[mv.cluster].short, color: `var(${CLUSTER_MAP[mv.cluster].colorVar})` };
}

const RAW_POOL: Movement[] = [
  {
    id: "ib318",
    mode: "air",
    code: "IB 318",
    origin: "MRU",
    destination: "RUN",
    cargo: "FRESH PRODUCE · 2.4 T",
    company: "IBL Aviation",
    cluster: "services",
    facts: [
      { label: "Mode", value: "Air · GSA & charter" },
      { label: "Cargo", value: "fresh produce · 2.4 t" },
    ],
  },
  {
    id: "ib226",
    mode: "air",
    code: "IB 226",
    origin: "MRU",
    destination: "NBO",
    cargo: "PHARMA · 1.1 T",
    company: "IBL Aviation",
    cluster: "services",
    cold: true,
    facts: [
      { label: "Mode", value: "Air · cold chain" },
      { label: "Cargo", value: "pharma · 1.1 t · 2 to 8 °C" },
    ],
  },
  {
    id: "ib141",
    mode: "air",
    code: "IB 141",
    origin: "RUN",
    destination: "MRU",
    cargo: "SPARES & MAIL · 0.6 T",
    company: "IBL Aviation",
    cluster: "services",
    facts: [
      { label: "Mode", value: "Air · GSA & charter" },
      { label: "Cargo", value: "spares & mail · 0.6 t" },
    ],
  },
  {
    id: "cordelia",
    mode: "sea",
    code: "MV CORDÉLIA",
    origin: "PORT LOUIS",
    destination: "DIEGO SUAREZ",
    cargo: "NAVAL DOCKING SUPPORT",
    company: "CNOI",
    cluster: "industrials",
    facts: [
      { label: "Yard", value: "CNOI, since 2001" },
      { label: "Job", value: "docking & refit support" },
    ],
  },
  {
    id: "loiret",
    mode: "sea",
    code: "FS LOIRET",
    origin: "TOULON",
    destination: "PORT LOUIS",
    cargo: "FRENCH NAVY · CNOI REFIT",
    company: "CNOI",
    cluster: "industrials",
    facts: [
      { label: "Yard", value: "CNOI, since 2001" },
      { label: "Job", value: "French Navy alongside refit" },
    ],
  },
  {
    id: "bellerose",
    mode: "sea",
    code: "MV BELLE ROSE",
    origin: "PORT LOUIS",
    destination: "TAMATAVE",
    cargo: "GENERAL CARGO · 420 T",
    company: "CNOI",
    cluster: "industrials",
    facts: [
      { label: "Yard", value: "CNOI, since 2001" },
      { label: "Cargo", value: "general cargo · 420 t" },
    ],
  },
  {
    id: "reefer01",
    mode: "air",
    code: "REEFER 01",
    origin: "MRU",
    destination: "CDG",
    cargo: "SEAFOOD · 18 T · −22°C",
    company: "Froid des Mascareignes",
    cluster: "industrials",
    cold: true,
    facts: [
      { label: "Cold chain", value: "−22 °C airbridge" },
      { label: "Cargo", value: "seafood export · 18 t" },
    ],
  },
  {
    id: "coldchain",
    mode: "sea",
    code: "COLD CHAIN",
    origin: "PORT LOUIS",
    destination: "LE HAVRE",
    cargo: "TUNA LOINS · REEFER HOLD",
    company: "Froid des Mascareignes",
    cluster: "industrials",
    cold: true,
    facts: [
      { label: "Cold chain", value: "reefer hold · −22 °C" },
      { label: "Cargo", value: "tuna loins · Le Havre" },
    ],
  },
  {
    id: "rt22",
    mode: "land",
    code: "RT 22",
    origin: "PORT LOUIS",
    destination: "CUREPIPE",
    cargo: "FMCG PALLETS · 84 STOPS",
    company: "Logidis",
    cluster: "services",
    facts: [
      { label: "Mode", value: "Land · daily routes" },
      { label: "Cargo", value: "FMCG pallets · 84 stops" },
    ],
  },
  {
    id: "rt07",
    mode: "land",
    code: "RT 07",
    origin: "PORT LOUIS",
    destination: "FLACQ",
    cargo: "REPLENISHMENT · 61 STOPS",
    company: "Logidis",
    cluster: "services",
    facts: [
      { label: "Mode", value: "Land · daily routes" },
      { label: "Cargo", value: "retail replenishment · 61 stops" },
    ],
  },
  {
    id: "nbohub",
    mode: "land",
    code: "NBO HUB",
    origin: "NAIROBI",
    destination: "84 STORES",
    cargo: "FRESH & DRY GOODS",
    company: "Naivas",
    cluster: "retail",
    facts: [
      { label: "Network", value: "80+ stores, Kenya" },
      { label: "Cargo", value: "fresh & dry goods" },
    ],
  },
  {
    id: "kbx12",
    mode: "land",
    code: "KBX 12",
    origin: "NAIROBI",
    destination: "KISUMU",
    cargo: "PRODUCE RUN · 12 T",
    company: "Naivas",
    cluster: "retail",
    facts: [
      { label: "Network", value: "80+ stores, Kenya" },
      { label: "Cargo", value: "produce run · 12 t" },
    ],
  },
  {
    id: "bulk03",
    mode: "sea",
    code: "BULK 03",
    origin: "BELLE VUE",
    destination: "TERMINAL BERTH 3",
    cargo: "RAW SUGAR · 12 400 T",
    company: "Alteo",
    cluster: "industrials",
    facts: [
      { label: "Mill", value: "Belle Vue, Mauritius" },
      { label: "Cargo", value: "raw sugar · 12 400 t" },
    ],
  },
  {
    id: "sc29",
    mode: "land",
    code: "SC 29",
    origin: "PORT LOUIS",
    destination: "PLANT SITE",
    cargo: "CAT PARTS · 3 FLATBEDS",
    company: "Scomat",
    cluster: "industrials",
    facts: [
      { label: "Dealership", value: "Caterpillar, since 1929" },
      { label: "Cargo", value: "parts · 3 flatbeds" },
    ],
  },
  {
    id: "dcflow",
    mode: "land",
    code: "DC FLOW",
    origin: "RICHE TERRE DC",
    destination: "21 STORES",
    cargo: "OVERNIGHT RESTOCK",
    company: "Winner's",
    cluster: "retail",
    facts: [
      { label: "Network", value: "130+ stores, 3 countries" },
      { label: "Cargo", value: "overnight restock" },
    ],
  },
  {
    id: "pv60",
    mode: "land",
    code: "PV 60",
    origin: "PHOENIX BREWERY",
    destination: "ISLAND-WIDE",
    cargo: "KEGS & CASES",
    company: "Phoenix Beverages",
    cluster: "cbd",
    facts: [
      { label: "Brewery", value: "Phoenix, Mauritius" },
      { label: "Cargo", value: "kegs & cases · island-wide" },
    ],
  },
];

/** every movement carries its cluster row first, like the pulse breakdowns */
const POOL: Movement[] = RAW_POOL.map((mv) => ({ ...mv, facts: [factRow(mv), ...mv.facts] }));

/* ---------- Port Louis mean time, the board's clock ---------- */

const MUT_OFFSET_MS = 4 * 3_600_000; // Mauritius, UTC+4, no DST

function mutNowMinutes(): number {
  const d = new Date(Date.now() + MUT_OFFSET_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function fmtHM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** plausible departure label for a movement entering at this status */
function spawnTime(status: StatusIdx): number {
  const now = mutNowMinutes();
  const off =
    status === 0
      ? 8 + Math.floor(Math.random() * 45)
      : status === 1
        ? -(15 + Math.floor(Math.random() * 110))
        : -(45 + Math.floor(Math.random() * 200));
  return now + off;
}

/* ---------- the living board ---------- */

interface RowState {
  key: number;
  status: StatusIdx;
  arrivedFor: number;
  timeMin: number;
  mv: Movement;
}

const ROWS_SHOWN = 7;
const TICK_MS = 6500;
/** statuses the board boots with, spread across the cycle */
const BOOT_STATUSES: StatusIdx[] = [1, 0, 2, 1, 0, 2, 1];

let spawnKey = 1;

function makeRow(mv: Movement, status: StatusIdx): RowState {
  return { key: spawnKey++, status, arrivedFor: 0, timeMin: spawnTime(status), mv };
}

/** Port Louis clock, ticking on its own interval */
function usePortLouisClock(): string {
  const [hm, setHm] = useState("--:--");
  useEffect(() => {
    const tick = () => setHm(fmtHM(mutNowMinutes()));
    const t = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, []);
  return hm;
}

interface BoardRowProps {
  row: RowState;
  index: number;
  flap: boolean;
  assembling: boolean;
}

function BoardRow({ row, index, flap, assembling }: BoardRowProps) {
  const mv = row.mv;
  const Icon = MODE_ICONS[mv.mode];
  const delay = assembling ? index * 120 : 0;
  const labels = mv.cold ? COLD_LABELS : STATUS_LABELS;
  const color = mv.cold ? COLD_COLOR : STATUS_COLORS[row.status];
  const route = `${mv.origin} → ${mv.destination}`;
  const time = fmtHM(row.timeMin);

  return (
    <BreakdownPopover title={mv.company} rows={mv.facts} align="start" className="movements-row-wrap">
      <div className="movements-row grid min-w-0 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-3 sm:grid-cols-[44px_118px_minmax(0,1.15fr)_minmax(0,1fr)_164px] sm:gap-x-4 sm:px-4">
        {/* mode lamp */}
        <span className="flex items-center" title={`${MODE_LABELS[mv.mode]} movement`}>
          <Icon className="size-4 shrink-0 movements-dim" aria-hidden />
        </span>
        {/* flight / vessel — mobile folds code and time into the middle cell */}
        <span className="hidden min-w-0 sm:block">
          <FlapText key={`c${row.key}:${mv.code}`} text={mv.code} animate={flap} delay={delay} className="movements-code block truncate text-[0.72rem] font-medium tracking-[0.06em]" />
          <FlapText key={`t${row.key}:${time}`} text={time} animate={flap} delay={delay + 60} className="movements-dim tabular mt-1 block text-[0.66rem] tracking-[0.08em]" />
        </span>
        {/* route (mobile: stacked with the code above) */}
        <span className="min-w-0">
          <span className="mb-1 block sm:hidden">
            <FlapText key={`cm${row.key}:${mv.code}`} text={`${mv.code} · ${time}`} animate={flap} delay={delay} className="movements-code block truncate text-[0.68rem] font-medium tracking-[0.05em]" />
          </span>
          <FlapText key={`r${row.key}:${route}`} text={route} animate={flap} delay={delay} className="block truncate text-[0.72rem] tracking-[0.05em]" />
        </span>
        {/* cargo */}
        <span className="hidden min-w-0 items-center gap-1.5 sm:flex">
          {mv.cold && <Snowflake className="size-3 shrink-0" aria-hidden style={{ color: COLD_COLOR }} />}
          <FlapText key={`g${row.key}:${mv.cargo}`} text={mv.cargo} animate={flap} delay={delay} className="movements-dim block truncate text-[0.66rem] tracking-[0.07em]" />
        </span>
        {/* status lamp */}
        <span className="flex items-center justify-end gap-2 sm:gap-2.5">
          <span
            aria-hidden
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
          />
          <FlapText
            key={`s${row.key}:${labels[row.status]}`}
            text={labels[row.status]}
            animate={flap}
            delay={delay}
            className="tabular block whitespace-nowrap text-[0.64rem] font-medium tracking-[0.12em]"
          />
        </span>
      </div>
    </BreakdownPopover>
  );
}

export function MovementsBoard() {
  const reducedStore = useApp((s) => s.reducedMotion);
  const a11yProfile = useApp((s) => s.a11y);
  const [mediaReduced, setMediaReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMediaReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const reduce = reducedStore || mediaReduced || a11yProfile === "epilepsy";

  /* header reveals, same grammar as the pulse section */
  const { ref: titleRef, style: titleStyle } = useReveal<HTMLDivElement>("w");
  const { ref: blurbRef, style: blurbStyle } = useReveal<HTMLDivElement>("e");
  const { ref: boardRef, style: boardStyle, visible: started } = useReveal<HTMLDivElement>("s");

  /* rows mount client-side so server and client agree, then write themselves in */
  const [rows, setRows] = useState<RowState[]>([]);
  const rowsRef = useRef<RowState[]>([]);
  const cursorRef = useRef(ROWS_SHOWN);
  const [assembling, setAssembling] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const init = BOOT_STATUSES.map((status, i) => makeRow(POOL[i], status));
      rowsRef.current = init;
      setRows(init);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  /* the assembly stagger window closes once every row has written itself */
  useEffect(() => {
    if (!started) return;
    const t = window.setTimeout(() => setAssembling(false), 2400);
    return () => window.clearTimeout(t);
  }, [started]);

  /* live view gating: the simulation only runs for an in-view, visible tab */
  const liveRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const el = liveRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setInView(entries[0].isIntersecting), {
      threshold: 0.12,
      rootMargin: "0px 0px -6% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  /* one tick of the day: age the arrived, replace the stalest arrival with a
     fresh movement entering at the top, otherwise advance a random row */
  const advance = useCallback(() => {
    const prev = rowsRef.current;
    if (prev.length === 0) return;
    const aged = prev.map((r) => (r.status === 2 ? { ...r, arrivedFor: r.arrivedFor + 1 } : r));
    const replIdx = aged.findIndex((r) => r.status === 2 && r.arrivedFor >= 1);
    let next: RowState[];
    if (replIdx >= 0) {
      const mv = POOL[cursorRef.current % POOL.length];
      cursorRef.current += 1;
      next = [makeRow(mv, 0), ...aged.slice(0, replIdx), ...aged.slice(replIdx + 1)];
    } else {
      const cands: number[] = [];
      aged.forEach((r, i) => {
        if (r.status < 2) cands.push(i);
      });
      if (cands.length === 0) {
        next = aged;
      } else {
        const pick = cands[Math.floor(Math.random() * cands.length)];
        next = aged.map((r, i) => (i === pick ? { ...r, status: (r.status + 1) as StatusIdx } : r));
      }
    }
    rowsRef.current = next;
    setRows(next);
  }, []);

  useEffect(() => {
    if (!inView || tabHidden || !started) return;
    const id = window.setInterval(advance, TICK_MS);
    return () => window.clearInterval(id);
  }, [inView, tabHidden, started, advance]);

  const clock = usePortLouisClock();

  return (
    <section id="movements" className="relative py-28 md:py-36" aria-label="Group logistics movements">
      <style>{BOARD_CSS}</style>
      <div className="mx-auto w-full max-w-[88rem] px-5 sm:px-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div ref={titleRef} style={titleStyle}>
            <p className="eyebrow flex items-center gap-3">
              <span className="live-dot movements-dot" aria-hidden />
              Live logistics · Air sea land
            </p>
            <h2 className="h-display h-section mt-4 max-w-xl">
              <T k="movements.title" />
            </h2>
          </div>
          <div ref={blurbRef} style={blurbStyle} className="max-w-sm md:ml-auto">
            <p className="caption">
              <T k="movements.blurb" />
            </p>
          </div>
        </header>

        {/* the board */}
        <div ref={boardRef} style={boardStyle} className="mt-10 md:mt-14">
          <div ref={liveRef} className="movements-board relative rounded-3xl border border-white/[0.08] p-3 sm:p-5">
            {/* column header, gold letterspaced caps like the plates above a Solari rack */}
            <div className="movements-gold mb-2 hidden grid-cols-[44px_118px_minmax(0,1.15fr)_minmax(0,1fr)_164px] gap-x-4 px-4 text-[0.58rem] font-medium uppercase tracking-[0.24em] sm:grid" aria-hidden="true">
              <span>MODE</span>
              <span>FLIGHT / VESSEL</span>
              <span>ROUTE</span>
              <span>CARGO</span>
              <span className="flex items-center justify-end gap-2">
                <span className="live-dot movements-dot" aria-hidden />
                <span className="tabular">PORT LOUIS · {clock} MUT</span>
              </span>
            </div>
            {/* mobile: the clock still lives, alone on its line */}
            <div className="movements-gold mb-2 flex items-center justify-between px-1 text-[0.58rem] font-medium uppercase tracking-[0.24em] sm:hidden" aria-hidden="true">
              <span className="flex items-center gap-2">
                <span className="live-dot movements-dot" aria-hidden />
                DEPARTURES
              </span>
              <span className="tabular">{clock} MUT</span>
            </div>

            {/* the rack: 1 px seams, each row its own module */}
            <div className="grid gap-px">
              <AnimatePresence initial={false} mode="popLayout">
                {rows.map((row, i) => (
                  <motion.div
                    key={row.key}
                    layout={!reduce}
                    initial={reduce ? undefined : { opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
                    transition={{ duration: reduce ? 0 : 0.55, ease: EASE.luxe }}
                    className="rounded-lg bg-white/[0.03] transition-colors duration-500 hover:bg-white/[0.06]"
                  >
                    <BoardRow row={row} index={i} flap={started && !reduce} assembling={assembling} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* honesty, like the pulse cards */}
            <p className="movements-dim mt-3 px-4 text-center text-[0.6rem] uppercase tracking-[0.18em] sm:text-left sm:text-[0.62rem]">
              Movements modelled on the group's daily logistics rhythm · times in Mauritius time
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
