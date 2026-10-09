"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, MouseEventHandler } from "react";
import { motion } from "framer-motion";
import {
  Beer,
  Carrot,
  CupSoda,
  Fish,
  Plane,
  Pill,
  RotateCcw,
  ShieldCheck,
  ShoppingBasket,
  Sun,
  Tractor,
  Wheat,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";
import { useApp } from "@/store/app-store";
import { CLUSTER_MAP, type ClusterId } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { T } from "./t";

/* ==================================================================
   THE EVERYDAY BASKET — twelve ordinary things, every one of them
   already running through IBL. Tap the shelf and the tiles flip to
   the company behind each; the meter fills until the punchline lands:
   you've been an IBL customer all along.
   ================================================================== */

const SHELF_CSS = `
/* The revealed back of a tile: pressed ink, like a stamp on the sheet */
.basket-back {
  background: color-mix(in srgb, var(--foreground) 6%, var(--background));
  border: 1px solid color-mix(in srgb, var(--foreground) 15%, transparent);
  box-shadow: inset 0 2px 12px color-mix(in srgb, var(--foreground) 12%, transparent);
}
/* Paper grades: undiscovered tiles lift like the pulse bento cards */
html[data-theme="light"] .basket-tile,
html[data-theme="sepia"] .basket-tile {
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--foreground) 8%, transparent),
    0 18px 44px -30px color-mix(in srgb, var(--foreground) 22%, transparent);
  transition: box-shadow 0.7s var(--ease-luxe), transform 0.7s var(--ease-luxe);
}
/* Paper grade: the live dot's halo becomes a pressed teal ring */
html[data-theme="light"] .live-dot.basket-dot::after,
html[data-theme="sepia"] .live-dot.basket-dot::after {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ibl-teal) 22%, transparent);
}
`;

interface BasketItem {
  id: string;
  item: string;
  company: string;
  cluster: ClusterId;
  story: string;
  Icon: LucideIcon;
}

const SHELF: BasketItem[] = [
  {
    id: "groceries",
    item: "Weekly groceries",
    company: "Winner's",
    cluster: "retail",
    story: "Winner's keeps daily life affordable across 130+ stores.",
    Icon: ShoppingBasket,
  },
  {
    id: "produce",
    item: "Fresh produce, Kenya",
    company: "Naivas",
    cluster: "retail",
    story: "Naivas runs Kenya's freshest aisles, 80+ stores and counting.",
    Icon: Carrot,
  },
  {
    id: "beer",
    item: "A cold beer",
    company: "Phoenix Beverages",
    cluster: "cbd",
    story: "The nation's brewer, pouring since the sugar era.",
    Icon: Beer,
  },
  {
    id: "pharmacy",
    item: "Pharmacy run",
    company: "HealthActiv",
    cluster: "cbd",
    story: "Healthcare brands delivered to every pharmacy counter.",
    Icon: Pill,
  },
  {
    id: "chips",
    item: "Chips & soda",
    company: "BrandActiv",
    cluster: "cbd",
    story: "400+ global brands carried into regional homes.",
    Icon: CupSoda,
  },
  {
    id: "sugar",
    item: "Sugar",
    company: "Alteo",
    cluster: "industrials",
    story: "Alteo mills the island's sugar, field to terminal.",
    Icon: Wheat,
  },
  {
    id: "seafood",
    item: "Frozen seafood",
    company: "Froid des Mascareignes",
    cluster: "industrials",
    story: "The cold chain that carries the ocean to the world.",
    Icon: Fish,
  },
  {
    id: "electricity",
    item: "Electricity",
    company: "IBL Energy",
    cluster: "industrials",
    story: "Bagasse and solar, keeping the lights on.",
    Icon: Zap,
  },
  {
    id: "holiday",
    item: "Beach holiday",
    company: "LUX* Resorts",
    cluster: "services",
    story: "LUX* Collective, the Indian Ocean's address for escape.",
    Icon: Sun,
  },
  {
    id: "flight",
    item: "Your flight",
    company: "IBL Aviation",
    cluster: "services",
    story: "GSA, charter, cargo. Wings for the region.",
    Icon: Plane,
  },
  {
    id: "insurance",
    item: "Car insurance",
    company: "Mauritian Eagle",
    cluster: "services",
    story: "Insuring the region's drivers since 1973.",
    Icon: ShieldCheck,
  },
  {
    id: "machinery",
    item: "Heavy machinery",
    company: "Scomat",
    cluster: "industrials",
    story: "The Caterpillar dealership held since 1929.",
    Icon: Tractor,
  },
];

const TOTAL = SHELF.length;

function verdict(n: number): string {
  if (n <= 0) return "Raid the shelf. Tap anything.";
  if (n <= 5) return "The pattern emerges…";
  if (n <= 10) return "Hard to avoid us, isn't it?";
  if (n === 11) return "One left. You know it.";
  return "All twelve. You've been an IBL customer all along.";
}

/* ---------- one tactile tile ---------- */

interface ShelfTileProps {
  tile: BasketItem;
  revealed: boolean;
  reduce: boolean;
  onReveal: (id: string) => void;
}

function ShelfTile({ tile, revealed, reduce, onReveal }: ShelfTileProps) {
  const cluster = CLUSTER_MAP[tile.cluster];
  const clusterVar = `var(${cluster.colorVar})`;

  const inner: CSSProperties | undefined = reduce
    ? undefined
    : {
        transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)",
        transition: "transform 0.6s var(--ease-luxe)",
      };

  return (
    <button
      type="button"
      data-cursor="PICK"
      onClick={() => onReveal(tile.id)}
      aria-pressed={revealed}
      className="basket-tile group relative block aspect-[4/5] w-full cursor-pointer rounded-2xl [perspective:1000px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        className="relative block h-full w-full [transform-style:preserve-3d]"
        style={inner}
      >
        {/* front — the everyday thing, undiscovered */}
        <span
          aria-hidden={revealed}
          className={cn(
            "glass absolute inset-0 flex flex-col items-start justify-between rounded-2xl p-4 text-left [backface-visibility:hidden]",
            reduce && "transition-opacity duration-300",
            reduce && (revealed ? "opacity-0" : "opacity-100")
          )}
        >
          <tile.Icon className="h-7 w-7 shrink-0" aria-hidden strokeWidth={1.5} style={{ color: clusterVar }} />
          <span className="block w-full">
            <span className="block text-sm font-medium leading-snug">{tile.item}</span>
            <span className="caption mt-1.5 block text-[0.6rem] uppercase tracking-[0.22em]">Tap to reveal</span>
          </span>
        </span>

        {/* back — the company that was there all along */}
        <span
          aria-hidden={!revealed}
          className={cn(
            "basket-back absolute inset-0 flex flex-col justify-between rounded-2xl p-4 pl-5 text-left [backface-visibility:hidden] [transform:rotateY(180deg)]",
            reduce && "transition-opacity duration-300",
            reduce && (revealed ? "opacity-100" : "opacity-0")
          )}
        >
          <span
            aria-hidden
            className="absolute bottom-4 left-0 top-4 w-[3px] rounded-full"
            style={{ background: clusterVar }}
          />
          <span className="block">
            <span className="block text-sm font-medium leading-tight">{tile.company}</span>
            <span className="caption mt-1.5 line-clamp-3 block text-[0.68rem] leading-relaxed">{tile.story}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: clusterVar }} />
            <span className="text-[0.58rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {cluster.short}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}

