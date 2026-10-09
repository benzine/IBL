"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode, Ref } from "react";
import { Droplets, Recycle, Sun, Trees, type LucideIcon } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { IMPACT_ANCHORS, PULSE_ANCHORS } from "@/lib/data/trust";
import { translate } from "@/lib/i18n";
import { useApp, type LangId } from "@/store/app-store";
import { useCountUp, useLiveCounter } from "@/hooks/use-count-up";
import { useReveal } from "@/hooks/use-reveal";

const GREEN = "#2FA96E";
const WORLD_POP = 8_000_000_000;
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Seconds elapsed since local midnight, the day yardstick for the live counters. */
function useDaySecond(): number {
  const [s, setS] = useState(0);
  useEffect(() => {
    const read = () => {
      const n = new Date();
      setS(n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds());
    };
    const t = window.setTimeout(read, 0);
    return () => window.clearTimeout(t);
  }, []);
  return s;
}

/** The section title, with its verb set in Fraunces italic. */
function TitleWithVerb() {
  const lang = useApp((s) => s.lang);
  const verbs: Record<LangId, string> = { en: "gives", fr: "restitue", cr: "donn" };
  const text = translate("planet.title", lang);
  const verb = verbs[lang];
  const idx = verb ? text.indexOf(verb) : -1;
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <em className="font-display font-normal italic">{verb}</em>
      {text.slice(idx + verb.length)}
    </>
  );
}

function MetricCard({
  icon: Icon,
  number,
  unit,
  label,
  share,
  className,
  countRef,
}: {
  icon: LucideIcon;
  number: string;
  unit: string;
  label: ReactNode;
  share: string;
  className?: string;
  countRef?: Ref<HTMLSpanElement>;
}) {
  return (
    <div
      className={`glass group relative overflow-hidden rounded-2xl p-5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${GREEN} 14%, transparent)` }}>
          <Icon className="size-5" style={{ color: GREEN }} aria-hidden />
        </span>
        <span className="live-dot" style={{ ["--ibl-teal" as string]: GREEN }} aria-hidden />
        <span className="sr-only">live</span>
      </div>
      <p className="mt-4 flex flex-wrap items-baseline gap-2">
        <span ref={countRef} className="h-display tabular text-3xl sm:text-4xl">
          {number}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </p>
      <p className="caption mt-1">{label}</p>
      <p className="caption mt-3 max-h-0 overflow-hidden opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:mt-2 group-hover:max-h-10 group-hover:opacity-100">
        {share}
      </p>
    </div>
  );
}

function EquivalentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-foreground/10 py-2.5 last:border-b-0">
      <span className="caption">{label}</span>
      <span className="tabular text-lg font-medium">{value}</span>
    </div>
  );
}

