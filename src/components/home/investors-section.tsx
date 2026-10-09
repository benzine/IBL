"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CalendarPlus, FileText, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { T } from "@/components/home/t";
import { CLUSTERS, GROUP } from "@/lib/brand";
import { DIVIDENDS, type DividendYear } from "@/lib/data/dividends";
import { REPORT_SECTIONS, generateAnnualReportPdf } from "@/components/home/report-pdf";
import { usePulse } from "@/hooks/use-pulse";
import { useCountUp } from "@/hooks/use-count-up";
import { useMagnetic, useTilt } from "@/hooks/use-tilt";
import { useReveal } from "@/hooks/use-reveal";

const TEAL = "var(--ibl-teal)";
const TEAL_DEEP = "var(--ibl-teal-deep)";
/** UI accents resolve through the theme var so paper gets the deep teal */
const TEAL_VAR = "var(--ibl-teal)";
/** Small live-value text leans toward ink on paper (toward light on abyss),
 *  deep teal alone sits near 3:1 on ivory which fails AA at 12px. */
const TEAL_TEXT = "color-mix(in srgb, var(--ibl-teal) 72%, var(--foreground))";
const DOWN_TEXT = "color-mix(in srgb, var(--cluster-services) 82%, var(--foreground))";
const LUXE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* Paper-grade rules, scoped to this section (dark grades stay untouched).
   On flat ivory the figures need a pressed ink shadow to lift off the sheet. */
const PAPER_GRADE_CSS = `
html[data-theme="light"] .inv-lift,
html[data-theme="sepia"] .inv-lift {
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--foreground) 10%, transparent),
    0 22px 55px -30px color-mix(in srgb, var(--foreground) 26%, transparent);
  /* carries .lift's transform leg too: without it the shorthand would replace
     the base rule and the hover lift would snap instead of glide */
  transition: transform 0.6s var(--ease-luxe), box-shadow 0.7s var(--ease-luxe);
}
`;

/* ------------------------------------------------ share chip */

function ShareChip() {
  const pulse = usePulse();
  const price = pulse?.share.price ?? 21;
  const change = pulse?.share.changePct ?? 0;
  const up = change >= 0;
  return (
    <div className="glass flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 rounded-full px-4 py-2 text-sm">
      <span className="font-medium">IBL · SEM</span>
      <span className="tabular">Rs {price.toFixed(2)}</span>
      <span className="tabular text-xs font-medium" style={{ color: up ? TEAL_TEXT : DOWN_TEXT }}>
        {up ? "+" : ""}
        {change.toFixed(2)}%
      </span>
      <span className="caption">delayed</span>
    </div>
  );
}

/* ------------------------------------------------ key figures */

function StatCard({
  number,
  label,
  className,
  growth,
  children,
}: {
  number: ReactNode;
  label: string;
  className?: string;
  growth?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`inv-lift glass lift relative overflow-hidden rounded-2xl border-l-[3px] p-5 ${className ?? ""}`}
      style={{ borderLeftColor: TEAL_VAR }}
    >
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">{number}</p>
      <p className="caption mt-2">{label}</p>
      {children}
    </div>
  );
}

