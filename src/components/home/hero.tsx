"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Film, Ship, Wind, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EASE } from "@/lib/brand";
import { LENSES } from "@/lib/lens";
import { useApp } from "@/store/app-store";
import { pulseMetrics, usePulse, type PulseData } from "@/hooks/use-pulse";
import { useCountUp } from "@/hooks/use-count-up";
import { useMagnetic } from "@/hooks/use-tilt";
import { T } from "./t";

const EASE_LUXE: [number, number, number, number] = [...EASE.luxe];

/** Indian Ocean ports the fleet travels between, normalised coordinates. */
const PORTS = [
  { name: "Port Louis", x: 0.62, y: 0.62 },
  { name: "Saint-Denis", x: 0.6, y: 0.68 },
  { name: "Maputo", x: 0.42, y: 0.45 },
  { name: "Dar es Salaam", x: 0.58, y: 0.28 },
  { name: "Mombasa", x: 0.64, y: 0.18 },
  { name: "Moroni", x: 0.5, y: 0.5 },
  { name: "Mumbai", x: 0.8, y: 0.32 },
  { name: "Singapore", x: 0.95, y: 0.52 },
] as const;

/* The ether carries one palette per grade. On paper it draws in ink,
   in the abyss it draws in light. */
interface HeroPalette {
  particle: string;
  particleSoft: string;
  ship: string;
  port: string;
  portHQ: string;
  route: string;
  ring: string;
  ridgeUp: string;
  ridgeDown: string;
  alphaBoost: number;
  dim: number;
  trailFade: number;
  glow: boolean;
}
const HERO_PALETTES: Record<"light" | "abyss" | "sepia", HeroPalette> = {
  light: {
    particle: "21, 124, 135",
    particleSoft: "33, 41, 121",
    ship: "33, 41, 121",
    port: "33, 41, 121",
    portHQ: "21, 124, 135",
    route: "33, 41, 121",
    ring: "21, 124, 135",
    ridgeUp: "21, 124, 135",
    ridgeDown: "168, 42, 104",
    alphaBoost: 1.7,
    dim: 0.74,
    trailFade: 0.085,
    glow: false,
  },
  abyss: {
    particle: "75, 189, 200",
    particleSoft: "118, 192, 202",
    ship: "255, 246, 224",
    port: "234, 245, 246",
    portHQ: "75, 189, 200",
    route: "75, 189, 200",
    ring: "75, 189, 200",
    ridgeUp: "75, 189, 200",
    ridgeDown: "214, 51, 132",
    alphaBoost: 1,
    dim: 1,
    trailFade: 0.06,
    glow: true,
  },
  sepia: {
    particle: "122, 92, 50",
    particleSoft: "59, 50, 34",
    ship: "59, 50, 34",
    port: "59, 50, 34",
    portHQ: "122, 92, 50",
    route: "59, 50, 34",
    ring: "122, 92, 50",
    ridgeUp: "122, 92, 50",
    ridgeDown: "154, 73, 47",
    alphaBoost: 1.5,
    dim: 0.74,
    trailFade: 0.08,
    glow: false,
  },
};

const themeToPalette = (t: string | undefined): HeroPalette =>
  t === "sepia"
    ? HERO_PALETTES.sepia
    : t === "abyss" || t === "oled"
      ? HERO_PALETTES.abyss
      : HERO_PALETTES.light;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Splits a lens stat string into countable pieces, "Rs 124.3 Bn" for instance. */
