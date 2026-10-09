"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { pulseMetrics, usePulse } from "@/hooks/use-pulse";
import { useLiveCounter } from "@/hooks/use-count-up";
import { PULSE_ANCHORS } from "@/lib/data/trust";

const EASE_LUXE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* Paper grade rules, scoped to the HUD (dark grades stay untouched).
   On ivory the live dot's luminous halo would read as a glow, so it becomes
   a thin pressed teal ring, like a stamp on the sheet. */
const GRADE_CSS = `
html[data-theme="light"] .live-dot.hud-dot::after,
html[data-theme="sepia"] .live-dot.hud-dot::after {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ibl-teal) 22%, transparent);
}
`;

export interface BreakdownRow {
  label: string;
  value: string;
  color?: string;
}

interface BreakdownPopoverProps {
  title: string;
  rows: BreakdownRow[];
  children: ReactNode;
  align?: "start" | "center";
  className?: string;
}

/**
 * Hover or focus any wrapped figure and a glass breakdown appears above it.
 * Keyboard accessible, touch taps toggle it.
 */
export function BreakdownPopover({ title, rows, children, align = "center", className }: BreakdownPopoverProps) {
  const [open, setOpen] = useState(false);
  const x0 = align === "center" ? "-50%" : 0;

  return (
    <span className={cn("relative", className)}>
      <button
        type="button"
        className="min-h-[44px] cursor-default text-left"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${title} breakdown`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        {children}
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 6, x: x0, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, x: x0, scale: 1 }}
            exit={{ opacity: 0, y: 6, x: x0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE_LUXE }}
            className={cn(
              "glass-strong pointer-events-none absolute bottom-full z-50 mb-2 block w-60 rounded-xl border border-foreground/10 p-3",
              align === "center" ? "left-1/2" : "left-0"
            )}
          >
            <span className="eyebrow mb-2 block">{title}</span>
            {rows.map((row) => (
              <span key={row.label} className="flex items-center justify-between gap-3 py-0.5">
                <span className="flex items-center gap-2 text-xs text-foreground/85">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: row.color ?? "var(--muted-foreground)" }}
                  />
                  {row.label}
                </span>
                <span className="tabular text-xs font-medium">{row.value}</span>
              </span>
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

const REVENUE_ROWS: BreakdownRow[] = [
  { label: "Retail", value: "47% · MU KE RE", color: "var(--cluster-retail)" },
  { label: "CBD", value: "25% · MU MG", color: "var(--cluster-cbd)" },
  { label: "Industrials", value: "16% · MU MG", color: "var(--cluster-industrials)" },
  { label: "Services", value: "12% · MU RE", color: "var(--cluster-services)" },
];

const TRANSACTION_ROWS: BreakdownRow[] = [
  { label: "Retail", value: "71%", color: "var(--cluster-retail)" },
  { label: "CBD", value: "18%", color: "var(--cluster-cbd)" },
  { label: "Services", value: "11%", color: "var(--cluster-services)" },
];

const MEAL_ROWS: BreakdownRow[] = [
  { label: "Services", value: "52% · resorts", color: "var(--cluster-services)" },
  { label: "Retail", value: "48%", color: "var(--cluster-retail)" },
];

const FRAUD_ROWS: BreakdownRow[] = [
  { label: "Phishing", value: "54%" },
  { label: "Fake profiles", value: "31%" },
  { label: "Fake invoices", value: "15%" },
];

interface MetricDef {
  id: string;
  label: string;
  value: string;
  rows: BreakdownRow[];
}

export function PulseHud() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);

  /* the hero already carries the live signals, the HUD rests while it fills the screen */
  useEffect(() => {
    const onScroll = () => {
      setHeroVisible(window.scrollY < window.innerHeight * 0.72);
    };
    const t = setTimeout(onScroll, 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const pulse = usePulse();
  const m = pulseMetrics(pulse);
  const ready = pulse !== null;

  const revenue = useLiveCounter(PULSE_ANCHORS.revenuePerSecond, m.revenueToday);
  const transactions = useLiveCounter(PULSE_ANCHORS.transactionsPerSecond, m.transactionsToday);
  const meals = useLiveCounter(PULSE_ANCHORS.mealsPerSecond, m.mealsToday);
  const fraud = useLiveCounter(PULSE_ANCHORS.fraudPerDay / 86400, m.fraudBlocked);

  const metrics: MetricDef[] = [
    {
      id: "revenue",
      label: "Revenue today",
      value: ready ? `Rs ${(revenue.value / 1e6).toFixed(1)}M` : "…",
      rows: REVENUE_ROWS,
    },
    {
      id: "transactions",
      label: "Transactions",
      value: ready ? Math.floor(transactions.value).toLocaleString("en-US") : "…",
      rows: TRANSACTION_ROWS,
    },
    {
      id: "meals",
      label: "Meals served",
      value: ready ? Math.floor(meals.value).toLocaleString("en-US") : "…",
      rows: MEAL_ROWS,
    },
    {
      id: "fraud",
      label: "Fraud blocked",
      value: ready ? Math.floor(fraud.value).toLocaleString("en-US") : "…",
      rows: FRAUD_ROWS,
    },
  ];

  /* one metric at a time on small screens */
  useEffect(() => {
    if (collapsed) return;
    const id = setInterval(() => setMobileIndex((i) => (i + 1) % metrics.length), 6000);
    return () => clearInterval(id);
  }, [collapsed, metrics.length]);

  if (collapsed) {
    return (
      <AnimatePresence>
        {!heroVisible && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.5, ease: EASE_LUXE }}
            className="no-print fixed bottom-0 left-0 z-40 p-3 sm:p-4"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <style>{GRADE_CSS}</style>
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Expand the live pulse"
              className="glass inline-flex min-h-[44px] items-center gap-2 rounded-full px-3.5 py-2"
              style={{ background: "color-mix(in srgb, var(--popover) 94%, transparent)" }}
            >
              <span className="live-dot hud-dot" aria-hidden />
              <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const current = metrics[mobileIndex] ?? metrics[0];

  return (
    <AnimatePresence>
      {!heroVisible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.55, ease: EASE_LUXE }}
          className="no-print fixed bottom-0 left-0 z-40 p-3 sm:p-4"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
      <style>{GRADE_CSS}</style>
      {/* desktop, all four in one glass bar. The inline background leans on
          --popover so the bar keeps its paper (or abyss) grade even when it
          floats over dark duotone photography. */}
      <div
        className="glass shadow-teal hidden items-stretch rounded-2xl md:flex md:divide-x md:divide-border"
        style={{ background: "color-mix(in srgb, var(--popover) 94%, transparent)" }}
      >
        {metrics.map((metric) => (
          <BreakdownPopover key={metric.id} title={metric.label} rows={metric.rows} align="start" className="px-4 py-2.5">
            <span className="block">
              <span className="tabular block text-sm font-semibold leading-tight">{metric.value}</span>
              <span
                className="caption mt-0.5 flex items-center gap-2 text-[0.66rem]"
                /* the label leans toward ink on paper and toward light on abyss,
                   one var mix keeps both grades comfortably readable */
                style={{ color: "color-mix(in srgb, var(--muted-foreground) 45%, var(--foreground))" }}
              >
                <span className="live-dot hud-dot" aria-hidden />
                {metric.label}
              </span>
            </span>
          </BreakdownPopover>
        ))}
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse the live pulse"
          aria-expanded={false}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center px-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronsDownUp className="size-4" aria-hidden />
        </button>
      </div>

      {/* mobile, cycling */}
      <div
        className="glass shadow-teal flex items-center rounded-2xl md:hidden"
        style={{ background: "color-mix(in srgb, var(--popover) 94%, transparent)" }}
      >
        <div className="min-h-[44px] min-w-[12.5rem] px-1 py-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.35, ease: EASE_LUXE }}
            >
              <BreakdownPopover title={current.label} rows={current.rows} align="start">
                <span className="flex items-center gap-3 px-3 py-2">
                  <span className="tabular text-sm font-semibold">{current.value}</span>
                  <span
                    className="caption flex items-center gap-2 text-[0.66rem]"
                    style={{ color: "color-mix(in srgb, var(--muted-foreground) 45%, var(--foreground))" }}
                  >
                    <span className="live-dot hud-dot" aria-hidden />
                    {current.label}
                  </span>
                </span>
              </BreakdownPopover>
            </motion.div>
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse the live pulse"
          aria-expanded={false}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center px-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronsDownUp className="size-4" aria-hidden />
        </button>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
