"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CLUSTER_MAP, EASE, type ClusterId } from "@/lib/brand";
import { useCountUp } from "@/hooks/use-count-up";
import { usePlateDraw } from "@/hooks/use-plate-draw";
import { useApp } from "@/store/app-store";
import { T } from "./t";

const LUXE: [number, number, number, number] = [...EASE.luxe] as [number, number, number, number];

/** The color journey order. Deliberately not the official listing order. */
const JOURNEY: ClusterId[] = ["retail", "industrials", "cbd", "services"];

type Tone = { fg: string; soft: string; line: string };

function toneFor(id: ClusterId): Tone {
  const fg = id === "services" ? "#FFF7FA" : "#0A0E23";
  return { fg, soft: `${fg}B3`, line: `${fg}59` };
}

/* ---------- motion helpers ---------- */

/** Scroll parallax, rAF driven, skipped for reduced motion and epilepsy profiles. */
function Parallax({
  children,
  className,
  amount = 12,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      document.documentElement.dataset.motion === "reduced" ||
      document.documentElement.dataset.a11y === "epilepsy" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      const offset = (0.5 - progress) * amount;
      el.style.transform = `translateY(${offset.toFixed(2)}%)`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [amount]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Cardinal assembly on scroll into view. */
function Assemble({
  dir,
  delay = 0,
  className,
  reduce,
  children,
}: {
  dir: "n" | "e" | "s" | "w";
  delay?: number;
  className?: string;
  reduce: boolean;
  children: ReactNode;
}) {
  const offset =
    dir === "n" ? { y: -44 } : dir === "e" ? { x: 56 } : dir === "s" ? { y: 44 } : { x: -56 };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={reduce ? { duration: 0 } : { duration: 1.05, ease: LUXE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- stat + chip atoms ---------- */

function StatValue({ value, className }: { value: string; className?: string }) {
  const m = /since/i.test(value) ? null : value.match(/^(\D*)([\d.,]+)(.*)$/);
  const target = m ? parseFloat(m[2].replace(/,/g, "")) : 0;
  const decimals = m && m[2].includes(".") ? 1 : 0;
  const { ref, formatted } = useCountUp(target, 1700, decimals);
  if (!m) return <span className={className}>{value}</span>;
  return (
    <span ref={ref} className={className}>
      {m[1]}
      {formatted}
      {m[3]}
    </span>
  );
}

function StatRow({
  stats,
  tone,
  center,
}: {
  stats: { label: string; value: string }[];
  tone: Tone;
  center?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-x-10 gap-y-6 ${center ? "justify-center" : ""}`}>
      {stats.map((st) => (
        <div key={st.label} className={center ? "text-center" : ""}>
          <StatValue
            value={st.value}
            className="tabular text-3xl font-semibold tracking-tight md:text-4xl"
          />
          <p
            className="mt-1.5 text-[11px] uppercase tracking-[0.18em]"
            style={{ color: tone.soft }}
          >
            {st.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function ChipRow({ items, tone, center }: { items: string[]; tone: Tone; center?: boolean }) {
  return (
    <ul className={`flex flex-wrap gap-2.5 ${center ? "justify-center" : ""}`}>
      {items.map((it) => (
        <li
          key={it}
          className="rounded-full border px-3.5 py-1.5 text-xs font-medium"
          style={{ borderColor: tone.line, color: tone.fg }}
        >
          {it}
        </li>
      ))}
    </ul>
  );
}

function FoundingNote({ note, tone, center }: { note: string; tone: Tone; center?: boolean }) {
  return (
    <p
      className={`font-display mt-9 max-w-sm text-sm italic leading-relaxed ${
        center ? "mx-auto text-center" : "border-l-2 pl-4"
      }`}
      style={{ borderColor: tone.line, color: tone.soft }}
    >
      {note}
    </p>
  );
}

/* ---------- decorative motifs (pure type and line, no photography) ---------- */

/* The Industrials plate: a technical elevation of the group's mills and power
   houses, drawn the way an engineering office would draw it — dimension lines,
   leader notes, a title block. Ink on the orange flood, quiet and precise. */
function IndustrialsPlate() {
  const { ref, cls } = usePlateDraw<SVGSVGElement>();
  const ink = (a: number) => `rgba(10,14,35,${a})`;
  const label = {
    fontFamily: "var(--font-sans)",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  } as const;
  /* lattice braces between the conveyor chords */
  const lattice: ReactNode[] = [];
  for (let x = 208; x <= 404; x += 24) {
    const t = (x - 200) / 218;
    const y1 = 290 + t * 28;
    const y2 = 304 + t * 28;
    lattice.push(<line key={`f${x}`} x1={x} y1={y1} x2={x + 24} y2={y2} />);
    lattice.push(<line key={`b${x}`} x1={x + 24} y1={y1 + (24 / 218) * 28} x2={x} y2={y2} />);
  }
  /* ground hatch below the baseline */
  const hatch: ReactNode[] = [];
  for (let x = 30; x <= 496; x += 13) {
    hatch.push(<line key={x} x1={x} y1={478} x2={x - 9} y2={488} />);
  }
  return (
    <svg
      ref={ref}
      viewBox="0 0 520 560"
      fill="none"
      aria-hidden="true"
      className={`w-full ${cls}`}
    >
      {/* registration crosshair */}
      <g stroke={ink(0.34)} strokeWidth="1">
        <circle cx="72" cy="84" r="9" />
        <line x1="72" y1="66" x2="72" y2="102" />
        <line x1="54" y1="84" x2="90" y2="84" />
      </g>

      {/* harbor crane, a whisper of the quays the group was born on */}
      <g stroke={ink(0.26)} strokeWidth="1">
        <line x1="34" y1="470" x2="34" y2="362" />
        <line x1="34" y1="368" x2="64" y2="386" />
        <line x1="34" y1="368" x2="16" y2="376" />
        <line x1="34" y1="362" x2="62" y2="382" />
        <line x1="58" y1="385" x2="58" y2="432" />
        <rect x="54.5" y="432" width="7" height="6" />
      </g>

      {/* chimney with collar rings and vapour */}
      <g stroke={ink(0.18)} strokeWidth="1" strokeDasharray="5 4">
        <path d="M218,146 C226,128 208,120 218,102" />
        <path d="M224,148 C234,132 216,124 228,108" />
      </g>
      <g stroke={ink(0.5)} strokeWidth="1.25">
        <path d="M208,470 L212,152 L224,152 L228,470 Z" />
      </g>
      <g stroke={ink(0.3)} strokeWidth="1">
        <line x1="210.5" y1="200" x2="225.5" y2="200" />
        <line x1="211.5" y1="222" x2="224.5" y2="222" />
      </g>

      {/* boiler house with monitor roof */}
      <g stroke={ink(0.5)} strokeWidth="1.25">
        <rect x="60" y="302" width="140" height="168" />
        <rect x="88" y="274" width="84" height="28" />
      </g>
      <g stroke={ink(0.3)} strokeWidth="1">
        <line x1="108" y1="274" x2="108" y2="302" />
        <line x1="130" y1="274" x2="130" y2="302" />
        <line x1="152" y1="274" x2="152" y2="302" />
        <rect x="82" y="336" width="14" height="20" />
        <rect x="122" y="336" width="14" height="20" />
        <rect x="162" y="336" width="14" height="20" />
        <rect x="118" y="430" width="24" height="40" />
      </g>

      {/* turbine hall with sawtooth roof */}
      <g stroke={ink(0.5)} strokeWidth="1.25">
        <path d="M246,470 L246,414 L287,444 L287,414 L328,444 L328,414 L368,444 L368,470 Z" />
      </g>
      <g stroke={ink(0.2)} strokeWidth="1">
        <line x1="246" y1="452" x2="368" y2="452" />
        <line x1="246" y1="460" x2="368" y2="460" />
        <rect x="292" y="430" width="22" height="40" />
      </g>

      {/* storage silos */}
      <g stroke={ink(0.5)} strokeWidth="1.25">
        <path d="M390,470 L390,328 A28,9 0 0 1 446,328 L446,470" />
        <path d="M456,470 L456,362 A22,7 0 0 1 500,362 L500,470" />
      </g>
      <g stroke={ink(0.28)} strokeWidth="1">
        <line x1="390" y1="380" x2="446" y2="380" />
        <line x1="390" y1="416" x2="446" y2="416" />
        <line x1="456" y1="402" x2="500" y2="402" />
      </g>

      {/* conveyor gantry up to the silos */}
      <g stroke={ink(0.3)} strokeWidth="1">
        {lattice}
      </g>
      <g stroke={ink(0.38)} strokeWidth="1">
        <line x1="200" y1="290" x2="418" y2="318" />
        <line x1="200" y1="304" x2="418" y2="332" />
        <line x1="262" y1="298.6" x2="262" y2="470" />
        <line x1="322" y1="306.3" x2="322" y2="470" />
        <line x1="372" y1="312.7" x2="372" y2="470" />
      </g>

      {/* ground baseline and hatch */}
      <g stroke={ink(0.28)} strokeWidth="1">{hatch}</g>
      <line x1="20" y1="470" x2="500" y2="470" stroke={ink(0.55)} strokeWidth="1.5" />

      {/* dimensions */}
      <g stroke={ink(0.25)} strokeWidth="1">
        <line x1="60" y1="474" x2="60" y2="502" />
        <line x1="200" y1="474" x2="200" y2="502" />
      </g>
      <g stroke={ink(0.4)} strokeWidth="1">
        <line x1="66" y1="496" x2="194" y2="496" />
        <path d="M60,496 l7,-3 v6 z" fill={ink(0.4)} stroke="none" />
        <path d="M200,496 l-7,-3 v6 z" fill={ink(0.4)} stroke="none" />
      </g>
      <text x="130" y="490" textAnchor="middle" fontSize="7" fill={ink(0.5)} style={label}>
        42.0 m
      </text>
      <g stroke={ink(0.25)} strokeWidth="1">
        <line x1="504" y1="362" x2="516" y2="362" />
        <line x1="504" y1="470" x2="516" y2="470" />
      </g>
      <g stroke={ink(0.4)} strokeWidth="1">
        <line x1="510" y1="368" x2="510" y2="464" />
        <path d="M510,362 l-3,7 h6 z" fill={ink(0.4)} stroke="none" />
        <path d="M510,470 l-3,-7 h6 z" fill={ink(0.4)} stroke="none" />
      </g>
      <text
        x="510"
        y="416"
        textAnchor="middle"
        fontSize="7"
        fill={ink(0.5)}
        style={label}
        transform="rotate(-90 510 416)"
      >
        12.6 m
      </text>

      {/* flue leader note */}
      <g stroke={ink(0.3)} strokeWidth="1">
        <path d="M216,196 L248,168 L264,168" fill="none" />
      </g>
      <text x="268" y="170" fontSize="6.5" fill={ink(0.45)} style={label}>
        FLUE · 62 m
      </text>

      {/* plate label along the left edge */}
      <text
        x="36"
        y="300"
        textAnchor="middle"
        fontSize="7"
        fill={ink(0.4)}
        style={{ ...label, letterSpacing: "0.22em" }}
        transform="rotate(-90 36 300)"
      >
        Elevation A-A · Scale 1:500
      </text>

      {/* title block */}
      <g stroke={ink(0.35)} strokeWidth="1">
        <rect x="316" y="512" width="184" height="36" />
        <line x1="316" y1="530" x2="500" y2="530" stroke={ink(0.22)} />
      </g>
      <text x="328" y="526" fontSize="8" fill={ink(0.5)} style={label}>
        IBL Engineering Works
      </text>
      <text x="328" y="542" fontSize="6.5" fill={ink(0.4)} style={label}>
        Plate 02 · Mills &amp; Energy
      </text>
    </svg>
  );
}

/* The Retail plate: the high street itself, drawn the way a shopfitter's
   office would draw it — three storefronts of the cluster's own brands under
   one measured frontage, awnings, display shelves, a drafting scale figure.
   Ink on the teal flood, the street-level sibling of the Industrials plate. */
function RetailPlate() {
  const { ref, cls } = usePlateDraw<SVGSVGElement>();
  const ink = (a: number) => `rgba(10,14,35,${a})`;
  const label = {
    fontFamily: "var(--font-sans)",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  } as const;

  /* scalloped valance under the Winner's canopy: eight 26.5px bumps */
  const valance = `M84,176 ${"q13.25,13 26.5,0 ".repeat(8).trim()}`;
  /* ground hatch below the pavement line */
  const hatch: ReactNode[] = [];
  for (let x = 44; x <= 600; x += 13) {
    hatch.push(<line key={x} x1={x} y1={326} x2={x - 9} y2={336} />);
  }
  /* canopy seams */
  const seams = [126, 168, 210, 252];
  /* display goods on the shelves of the flagship window */
  const goods = [
    [106, 242, 9, 10], [130, 240, 11, 12], [158, 243, 8, 9], [184, 241, 10, 11], [212, 242, 9, 10],
    [106, 276, 9, 10], [134, 274, 11, 12], [162, 277, 8, 9], [190, 275, 10, 11], [216, 276, 9, 10],
  ];

  return (
    <svg
      ref={ref}
      viewBox="0 0 640 400"
      fill="none"
      aria-hidden="true"
      className={`w-full ${cls}`}
    >
      {/* registration crosshair */}
      <g stroke={ink(0.34)} strokeWidth="1">
        <circle cx="52" cy="52" r="9" />
        <line x1="52" y1="34" x2="52" y2="70" />
        <line x1="34" y1="52" x2="70" y2="52" />
      </g>

      {/* frontage dimension across the parade */}
      <g stroke={ink(0.25)} strokeWidth="1">
        <line x1="76" y1="114" x2="76" y2="78" />
        <line x1="612" y1="152" x2="612" y2="78" />
      </g>
      <g stroke={ink(0.4)} strokeWidth="1">
        <line x1="83" y1="84" x2="605" y2="84" />
        <path d="M76,84 l7,-3 v6 z" fill={ink(0.4)} stroke="none" />
        <path d="M612,84 l-7,-3 v6 z" fill={ink(0.4)} stroke="none" />
      </g>
      <text x="344" y="78" textAnchor="middle" fontSize="8" fill={ink(0.5)} style={label}>
        Frontage · 128 m
      </text>

      {/* ---- Bay 01 · the Winner's flagship ---- */}
      <line x1="76" y1="114" x2="304" y2="114" stroke={ink(0.3)} />
      <rect x="76" y="118" width="228" height="36" stroke={ink(0.5)} strokeWidth="1.25" />
      <text x="190" y="142" textAnchor="middle" fontSize="12" fill={ink(0.62)} style={label} letterSpacing="0.34em">
        Winner&apos;s
      </text>
      <g stroke={ink(0.4)} strokeWidth="1">
        <rect x="108" y="133" width="4" height="4" />
        <rect x="268" y="133" width="4" height="4" />
      </g>
      {/* the canopy: band, seams, scalloped valance */}
      <line x1="84" y1="158" x2="296" y2="158" stroke={ink(0.5)} />
      <g stroke={ink(0.22)} strokeWidth="1">
        {seams.map((x) => (
          <line key={x} x1={x} y1="158" x2={x} y2="176" />
        ))}
      </g>
      <path d={valance} stroke={ink(0.4)} strokeWidth="1" />
      {/* glazed front with mullions, display shelves and goods */}
      <rect x="92" y="196" width="156" height="126" stroke={ink(0.5)} strokeWidth="1.25" />
      <g stroke={ink(0.3)} strokeWidth="1">
        <line x1="144" y1="196" x2="144" y2="322" />
        <line x1="196" y1="196" x2="196" y2="322" />
      </g>
      <g data-ink="late">
        <g stroke={ink(0.22)} strokeWidth="1">
          <line x1="100" y1="252" x2="240" y2="252" />
          <line x1="100" y1="286" x2="240" y2="286" />
        </g>
        <g stroke={ink(0.3)} strokeWidth="1">
          {goods.map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} />
          ))}
        </g>
      </g>
      {/* entrance: double doors, transom, pull handles */}
      <rect x="256" y="210" width="40" height="112" stroke={ink(0.5)} strokeWidth="1.25" />
      <g stroke={ink(0.3)} strokeWidth="1">
        <line x1="276" y1="216" x2="276" y2="318" />
        <line x1="256" y1="228" x2="296" y2="228" />
      </g>
      <g stroke={ink(0.45)} strokeWidth="1.25">
        <line x1="270" y1="266" x2="270" y2="276" />
        <line x1="282" y1="266" x2="282" y2="276" />
      </g>

      {/* pier between bays */}
      <rect x="300" y="112" width="36" height="6" stroke={ink(0.3)} />
      <rect x="304" y="118" width="28" height="204" stroke={ink(0.5)} strokeWidth="1.25" />

      {/* ---- Bay 02 · Naivas, bracket sign and roller box ---- */}
      <line x1="332" y1="136" x2="464" y2="136" stroke={ink(0.3)} />
      <rect x="332" y="140" width="132" height="30" stroke={ink(0.5)} strokeWidth="1.25" />
      <text x="398" y="159" textAnchor="middle" fontSize="9" fill={ink(0.55)} style={label} letterSpacing="0.3em">
        Naivas
      </text>
      <rect x="340" y="172" width="116" height="7" stroke={ink(0.35)} />
      {/* projecting bracket sign, chains and etched diamond */}
      <g data-ink="late">
        <g stroke={ink(0.4)} strokeWidth="1">
          <line x1="332" y1="192" x2="376" y2="192" />
          <line x1="352" y1="192" x2="352" y2="200" />
          <line x1="368" y1="192" x2="368" y2="200" />
        </g>
        <line x1="332" y1="206" x2="360" y2="192" stroke={ink(0.3)} />
        <rect x="344" y="200" width="32" height="24" stroke={ink(0.5)} strokeWidth="1.25" />
        <path d="M360,205.5 L366,212 L360,218.5 L354,212 Z" stroke={ink(0.45)} />
      </g>
      <rect x="344" y="214" width="80" height="108" stroke={ink(0.5)} strokeWidth="1.25" />
      <line x1="384" y1="214" x2="384" y2="322" stroke={ink(0.3)} />
      <rect x="432" y="214" width="24" height="108" stroke={ink(0.5)} strokeWidth="1.25" />
      <line x1="451" y1="266" x2="451" y2="276" stroke={ink(0.45)} strokeWidth="1.25" />

      {/* pier between bays */}
      <rect x="460" y="132" width="36" height="6" stroke={ink(0.3)} />
      <rect x="464" y="138" width="28" height="184" stroke={ink(0.5)} strokeWidth="1.25" />

      {/* ---- Bay 03 · Run Market, the arched corner shop ---- */}
      <line x1="492" y1="148" x2="612" y2="148" stroke={ink(0.3)} />
      <rect x="492" y="152" width="120" height="26" stroke={ink(0.5)} strokeWidth="1.25" />
      <text x="552" y="168" textAnchor="middle" fontSize="8" fill={ink(0.55)} style={label} letterSpacing="0.24em">
        Run Market
      </text>
      <path d="M504,322 V244 A38,38 0 0 1 580,244 V322" stroke={ink(0.5)} strokeWidth="1.25" />
      <g stroke={ink(0.3)} strokeWidth="1">
        <line x1="542" y1="210" x2="542" y2="318" />
        <line x1="504" y1="252" x2="580" y2="252" />
      </g>

      {/* street furniture: drafting figure, trolley, lamp (late beat) */}
      <g data-ink="late">
        <g stroke={ink(0.45)} strokeWidth="1.1">
          <circle cx="60" cy="248" r="4.5" />
          <path d="M60,252.5 L60,288" />
          <path d="M60,259 L52,272 M60,259 L68,271" />
          <path d="M60,288 L53,318 M60,288 L67,318" />
        </g>
        <g stroke={ink(0.4)} strokeWidth="1">
          <path d="M44,280 L49,308 L69,308 L74,280 Z" />
          <line x1="46" y1="290" x2="72" y2="290" stroke={ink(0.25)} />
          <path d="M74,280 L80,272" />
          <circle cx="53" cy="313" r="2.5" />
          <circle cx="65" cy="313" r="2.5" />
        </g>
        <g stroke={ink(0.45)} strokeWidth="1">
          <line x1="620" y1="306" x2="620" y2="178" />
          <path d="M620,184 Q620,168 602,168" />
          <circle cx="598" cy="168" r="4.5" stroke={ink(0.5)} />
          <rect x="612" y="300" width="16" height="22" stroke={ink(0.4)} />
        </g>
      </g>

      {/* pavement: baseline and hatch */}
      <g stroke={ink(0.28)} strokeWidth="1">{hatch}</g>
      <line x1="36" y1="322" x2="616" y2="322" stroke={ink(0.55)} strokeWidth="1.5" />

      {/* shopfront height dimension, left edge */}
      <g stroke={ink(0.25)} strokeWidth="1">
        <line x1="50" y1="118" x2="72" y2="118" />
        <line x1="50" y1="322" x2="72" y2="322" />
      </g>
      <g stroke={ink(0.4)} strokeWidth="1">
        <line x1="54" y1="124" x2="54" y2="316" />
        <path d="M54,118 l-3,7 h6 z" fill={ink(0.4)} stroke="none" />
        <path d="M54,322 l-3,-7 h6 z" fill={ink(0.4)} stroke="none" />
      </g>
      <text
        x="48"
        y="220"
        textAnchor="middle"
        fontSize="7.5"
        fill={ink(0.45)}
        style={label}
        transform="rotate(-90 48 220)"
      >
        7.4 m
      </text>

      {/* canopy leader note */}
      <path d="M296,166 L322,132 L390,132" stroke={ink(0.3)} />
      <text x="394" y="134" fontSize="7" fill={ink(0.5)} style={label}>
        Canopy · 3.4 m
      </text>

      {/* plate label along the left edge */}
      <text
        x="22"
        y="230"
        textAnchor="middle"
        fontSize="7.5"
        fill={ink(0.45)}
        style={{ ...label, letterSpacing: "0.22em" }}
        transform="rotate(-90 22 230)"
      >
        Elevation B-B · Scale 1:250
      </text>

      {/* title block */}
      <g stroke={ink(0.35)} strokeWidth="1">
        <rect x="396" y="342" width="216" height="40" />
        <line x1="396" y1="362" x2="612" y2="362" stroke={ink(0.22)} />
      </g>
      <text x="408" y="358" fontSize="8.5" fill={ink(0.55)} style={label}>
        IBL Retail Works
      </text>
      <text x="408" y="374" fontSize="7" fill={ink(0.45)} style={label}>
        Plate 01 · The high street
      </text>
    </svg>
  );
}

/* The Brands plate: the distribution yard in plan — berth, container field,
   cross-dock, and the routes that carry four hundred brands out to the shops.
   Ink on the green flood; the plan-view sibling of the two elevations. */
function DistributionPlate() {
  const { ref, cls } = usePlateDraw<SVGSVGElement>();
  /* the green flood sits closer to navy in luminance than the orange and teal
     floods, so the ink presses a stop harder here to keep the same read */
  const ink = (a: number) => `rgba(10,14,35,${Math.min(1, a + 0.14)})`;
  /* stamped labels: the sheet's linework stays engraved, but its lettering
     is pressed type, dark enough to reward a closer look */
  const stamp = (a: number) => `rgba(10,14,35,${Math.min(1, a + 0.42)})`;
  const label = {
    fontFamily: "var(--font-sans)",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  } as const;

  /* container stacks: 4 columns × 3 rows, each stack two twenty-footers */
  const stacks: ReactNode[] = [];
  for (const y of [178, 210, 242]) {
    for (const x of [64, 126, 188, 250]) {
      stacks.push(
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="46" height="14" />
          <line x1={x + 23} y1={y} x2={x + 23} y2={y + 14} stroke={ink(0.25)} />
        </g>
      );
    }
  }
  /* deck containers on the berthed ship, two bays deep */
  const deck: ReactNode[] = [];
  for (const y of [322, 333]) {
    for (let k = 0; k < 7; k++) {
      deck.push(<rect key={`${y}-${k}`} x={72 + k * 24} y={y} width="20" height="8" />);
    }
  }
  /* harbor water, three drift lines */
  const wave = (y: number, x0: number) =>
    `M${x0},${y} q10,-4 20,0 ${"t20,0 ".repeat(9).trim()}`;

  return (
    <svg
      ref={ref}
      viewBox="0 0 560 420"
      fill="none"
      aria-hidden="true"
      className={`w-full ${cls}`}
    >
      {/* registration crosshair */}
      <g stroke={ink(0.34)} strokeWidth="1">
        <circle cx="52" cy="52" r="9" />
        <line x1="52" y1="34" x2="52" y2="70" />
        <line x1="34" y1="52" x2="70" y2="52" />
      </g>

      {/* north arrow */}
      <g stroke={ink(0.4)} strokeWidth="1">
        <circle cx="520" cy="52" r="15" />
        <line x1="520" y1="64" x2="520" y2="42" stroke={ink(0.45)} />
      </g>
      <path d="M520,38 l-4,9 h8 z" fill={ink(0.5)} />
      <text x="520" y="32" textAnchor="middle" fontSize="8" fill={stamp(0.5)} style={label}>
        N
      </text>

      {/* cold room with insulation hatch */}
      <rect x="64" y="140" width="92" height="26" stroke={ink(0.5)} strokeWidth="1.25" />
      <g stroke={ink(0.25)} strokeWidth="1">
        <line x1="72" y1="166" x2="90" y2="140" />
        <line x1="90" y1="166" x2="108" y2="140" />
        <line x1="108" y1="166" x2="126" y2="140" />
        <line x1="126" y1="166" x2="144" y2="140" />
      </g>
      <path d="M110,140 L136,108 L176,108" stroke={ink(0.3)} />
      <text x="180" y="110" fontSize="7.5" fill={stamp(0.45)} style={label}>
        Cold room · −22 °C
      </text>

      {/* the stack field and its lanes */}
      <g stroke={ink(0.5)} strokeWidth="1.25">{stacks}</g>
      <g stroke={ink(0.22)} strokeWidth="1" strokeDasharray="5 5">
        <line x1="56" y1="201" x2="310" y2="201" />
        <line x1="56" y1="233" x2="310" y2="233" />
      </g>
      <path d="M234,214 L258,132 L268,132" stroke={ink(0.3)} />
      <text x="272" y="134" fontSize="7.5" fill={stamp(0.45)} style={label}>
        Stack 06 · 4 high
      </text>

      {/* cross-dock with dock doors on the south wall */}
      <rect x="336" y="196" width="168" height="104" stroke={ink(0.5)} strokeWidth="1.25" />
      <text x="420" y="242" textAnchor="middle" fontSize="9" fill={stamp(0.55)} style={label} letterSpacing="0.2em">
        Cross-dock
      </text>
      <text x="420" y="256" textAnchor="middle" fontSize="7" fill={stamp(0.4)} style={label}>
        40 docks
      </text>
      <g data-ink="late" stroke={ink(0.4)} strokeWidth="1">
        {[344, 362, 380, 398, 416, 434, 452, 470].map((x) => (
          <rect key={x} x={x} y="300" width="8" height="4" />
        ))}
      </g>

      {/* a truck at the apron (late beat) */}
      <g data-ink="late" stroke={ink(0.4)} strokeWidth="1">
        <rect x="348" y="306" width="30" height="9" />
        <rect x="382" y="308" width="11" height="7" />
        <circle cx="356" cy="316" r="2" />
        <circle cx="370" cy="316" r="2" />
        <circle cx="388" cy="316" r="2" />
      </g>

      {/* the quay: edge, gantry rails, crane portal and boom */}
      <line x1="36" y1="318" x2="524" y2="318" stroke={ink(0.55)} strokeWidth="1.5" />
      <g stroke={ink(0.3)} strokeWidth="1" strokeDasharray="4 4">
        <line x1="56" y1="302" x2="260" y2="302" />
        <line x1="56" y1="314" x2="260" y2="314" />
      </g>
      <rect x="150" y="300" width="44" height="15" stroke={ink(0.5)} strokeWidth="1.25" />
      <line x1="172" y1="318" x2="172" y2="340" stroke={ink(0.35)} strokeDasharray="4 4" />

      {/* the berthed ship, her cargo and the harbor water */}
      <path d="M64,318 L246,318 L262,331 L246,344 L64,344 Z" stroke={ink(0.5)} strokeWidth="1.25" />
      <g stroke={ink(0.35)} strokeWidth="1">{deck}</g>
      <g data-ink="late" stroke={ink(0.22)} strokeWidth="1">
        <path d={wave(354, 40)} />
        <path d={wave(368, 48)} />
        <path d={wave(382, 40)} />
      </g>
      <text
        x="270"
        y="337"
        fontSize="7"
        fill={stamp(0.45)}
        style={label}
      >
        Corail Cardinal · 182 m
      </text>

      {/* route one: hold to cross-dock */}
      <path
        d="M200,322 C200,286 250,282 300,260 C316,254 324,250 336,250"
        stroke={ink(0.4)}
        strokeWidth="1.2"
        strokeDasharray="6 4"
      />
      <path d="M336,245.5 L345,250 L336,254.5 Z" fill={ink(0.4)} />

      {/* route two: the north road out to the shops */}
      <g stroke={ink(0.3)} strokeWidth="1">
        <line x1="408" y1="196" x2="408" y2="58" />
        <line x1="436" y1="196" x2="436" y2="58" />
      </g>
      <line x1="422" y1="190" x2="422" y2="64" stroke={ink(0.22)} strokeDasharray="5 5" />
      <path d="M418,64 L422,54 L426,64 Z" fill={ink(0.4)} />
      <text
        x="447"
        y="127"
        textAnchor="middle"
        fontSize="7.5"
        fill={stamp(0.45)}
        style={label}
        transform="rotate(-90 447 127)"
      >
        To 130+ stores
      </text>

      {/* the shops that receive the brands (late beat) */}
      <g data-ink="late">
        <g stroke={ink(0.5)} strokeWidth="1.25">
          <rect x="470" y="92" width="22" height="16" />
          <rect x="500" y="92" width="22" height="16" />
          <rect x="530" y="92" width="22" height="16" />
        </g>
        <g stroke={ink(0.35)} strokeWidth="1">
          <line x1="481" y1="108" x2="481" y2="114" />
          <line x1="511" y1="108" x2="511" y2="114" />
          <line x1="541" y1="108" x2="541" y2="114" />
        </g>
        <path d="M436,102 C448,100 456,101 464,102" stroke={ink(0.35)} strokeDasharray="3 3" />
        <path d="M464,98.5 L472,102 L464,105.5 Z" fill={ink(0.35)} />
        <text x="511" y="132" textAnchor="middle" fontSize="7" fill={stamp(0.45)} style={label}>
          Shops · 5 countries
        </text>
      </g>

      {/* scale bar */}
      <g>
        <rect x="40" y="384" width="32" height="5" fill={ink(0.4)} />
        <rect x="72" y="384" width="32" height="5" stroke={ink(0.4)} />
        <rect x="104" y="384" width="32" height="5" fill={ink(0.4)} />
      </g>
      <g fontSize="6.5" fill={stamp(0.4)} style={label} textAnchor="middle">
        <text x="40" y="380">0</text>
        <text x="72" y="380">10</text>
        <text x="104" y="380">20</text>
        <text x="136" y="380">30</text>
      </g>
      <text x="40" y="400" fontSize="7" fill={stamp(0.4)} style={label}>
        Scale 1:2000 · metres
      </text>

      {/* title block */}
      <g stroke={ink(0.35)} strokeWidth="1">
        <rect x="336" y="344" width="188" height="38" />
        <line x1="336" y1="364" x2="524" y2="364" stroke={ink(0.22)} />
      </g>
      <text x="346" y="360" fontSize="9" fill={stamp(0.55)} style={label}>
        IBL Distribution Works
      </text>
      <text x="346" y="376" fontSize="7.5" fill={stamp(0.45)} style={label}>
        Plate 03 · Yard &amp; routes
      </text>
    </svg>
  );
}

function ConstellationMotif({ tone }: { tone: Tone }) {
  const dots = [
    { x: 60, y: 90, r: 6, color: "#4BBDC8" },
    { x: 150, y: 50, r: 5, color: "#FFF7FA" },
    { x: 240, y: 110, r: 7, color: "#2FA96E" },
    { x: 320, y: 70, r: 5, color: "#EE6C2B" },
    { x: 90, y: 200, r: 5, color: "#EE6C2B" },
    { x: 200, y: 190, r: 8, color: "#D63384" },
    { x: 300, y: 230, r: 6, color: "#4BBDC8" },
    { x: 140, y: 300, r: 5, color: "#2FA96E" },
    { x: 260, y: 320, r: 6, color: "#FFF7FA" },
    { x: 350, y: 150, r: 4, color: "#D63384" },
  ];
  const links: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 2], [5, 6], [6, 8], [4, 7], [7, 8], [3, 9], [9, 6],
  ];
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden="true">
      <g stroke={`${tone.fg}4D`} strokeWidth="1">
        {links.map(([a, b], i) => (
          <line key={i} x1={dots[a].x} y1={dots[a].y} x2={dots[b].x} y2={dots[b].y} />
        ))}
      </g>
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r={d.r * 2.4} fill={d.color} opacity="0.18" />
          <circle cx={d.x} cy={d.y} r={d.r} fill={d.color} opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

function BrandMarquee({ items, tone }: { items: string[]; tone: Tone }) {
  const half = [...items, ...items, ...items];
  return (
    <div className="marquee-track" aria-hidden="true">
      {[0, 1].map((halfIdx) => (
        <div key={halfIdx} className="flex items-center gap-10 pr-10">
          {half.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="whitespace-nowrap text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
              /* ghost outline, pressed hard enough to stay present on the
                 flood colour at phone sizes, where a whisper would vanish */
              style={{ WebkitTextStroke: `1.7px ${tone.fg}80`, color: "transparent" }}
            >
              {item}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- the floods ---------- */

export function ClusterFloods() {
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

  const retail = CLUSTER_MAP[JOURNEY[0]];
  const industrials = CLUSTER_MAP[JOURNEY[1]];
  const cbd = CLUSTER_MAP[JOURNEY[2]];
  const services = CLUSTER_MAP[JOURNEY[3]];

  return (
    <section id="clusters" className="relative">
      {/* intro header */}
      <div className="mx-auto w-full max-w-7xl px-5 pb-14 pt-24 sm:px-8 md:pt-32 md:pb-20 lg:px-12">
        <p className="eyebrow">The color journey</p>
        <h2 className="h-display h-section mt-4">
          <T k="clusters.title" />
        </h2>
        <p className="caption mt-6 max-w-md">
          Four clusters, four floods of color. Retail, Industrials, Brands, Services. Keep
          scrolling and let the palette do the talking.
        </p>
      </div>

      {/* 01 Retail, teal flood */}
      <section
        aria-label="Retail cluster, first of the color journey"
        className="seam-both relative min-h-svh overflow-x-clip px-6 pb-[15svh] pt-[15svh] sm:px-10 lg:px-24"
        style={{ backgroundColor: retail.color, color: "#0A0E23" }}
      >
        <Parallax
          amount={14}
          className="pointer-events-none absolute inset-y-0 left-1 flex items-center sm:left-3"
        >
          <span
            aria-hidden="true"
            className="select-none font-semibold leading-[0.83] tracking-[-0.05em]"
            style={{
              writingMode: "vertical-rl",
              fontSize: "clamp(4.5rem, 13vw, 12rem)",
              WebkitTextStroke: "1.5px rgba(10,14,35,0.35)",
              color: "transparent",
            }}
          >
            RETAIL
          </span>
        </Parallax>
        <Parallax
          amount={8}
          className="pointer-events-none absolute -right-4 top-[6svh] sm:right-8"
        >
          <span
            aria-hidden="true"
            className="select-none font-semibold leading-none"
            style={{
              fontSize: "clamp(8rem, 26vw, 24rem)",
              WebkitTextStroke: "1.5px rgba(10,14,35,0.13)",
              color: "transparent",
            }}
          >
            1830
          </span>
        </Parallax>

        {/* Plate 01: the high street, inked onto the teal below the founding
            year, behind the words like the Industrials plate on its flood */}
        <Parallax
          amount={9}
          className="pointer-events-none absolute right-[2%] top-[42svh] w-[46%] max-w-[600px]"
        >
          <RetailPlate />
        </Parallax>

        <div className="relative z-10 ml-[18vw] max-w-2xl sm:ml-[15vw] lg:ml-[13vw]">
          <Assemble dir="w" reduce={reduce}>
            <p className="eyebrow" style={{ color: "rgba(10,14,35,0.7)" }}>
              01 / Retail cluster
            </p>
          </Assemble>
          <Assemble dir="n" delay={0.08} reduce={reduce}>
            <h3 className="h-display h-section mt-5">{retail.tagline}</h3>
          </Assemble>
          <Assemble dir="s" delay={0.16} reduce={reduce}>
            <p
              className="mt-6 max-w-md text-base leading-relaxed sm:text-lg"
              style={{ color: "rgba(10,14,35,0.78)" }}
            >
              {retail.description}
            </p>
          </Assemble>
          <Assemble dir="s" delay={0.24} reduce={reduce} className="mt-10">
            <StatRow stats={retail.keyStats} tone={toneFor("retail")} />
          </Assemble>
          <Assemble dir="e" delay={0.32} reduce={reduce} className="mt-8">
            <ChipRow items={retail.keyCompanies} tone={toneFor("retail")} />
          </Assemble>
          <Assemble dir="e" delay={0.4} reduce={reduce}>
            <FoundingNote note={retail.foundedNote ?? ""} tone={toneFor("retail")} />
          </Assemble>
        </div>

        <div className="absolute bottom-[10svh] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
          <p className="caption" style={{ color: "rgba(10,14,35,0.7)" }}>
            Scroll to continue the journey
          </p>
          <motion.span
            animate={reduce ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="size-5" style={{ color: "#0A0E23" }} aria-hidden="true" />
          </motion.span>
        </div>
      </section>

      {/* 02 Industrials, orange flood */}
      <section
        aria-label="Industrials cluster, second of the color journey"
        className="seam-t relative -mt-[12svh] min-h-svh overflow-x-clip px-6 pb-[13svh] pt-[16svh] sm:px-10 lg:px-24"
        style={{ backgroundColor: industrials.color, color: "#0A0E23" }}
      >
        <Parallax
          amount={10}
          className="pointer-events-none absolute -right-[8%] top-[10svh] w-[62%] max-w-[720px]"
        >
          <IndustrialsPlate />
        </Parallax>

        <div className="relative z-10 max-w-2xl">
          <Assemble dir="w" reduce={reduce}>
            <p className="eyebrow" style={{ color: "rgba(10,14,35,0.7)" }}>
              02 / Industrials cluster
            </p>
          </Assemble>
          <Assemble dir="n" delay={0.06} reduce={reduce}>
            <p
              className="mt-6 text-[11px] uppercase tracking-[0.22em]"
              style={{ color: "rgba(10,14,35,0.7)" }}
            >
              Cluster revenue, FY
            </p>
            <StatValue
              value={industrials.revenue}
              className="h-display tabular mt-2 block text-6xl font-semibold tracking-tight md:text-7xl"
            />
          </Assemble>
          <Assemble dir="n" delay={0.12} reduce={reduce}>
            <h3 className="h-display h-section mt-8 max-w-xl">{industrials.tagline}</h3>
          </Assemble>
          <Assemble dir="s" delay={0.2} reduce={reduce}>
            <p
              className="mt-6 max-w-md text-base leading-relaxed sm:text-lg"
              style={{ color: "rgba(10,14,35,0.78)" }}
            >
              {industrials.description}
            </p>
          </Assemble>
          <Assemble dir="s" delay={0.28} reduce={reduce} className="mt-10">
            <StatRow
              stats={[
                ...industrials.keyStats.filter((st) => st.label !== "Revenue"),
                { label: industrials.teamLabel, value: industrials.team.toLocaleString("en-US") },
              ]}
              tone={toneFor("industrials")}
            />
          </Assemble>
          <Assemble dir="e" delay={0.36} reduce={reduce} className="mt-8">
            <ChipRow items={industrials.keyCompanies} tone={toneFor("industrials")} />
          </Assemble>
          <Assemble dir="e" delay={0.44} reduce={reduce}>
            <FoundingNote note={industrials.foundedNote ?? ""} tone={toneFor("industrials")} />
          </Assemble>
        </div>
      </section>

      {/* 03 Consumer Brands & Distribution, green flood */}
      <section
        aria-label="Consumer Brands and Distribution cluster, third of the color journey"
        className="seam-both relative -mt-[12svh] flex min-h-svh flex-col overflow-x-clip px-6 pb-[15svh] pt-[16svh] sm:px-10"
        style={{ backgroundColor: cbd.color, color: "#0A0E23" }}
      >
        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 py-[4svh] lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="max-w-xl">
            <Assemble dir="w" reduce={reduce}>
              <p className="eyebrow" style={{ color: "rgba(10,14,35,0.7)" }}>
                03 / Consumer Brands &amp; Distribution cluster
              </p>
            </Assemble>
            <Assemble dir="n" delay={0.08} reduce={reduce}>
              <h3 className="font-display mt-7 text-4xl italic leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                {cbd.tagline}
              </h3>
            </Assemble>
            <Assemble dir="s" delay={0.16} reduce={reduce}>
              <p
                className="mt-7 max-w-xl text-base leading-relaxed sm:text-lg"
                style={{ color: "rgba(10,14,35,0.78)" }}
              >
                {cbd.description}
              </p>
            </Assemble>
            <Assemble dir="s" delay={0.24} reduce={reduce} className="mt-10">
              <StatRow stats={cbd.keyStats} tone={toneFor("cbd")} />
            </Assemble>
            <Assemble dir="e" delay={0.32} reduce={reduce} className="mt-8">
              <ChipRow items={cbd.keyCompanies} tone={toneFor("cbd")} />
            </Assemble>
            <Assemble dir="e" delay={0.4} reduce={reduce}>
              <FoundingNote note={cbd.foundedNote ?? ""} tone={toneFor("cbd")} />
            </Assemble>
          </div>

          {/* Plate 03: the yard and its routes, inked onto the green. On
              desktop it leans into the column gap (the text column keeps its
              own air), so the plan reads larger without crowding the words */}
          <div className="flex items-center justify-center lg:justify-end">
            <Parallax amount={10} className="w-full max-w-[300px] shrink-0 sm:max-w-[440px] lg:w-[calc(100%_+_3rem)] lg:max-w-none">
              <DistributionPlate />
            </Parallax>
          </div>
        </div>

        {/* the brand ticker rides in the flow, below the words, clear of
            the seam by the panel's own padding */}
        <div className="relative z-10 mt-[7svh] overflow-hidden" aria-hidden="true">
          <BrandMarquee
            items={[...cbd.keyCompanies, "400+ brands"]}
            tone={toneFor("cbd")}
          />
        </div>
      </section>

      {/* 04 Services, magenta flood */}
      <section
        aria-label="Services cluster, fourth of the color journey"
        className="seam-t relative -mt-[12svh] min-h-svh overflow-x-clip px-6 pb-[13svh] pt-[16svh] sm:px-10 lg:px-24"
        style={{ backgroundColor: services.color, color: "#FFF7FA" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[54%] top-1/2 hidden h-[150%] w-px -translate-y-1/2 rotate-[14deg] lg:block"
          style={{ background: "rgba(255,247,250,0.28)" }}
        />

        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-xl">
            <Assemble dir="w" reduce={reduce}>
              <p className="eyebrow" style={{ color: "rgba(255,247,250,0.75)" }}>
                04 / Services cluster
              </p>
            </Assemble>
            <Assemble dir="n" delay={0.08} reduce={reduce}>
              <h3 className="h-display h-section mt-5">{services.tagline}</h3>
            </Assemble>
            <Assemble dir="s" delay={0.16} reduce={reduce}>
              <p
                className="mt-6 max-w-md text-base leading-relaxed sm:text-lg"
                style={{ color: "rgba(255,247,250,0.82)" }}
              >
                {services.description}
              </p>
            </Assemble>
            <Assemble dir="s" delay={0.24} reduce={reduce} className="mt-10">
              <StatRow stats={services.keyStats} tone={toneFor("services")} />
            </Assemble>
            <Assemble dir="e" delay={0.32} reduce={reduce} className="mt-8">
              <ChipRow items={services.keyCompanies} tone={toneFor("services")} />
            </Assemble>
            <Assemble dir="e" delay={0.4} reduce={reduce}>
              <FoundingNote note={services.foundedNote ?? ""} tone={toneFor("services")} />
            </Assemble>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Parallax amount={10} className="relative">
              <motion.div
                animate={reduce ? undefined : { rotate: 360 }}
                transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
                className="relative size-64 overflow-hidden rounded-full border sm:size-80 lg:size-[24rem]"
                style={{
                  borderColor: "rgba(255,247,250,0.32)",
                  background:
                    "radial-gradient(circle at 35% 30%, rgba(255,247,250,0.10), rgba(10,14,35,0.14) 75%)",
                }}
              >
                <ConstellationMotif tone={toneFor("services")} />
              </motion.div>
            </Parallax>
          </div>
        </div>
      </section>
    </section>
  );
}
