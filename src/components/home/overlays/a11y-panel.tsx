"use client";

import { useEffect, useState } from "react";
import { useApp, type A11yProfile, type CursorId } from "@/store/app-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Eye,
  Focus,
  Type,
  Hand,
  ZapOff,
  Palette,
  Accessibility,
  Flag,
  Check,
  MousePointer2,
  MousePointer,
} from "lucide-react";

const PROFILES: { id: A11yProfile; label: string; blurb: string; icon: React.ReactNode }[] = [
  { id: "low-vision", label: "Low vision", blurb: "Larger text, stronger contrast, thicker focus rings", icon: <Eye className="h-4 w-4" /> },
  { id: "adhd", label: "Focus friendly", blurb: "Calmer surfaces, no marquees, quieter imagery", icon: <Focus className="h-4 w-4" /> },
  { id: "dyslexia", label: "Dyslexia", blurb: "Wider letter and word spacing, taller lines", icon: <Type className="h-4 w-4" /> },
  { id: "motor", label: "Motor impaired", blurb: "Bigger targets, no hover only tricks, no cursor toys", icon: <Hand className="h-4 w-4" /> },
  { id: "epilepsy", label: "Seizure safe", blurb: "All motion frozen, no looping animation", icon: <ZapOff className="h-4 w-4" /> },
  { id: "colorblind", label: "Colour blind", blurb: "Cluster hues remapped to safe luminance steps", icon: <Palette className="h-4 w-4" /> },
];

const CURSOR_OPTIONS: { id: CursorId; label: string; blurb: string; icon: React.ReactNode }[] = [
  { id: "custom", label: "Custom cursor", blurb: "The signature IBL pointer", icon: <MousePointer2 className="h-4 w-4" /> },
  { id: "system", label: "System cursor", blurb: "Your operating system default", icon: <MousePointer className="h-4 w-4" /> },
];

export function A11yPanel() {
  const [open, setOpen] = useState(false);
  const a11y = useApp((s) => s.a11y);
  const setA11y = useApp((s) => s.setA11y);
  const reducedMotion = useApp((s) => s.reducedMotion);
  const setReducedMotion = useApp((s) => s.setReducedMotion);
  const cursor = useApp((s) => s.cursor);
  const setCursor = useApp((s) => s.setCursor);
  const [barrierSent, setBarrierSent] = useState(false);

  useEffect(() => {
    const openIt = () => setOpen(true);
    window.addEventListener("ibl:open-a11y", openIt);
    return () => window.removeEventListener("ibl:open-a11y", openIt);
  }, []);

  const reportBarrier = async () => {
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "barrier", details: "Reported from the accessibility panel" }),
      });
    } catch {
      /* silent, the toast still thanks them */
    }
    setBarrierSent(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glass-strong max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg tracking-tight">
            <Accessibility className="h-5 w-5 text-teal" />
            Accessibility profiles
          </DialogTitle>
          <DialogDescription className="caption">
            Your profile follows you across visits on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <button
            onClick={() => setA11y("none")}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
              a11y === "none" ? "border-teal/60 bg-teal/10" : "border-border hover:bg-foreground/5"
            }`}
          >
            <span>Standard experience</span>
            {a11y === "none" && <Check className="h-4 w-4 text-teal" />}
          </button>
          {PROFILES.map((p) => (
            <button
              key={p.id}
              onClick={() => setA11y(p.id)}
              aria-pressed={a11y === p.id}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                a11y === p.id ? "border-teal/60 bg-teal/10" : "border-border hover:bg-foreground/5"
              }`}
            >
              <span className="mt-0.5 text-teal">{p.icon}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{p.label}</span>
                <span className="caption block text-[11px]">{p.blurb}</span>
              </span>
              {a11y === p.id && <Check className="mt-1 h-4 w-4 text-teal" />}
            </button>
          ))}
        </div>

        {/* Cursor preference, the house pointer or the OS default */}
        <div className="mt-2 rounded-2xl border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Cursor</p>
            <p className="caption text-[11px]">The house pointer, or your system default</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label="Cursor preference">
            {CURSOR_OPTIONS.map((o) => {
              const active = cursor === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setCursor(o.id)}
                  aria-pressed={active}
                  className={`flex flex-col gap-2 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                    active ? "border-teal/60 bg-teal/10" : "border-border hover:bg-foreground/5"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-teal">{o.icon}</span>
                    {active ? (
                      <Check className="h-4 w-4 text-teal" aria-hidden />
                    ) : (
                      <span className="h-4 w-4" aria-hidden />
                    )}
                  </span>
                  <span className="block text-sm font-medium">{o.label}</span>
                  <span className="caption block text-[11px]">{o.blurb}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-2xl border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Reduce all motion</p>
            <p className="caption text-[11px]">Freezes assembly, marquees and canvases</p>
          </div>
          <Switch
            checked={reducedMotion || a11y === "epilepsy"}
            onCheckedChange={(v) => {
              if (v) {
                setReducedMotion(true);
              } else {
                setReducedMotion(false);
                if (a11y === "epilepsy") setA11y("none");
              }
            }}
            aria-label="Reduce all motion"
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
          <p className="caption text-[11px]">
            Something still in your way? One tap and the team reviews it.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={reportBarrier}
            disabled={barrierSent}
            className="min-h-11 shrink-0 rounded-full"
          >
            {barrierSent ? "Thank you" : <><Flag className="mr-1.5 h-3.5 w-3.5" /> Report a barrier</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