function KeyFigures() {
  const tilt = useTilt(5);
  const { ref: revRef, formatted: revFmt } = useCountUp(124.3, 1900, 1);
  const { ref: ebitdaRef, formatted: ebitdaFmt } = useCountUp(14.5, 1900, 1);
  const { ref: assetsRef, formatted: assetsFmt } = useCountUp(151.1, 1900, 1);
  const { ref: outsideRef, formatted: outsideFmt } = useCountUp(GROUP.outsideMauritius, 1900, 0);
  const { ref: teamRef, formatted: teamFmt } = useCountUp(GROUP.team, 2100, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        ref={tilt}
        className="inv-lift glass tilt-card relative overflow-hidden rounded-2xl border-l-[3px] p-6 sm:p-8 lg:col-span-2 lg:row-span-2"
        style={{ borderLeftColor: TEAL_VAR }}
      >
        <p className="eyebrow">Revenue, FY2026</p>
        <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span ref={revRef} className="h-display tabular text-5xl sm:text-6xl">
            Rs {revFmt} Bn
          </span>
          {/* accent-foreground keeps the badge readable on the teal tint in both grades */}
          <Badge className="border-transparent bg-teal/15 text-accent-foreground">
            <TrendingUp className="size-3" aria-hidden />
            {GROUP.revenueGrowth}
          </Badge>
        </p>
        <p className="caption mt-4 max-w-xs">
          Thirteen percent growth, and most of it earned beyond Mauritius.
        </p>
        <p className="caption mt-8 hidden sm:block">USD 2.6 Bn at group level</p>
      </div>

      <StatCard
        number={
          <span ref={ebitdaRef} className="h-display tabular text-3xl sm:text-4xl">
            Rs {ebitdaFmt} Bn
          </span>
        }
        label="EBITDA, FY2026"
      />
      <StatCard
        number={
          <span ref={assetsRef} className="h-display tabular text-3xl sm:text-4xl">
            Rs {assetsFmt} Bn
          </span>
        }
        label="Total assets"
      />
      <StatCard
        number={
          <span ref={outsideRef} className="h-display tabular text-3xl sm:text-4xl">
            {outsideFmt}%
          </span>
        }
        label="Revenue earned outside Mauritius"
      />
      <StatCard
        number={
          <span ref={teamRef} className="h-display tabular text-3xl sm:text-4xl">
            {teamFmt.replace(/,/g, "\u202F")}
          </span>
        }
        label="Team members across 20 countries"
      />
      <StatCard
        className="sm:col-span-2 lg:col-span-4"
        number={
          <span className="h-display tabular text-4xl sm:text-5xl">
            1<sup className="text-xl">st</sup>
          </span>
        }
        label="Market position among listed Mauritian groups, outside banking"
      >
        <p className="caption mt-3 max-w-sm">
          Listed on the Stock Exchange of Mauritius since 1994. The island's largest group outside the banks.
        </p>
      </StatCard>
    </div>
  );
}

/* ------------------------------------------------ dividend chart */

type Series = "total" | "interim" | "final";

/* Two drawing grades so the sheet never needs a scrollbar: a wide plate
   for the desktop column and a compact one for phones. The svg is fluid,
   the wrapper has no min width, and the hover card is clamped to the
   measured frame, so no edge of it can ever leave the card. */
const GEO_WIDE = { W: 800, H: 280, TOP: 26, BASE: 246, X0: 46, X1: 788, BAR: 58 } as const;
const GEO_COMPACT = { W: 420, H: 252, TOP: 30, BASE: 224, X0: 36, X1: 406, BAR: 30 } as const;

function seriesValue(d: DividendYear, s: Series): number {
  return s === "total" ? d.total : s === "interim" ? d.interim : d.final;
}