function parseStatValue(raw: string) {
  const val = raw.trim();
  if (/^\d{1,3}( \d{3})+$/.test(val)) {
    return { prefix: "", num: Number(val.replace(/ /g, "")), suffix: "", decimals: 0, spaceGroup: true };
  }
  const m = val.match(/^([^\d]*)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return null;
  const numStr = m[2].replace(",", ".");
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  return { prefix: m[1], num: Number(numStr), suffix: m[3], decimals, spaceGroup: false };
}

function StatChip({ value, label }: { value: string; label: string }) {
  const parsed = useMemo(() => parseStatValue(value), [value]);
  const { ref: countRef, value: countValue } = useCountUp(parsed?.num ?? 0, 1900, parsed?.decimals ?? 0);
  let shown = value;
  if (parsed) {
    const nums = countValue.toLocaleString("en-US", {
      minimumFractionDigits: parsed.decimals,
      maximumFractionDigits: parsed.decimals,
    });
    shown = `${parsed.prefix}${parsed.spaceGroup ? nums.replace(/,/g, " ") : nums}${parsed.suffix}`;
  }
  return (
    <div className="glass lift pointer-events-auto min-w-[8rem] rounded-xl px-4 py-3">
      <span ref={countRef} className="tabular block text-lg font-semibold md:text-xl">
        {shown}
      </span>
      <span className="caption mt-1 block">{label}</span>
    </div>
  );
}

function SignalChip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <span
      title={title}
      className="glass inline-flex min-h-[2.25rem] items-center gap-2 rounded-full px-3 py-1.5 text-xs text-foreground/90"
    >
      {children}
    </span>
  );
}

type Cardinal = "n" | "w" | "e";

const lineVariants: Variants = {
  hidden: (dir: Cardinal) => ({
    opacity: 0,
    y: dir === "n" ? -44 : 0,
    x: dir === "w" ? -56 : dir === "e" ? 56 : 0,
  }),
  show: (dir: Cardinal) => ({
    opacity: 1,
    y: 0,
    x: 0,
    transition: { duration: 1.05, ease: EASE_LUXE, delay: dir === "n" ? 0.15 : dir === "w" ? 0.34 : 0.52 },
  }),
};

const riseVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.95, ease: EASE_LUXE, delay },
  }),
};

