"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLUSTERS, CLUSTER_MAP, EASE, type ClusterId } from "@/lib/brand";
import {
  COLLABORATION_PAIRS,
  COUNTRIES_IN_CONSTELLATION,
  SECTORS,
  SUBSIDIARIES,
  YEAR_FILTERS,
  yearBucket,
  type Subsidiary,
} from "@/lib/data/subsidiaries";
import { useApp } from "@/store/app-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { T } from "./t";

const LUXE: [number, number, number, number] = [...EASE.luxe] as [number, number, number, number];

/* ---------- tiny color helpers ---------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* On paper the curves must read as colored ink pressed into the sheet,
   so pale cluster hues are pulled toward ink navy before drawing. */
function inked(hex: string, grade: "light" | "abyss" | "sepia"): string {
  const mix = grade === "abyss" ? 0 : grade === "sepia" ? 0.2 : 0.38;
  if (!mix) return hex;
  const [r, g, b] = hexToRgb(hex);
  const ir = 22;
  const ig = 28;
  const ib = 74;
  const to = (v: number, iv: number) => Math.round(v + (iv - v) * mix);
  const h = (v: number) => v.toString(16).padStart(2, "0");
  return `#${h(to(r, ir))}${h(to(g, ig))}${h(to(b, ib))}`;
}

function firstSentence(note: string): string {
  const idx = note.indexOf(". ");
  return idx === -1 ? note : `${note.slice(0, idx + 1)}`;
}

/* ---------- grade awareness ---------- */

type Grade = "light" | "abyss" | "sepia";

/** Follows the live data-theme so paper and abyss both read as deliberate. */
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

/* The chart plate the constellation is drawn on. Dark keeps its luminous navy,
   paper gets a fresh sheet with a barely-there teal breath and an ink dot grid. */
const FIELD_BASE: Record<Grade, string> = {
  abyss: "var(--background)",
  sepia: "#f6efdc",
  light: "#fcfbf7",
};
const FIELD_TEXTURE: Record<Grade, string> = {
  abyss:
    "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(75,189,200,0.10), transparent 70%), radial-gradient(rgba(139,166,180,0.08) 1px, transparent 1.4px)",
  sepia:
    "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(154,107,47,0.08), transparent 70%), radial-gradient(rgba(59,50,34,0.13) 1px, transparent 1.4px)",
  light:
    "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(30,154,167,0.05), transparent 70%), radial-gradient(rgba(22,28,74,0.11) 1px, transparent 1.4px)",
};

/* Star halos. Light projected in the abyss, ink pressed into paper. */
function nodeHalo(grade: Grade, color: string): string {
  if (grade === "abyss") return `0 0 0 1px rgba(10,14,35,0.9), 0 0 18px 2px ${rgba(color, 0.45)}`;
  if (grade === "sepia") return `0 0 0 1px rgba(59,50,34,0.55), 0 1px 4px rgba(59,50,34,0.24)`;
  return `0 0 0 1px rgba(22,28,74,0.42), 0 1px 5px rgba(22,28,74,0.22)`;
}

/* ---------- shared bits ---------- */