function DividendChart() {
  const [series, setSeries] = useState<Series>("total");
  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapW, setWrapW] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWrapW(el.clientWidth));
    ro.observe(el);
    setWrapW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const compact = wrapW > 0 && wrapW < 520;
  const G = compact ? GEO_COMPACT : GEO_WIDE;
  const max = Math.max(...DIVIDENDS.map((d) => seriesValue(d, series)));
  const n = DIVIDENDS.length;
  const slot = (G.X1 - G.X0) / n;
  const barW = Math.min(G.BAR, slot * 0.62);
  const scale = (v: number) => (v / max) * (G.BASE - G.TOP);

  /* Tooltip geometry: anchored to the hovered bar, clamped so both edges
     stay inside the measured frame. The frame is the true visible width,
     there is no scroll container any more, so the card can never clip. */
  const TOOLTIP_W = 192;
  const pointPx = hover !== null && wrapW ? ((G.X0 + slot * hover + slot / 2) / G.W) * wrapW : 0;
  const tipLeft =
    hover !== null && wrapW
      ? `${Math.min(Math.max(TOOLTIP_W / 2 + 2, pointPx), wrapW - TOOLTIP_W / 2 - 2)}px`
      : "50%";

  return (
    <div className="inv-lift glass rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Dividend history</p>
          <p className="h-sub mt-2">Eight years of payouts</p>
        </div>
        <div className="glass inline-flex rounded-full p-1" role="group" aria-label="Dividend series">
          {(["total", "interim", "final"] as Series[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeries(s)}
              aria-pressed={series === s}
              /* ink on the teal chip passes AA in every grade: 5.6:1 on the deep
                 paper teal, 8.4:1 on the bright abyss teal. --primary-foreground
                 would flip to near-white on paper and fail at 3.2:1. */
              className={`min-h-9 rounded-full px-4 text-xs font-medium capitalize transition-colors duration-300 ${
                series === s ? "bg-teal text-[#06131a]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div ref={wrapRef} className="relative">
          <p className="sr-only">
            Dividend history. Interim and final payout per share for each year since 2018. Each bar is focusable.
          </p>
          <svg viewBox={`0 0 ${G.W} ${G.H}`} className="block h-auto w-full">
            {[1, 0.5].map((f) => (
              <g key={f}>
                <line
                  x1={G.X0}
                  x2={G.X1}
                  y1={G.BASE - (G.BASE - G.TOP) * f}
                  y2={G.BASE - (G.BASE - G.TOP) * f}
                  stroke="currentColor"
                  strokeOpacity="0.15"
                  strokeDasharray="3 6"
                />
                <text
                  x={G.X0 - 8}
                  y={G.BASE - (G.BASE - G.TOP) * f + 4}
                  textAnchor="end"
                  fontSize={compact ? 10 : 11}
                  className="fill-current"
                  opacity="0.62"
                >
                  {(max * f).toFixed(2)}
                </text>
              </g>
            ))}
            <line x1={G.X0} x2={G.X1} y1={G.BASE} y2={G.BASE} stroke="currentColor" strokeOpacity="0.25" />

            {DIVIDENDS.map((d, i) => {
              const x = G.X0 + slot * i + (slot - barW) / 2;
              const hI = scale(d.interim);
              const hF = scale(d.final);
              const dimmed = hover !== null && hover !== i;
              return (
                <motion.g
                  key={d.year}
                  role="button"
                  tabIndex={0}
                  aria-label={`${d.year}, interim ${d.interim.toFixed(2)}, final ${d.final.toFixed(2)}, total ${d.total.toFixed(2)} rupees per share${d.note ? `. ${d.note}` : ""}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  animate={{ opacity: dimmed ? 0.38 : 1 }}
                  transition={{ duration: 0.35 }}
                  className="cursor-pointer"
                >
                  {series === "total" ? (
                    <>
                      <motion.rect
                        x={x}
                        width={barW}
                        style={{ fill: TEAL }}
                        initial={{ y: G.BASE, height: 0 }}
                        animate={{ y: G.BASE - hI, height: hI }}
                        transition={{ duration: 0.7, ease: LUXE }}
                      />
                      <motion.rect
                        x={x}
                        width={barW}
                        style={{ fill: TEAL_DEEP }}
                        rx={3}
                        initial={{ y: G.BASE, height: 0 }}
                        animate={{ y: G.BASE - hI - hF, height: hF }}
                        transition={{ duration: 0.7, ease: LUXE }}
                      />
                    </>
                  ) : (
                    <motion.rect
                      x={x}
                      width={barW}
                      style={{ fill: series === "interim" ? TEAL : TEAL_DEEP }}
                      rx={3}
                      initial={{ y: G.BASE, height: 0 }}
                      animate={{
                        y: G.BASE - (series === "interim" ? hI : hF),
                        height: series === "interim" ? hI : hF,
                      }}
                      transition={{ duration: 0.7, ease: LUXE }}
                    />
                  )}
                  <text
                    x={x + barW / 2}
                    y={G.BASE + 22}
                    textAnchor="middle"
                    fontSize={13}
                    className="fill-current"
                    opacity="0.66"
                  >
                    {d.year}
                  </text>
                  <rect
                    x={G.X0 + slot * i}
                    y={G.TOP - 12}
                    width={slot}
                    height={G.BASE - G.TOP + 24}
                    fill="none"
                    pointerEvents="all"
                  />
                </motion.g>
              );
            })}
          </svg>

          {hover !== null && !compact && (
            <div
              className="glass-strong pointer-events-none absolute top-0 z-30 w-48 -translate-x-1/2 rounded-xl border border-foreground/10 p-3"
              style={{ left: tipLeft }}
            >
              <p className="text-sm font-medium">{DIVIDENDS[hover].year}</p>
              <div className="caption mt-1 space-y-0.5">
                <p className="flex justify-between">
                  <span>Interim</span>
                  <span className="tabular">Rs {DIVIDENDS[hover].interim.toFixed(2)}</span>
                </p>
                <p className="flex justify-between">
                  <span>Final</span>
                  <span className="tabular">Rs {DIVIDENDS[hover].final.toFixed(2)}</span>
                </p>
                <p className="flex justify-between font-medium text-foreground">
                  <span>Total</span>
                  <span className="tabular">Rs {DIVIDENDS[hover].total.toFixed(2)}</span>
                </p>
              </div>
              {DIVIDENDS[hover].note && (
                <p className="caption mt-2 border-t border-foreground/10 pt-2">{DIVIDENDS[hover].note}</p>
              )}
            </div>
          )}
        </div>

        {compact && <DividendReadout idx={hover ?? n - 1} />}
      </div>

      <p className="caption mt-4">Interim declared around December, final around June. MUR per share.</p>
    </div>
  );
}