export function HeroSection() {
  const lens = useApp((s) => s.lens);
  const reducedMotion = useApp((s) => s.reducedMotion);
  const a11y = useApp((s) => s.a11y);
  const fmReduce = useReducedMotion();
  const motionOff = Boolean(fmReduce) || reducedMotion || a11y === "epilepsy";

  const lensCfg = LENSES[lens];
  const pulse = usePulse();
  const metrics = pulseMetrics(pulse);
  const pulseRef = useRef<PulseData | null>(null);
  useEffect(() => {
    pulseRef.current = pulse;
  }, [pulse]);
  const ready = pulse !== null;

  const heroRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const filmRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLSpanElement | null>(null);
  const palRef = useRef<HeroPalette>(HERO_PALETTES.light);
  const magRef = useMagnetic(0.3, 120);

  /* Follow the live grade so the ether redraws in ink or light */
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      palRef.current = themeToPalette(root.dataset.theme);
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  /* The reel itself, real footage at a calmer heartbeat */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 0.85;
    if (motionOff) {
      v.pause();
      v.currentTime = 0;
      return;
    }
    const tryPlay = () => {
      v.play().catch(() => {});
    };
    tryPlay();
    v.addEventListener("canplay", tryPlay);
    const onVis = () => {
      if (document.hidden) v.pause();
      else if (heroRef.current) {
        const r = heroRef.current.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) tryPlay();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) tryPlay();
        else v.pause();
      },
      { threshold: 0.02 }
    );
    io.observe(v);
    return () => {
      v.removeEventListener("canplay", tryPlay);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
    };
  }, [motionOff]);

  /* Film timecode read straight off the running reel, 25 fps */
  const [timecode, setTimecode] = useState("00:00:00:00");
  useEffect(() => {
    if (motionOff) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      const t = Math.max(0, v.currentTime);
      const h = Math.floor(t / 3600);
      const m = Math.floor((t % 3600) / 60);
      const s = Math.floor(t % 60);
      const f = Math.floor((t % 1) * 25);
      setTimecode(`${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`);
    }, 90);
    return () => clearInterval(id);
  }, [motionOff]);

  /* ghost numeral parallax and footage parallax, rAF throttled.
     The reel rides slower than the page, a window not a sticker. */
  useEffect(() => {
    if (motionOff) return;
    const el = ghostRef.current;
    const film = filmRef.current;
    let raf = 0;
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(() => {
        queued = false;
        const y = window.scrollY;
        if (el) el.style.transform = `translate3d(0, ${(y * 0.12).toFixed(1)}px, 0)`;
        if (film) film.style.transform = `translate3d(0, ${(y * 0.18).toFixed(1)}px, 0) scale(1.08)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [motionOff]);

  /* page performance, measured once the document has fully loaded */
  const [perf, setPerf] = useState<string | null>(null);
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      try {
        const nav = (performance.getEntriesByType("navigation") as PerformanceNavigationTiming[])[0];
        if (!nav) return;
        const loadMs = nav.domContentLoadedEventEnd > 0 ? nav.domContentLoadedEventEnd : nav.duration;
        let bytes = nav.transferSize ?? 0;
        const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        for (const r of resources) bytes += r.transferSize ?? 0;
        const loadPart = `${(loadMs / 1000).toFixed(1)} s`;
        if (bytes > 0) {
          const kb = bytes / 1024;
          const sizePart = kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
          setPerf(`${loadPart} · ${sizePart} · live`);
        } else {
          setPerf(`${loadPart} · live`);
        }
      } catch {
        setPerf(null);
      }
    };
    const onLoaded = () => {
      raf = requestAnimationFrame(compute);
    };
    if (document.readyState === "complete") {
      raf = requestAnimationFrame(compute);
    } else {
      window.addEventListener("load", onLoaded, { once: true });
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoaded);
    };
  }, []);

  /* the generative ether above the footage */
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = heroRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* every visit differs, minute seed plus mount time */
    const seed = ((pulseRef.current?.seed ?? Math.floor(Date.now() / 60000)) + Date.now()) >>> 0;
    const rand = mulberry32(seed);

    let w = 1;
    let h = 1;
    let placed = false;

    interface Particle {
      x: number;
      y: number;
      px: number;
      py: number;
      a: number;
      warm: boolean;
    }
    const particles: Particle[] = Array.from({ length: 150 }, () => ({
      x: rand(),
      y: rand(),
      px: 0,
      py: 0,
      a: 0.15 + rand() * 0.45,
      warm: rand() < 0.12,
    }));

    const pickPortSeeded = (not: number) => {
      let p = Math.floor(rand() * PORTS.length);
      if (p === not) p = (p + 1) % PORTS.length;
      return p;
    };
    const pickPortLive = (not: number) => {
      let p = Math.floor(Math.random() * PORTS.length);
      if (p === not) p = (p + 1) % PORTS.length;
      return p;
    };

    interface ShipState {
      from: number;
      to: number;
      t: number;
      speed: number;
      curve: number;
      trail: number[][];
    }
    const shipCount = 8 + Math.floor(rand() * 7);
    const ships: ShipState[] = Array.from({ length: shipCount }, () => {
      const from = Math.floor(rand() * PORTS.length);
      return {
        from,
        to: pickPortSeeded(from),
        t: rand(),
        speed: 0.01 + rand() * 0.028,
        curve: (rand() - 0.5) * 0.45,
        trail: [],
      };
    });

    const routePairs: [number, number][] = [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 6],
      [6, 7],
      [3, 4],
      [2, 5],
      [1, 5],
    ];
    const routes = routePairs.map(([a, b]) => ({ from: a, to: b, curve: (rand() - 0.5) * 0.34 }));

    const bez = (from: number, to: number, curve: number, t: number): [number, number] => {
      const ax = PORTS[from].x;
      const ay = PORTS[from].y;
      const bx = PORTS[to].x;
      const by = PORTS[to].y;
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 0.001;
      const cx = mx - (dy / len) * curve;
      const cy = my + (dx / len) * curve;
      const u = 1 - t;
      return [u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by];
    };

    /* share ridge, seeded walk anchored on the pulse price */
    let ridgeSeed = -1;
    let ridgeWalk: number[] = [];
    let ridgeProgress = 0;
    const ensureRidge = () => {
      const s = pulseRef.current?.seed ?? 0;
      if (s === ridgeSeed) return;
      ridgeSeed = s;
      const r2 = mulberry32((s + 1013) >>> 0);
      const walk: number[] = [];
      for (let i = 0; i < 110; i++) walk.push(i === 0 ? 0 : walk[i - 1] + (r2() - 0.5) * 2);
      let maxAbs = 1e-6;
      for (const v of walk) maxAbs = Math.max(maxAbs, Math.abs(v));
      ridgeWalk = walk.map((v) => v / maxAbs);
      ridgeProgress = 0;
    };

    let rings: { r: number }[] = [];
    let ringTimer = 1 + rand() * 2.5;

    const pointer = { x: 0, y: 0, inside: false };

    const resize = () => {
      const rect = section.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!placed) {
        for (const p of particles) {
          p.x *= w;
          p.y *= h;
        }
        placed = true;
      }
    };

    /* every element redrawn each frame reaches an alpha equilibrium under
       the trail fade, so per stroke alphas stay low. k compensates the single
       static pass. */
    const drawRoutes = (k: number) => {
      const pal = palRef.current;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${pal.route}, ${Math.min(1, 0.018 * k * pal.alphaBoost)})`;
      for (const r of routes) {
        ctx.beginPath();
        for (let i = 0; i <= 36; i++) {
          const t = i / 36;
          const [nx, ny] = bez(r.from, r.to, r.curve, t);
          if (i === 0) ctx.moveTo(nx * w, ny * h);
          else ctx.lineTo(nx * w, ny * h);
        }
        ctx.stroke();
      }
    };

    const drawPorts = (k: number) => {
      const pal = palRef.current;
      for (let i = 0; i < PORTS.length; i++) {
        const x = PORTS[i].x * w;
        const y = PORTS[i].y * h;
        const rgb = i === 0 ? pal.portHQ : pal.port;
        const base = i === 0 ? 0.3 : 0.2;
        ctx.fillStyle = `rgba(${rgb}, ${Math.min(1, base * k * pal.alphaBoost)})`;
        ctx.beginPath();
        ctx.arc(x, y, i === 0 ? 2.8 : 2, 0, Math.PI * 2);
        ctx.fill();
        if (i === 0) {
          if (pal.glow) {
            ctx.fillStyle = `rgba(${pal.portHQ}, 0.1)`;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.strokeStyle = `rgba(${pal.portHQ}, ${Math.min(1, 0.14 * k * pal.alphaBoost)})`;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    const drawRings = () => {
      const pal = palRef.current;
      const maxR = Math.min(w, h) * 0.34;
      ctx.lineWidth = 1.2;
      for (const ring of rings) {
        const a = 0.45 * (1 - ring.r / maxR) * pal.dim;
        if (a <= 0.01) continue;
        ctx.strokeStyle = `rgba(${pal.ring}, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(PORTS[0].x * w, PORTS[0].y * h, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawRidge = (k: number) => {
      if (ridgeWalk.length < 2) return;
      const pal = palRef.current;
      const share = pulseRef.current?.share;
      const price = share?.price ?? 21;
      const up = (share?.changePct ?? 0) >= 0;
      const rgb = up ? pal.ridgeUp : pal.ridgeDown;
      const anchor = h - 64 - (price - 18) * 7;
      const yAt = (i: number) => Math.min(h - 26, Math.max(h - 132, anchor - ridgeWalk[i] * 44));
      const count = Math.floor(ridgeWalk.length * Math.min(1, ridgeProgress));
      if (count < 2) return;
      ctx.strokeStyle = `rgba(${rgb}, ${Math.min(1, 0.18 * k * pal.alphaBoost)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const x = (i / (ridgeWalk.length - 1)) * w;
        const y = yAt(i);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      const li = count - 1;
      if (pal.glow) {
        ctx.fillStyle = `rgba(${rgb}, 0.14)`;
        ctx.beginPath();
        ctx.arc((li / (ridgeWalk.length - 1)) * w, yAt(li), 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(${rgb}, ${Math.min(0.9, 0.5 * k * pal.alphaBoost)})`;
      ctx.beginPath();
      ctx.arc((li / (ridgeWalk.length - 1)) * w, yAt(li), 1.8, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawParticles = (dots: boolean) => {
      const pal = palRef.current;
      if (dots) {
        for (const p of particles) {
          const a = Math.min(0.6, p.a + 0.1) * pal.dim;
          ctx.fillStyle = p.warm ? `rgba(${pal.particleSoft}, ${a})` : `rgba(${pal.particle}, ${a})`;
          ctx.fillRect(p.x - 0.75, p.y - 0.75, 1.5, 1.5);
        }
        return;
      }
      ctx.lineWidth = 1;
      for (const p of particles) {
        ctx.strokeStyle = p.warm
          ? `rgba(${pal.particleSoft}, ${p.a * pal.dim})`
          : `rgba(${pal.particle}, ${p.a * pal.dim})`;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    };

    const drawShips = (k: number) => {
      const pal = palRef.current;
      ctx.lineWidth = 1;
      for (const s of ships) {
        if (s.trail.length > 1) {
          ctx.strokeStyle = `rgba(${pal.ship}, ${Math.min(1, 0.06 * k * pal.alphaBoost)})`;
          ctx.beginPath();
          for (let i = 0; i < s.trail.length; i++) {
            const x = s.trail[i][0] * w;
            const y = s.trail[i][1] * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        const [hx, hy] = bez(s.from, s.to, s.curve, s.t);
        const x = hx * w;
        const y = hy * h;
        ctx.fillStyle = `rgba(${pal.ship}, ${Math.min(1, 0.08 * k * pal.alphaBoost)})`;
        ctx.beginPath();
        ctx.arc(x, y, pal.glow ? 6.5 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${pal.ship}, 0.9)`;
        ctx.beginPath();
        ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();

    /* reduced motion draws exactly one composed frame, regraded live */
    if (motionOff) {
      const prepStatic = () => {
        ensureRidge();
        ridgeProgress = 1;
        const base = Math.min(w, h);
        rings = [base * 0.08, base * 0.15, base * 0.22].map((r) => ({ r }));
        for (const s of ships) {
          s.trail = [];
          for (let k = 14; k >= 0; k--) s.trail.push(bez(s.from, s.to, s.curve, Math.max(0, s.t - k * 0.008)));
        }
      };
      const drawStaticFrame = () => {
        ctx.clearRect(0, 0, w, h);
        drawRoutes(2.6);
        drawRings();
        drawRidge(2.6);
        drawParticles(true);
        drawShips(2.6);
        drawPorts(2.6);
      };
      prepStatic();
      drawStaticFrame();
      const ro = new ResizeObserver(() => {
        resize();
        prepStatic();
        drawStaticFrame();
      });
      ro.observe(section);
      const themeMo = new MutationObserver(() => drawStaticFrame());
      themeMo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => {
        ro.disconnect();
        themeMo.disconnect();
      };
    }

    let raf = 0;
    let running = false;
    let alive = true;
    let last = performance.now();

    const loop = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const weather = pulseRef.current?.weather;
      const windDir = weather?.windDir ?? 120;
      const windKph = weather?.windKph ?? 16;
      const windRad = (windDir * Math.PI) / 180;
      const windScale = 0.5 + Math.min(2.2, windKph / 14);

      /* fading trails without hiding the grade below */
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${palRef.current.trailFade})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      ensureRidge();
      ridgeProgress = Math.min(1, ridgeProgress + dt / 26);

      for (const p of particles) {
        p.px = p.x;
        p.py = p.y;
        const ang =
          windRad + Math.sin(p.x * 0.003 + now * 0.00021) * 1.15 + Math.cos(p.y * 0.0037 - now * 0.00017) * 0.95;
        const spd = (9 + 15 * windScale) * (0.55 + p.a);
        let vx = Math.cos(ang) * spd;
        let vy = Math.sin(ang) * spd;
        if (pointer.inside) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < 150 && d > 1) {
            const f = (1 - d / 150) * 95;
            vx += (dx / d) * f;
            vy += (dy / d) * f;
          }
        }
        p.x += vx * dt;
        p.y += vy * dt;
        if (p.x < -14) {
          p.x = w + 12;
          p.px = p.x;
        } else if (p.x > w + 14) {
          p.x = -12;
          p.px = p.x;
        }
        if (p.y < -14) {
          p.y = h + 12;
          p.py = p.y;
        } else if (p.y > h + 14) {
          p.y = -12;
          p.py = p.y;
        }
      }

      for (const s of ships) {
        s.t += s.speed * dt * (0.75 + windScale * 0.25);
        if (s.t >= 1) {
          s.t = 0;
          s.from = s.to;
          s.to = pickPortLive(s.from);
          s.curve = (Math.random() - 0.5) * 0.45;
          s.trail = [];
        }
        s.trail.push(bez(s.from, s.to, s.curve, s.t));
        if (s.trail.length > 16) s.trail.shift();
      }

      ringTimer -= dt;
      if (ringTimer <= 0) {
        rings.push({ r: 5 });
        ringTimer = 3.2 + Math.random() * 2.4;
      }
      const maxR = Math.min(w, h) * 0.34;
      rings = rings.filter((rg) => rg.r < maxR);
      for (const rg of rings) rg.r += 26 * dt;

      drawRoutes(1);
      drawRings();
      drawRidge(1);
      drawParticles(false);
      drawShips(1);
      drawPorts(1);

      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || !alive) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) start();
        else stop();
      },
      { threshold: 0.02 }
    );
    io.observe(section);

    const onVis = () => {
      if (document.hidden) {
        stop();
        return;
      }
      const r = section.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) start();
    };
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(resize);
    ro.observe(section);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave);

    start();

    return () => {
      alive = false;
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [motionOff]);

  const openBuilder = () => {
    window.dispatchEvent(
      new CustomEvent("ibl:open-builder", { detail: { kind: lensCfg.hero.primaryCta.action } })
    );
  };

  const scrollToLensAnchor = () => {
    document
      .getElementById(lensCfg.hero.secondaryCta.anchor)
      ?.scrollIntoView({ behavior: motionOff ? "auto" : "smooth", block: "start" });
  };

  const up = metrics.share.changePct >= 0;
  const ghostStyle: CSSProperties = { fontSize: "clamp(16rem, 38vw, 34rem)" };

  return (
    <section ref={heroRef} className="relative isolate min-h-svh overflow-hidden" aria-label="IBL Group hero">
      {/* L0, the real footage. Graded, never competing, carrying the emotion */}
      <div ref={filmRef} className="hero-film" aria-hidden>
        <video
          ref={videoRef}
          poster="/media/hero-poster.jpg"
          muted
          loop
          playsInline
          autoPlay={!motionOff}
          preload={motionOff ? "metadata" : "auto"}
          tabIndex={-1}
          disablePictureInPicture
        >
          <source src="/media/hero-web.mp4" type="video/mp4" />
        </video>
      </div>
      {/* L1, the veil. Heavy where typography lives, breathing where footage shines */}
      <div className="hero-veil" aria-hidden />
      {/* L2, the generative ether drawn above the grade */}
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 z-[2] h-full w-full" />
      {/* L3, ghost numeral */}
      <span
        ref={ghostRef}
        aria-hidden
        style={ghostStyle}
        className="text-outline pointer-events-none absolute -top-[5vw] right-[-2vw] z-[3] select-none font-semibold leading-none opacity-[0.18]"
      >
        1830
      </span>
      {/* L4, film grain */}
      <div aria-hidden className="grain pointer-events-none absolute inset-0 z-[4]" />

      {/* slate marks, quiet film furniture on grand screens */}
      <span aria-hidden className="hero-slate left-6 top-[88px] hidden 2xl:block">
        Reel 001 · Indian Ocean · 25 fps
      </span>
      <span aria-hidden className="hero-slate right-6 top-[88px] hidden text-right 2xl:block">
        20°09′S 57°30′E · Port Louis
      </span>

      {/* typography layer */}
      <div className="pointer-events-none relative z-10 mx-auto flex min-h-svh w-full max-w-[88rem] flex-col px-5 pb-36 pt-[88px] sm:px-8 md:pb-28 md:pt-[120px]">
        <motion.div initial={motionOff ? "show" : "hidden"} animate="show" className="mt-[2vh] max-w-6xl md:mt-[4vh]">
          <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="live-dot" aria-hidden />
            <T k="hero.kicker" />
            <span aria-hidden className="opacity-60">
              ·
            </span>
            <span className="text-foreground/85">{lensCfg.hero.kicker}</span>
          </p>

          <h1 className="h-display mt-6 text-[clamp(2.5rem,min(9.4vw,12.4svh),8.8rem)] md:mt-8">
            <motion.span className="block" variants={lineVariants} custom="n">
              <T k="hero.line1" />
            </motion.span>
            <motion.span className="block" variants={lineVariants} custom="w">
              <T k="hero.line2" />
            </motion.span>
            <motion.span
              className="font-display block -mt-[0.16em] ml-[1.5vw] italic tracking-[-0.02em] md:ml-[3vw]"
              style={{ translate: "0.12em", color: "var(--ibl-teal)" }}
              variants={lineVariants}
              custom="e"
            >
              <T k="hero.line3" />
            </motion.span>
          </h1>

          {/* lens stats */}
          <motion.div
            variants={riseVariants}
            custom={0.75}
            className="mt-6 flex flex-wrap gap-3 md:mt-10"
          >
            {lensCfg.hero.stat.map((stat) => (
              <StatChip key={`${stat.value}-${stat.label}`} value={stat.value} label={stat.label} />
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div variants={riseVariants} custom={0.95} className="pointer-events-auto mt-6 flex flex-wrap items-center gap-4 md:mt-8">
            <div ref={magRef as RefObject<HTMLDivElement | null>} className="btn-magnetic inline-flex rounded-full">
              <Button
                size="lg"
                data-cursor="DISCOVER"
                className="min-h-[44px] rounded-full px-7 text-sm md:text-base"
                onClick={openBuilder}
              >
                {lensCfg.hero.primaryCta.label}
              </Button>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="min-h-[44px] rounded-full px-6 text-sm md:text-base"
              onClick={scrollToLensAnchor}
            >
              {lensCfg.hero.secondaryCta.label}
            </Button>
          </motion.div>
        </motion.div>

        {/* live signal chips, bottom left */}
        <motion.div
          initial={motionOff ? "show" : "hidden"}
          animate="show"
          variants={riseVariants}
          custom={1.15}
          className="pointer-events-auto absolute left-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 max-w-[calc(100vw-2.5rem)] md:bottom-[calc(1.25rem+env(safe-area-inset-bottom))] md:max-w-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <SignalChip title="Film timecode, the home reel at 25 fps">
              <Film className="size-3" aria-hidden style={{ color: "var(--ibl-teal)" }} />
              <span className="tabular font-medium">{timecode}</span>
              <span className="caption text-[0.62rem]">reel</span>
            </SignalChip>
            <SignalChip title="Simulated ticker, delayed reference price">
              <span className="tabular font-medium">Rs {ready ? metrics.share.price.toFixed(2) : "…"}</span>
              <span
                className="inline-flex items-center gap-1"
                style={{ color: up ? "var(--ibl-teal)" : "#D63384" }}
              >
                {up ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
                <span className="tabular">
                  {up ? "+" : ""}
                  {ready ? metrics.share.changePct.toFixed(2) : "0.00"}%
                </span>
              </span>
              <span className="caption text-[0.62rem]">delayed</span>
            </SignalChip>
            <SignalChip title={metrics.weather.live ? "Live weather, Port Louis" : "Modelled weather, Port Louis"}>
              <Wind className="size-3" aria-hidden style={{ color: "var(--ibl-teal)" }} />
              <span className="tabular">{ready ? `${metrics.weather.tempC}°C` : "…"}</span>
              <span className="text-muted-foreground">{metrics.weather.condition}</span>
              <span className="tabular text-muted-foreground">{ready ? `${metrics.weather.windKph} km/h` : ""}</span>
            </SignalChip>
            <SignalChip title="Vessels modelled on group routes right now">
              <Ship className="size-3" aria-hidden style={{ color: "var(--ibl-teal)" }} />
              <span className="tabular font-medium">{ready ? metrics.shipments.atSea : "…"}</span>
              <span className="text-muted-foreground">ships at sea</span>
            </SignalChip>
          </div>
        </motion.div>
      </div>

      {/* performance badge, bottom right */}
      <div className="absolute right-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 sm:right-8">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Page performance"
              className="glass caption inline-flex min-h-[44px] items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:text-foreground"
            >
              <Zap className="size-3" aria-hidden style={{ color: "var(--ibl-teal)" }} />
              <span className="tabular hidden sm:inline">{perf ?? "measuring"}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-56 text-center">
            Performance is a feature. Navigation Timing API.
          </TooltipContent>
        </Tooltip>
      </div>

      {/* scroll cue, bottom center */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-1">
        <span className="caption">
          <T k="hero.scroll" />
        </span>
        <motion.span
          aria-hidden
          animate={motionOff ? undefined : { y: [0, 7, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="size-4" />
        </motion.span>
      </div>
    </section>
  );
}