function ClusterChip({
  id,
  size = "sm",
  grade,
}: {
  id: ClusterId;
  size?: "sm" | "md";
  grade: Grade;
}) {
  const c = CLUSTER_MAP[id];
  /* Cluster hues stay, but on paper the label ink is deepened so a chip never whispers. */
  const text =
    grade === "abyss" ? c.color : `color-mix(in srgb, ${c.color} 72%, var(--foreground))`;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wider ${
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]"
      }`}
      style={{
        borderColor: rgba(c.color, grade === "abyss" ? 0.45 : 0.55),
        background: rgba(c.color, grade === "abyss" ? 0.14 : 0.15),
        color: text,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: c.color }} aria-hidden="true" />
      {c.short}
    </span>
  );
}

function miniCardPos(s: Subsidiary): CSSProperties {
  const flipX = s.x > 0.62;
  const flipY = s.y > 0.72;
  return {
    left: `${s.x * 100}%`,
    top: `${s.y * 100}%`,
    transform: `translate(${flipX ? "calc(-100% - 22px)" : "22px"}, ${
      flipY ? "calc(-100% - 22px)" : "22px"
    })`,
  };
}

/* ---------- main section ---------- */

export function ConstellationSection() {
  const [cluster, setCluster] = useState<ClusterId | "all">("all");
  const [country, setCountry] = useState("all");
  const [sector, setSector] = useState("all");
  const [year, setYear] = useState("all");
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const fieldRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const nodeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const reducedStore = useApp((s) => s.reducedMotion);
  const a11yProfile = useApp((s) => s.a11y);
  const [mediaReduced, setMediaReduced] = useState(false);
  const isMobile = useIsMobile();
  const grade = useGrade();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMediaReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const motionOk = !reducedStore && !mediaReduced && a11yProfile !== "epilepsy";
  const magnetismOk = motionOk && a11yProfile !== "motor";

  /* ----- filtering (AND) ----- */

  const visibleSubs = useMemo(
    () =>
      SUBSIDIARIES.filter(
        (s) =>
          (cluster === "all" || s.cluster === cluster) &&
          (country === "all" || s.country === country) &&
          (sector === "all" || s.sector === sector) &&
          (year === "all" || yearBucket(s.since) === year)
      ),
    [cluster, country, sector, year]
  );

  const visiblePairs = useMemo(() => {
    const ids = new Set(visibleSubs.map((s) => s.id));
    return COLLABORATION_PAIRS.filter(([a, b]) => ids.has(a) && ids.has(b));
  }, [visibleSubs]);

  const collabCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const [a, b] of COLLABORATION_PAIRS) {
      m.set(a, (m.get(a) ?? 0) + 1);
      m.set(b, (m.get(b) ?? 0) + 1);
    }
    return m;
  }, []);

  const hoveredSub = useMemo(
    () => visibleSubs.find((s) => s.id === hovered) ?? null,
    [visibleSubs, hovered]
  );
  const selectedSub = useMemo(
    () => visibleSubs.find((s) => s.id === selected) ?? null,
    [visibleSubs, selected]
  );
  const openSub = useMemo(
    () => SUBSIDIARIES.find((s) => s.id === openId) ?? null,
    [openId]
  );

  /* ----- canvas layer: collaboration lines + twinkles ----- */

  useEffect(() => {
    const field = fieldRef.current;
    const canvas = canvasRef.current;
    if (!field || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const byId = new Map(visibleSubs.map((s) => [s.id, s]));
    const pairs = visiblePairs
      .map(([a, b]) => [byId.get(a), byId.get(b)] as [Subsidiary | undefined, Subsidiary | undefined])
      .filter((p): p is [Subsidiary, Subsidiary] => Boolean(p[0] && p[1]));

    /* Paper wants heavier ink than the abyss wants light. */
    const boost = grade === "abyss" ? 1 : grade === "sepia" ? 1.45 : 1.7;
    const ink = (hex: string) => inked(hex, grade);
    const baseAlpha = grade === "abyss" ? 0.15 : grade === "sepia" ? 0.21 : 0.26;
    const baseWidth = grade === "abyss" ? 1 : 1.25;
    const antsWidth = grade === "abyss" ? 1.5 : 1.75;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let inView = true;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      pairs.forEach(([a, b], i) => {
        const ax = a.x * w;
        const ay = a.y * h;
        const bx = b.x * w;
        const by = b.y * h;
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        const bow = Math.min(len * 0.18, 46) * (i % 2 === 0 ? 1 : -1);
        const cx = (ax + bx) / 2 + (-dy / len) * bow;
        const cy = (ay + by) / 2 + (dx / len) * bow;
        const ca = ink(CLUSTER_MAP[a.cluster].color);
        const cb = ink(CLUSTER_MAP[b.cluster].color);

        // soft base pass
        const base = ctx.createLinearGradient(ax, ay, bx, by);
        base.addColorStop(0, rgba(ca, Math.min(0.42, baseAlpha * boost)));
        base.addColorStop(1, rgba(cb, Math.min(0.42, baseAlpha * boost)));
        ctx.strokeStyle = base;
        ctx.lineWidth = baseWidth;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cx, cy, bx, by);
        ctx.stroke();

        // slow marching ants on top
        const ants = ctx.createLinearGradient(ax, ay, bx, by);
        ants.addColorStop(0, rgba(ca, Math.min(0.8, 0.5 * boost)));
        ants.addColorStop(1, rgba(cb, Math.min(0.8, 0.5 * boost)));
        ctx.strokeStyle = ants;
        ctx.lineWidth = antsWidth;
        ctx.setLineDash([5, 9]);
        ctx.lineDashOffset = motionOk ? -(t / 1000) * 7 : 0;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cx, cy, bx, by);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // per node twinkle halo, phase offset per star
      visibleSubs.forEach((s, i) => {
        const phase = i * 1.9;
        const pulse = motionOk ? (Math.sin(t / 1100 + phase) + 1) / 2 : 0.5;
        const r = 9 + pulse * 5;
        const col = ink(CLUSTER_MAP[s.cluster].color);
        ctx.strokeStyle = rgba(col, Math.min(0.48, (0.12 + pulse * 0.2) * boost));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, r, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    const resize = () => {
      const rect = field.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!motionOk) draw(0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(field);
    resize();

    if (motionOk) {
      const io = new IntersectionObserver((entries) => {
        inView = entries[0]?.isIntersecting ?? true;
      });
      io.observe(field);
      const loop = (t: number) => {
        if (inView) draw(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
      };
    }
    return () => {
      ro.disconnect();
    };
  }, [visibleSubs, visiblePairs, motionOk, grade]);

  /* ----- cursor magnetism on the nodes ----- */

  useEffect(() => {
    if (!magnetismOk) return;
    const field = fieldRef.current;
    if (!field) return;

    type Target = { el: HTMLElement; px: number; py: number; mx: number; my: number };
    let targets: Target[] = [];

    const measure = () => {
      const rect = field.getBoundingClientRect();
      targets = Array.from(field.querySelectorAll<HTMLElement>("[data-node]")).map((el) => ({
        el,
        px: parseFloat(el.dataset.x ?? "0") * rect.width,
        py: parseFloat(el.dataset.y ?? "0") * rect.height,
        mx: 0,
        my: 0,
      }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(field);

    const ptr = { x: -9999, y: -9999 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = field.getBoundingClientRect();
      ptr.x = e.clientX - rect.left;
      ptr.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      ptr.x = -9999;
      ptr.y = -9999;
    };
    field.addEventListener("pointermove", onMove, { passive: true });
    field.addEventListener("pointerleave", onLeave);

    const RADIUS = 140;
    const MAX = 10;
    const K = 0.14;
    let raf = 0;
    const loop = () => {
      for (const t of targets) {
        const dx = ptr.x - t.px;
        const dy = ptr.y - t.py;
        const d = Math.hypot(dx, dy);
        let tx = 0;
        let ty = 0;
        if (d < RADIUS && d > 1) {
          const f = (1 - d / RADIUS) * MAX;
          tx = (dx / d) * f;
          ty = (dy / d) * f;
        }
        t.mx += (tx - t.mx) * K;
        t.my += (ty - t.my) * K;
        t.el.style.setProperty("--mx", `${t.mx.toFixed(2)}px`);
        t.el.style.setProperty("--my", `${t.my.toFixed(2)}px`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      field.removeEventListener("pointermove", onMove);
      field.removeEventListener("pointerleave", onLeave);
    };
  }, [magnetismOk, visibleSubs]);

  /* ----- overlay: escape, focus, scroll lock ----- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (openId) setOpenId(null);
      else {
        setSelected(null);
        setHovered(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    const nodeBtn = nodeRefs.current.get(openId) ?? null;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 80);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
      nodeBtn?.focus();
    };
  }, [openId]);

  /* ----- derived copy ----- */

  const hasFilters =
    cluster !== "all" || country !== "all" || sector !== "all" || year !== "all";

  const activeNames: string[] = [];
  if (cluster !== "all") activeNames.push(CLUSTER_MAP[cluster].short);
  if (country !== "all") activeNames.push(country);
  if (sector !== "all") activeNames.push(sector);
  if (year !== "all") {
    const yf = YEAR_FILTERS.find((f) => f.value === year);
    if (yf) activeNames.push(yf.label);
  }
  const filterSummary =
    activeNames.length > 0 ? `filtered by ${activeNames.join(", ")}` : "the whole sky";

  const reset = () => {
    setCluster("all");
    setCountry("all");
    setSector("all");
    setYear("all");
  };

  const openColor = openSub ? CLUSTER_MAP[openSub.cluster].color : "#4BBDC8";

  /* Overlay backdrop. The abyss gets a cluster-colored glow, paper gets a soft
     cluster wash pressed into the sheet, parchment gets its own warm veil. */
  const overlayBg =
    grade === "abyss"
      ? `radial-gradient(ellipse 90% 70% at 50% 32%, ${rgba(openColor, 0.28)}, rgba(10,14,35,0.78) 75%)`
      : grade === "sepia"
        ? `radial-gradient(ellipse 90% 70% at 50% 32%, ${rgba(openColor, 0.15)}, rgba(242,234,217,0.9) 75%)`
        : `radial-gradient(ellipse 90% 70% at 50% 32%, ${rgba(openColor, 0.14)}, rgba(248,246,241,0.93) 75%)`;

  return (
    <section id="constellation" className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-10">
          <div>
            <p className="eyebrow">The group, mapped</p>
            <h2 className="h-display h-section mt-4">
              <T k="constellation.title" />
            </h2>
          </div>
          <p className="caption max-w-sm md:ml-auto md:text-right">
            <T k="constellation.blurb" />
          </p>
        </div>

        {/* filter bar */}
        <div
          role="group"
          aria-label="Constellation filters"
          className="glass mt-10 flex flex-wrap items-center gap-2 rounded-3xl p-3 sm:rounded-full"
        >
          <button
            type="button"
            aria-pressed={cluster === "all"}
            onClick={() => setCluster("all")}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-xs font-medium transition-colors duration-500"
            style={{
              borderColor: cluster === "all" ? "transparent" : "var(--border)",
              background: cluster === "all" ? "var(--foreground)" : "transparent",
              color: cluster === "all" ? "var(--background)" : "var(--foreground)",
              transitionTimingFunction: "var(--ease-luxe)",
            }}
          >
            <span
              className="size-2.5 rounded-full"
              style={{
                background:
                  "conic-gradient(#4BBDC8, #EE6C2B, #2FA96E, #D63384, #4BBDC8)",
              }}
              aria-hidden="true"
            />
            All
          </button>

          {CLUSTERS.map((c) => {
            const active = cluster === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCluster(active ? "all" : c.id)}
                className="flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-xs font-medium transition-colors duration-500"
                style={{
                  borderColor: active ? "transparent" : "var(--border)",
                  background: active ? c.color : "transparent",
                  color: active ? "#0A0E23" : "var(--foreground)",
                  transitionTimingFunction: "var(--ease-luxe)",
                }}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: c.color }}
                  aria-hidden="true"
                />
                {c.short}
              </button>
            );
          })}

          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger
              aria-label="Filter by country"
              className="h-11 min-w-36 rounded-full border-border/60 px-4 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all" className="text-xs">
                All countries
              </SelectItem>
              {COUNTRIES_IN_CONSTELLATION.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger
              aria-label="Filter by sector"
              className="h-11 min-w-36 rounded-full border-border/60 px-4 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all" className="text-xs">
                All sectors
              </SelectItem>
              {SECTORS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger
              aria-label="Filter by founding year"
              className="h-11 min-w-36 rounded-full border-border/60 px-4 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {YEAR_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* the field */}
        <div
          ref={fieldRef}
          role="group"
          aria-label="Subsidiary constellation. Each star is a subsidiary, the drawn lines are real collaborations."
          className="relative mt-8 overflow-hidden rounded-3xl border border-border/60"
          style={{
            height: "clamp(520px, 72vh, 900px)",
            backgroundColor: FIELD_BASE[grade],
            backgroundImage: FIELD_TEXTURE[grade],
            backgroundSize: "100% 100%, 28px 28px",
            transition: "background-color 0.7s var(--ease-luxe)",
          }}
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
          />

          {visibleSubs.map((s) => {
            const c = CLUSTER_MAP[s.cluster];
            const big = (collabCount.get(s.id) ?? 0) >= 3;
            const size = big ? 18 : 14;
            const flip = s.x > 0.75;
            const isActive = hovered === s.id || selected === s.id || openId === s.id;
            return (
              <div
                key={s.id}
                data-node
                data-x={s.x}
                data-y={s.y}
                className={`absolute ${isActive ? "z-30" : "z-[15]"}`}
                style={{
                  left: `${s.x * 100}%`,
                  top: `${s.y * 100}%`,
                  width: 0,
                  height: 0,
                  transform: "translate(var(--mx, 0px), var(--my, 0px))",
                }}
              >
                <button
                  type="button"
                  ref={(el) => {
                    if (el) nodeRefs.current.set(s.id, el);
                    else nodeRefs.current.delete(s.id);
                  }}
                  aria-label={`${s.name}, ${s.sector}, ${s.country}, since ${s.since}`}
                  onMouseEnter={() => setHovered(s.id)}
                  onMouseLeave={() => setHovered((h) => (h === s.id ? null : h))}
                  onFocus={() => {
                    if (!isMobile) setHovered(s.id);
                  }}
                  onBlur={() => setHovered((h) => (h === s.id ? null : h))}
                  onClick={() => {
                    if (isMobile) {
                      if (selected === s.id) setOpenId(s.id);
                      else setSelected(s.id);
                    } else {
                      setHovered(null);
                      setOpenId(s.id);
                    }
                  }}
                  className={`group absolute flex min-h-11 cursor-pointer items-center gap-2 px-2 ${
                    flip ? "flex-row-reverse" : ""
                  }`}
                  style={flip ? { top: -22, right: -size / 2 } : { top: -22, left: -size / 2 }}
                >
                  <span
                    className="block shrink-0 rounded-full transition-transform duration-500 group-hover:scale-[1.35] group-focus-visible:scale-[1.35]"
                    style={{
                      width: size,
                      height: size,
                      transitionTimingFunction: "var(--ease-luxe)",
                    }}
                  >
                    <motion.span
                      layoutId={`dot-${s.id}`}
                      className="block h-full w-full rounded-full"
                      style={{
                        background: c.color,
                        boxShadow: nodeHalo(grade, c.color),
                      }}
                    />
                  </span>
                  <span
                    className={`whitespace-nowrap text-[11px] tracking-wide text-muted-foreground/90 transition-colors duration-500 group-hover:text-foreground group-focus-visible:text-foreground ${
                      flip ? "text-right" : ""
                    }`}
                  >
                    {s.name}
                  </span>
                </button>
              </div>
            );
          })}

          {visibleSubs.length === 0 && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 text-center">
              <p className="caption">No stars in this slice of sky. Loosen a filter.</p>
              <button
                type="button"
                onClick={reset}
                className="h-11 cursor-pointer rounded-full border border-border/70 px-5 text-xs font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* hover mini card, desktop */}
          <AnimatePresence>
            {hoveredSub && !isMobile && !openId && (
              <div
                key={hoveredSub.id}
                className="pointer-events-none absolute z-40"
                style={miniCardPos(hoveredSub)}
              >
                <motion.div
                  layoutId={`card-${hoveredSub.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
                  transition={{ duration: 0.4, ease: LUXE }}
                  className="glass w-64 rounded-2xl p-4 text-left shadow-teal"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{hoveredSub.name}</p>
                    <ClusterChip id={hoveredSub.cluster} grade={grade} />
                  </div>
                  <p className="caption mt-2">
                    {hoveredSub.sector} · {hoveredSub.country} · Since {hoveredSub.since}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/75">
                    {firstSentence(hoveredSub.note)}
                  </p>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* counter caption */}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <p className="caption">
            {visibleSubs.length} stars · {visiblePairs.length} collaborations · {filterSummary}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="h-11 cursor-pointer rounded-full border border-border/60 px-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground transition-colors duration-500 hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* mobile pinned card */}
        <AnimatePresence>
          {selectedSub && isMobile && !openId && (
            <motion.div
              key={selectedSub.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8, transition: { duration: 0.18 } }}
              transition={{ duration: 0.35, ease: LUXE }}
              className="glass mt-4 rounded-3xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{selectedSub.name}</p>
                  <p className="caption mt-1">
                    {selectedSub.sector} · {selectedSub.country} · Since {selectedSub.since}
                  </p>
                </div>
                <ClusterChip id={selectedSub.cluster} grade={grade} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                {firstSentence(selectedSub.note)}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setOpenId(selectedSub.id)}
                  className="h-11 cursor-pointer rounded-full px-5 text-xs font-semibold"
                  style={{
                    background: CLUSTER_MAP[selectedSub.cluster].color,
                    color: "#0A0E23",
                  }}
                >
                  Open the full star
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="h-11 cursor-pointer rounded-full border border-border/60 px-5 text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* full screen morph overlay */}
      <AnimatePresence>
        {openSub && (
          <div
            key="constellation-overlay"
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`${openSub.name} details`}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ duration: 0.4, ease: LUXE }}
              onClick={() => setOpenId(null)}
              aria-hidden="true"
              className="glass-strong absolute inset-0 cursor-pointer"
              style={{ background: overlayBg }}
            />
            <motion.div
              layoutId={`card-${openSub.id}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.22 } }}
              transition={{ duration: 0.55, ease: LUXE }}
              /* No scrollbars, ever: the panel is sized to hold every star at
                 desktop and phone heights, and the no-scrollbar failsafe keeps
                 even tiny landscape viewports silent instead of showing a bar. */
              className="shadow-teal-lg no-scrollbar relative z-10 flex max-h-[92svh] w-full max-w-2xl flex-col overflow-y-auto overscroll-contain rounded-3xl border border-border/50 p-5 pb-5 sm:p-8 sm:pb-8"
              style={{
                background: "color-mix(in srgb, var(--popover) 90%, transparent)",
                backdropFilter: "blur(26px) saturate(1.4)",
                WebkitBackdropFilter: "blur(26px) saturate(1.4)",
              }}
            >
              <motion.span
                layoutId={`dot-${openSub.id}`}
                className="block shrink-0 rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  background: openColor,
                  boxShadow: `0 0 30px 6px ${rgba(openColor, grade === "abyss" ? 0.5 : 0.3)}`,
                }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.16, duration: 0.4, ease: LUXE }}
              >
                <h3 className="h-display mt-3 text-2xl sm:text-4xl">{openSub.name}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <ClusterChip id={openSub.cluster} size="md" grade={grade} />
                  <p className="caption">
                    {openSub.sector} · {openSub.country} · Since {openSub.since}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
                  {openSub.note}
                </p>

                <div className="mt-5 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
                  <p className="eyebrow">The {CLUSTER_MAP[openSub.cluster].name} cluster</p>
                  <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-3 sm:gap-x-10">
                    <div>
                      <p className="tabular text-lg font-semibold tracking-tight sm:text-2xl">
                        {CLUSTER_MAP[openSub.cluster].revenue}
                      </p>
                      <p className="caption mt-1">cluster revenue</p>
                    </div>
                    <div>
                      <p className="tabular text-lg font-semibold tracking-tight sm:text-2xl">
                        {CLUSTER_MAP[openSub.cluster].operatingProfit}
                      </p>
                      <p className="caption mt-1">operating profit</p>
                    </div>
                    <div>
                      <p className="tabular text-lg font-semibold tracking-tight sm:text-2xl">
                        {CLUSTER_MAP[openSub.cluster].team.toLocaleString("en-US")}
                      </p>
                      <p className="caption mt-1">{CLUSTER_MAP[openSub.cluster].teamLabel}</p>
                    </div>
                  </div>
                  <p className="caption mt-4">Key companies in this cluster</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                    {CLUSTER_MAP[openSub.cluster].keyCompanies.map((k) => (
                      <li
                        key={k}
                        className="rounded-full border px-2.5 py-1 text-[11px] font-medium sm:text-xs"
                        style={{ borderColor: rgba(openColor, grade === "abyss" ? 0.4 : 0.55) }}
                      >
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </motion.div>

            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpenId(null)}
              aria-label="Close"
              className="glass absolute right-4 top-4 z-20 flex size-11 cursor-pointer items-center justify-center rounded-full sm:right-8 sm:top-8"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
