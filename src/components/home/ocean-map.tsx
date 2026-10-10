"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CLUSTERS, CLUSTER_MAP, EASE, GROUP, type ClusterId } from "@/lib/brand";
import { COUNTRIES, type CountryPin } from "@/lib/data/countries";
import {
  GRATICULE,
  GRAT_LABELS,
  ISLE_PATHS,
  LABELS,
  LAND_PATHS,
  PIN,
  ROUTES,
  ROUTE_DUR,
} from "@/lib/data/coastline";
import { useApp } from "@/store/app-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { T } from "./t";

const LUXE: [number, number, number, number] = [...EASE.luxe] as [number, number, number, number];

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

/* ---------- grade awareness ---------- */

type Grade = "light" | "abyss" | "sepia";

/** Follows the live data-theme so the ocean regrades itself without a reload. */
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

/* ---------- cartography, one per grade ----------
   The abyss keeps its luminous night ocean. Paper gets a printed chart in
   the group's own corporate identity: a pale teal sea, landmasses washed in
   brand ink navy, deep teal trade lanes, so nothing on the sheet is brown.
   Parchment keeps the archive atlas of the same idea, at home in that grade.
   Coastlines, islands, graticule and great-circle lanes are baked in
   src/lib/data/coastline.ts from real geography. */

const CARTO = {
  abyss: {
    ocean: "var(--background)",
    texture:
      "radial-gradient(ellipse 65% 50% at 60% 42%, rgba(75,189,200,0.08), transparent 70%), radial-gradient(rgba(75,189,200,0.06) 1px, transparent 1.4px)",
    graticule: "rgba(75,189,200,0.09)",
    land: "rgba(30,39,86,0.9)",
    landStroke: "rgba(75,189,200,0.25)",
    isle: "rgba(34,44,94,0.92)",
    isleStroke: "rgba(75,189,200,0.35)",
    route: "rgba(75,189,200,0.32)",
    port: "rgba(34,44,94,0.92)",
    portStroke: "rgba(75,189,200,0.35)",
    landLabel: "rgba(139,166,180,0.5)",
    oceanLabel: "rgba(234,245,246,0.22)",
    muPin: "#4BBDC8",
  },
  sepia: {
    ocean: "#f4ecdb",
    texture:
      "radial-gradient(ellipse 65% 50% at 60% 42%, rgba(154,107,47,0.06), transparent 70%), radial-gradient(rgba(59,50,34,0.07) 1px, transparent 1.4px)",
    graticule: "rgba(59,50,34,0.12)",
    land: "#e7ddc1",
    landStroke: "rgba(59,50,34,0.32)",
    isle: "#e0d3b2",
    isleStroke: "rgba(59,50,34,0.36)",
    route: "rgba(154,107,47,0.6)",
    port: "rgba(122,92,50,0.92)",
    portStroke: "rgba(248,242,228,0.8)",
    landLabel: "rgba(59,50,34,0.62)",
    oceanLabel: "rgba(59,50,34,0.36)",
    muPin: "#9a6b2f",
  },
  /* Light grade, drawn from the corporate identity: the sea carries a
     whisper of brand teal, the land is brand ink navy pressed into paper,
     the lanes stay deep teal. The chart reads as a page of the annual
     report, not a desert. */
  light: {
    ocean: "#eaf2f3",
    texture:
      "radial-gradient(ellipse 65% 50% at 60% 42%, rgba(30,154,167,0.05), transparent 70%), radial-gradient(rgba(33,41,121,0.05) 1px, transparent 1.4px)",
    graticule: "rgba(33,41,121,0.11)",
    land: "#dbe1ee",
    landStroke: "rgba(33,41,121,0.32)",
    isle: "#cfd6ea",
    isleStroke: "rgba(33,41,121,0.36)",
    route: "rgba(30,154,167,0.58)",
    port: "rgba(30,154,167,0.92)",
    portStroke: "rgba(248,246,241,0.85)",
    landLabel: "rgba(33,41,121,0.72)",
    oceanLabel: "rgba(33,41,121,0.42)",
    muPin: "#1e9aa7",
  },
} as const;

interface Carto {
  ocean: string;
  texture: string;
  graticule: string;
  land: string;
  landStroke: string;
  isle: string;
  isleStroke: string;
  route: string;
  port: string;
  portStroke: string;
  landLabel: string;
  oceanLabel: string;
  muPin: string;
}

/* Pin presence. In the abyss pins glow, on paper they are pressed ink dots. */
function pinShadow(grade: Grade, color: string): string {
  if (grade === "abyss") return `0 0 12px 2px ${rgba(color, 0.55)}`;
  if (grade === "sepia") return `0 0 0 1px rgba(59,50,34,0.38), 0 0 10px 2px ${rgba(color, 0.3)}`;
  return `0 0 0 1px rgba(33,41,121,0.32), 0 0 10px 2px ${rgba(color, 0.32)}`;
}