/* On phones the payout reads as a quiet panel under the sheet instead of a
   floating card: same figures, zero chance of clipping. */
function DividendReadout({ idx }: { idx: number }) {
  const d = DIVIDENDS[Math.max(0, Math.min(DIVIDENDS.length - 1, idx))];
  return (
    <div className="mt-3 rounded-xl border border-foreground/10 p-3.5" aria-live="polite">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-base font-semibold tabular">{d.year}</p>
        <p className="caption">
          Total <span className="tabular font-medium text-foreground">Rs {d.total.toFixed(2)}</span>
        </p>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-lg bg-foreground/[0.04] px-2.5 py-2">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: TEAL }} aria-hidden />
          <span className="caption flex-1">Interim</span>
          <span className="caption tabular font-medium">Rs {d.interim.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-foreground/[0.04] px-2.5 py-2">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: TEAL_DEEP }} aria-hidden />
          <span className="caption flex-1">Final</span>
          <span className="caption tabular font-medium">Rs {d.final.toFixed(2)}</span>
        </div>
      </div>
      {d.note && <p className="caption mt-2.5">{d.note}</p>}
    </div>
  );
}

/* ------------------------------------------------ AGM countdown */

function nextAgmDate(from: Date): Date {
  const y = from.getUTCFullYear();
  let d = new Date(Date.UTC(y, 10, 15, 6, 0, 0));
  if (d.getTime() <= from.getTime()) d = new Date(Date.UTC(y + 1, 10, 15, 6, 0, 0));
  return d;
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-[3.5rem] text-center">
      <p className="h-display tabular text-4xl sm:text-5xl">{value}</p>
      <p className="caption mt-1">{label}</p>
    </div>
  );
}