/* ---------- the meter ---------- */

interface MeterProps {
  count: number;
  revealedIds: string[];
  reduce: boolean;
  onReset: MouseEventHandler<HTMLButtonElement>;
}

function BasketMeter({ count, revealedIds, reduce, onReset }: MeterProps) {
  const done = count >= TOTAL;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - count / TOTAL);

  const byId = useMemo(() => new Map(SHELF.map((s) => [s.id, s])), []);
  const chips = revealedIds
    .map((id) => byId.get(id))
    .filter((s): s is BasketItem => Boolean(s));

  const scrollToClusters = () => {
    document.getElementById("clusters")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="glass rounded-3xl p-6 sm:p-7">
      <p className="eyebrow flex items-center gap-3">
        <span className="live-dot basket-dot" aria-hidden />
        The basket meter
      </p>

      {done ? (
        /* the finale lockup: the collection is complete */
        <div className="mt-6 flex flex-col items-center text-center" aria-live="polite">
          <div className="relative mx-auto h-[168px] w-[168px]">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r={radius} fill="none" stroke="color-mix(in srgb, var(--foreground) 8%, transparent)" strokeWidth="7" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="var(--ibl-teal)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset="0"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-display tabular text-4xl">100%</span>
            </span>
          </div>
          <p className="h-sub mt-6 max-w-[16rem]">You&rsquo;ve been an IBL customer all along.</p>
          <p className="caption mt-2 text-[0.66rem] uppercase tracking-[0.28em]">Since 1830</p>
          <Button
            size="lg"
            className="mt-6 min-h-[44px] rounded-full px-7"
            onClick={scrollToClusters}
          >
            Explore the four clusters
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-6" aria-live="polite">
          <div className="relative h-[168px] w-[168px] shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r={radius} fill="none" stroke="color-mix(in srgb, var(--foreground) 8%, transparent)" strokeWidth="7" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="var(--ibl-teal)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={progress}
                style={{ transition: "stroke-dashoffset 0.7s var(--ease-luxe)" }}
              />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              {reduce ? (
                <span className="h-display tabular text-4xl">
                  {count}
                  <span className="text-muted-foreground">/{TOTAL}</span>
                </span>
              ) : (
                <motion.span
                  key={count}
                  initial={{ scale: 0.88, opacity: 0.55 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="h-display tabular inline-block text-4xl"
                >
                  {count}
                  <span className="text-muted-foreground">/{TOTAL}</span>
                </motion.span>
              )}
              <span className="caption mt-1 text-[0.58rem] uppercase tracking-[0.26em]">Already IBL</span>
            </span>
          </div>
          <p className="caption flex-1">{verdict(count)}</p>
        </div>
      )}

      {/* the collection, accumulating */}
      {chips.length > 0 && (
        <div className="scrollbar-thin mt-6 max-h-40 overflow-y-auto pr-1">
          <ul className="flex flex-wrap gap-2">
            {chips.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-1.5 rounded-full border border-foreground/15 px-2.5 py-1 text-[0.66rem] font-medium"
              >
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: `var(${CLUSTER_MAP[s.cluster].colorVar})` }}
                />
                {s.company}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="caption mt-5 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full px-2 text-left transition-colors hover:text-foreground"
      >
        <RotateCcw className="size-3.5" aria-hidden />
        Reset shelf
      </button>
    </div>
  );
}

/* ---------- the section ---------- */

export function BasketApp() {
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

  const { ref: titleRef, style: titleStyle } = useReveal<HTMLDivElement>("w");
  const { ref: blurbRef, style: blurbStyle } = useReveal<HTMLDivElement>("e");
  const { ref: shelfRef, style: shelfStyle } = useReveal<HTMLDivElement>("s");

  const [revealedIds, setRevealedIds] = useState<string[]>([]);

  const reveal = (id: string) => {
    setRevealedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const reset = () => setRevealedIds([]);

  return (
    <section id="basket" className="relative py-28 md:py-36" aria-label="The everyday basket">
      <style>{SHELF_CSS}</style>
      <div className="mx-auto w-full max-w-[88rem] px-5 sm:px-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div ref={titleRef} style={titleStyle}>
            <p className="eyebrow flex items-center gap-3">
              <span className="live-dot basket-dot" aria-hidden />
              Retail · Consumer brands · Everyday
            </p>
            <h2 className="h-display h-section mt-4 max-w-xl">
              <T k="basket.title" />
            </h2>
          </div>
          <div ref={blurbRef} style={blurbStyle} className="max-w-sm md:ml-auto">
            <p className="caption">
              <T k="basket.blurb" />
            </p>
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 items-start gap-6 md:mt-14 lg:grid-cols-[1fr_380px] lg:gap-10">
          {/* the shelf */}
          <div ref={shelfRef} style={shelfStyle}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {SHELF.map((tile) => (
                <ShelfTile
                  key={tile.id}
                  tile={tile}
                  revealed={revealedIds.includes(tile.id)}
                  reduce={reduce}
                  onReveal={reveal}
                />
              ))}
            </div>
          </div>

          {/* the meter, sticky on tall shelves */}
          <aside className="lg:sticky lg:top-24">
            <BasketMeter count={revealedIds.length} revealedIds={revealedIds} reduce={reduce} onReset={reset} />
          </aside>
        </div>
      </div>
    </section>
  );
}