function Comparison({
  label,
  pct,
  note,
}: {
  label: string;
  pct: number;
  note: string;
}) {
  const shown = pct < 0.01 ? "under 0.01" : pct >= 100 ? Math.round(pct).toLocaleString("en-US") : pct.toFixed(1);
  const width = Math.min(100, Math.max(pct, 0.75));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="caption flex-1">{label}</span>
        <span className="tabular text-sm font-medium" style={{ color: GREEN }}>
          {shown}%
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full"
          style={{ background: GREEN, width: `${width}%`, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </div>
      <p className="caption mt-1.5">{note}</p>
    </div>
  );
}

function VisitCalculator({ daySecond }: { daySecond: number }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const [household, setHousehold] = useState(4);
  const [km, setKm] = useState(100);

  useEffect(() => {
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      setElapsed((Date.now() - (startRef.current ?? Date.now())) / 1000);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const meals = Math.floor(PULSE_ANCHORS.mealsPerSecond * elapsed);
  const litres = IMPACT_ANCHORS.waterSavedM3PerSec * 1000 * elapsed;
  const kwh = PULSE_ANCHORS.energyPerSecond * elapsed;
  const rupees = PULSE_ANCHORS.revenuePerSecond * elapsed;

  const dayNow = daySecond + elapsed;
  const groupWaterL = IMPACT_ANCHORS.waterSavedM3PerSec * dayNow * 1000;
  const homeYearL = household * 50 * 365;
  const waterPct = groupWaterL > 1000 ? (homeYearL / groupWaterL) * 100 : 0;
  const driveKg = km * 0.17;
  const solarOffsetKg = PULSE_ANCHORS.energyPerSecond * dayNow * 1000 * 0.7;
  const drivePct = solarOffsetKg > 100 ? (driveKg / solarOffsetKg) * 100 : 0;

  return (
    <div className="glass mt-6 rounded-3xl p-6 sm:p-8 lg:grid lg:grid-cols-2 lg:gap-12">
      <div>
        <p className="h-sub">Your visit, measured</p>
        <p className="caption mt-2 flex items-center gap-3">
          While you have been here
          <span className="tabular">
            {Math.floor(elapsed / 60)}m {Math.floor(elapsed % 60)}s
          </span>
        </p>
        <div className="mt-6">
          <EquivalentRow label="Meals served" value={meals.toLocaleString("en-US")} />
          <EquivalentRow label="Litres of water saved" value={`${Math.round(litres).toLocaleString("en-US")} L`} />
          <EquivalentRow label="Clean energy generated" value={`${kwh.toFixed(1)} kWh`} />
          <EquivalentRow label="Revenue earned" value={`Rs ${compact.format(rupees)}`} />
        </div>
        <p className="caption mt-4">
          Counters run on the same anchors as the pulse layer. They never sleep.
        </p>
      </div>

      <div className="mt-8 space-y-7 lg:mt-0">
        <div>
          <div className="flex items-baseline justify-between">
            <label id="calc-household-label" className="text-sm font-medium">
              People in your household
            </label>
            <span className="tabular text-sm text-muted-foreground" aria-hidden>{household}</span>
          </div>
          <Slider
            value={[household]}
            onValueChange={(v) => setHousehold(v[0] ?? 4)}
            min={1}
            max={8}
            step={1}
            className="mt-3"
            aria-labelledby="calc-household-label"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label id="calc-km-label" className="text-sm font-medium">
              Kilometres you drive weekly
            </label>
            <span className="tabular text-sm text-muted-foreground" aria-hidden>{km} km</span>
          </div>
          <Slider
            value={[km]}
            onValueChange={(v) => setKm(v[0] ?? 100)}
            min={0}
            max={500}
            step={10}
            className="mt-3"
            aria-labelledby="calc-km-label"
          />
        </div>

        <Comparison
          label="Your household's yearly water use, against water the group saved today (modelled)"
          pct={waterPct}
          note={`About ${homeYearL.toLocaleString("en-US")} L a year at home, against ${Math.round(groupWaterL).toLocaleString("en-US")} L saved so far today.`}
        />
        <Comparison
          label="Your weekly drive's CO2, against the solar fleet's offset today (modelled)"
          pct={drivePct}
          note={`About ${Math.round(driveKg)} kg of CO2 a week behind the wheel, against about ${compact.format(solarOffsetKg)} kg offset today.`}
        />
      </div>
    </div>
  );
}

export function PlanetSection() {
  const daySecond = useDaySecond();
  const { ref: headerRef, style: headerStyle } = useReveal<HTMLDivElement>("s");

  const water = useLiveCounter(IMPACT_ANCHORS.waterSavedM3PerSec, IMPACT_ANCHORS.waterSavedM3PerSec * daySecond, 1);
  const pack = useLiveCounter(
    IMPACT_ANCHORS.packagingTonsRecycledPerSec,
    IMPACT_ANCHORS.packagingTonsRecycledPerSec * daySecond,
    2
  );
  const energy = useLiveCounter(PULSE_ANCHORS.energyPerSecond, PULSE_ANCHORS.energyPerSecond * daySecond, 1);
  const trees = useCountUp(IMPACT_ANCHORS.mangroveTrees, 2200);
  const treesNumber = trees.formatted.replace(/,/g, "\u202F");

  const waterMl = (water.value / WORLD_POP) * 1e6;
  const waterShare =
    waterMl >= 1000
      ? `Your share, ${(waterMl / 1000).toFixed(2)} m³ per person alive`
      : `Your share, ${waterMl.toFixed(1)} mL per person alive`;
  const packG = (pack.value / WORLD_POP) * 1e6;
  const packShare =
    packG >= 1000
      ? `Your share, ${(packG / 1000).toFixed(1)} kg per person alive`
      : packG >= 1
        ? `Your share, ${packG.toFixed(1)} g per person alive`
        : `Your share, ${(packG * 1000).toFixed(1)} mg per person alive`;
  const energyWh = (energy.value / WORLD_POP) * 1e6;
  const energyShare =
    energyWh >= 1000
      ? `Your share, ${(energyWh / 1000).toFixed(2)} kWh per person alive`
      : `Your share, ${energyWh.toFixed(2)} Wh per person alive`;
  const treesShare = `One tree for every ${Math.round(WORLD_POP / IMPACT_ANCHORS.mangroveTrees).toLocaleString("en-US")} people alive`;

  return (
    <section
      id="planet"
      aria-labelledby="planet-title"
      className="grain relative scroll-mt-24 overflow-hidden py-20 sm:py-28"
      style={{ background: "linear-gradient(160deg, #0A0E23 0%, #0F2A1D 55%, #123324 100%)" }}
    >
      <div className="relative z-[1] mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} style={headerStyle}>
          <p className="eyebrow" style={{ color: `color-mix(in srgb, ${GREEN} 60%, #8ba6b4)` }}>
            Sustainability
          </p>
          <h2 id="planet-title" className="h-section mt-3 font-semibold tracking-tight text-white">
            <TitleWithVerb />
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Droplets}
            number={water.formatted}
            unit="m³"
            label="Water saved today across operations"
            share={waterShare}
            className="sm:col-span-2"
          />
          <MetricCard
            icon={Recycle}
            number={pack.formatted}
            unit="tonnes"
            label="Packaging recycled today"
            share={packShare}
          />
          <MetricCard
            icon={Sun}
            number={energy.formatted}
            unit="MWh"
            label="Renewable energy generated today"
            share={energyShare}
          />
          <MetricCard
            icon={Trees}
            number={treesNumber}
            unit="trees"
            label="Mangrove trees planted and standing"
            share={treesShare}
            countRef={trees.ref}
            className="sm:col-span-2 lg:col-span-4"
          />
        </div>

        <VisitCalculator daySecond={daySecond} />

        <p className="caption mt-6 max-w-2xl">
          Anchored on FY disclosures and group targets. Modelled live, refreshed with every visit.
        </p>
      </div>
    </section>
  );
}