function AgmCountdown() {
  const [target] = useState(() => nextAgmDate(new Date()));
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const t = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, []);

  const diff = now ? Math.max(0, target.getTime() - now.getTime()) : 0;
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000) % 24;
  const minutes = Math.floor(diff / 60_000) % 60;
  const seconds = Math.floor(diff / 1000) % 60;
  const ready = now !== null;

  const download = () => {
    const end = new Date(target.getTime() + 90 * 60_000);
    const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//IBL Group//AGM Reminder//EN",
      "BEGIN:VEVENT",
      `UID:ibl-agm-${target.getUTCFullYear()}@iblgroup.com`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(target)}`,
      `DTEND:${fmt(end)}`,
      "SUMMARY:IBL Group AGM",
      "LOCATION:IBL House\\, Caudan Waterfront\\, Port Louis\\, Mauritius",
      "DESCRIPTION:Annual general meeting of IBL Group. Doors open 09:30 Port Louis time.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "ibl-agm.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("Calendar file downloaded. See you in Port Louis.");
  };

  return (
    <div className="inv-lift glass rounded-2xl p-6">
      <p className="eyebrow">Diary</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4" role="timer" aria-label="Countdown to the next annual general meeting">
        <TimeUnit value={ready ? String(days) : "0"} label="D" />
        <span className="select-none pb-5 text-2xl text-muted-foreground/50" aria-hidden>
          ·
        </span>
        <TimeUnit value={ready ? String(hours).padStart(2, "0") : "00"} label="H" />
        <span className="select-none pb-5 text-2xl text-muted-foreground/50" aria-hidden>
          ·
        </span>
        <TimeUnit value={ready ? String(minutes).padStart(2, "0") : "00"} label="M" />
        <span className="select-none pb-5 text-2xl text-muted-foreground/50" aria-hidden>
          ·
        </span>
        <TimeUnit value={ready ? String(seconds).padStart(2, "0") : "00"} label="S" />
      </div>
      <p className="caption mt-4">Next annual general meeting, Port Louis</p>
      <p className="caption tabular mt-1">
        {ready
          ? `${target.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}, 10:00 Mauritius time (UTC+4)`
          : "15 November, 10:00 Mauritius time (UTC+4)"}
      </p>
      <Button variant="outline" className="mt-5 min-h-11 rounded-full" onClick={download}>
        <CalendarPlus className="size-4" aria-hidden />
        Add reminder
      </Button>
    </div>
  );
}

/* ------------------------------------------------ report generator */

function ReportBuilder() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(REPORT_SECTIONS.map((s) => s.id));
  const [busy, setBusy] = useState(false);
  const magnetic = useMagnetic(0.22, 130);

  const toggleSection = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /* A true PDF file, not a print dialog: the browser's own print header,
     the strip that carries the page's web address, never enters the
     document. jsPDF is pulled in only at the moment of assembly. */
  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setOpen(false);
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "report-built", meta: JSON.stringify(selected) }),
    }).catch(() => {});
    try {
      const fileName = await generateAnnualReportPdf(selected);
      toast.success("Annual report downloaded", {
        description: `${fileName} · A4, data only, no web addresses`,
      });
    } catch {
      toast.error("The report could not be assembled", {
        description: "Nothing was downloaded. Try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="inv-lift glass rounded-2xl p-6">
        <p className="eyebrow">One tap</p>
        <p className="h-sub mt-2">Your own annual report</p>
        <p className="caption mt-3">
          Pick the sections. We assemble them from the live data on this page into a PDF.
        </p>
        <span ref={magnetic} className="btn-magnetic mt-6 inline-block">
          <Button id="report-builder-trigger" className="min-h-11 rounded-full px-6" onClick={() => setOpen(true)}>
            <FileText className="size-4" aria-hidden />
            Build my annual report
          </Button>
        </span>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:rounded-t-3xl max-md:border-b-0">
          <DialogHeader>
            <DialogTitle>Build my annual report</DialogTitle>
            <DialogDescription>Choose the sections to include.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {REPORT_SECTIONS.map((s) => (
              <div key={s.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-border/40 px-3">
                <Checkbox
                  id={`rep-${s.id}`}
                  checked={selected.includes(s.id)}
                  disabled={s.id === "overview"}
                  onCheckedChange={() => toggleSection(s.id)}
                />
                <Label htmlFor={`rep-${s.id}`} className="text-sm font-normal">
                  {s.label}
                  {s.id === "overview" && <span className="sr-only"> (always included)</span>}
                </Label>
              </div>
            ))}
          </div>
          <p className="caption">A clean A4 PDF, data only, no web addresses.</p>
          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button className="min-h-11" disabled={busy || selected.length === 0} onClick={generate}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <FileText className="size-4" aria-hidden />
              )}
              {busy ? "Assembling" : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


/* ------------------------------------------------ section */

export function InvestorsSection() {
  const { ref: headerRef, style: headerStyle } = useReveal<HTMLDivElement>("s");

  return (
    <section id="investors" className="scroll-mt-24 py-20 sm:py-28" aria-labelledby="investors-title">
      <style>{PAPER_GRADE_CSS}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} style={headerStyle} className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Investor room</p>
            <h2 id="investors-title" className="h-section mt-3 font-semibold tracking-tight">
              <T k="investors.title" />
            </h2>
          </div>
          <ShareChip />
        </div>

        <div className="mt-10">
          <KeyFigures />
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <DividendChart />
          <div className="flex flex-col gap-6">
            <AgmCountdown />
            <ReportBuilder />
          </div>
        </div>
      </div>
    </section>
  );
}
