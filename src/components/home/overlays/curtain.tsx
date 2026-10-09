"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePulse, localPulse } from "@/hooks/use-pulse";
import { COUNTRIES } from "@/lib/data/countries";
import { SUBSIDIARIES } from "@/lib/data/subsidiaries";
import { PEOPLE } from "@/lib/data/people";
import { Activity, Database, Gauge, Image as ImageIcon, Radio, ShieldCheck } from "lucide-react";

/**
 * Behind the curtain. Live build status and performance stats,
 * honest about what is live and what is modelled.
 */
export function CurtainPanel() {
  const [open, setOpen] = useState(false);
  const pulse = usePulse();

  useEffect(() => {
    const openIt = () => setOpen(true);
    window.addEventListener("ibl:open-curtain", openIt);
    return () => window.removeEventListener("ibl:open-curtain", openIt);
  }, []);

  const [stats, setStats] = useState<{ loadMs: number; weightKb: number; resources: number; imgs: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      try {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        const resources = performance.getEntriesByType("resource");
        const weight = resources.reduce((acc, r) => acc + ((r as PerformanceResourceTiming).transferSize || 0), 0);
        setStats({
          loadMs: Math.round(nav?.domContentLoadedEventEnd ?? 0),
          weightKb: Math.round(weight / 1024),
          resources: resources.length,
          imgs: document.querySelectorAll("img").length,
        });
      } catch {
        setStats({ loadMs: 0, weightKb: 0, resources: 0, imgs: 0 });
      }
    }, 50);
    return () => clearTimeout(t);
  }, [open]);

  const p = pulse ?? localPulse();
  const modelled = p.weather.live ? "live, open meteo, Port Louis" : "modelled, seasonal fallback";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-strong max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg tracking-tight">
            <Activity className="h-5 w-5 text-teal" />
            Behind the curtain
          </DialogTitle>
          <DialogDescription className="caption">
            What is breathing under this page, right now.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat icon={<Gauge className="h-4 w-4" />} label="Interactive load" value={stats ? `${(stats.loadMs / 1000).toFixed(2)} s` : "…"} />
          <Stat icon={<Database className="h-4 w-4" />} label="Transferred" value={stats ? `${stats.weightKb} KB` : "…"} />
          <Stat icon={<Radio className="h-4 w-4" />} label="Resources" value={stats ? `${stats.resources}` : "…"} />
          <Stat icon={<ImageIcon className="h-4 w-4" />} label="Images on page" value={stats ? `${stats.imgs}` : "…"} />
        </dl>

        <div className="mt-2 space-y-2 rounded-2xl border border-border p-4 text-[13px] leading-relaxed">
          <Row label="Weather over Port Louis" value={modelled} ok={p.weather.live} />
          <Row label="Share ticker" value="delayed simulation anchored at Rs 21.00" ok={false} />
          <Row label="Shipment movement" value="modelled from seeded ocean lanes" ok={false} />
          <Row label="Day counters" value="FY disclosures pro rated by the clock" ok={false} />
          <Row label="Fraud attempts blocked" value="modelled from the trust center scale" ok={false} />
        </div>

        <div className="mt-2 grid grid-cols-3 gap-3 text-center">
          <Mini label="Stars in constellation" value={`${SUBSIDIARIES.length}`} />
          <Mini label="Shores pinned" value={`${COUNTRIES.length}`} />
          <Mini label="Story keepers" value={`${PEOPLE.length}`} />
        </div>

        <p className="caption mt-2 flex items-start gap-2 text-[11px]">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
          Incident reports and engagement events persist in a local SQLite ledger via Prisma. Nothing leaves this machine.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-foreground/[0.03] p-3">
      <dt className="caption flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em]">
        {icon} {label}
      </dt>
      <dd className="tabular mt-1 text-xl font-semibold">{value}</dd>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-[12px]">
        <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${ok ? "bg-teal" : "bg-magenta"}`} />
        {value}
      </span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border px-2 py-3">
      <p className="tabular text-lg font-semibold">{value}</p>
      <p className="caption text-[9px] uppercase tracking-[0.16em]">{label}</p>
    </div>
  );
}