/* ---------- label placement ----------
   The dot sits exactly on the baked pin; the name is set below it and
   nudged sideways only where the geography is tight. dx is the sideways
   offset in px from the dot, dy the drop below the dot centre. Wide
   values hold on the roomy desktop chart, compact values on the tighter
   phone crop, where the Mascarenes sit a hand's width apart. */

interface LabelPos {
  dx: number;
  dy: number;
}

const LABEL_WIDE: Record<string, LabelPos> = {
  /* The Mascarenes sit a hand's width apart on the wide chart too:
     Mauritius owns the open water to its south-east, Réunion the water
     between itself and Madagascar's tail, Seychelles lifts its name
     above the lane fan, and Madagascar's own name rides its island. */
  MU: { dx: 68, dy: 26 },
  MG: { dx: -60, dy: 10 },
  RE: { dx: -95, dy: 22 },
  KE: { dx: 0, dy: 15 },
  TZ: { dx: -44, dy: 15 },
  MZ: { dx: 12, dy: 15 },
  SC: { dx: -50, dy: -14 },
  KM: { dx: -8, dy: 15 },
  ZA: { dx: -44, dy: 15 },
  IN: { dx: 0, dy: 15 },
  AE: { dx: 45, dy: 15 },
  FR: { dx: 0, dy: 15 },
  SG: { dx: 0, dy: 15 },
  CN: { dx: -12, dy: 15 },
};

const LABEL_COMPACT: Record<string, LabelPos> = {
  MU: { dx: 40, dy: 22 },
  MG: { dx: -25, dy: 15 },
  RE: { dx: -70, dy: 20 },
  KE: { dx: 0, dy: 15 },
  TZ: { dx: 0, dy: 15 },
  MZ: { dx: 0, dy: 15 },
  SC: { dx: 0, dy: -12 },
  KM: { dx: 0, dy: 15 },
  ZA: { dx: -12, dy: 20 },
  IN: { dx: 0, dy: 15 },
  AE: { dx: 45, dy: 15 },
  FR: { dx: 0, dy: 15 },
  SG: { dx: 0, dy: 15 },
  CN: { dx: -12, dy: 15 },
};

/* On the phone crop Moroni is a dot in a crowded channel; its name waits
   for the wider chart. */
const HIDE_COMPACT_NAME = new Set(["KM"]);

function pinColor(c: CountryPin, grade: Grade): string {
  if (c.code === "MU") return CARTO[grade].muPin;
  const first: ClusterId = c.clusters[0];
  return CLUSTER_MAP[first].color;
}

function cardPos(p: { x: number; y: number }): CSSProperties {
  const flipX = p.x > 0.6;
  const flipY = p.y > 0.6;
  return {
    left: `${p.x * 100}%`,
    top: `${p.y * 100}%`,
    transform: `translate(${flipX ? "calc(-100% - 26px)" : "26px"}, ${
      flipY ? "calc(-100% - 34px)" : "34px"
    })`,
  };
}

/* ---------- story card body, shared by desktop card and mobile sheet ---------- */

function StoryBody({ c }: { c: CountryPin }) {
  const hq = c.code === "MU";
  return (
    <div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {c.brands.map((b) => (
          <span
            key={b}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-[10px]"
          >
            <BadgeCheck
              className="size-3 shrink-0"
              style={{ color: "var(--ibl-teal)" }}
              aria-hidden="true"
            />
            {b}
          </span>
        ))}
      </div>
      <p className="font-display mt-4 text-sm italic leading-relaxed text-foreground/85">
        <span className="mr-1 font-semibold" style={{ color: "var(--ibl-teal)" }}>
          &ldquo;
        </span>
        {c.story.person} · {c.story.line}&rdquo;
      </p>
      {hq && (
        <p
          className="tabular mt-4 border-t border-border/50 pt-3 text-xs"
          style={{ color: "var(--ibl-teal)" }}
        >
          {GROUP.team.toLocaleString("en-US").replace(",", " ")} people · {GROUP.countries}{" "}
          countries
        </p>
      )}
    </div>
  );
}

/* ---------- the section ---------- */

export function OceanMapSection() {
  const [active, setActive] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const grade = useGrade();
  const carto: Carto = CARTO[grade];

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

  const motionOk = !reducedStore && !mediaReduced && a11yProfile !== "epilepsy";

  const activeCountry = COUNTRIES.find((c) => c.code === active) ?? null;
  const activePin = activeCountry ? PIN[activeCountry.code] : null;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const labelTable = isMobile ? LABEL_COMPACT : LABEL_WIDE;

  return (
    <section id="map" className="relative py-24 md:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        {/* header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-10">
          <div>
            <p className="eyebrow">Where we stand</p>
            <h2 className="h-display h-section mt-4">
              <T k="map.title" />
            </h2>
          </div>
          <p className="caption max-w-sm md:ml-auto md:text-right">
            <T k="map.blurb" />
          </p>
        </div>

        {/* the map */}
        <div
          role="group"
          aria-label="Indian Ocean map with real coastlines. Pins mark countries with IBL presence."
          onClick={() => setActive(null)}
          className="relative mt-10 aspect-[4/5] cursor-default overflow-hidden rounded-3xl border border-border/60 sm:aspect-[3/2] lg:aspect-[16/10]"
          style={{
            backgroundColor: carto.ocean,
            backgroundImage: carto.texture,
            backgroundSize: "100% 100%, 22px 22px",
            transition: "background-color 0.7s var(--ease-luxe)",
          }}
        >
          {/* the map plane: exactly the rect the 1000x625 viewBox occupies
              under slice cropping, so pins and shapes share one truth */}
          <div className="absolute left-1/2 top-1/2 aspect-[16/10] h-full -translate-x-1/2 -translate-y-1/2">
            {/* basemap */}
            <svg
              viewBox="0 0 1000 625"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
              className="h-full w-full"
              style={{ transition: "fill 0.7s var(--ease-luxe), stroke 0.7s var(--ease-luxe)" }}
            >
              <g fill="none" stroke={carto.graticule} strokeWidth="0.6">
                {GRATICULE.map((g, i) => (
                  <path key={i} d={g.d} />
                ))}
              </g>
              <g
                fill={carto.land}
                stroke={carto.landStroke}
                strokeWidth="1"
                strokeLinejoin="round"
                fillRule="evenodd"
              >
                {LAND_PATHS.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              <g fill={carto.isle} stroke={carto.isleStroke} strokeWidth="1.15" strokeLinejoin="round">
                {ISLE_PATHS.map((d, i) => (
                  <path key={i} d={d} />
                ))}
                {/* home port emphasis ring on the Mauritius islet */}
                <circle
                  cx={PIN.MU.x * 1000}
                  cy={PIN.MU.y * 625}
                  r="9.5"
                  fill="none"
                  stroke={rgba(carto.muPin, 0.45)}
                  strokeWidth="0.9"
                />
              </g>
              <g
                fill="none"
                stroke={carto.route}
                strokeWidth="1.6"
                strokeDasharray="5 7"
                strokeLinecap="round"
              >
                {ROUTES.map((d, i) => (
                  <path key={i} d={d}>
                    {motionOk ? (
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-144"
                        dur={`${ROUTE_DUR[i]}s`}
                        repeatCount="indefinite"
                      />
                    ) : null}
                  </path>
                ))}
              </g>
              <g
                fill={carto.landLabel}
                fontSize="8"
                opacity="0.8"
                style={{ letterSpacing: "0.12em", transition: "fill 0.7s var(--ease-luxe)" }}
              >
                {GRAT_LABELS.map((l, i) => (
                  <text
                    key={i}
                    x={l.x}
                    y={l.y}
                    textAnchor={l.vertical ? "middle" : l.x < 500 ? "start" : "end"}
                  >
                    {l.text}
                  </text>
                ))}
              </g>
            </svg>

            {/* land labels. The ocean name rides the open basin on wide
                charts; on the phone crop it drops to the bottom of the
                frame, clear of the tight Mascarenes cluster, so its place
                comes from responsive classes rather than the baked point */}
            {LABELS.map((l) => (
              <span
                key={l.text}
                aria-hidden="true"
                className={`pointer-events-none absolute whitespace-nowrap uppercase${
                  l.mobile ? "" : " hidden sm:inline"
                }${
                  l.ocean
                    ? " left-1/2 top-[97.4%] text-[10px] tracking-[0.35em] sm:left-[66%] sm:top-[75.3%] sm:text-[13px] sm:tracking-[0.5em]"
                    : " text-[11px] tracking-[0.22em]"
                }`}
                style={{
                  ...(l.ocean ? null : { left: `${l.x * 100}%`, top: `${l.y * 100}%` }),
                  transform: `translate(-50%, -50%)${l.rotate ? ` rotate(${l.rotate}deg)` : ""}`,
                  color: l.ocean ? carto.oceanLabel : carto.landLabel,
                  transition: "color 0.7s var(--ease-luxe)",
                }}
              >
                {l.text}
              </span>
            ))}

            {/* country pins */}
            {COUNTRIES.map((c) => {
              const pin = PIN[c.code];
              const isActive = active === c.code;
              const color = pinColor(c, grade);
              const hq = c.code === "MU";
              const lp = labelTable[c.code] ?? { dx: 0, dy: 15 };
              const showName = !(isMobile && HIDE_COMPACT_NAME.has(c.code));
              return (
                <button
                  key={c.code}
                  type="button"
                  aria-label={`${c.name}. ${c.presence}`}
                  aria-expanded={isActive}
                  onMouseEnter={() => setActive(c.code)}
                  onFocus={() => setActive(c.code)}
                  onBlur={() => setActive((a) => (a === c.code ? null : a))}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(isActive ? null : c.code);
                  }}
                  className={`group absolute z-20 size-11 cursor-pointer items-center justify-center outline-none ${
                    pin.mobile ? "flex" : "hidden sm:flex"
                  } ${hq ? "z-30" : ""} ${isActive ? "z-40" : ""}`}
                  style={{
                    left: `${pin.x * 100}%`,
                    top: `${pin.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* the dot sits exactly on the baked pin: the button is a
                      44px hit square centred on the anchor, the name is
                      absolutely set below it so it never drags the dot off
                      its true coordinates. The home-port ring lives in the
                      baked SVG so the neighbouring Réunion dot stays
                      clear of it. */}
                  <span className="relative flex items-center justify-center">
                    {motionOk && (
                      <span
                        aria-hidden="true"
                        className="absolute size-4 animate-ping rounded-full"
                        style={{ background: rgba(color, 0.35) }}
                      />
                    )}
                    <span
                      className={`relative block rounded-full transition-transform duration-500 group-hover:scale-125 group-focus-visible:scale-125 ${
                        isActive ? "scale-125" : ""
                      } ${hq ? "size-4" : "size-2.5"}`}
                      style={{
                        background: color,
                        boxShadow: pinShadow(grade, color),
                        outline: isActive ? `1px solid ${rgba(color, 0.8)}` : undefined,
                        outlineOffset: 4,
                        transitionTimingFunction: "var(--ease-luxe)",
                      }}
                    />
                  </span>
                  {showName && (
                    <span
                      className="absolute left-1/2 top-1/2 flex flex-col items-center whitespace-nowrap"
                      style={{
                        transform: `translate(calc(-50% + ${lp.dx}px), ${lp.dy}px)`,
                      }}
                    >
                      <span
                        className={`text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 ${
                          isActive ? "text-foreground" : "text-foreground/70"
                        }`}
                      >
                        {c.name}
                      </span>
                      {hq && (
                        <span
                          className="mt-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em]"
                          style={{ borderColor: rgba(color, 0.6), color }}
                        >
                          HQ
                        </span>
                      )}
                      {hq && (
                        <span className="mt-1 text-[9px] uppercase tracking-[0.16em] text-foreground/55">
                          <span className="sm:hidden">Port Louis</span>
                          <span className="hidden sm:inline">Port Louis · home port</span>
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}

            {/* desktop anchored story card */}
            <AnimatePresence>
              {activeCountry && activePin && !isMobile && (
                <div
                  key={activeCountry.code}
                  className="absolute z-40"
                  style={cardPos(activePin)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.16 } }}
                    transition={{ duration: 0.4, ease: LUXE }}
                    className="glass relative w-64 rounded-2xl p-5 text-left shadow-teal sm:w-72"
                  >
                    <p className="h-sub text-xl">{activeCountry.name}</p>
                    <p className="caption mt-1">{activeCountry.presence}</p>
                    <StoryBody c={activeCountry} />
                    <button
                      type="button"
                      onClick={() => setActive(null)}
                      aria-label={`Close ${activeCountry.name}`}
                      className="absolute right-1.5 top-1.5 flex size-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors duration-300 hover:text-foreground"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* legend */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          {CLUSTERS.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
            >
              <span
                className="size-2 rounded-full"
                style={{ background: c.color }}
                aria-hidden="true"
              />
              {c.short}
            </span>
          ))}
          <span className="caption">Real coastlines, live trade lanes from Port Louis.</span>
        </div>
      </div>

      {/* mobile story sheet */}
      <Sheet
        open={Boolean(activeCountry) && isMobile}
        onOpenChange={(o) => {
          if (!o) setActive(null);
        }}
      >
        {activeCountry && (
          <SheetContent
            side="bottom"
            className="max-h-[80svh] overflow-y-auto rounded-t-3xl border-border/60 px-6 pb-8"
          >
            <SheetHeader className="px-0">
              <SheetTitle className="h-sub text-xl">{activeCountry.name}</SheetTitle>
              <SheetDescription className="caption">
                {activeCountry.presence}
              </SheetDescription>
            </SheetHeader>
            <StoryBody c={activeCountry} />
          </SheetContent>
        )}
      </Sheet>
    </section>
  );
}
