"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Printer,
  Share2,
  ShieldCheck,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { T } from "@/components/home/t";
import { PULSE_ANCHORS, TRUSTED_CHANNELS, type VerifiedChannel } from "@/lib/data/trust";
import { pulseMetrics, usePulse } from "@/hooks/use-pulse";
import { useLiveCounter } from "@/hooks/use-count-up";
import { useReveal } from "@/hooks/use-reveal";

const MAGENTA = "var(--trust-accent)";
const TEAL = "var(--ibl-teal)";

const KIND_ICONS: Record<VerifiedChannel["kind"], LucideIcon> = {
  domain: Globe,
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
  fax: Printer,
  social: Share2,
};

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  LinkedIn: Linkedin,
  Facebook: Facebook,
  Instagram: Instagram,
  YouTube: Youtube,
};

function ChannelCard({ ch }: { ch: VerifiedChannel }) {
  const socialIcon = ch.kind === "social" ? SOCIAL_ICONS[ch.label] : undefined;
  const Icon = socialIcon ?? KIND_ICONS[ch.kind];
  const isHttp = Boolean(ch.href && ch.href.startsWith("http"));
  /* Numbers stay whole on one line and the verification sits on its own
     quiet row, nothing ever overlaps, whatever the card width. */
  const isNumber = /^[+0-9][0-9 ()-]+$/.test(ch.label);
  const inner = (
    <>
      <span className="flex items-center gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-full"
          style={{ background: `color-mix(in srgb, ${MAGENTA} 12%, transparent)` }}
        >
          <Icon className="size-5" style={{ color: MAGENTA }} aria-hidden />
        </span>
        <span
          className={`min-w-0 flex-1 break-words text-sm font-medium leading-snug ${
            isNumber ? "tabular tracking-tight" : ""
          }`}
        >
          {ch.label}
        </span>
      </span>
      <span className="caption mt-2 block leading-snug">{ch.value}</span>
      <span
        className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-1"
        style={{ borderColor: `color-mix(in srgb, ${TEAL} 45%, transparent)`, color: TEAL }}
      >
        <BadgeCheck className="size-3.5" aria-hidden />
        <span className="caption tracking-[0.14em]">Verified</span>
      </span>
    </>
  );

  if (ch.href) {
    return (
      <a
        href={ch.href}
        {...(isHttp ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        className="glass lift flex min-h-11 flex-col items-stretch gap-0 rounded-2xl p-4"
        aria-label={`${ch.label}, ${ch.value}, verified channel`}
      >
        {inner}
      </a>
    );
  }
  return (
    <div
      className="glass lift flex min-h-11 flex-col items-stretch gap-0 rounded-2xl p-4"
      aria-label={`${ch.label}, ${ch.value}, verified channel`}
    >
      {inner}
    </div>
  );
}

/* ------------------------------------------------ report dialog */

type ReportState = "idle" | "sending" | "done" | "error";

function ReportImpersonationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const channels = Array.from(new Set(TRUSTED_CHANNELS.map((c) => c.label)));
  const [channel, setChannel] = useState(channels[0] ?? "Other");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<ReportState>("idle");
  const [refCode, setRefCode] = useState<string | null>(null);

  const submit = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "impersonation", channel, details }),
      });
      if (!res.ok) throw new Error("bad status");
      const json = (await res.json().catch(() => ({}))) as { id?: string | number };
      setRefCode(json.id !== undefined ? String(json.id) : null);
      setState("done");
    } catch {
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setDetails("");
    setRefCode(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o && state === "done") reset();
      }}
    >
      <DialogContent className="max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:rounded-t-3xl max-md:border-b-0 sm:max-w-lg">
        {state === "done" ? (
          <div className="py-6 text-center">
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="mx-auto grid size-16 place-items-center rounded-full"
              style={{ background: "color-mix(in srgb, #2FA96E 16%, transparent)" }}
            >
              <Check className="size-8" style={{ color: "#2FA96E" }} aria-hidden />
            </motion.div>
            <DialogTitle className="mt-4 text-lg font-medium">Thank you.</DialogTitle>
            <DialogDescription className="caption mt-2">
              The security team will review it. Reports like this one keep the verified list honest.
            </DialogDescription>
            {refCode && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/40 px-4 py-1.5 text-sm">
                <span className="caption">Reference</span>
                <span className="tabular font-medium">{refCode}</span>
              </p>
            )}
            <div className="mt-6">
              <Button variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-5" style={{ color: MAGENTA }} aria-hidden />
                  Report an impersonation
                </span>
              </DialogTitle>
              <DialogDescription>
                Which channel was impersonated, and anything you noticed. Screenshots help, keep them to yourself for
                now.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              <RadioGroup value={channel} onValueChange={setChannel} className="grid gap-2 sm:grid-cols-2">
                {channels.map((c) => (
                  <div
                    key={c}
                    className="flex min-h-11 items-center gap-3 rounded-lg border border-border/40 px-3"
                  >
                    <RadioGroupItem value={c} id={`rep-ch-${c.replace(/\W/g, "")}`} />
                    <Label htmlFor={`rep-ch-${c.replace(/\W/g, "")}`} className="text-sm font-normal">
                      {c}
                    </Label>
                  </div>
                ))}
                <div className="flex min-h-11 items-center gap-3 rounded-lg border border-border/40 px-3">
                  <RadioGroupItem value="Other" id="rep-ch-other" />
                  <Label htmlFor="rep-ch-other" className="text-sm font-normal">
                    Other
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="mt-4">
              <Label htmlFor="rep-details" className="text-sm font-medium">
                Details, optional
              </Label>
              <Textarea
                id="rep-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Where you saw it, what it asked for, anything else useful."
                className="mt-2 min-h-24"
              />
            </div>

            {state === "error" && (
              <p className="caption mt-3 flex items-center gap-2" style={{ color: MAGENTA }}>
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                That did not go through. The connection may have dropped, try again.
              </p>
            )}

            <DialogFooter>
              {state === "error" && (
                <Button variant="outline" className="min-h-11" onClick={reset}>
                  Edit report
                </Button>
              )}
              <Button
                className="min-h-11 rounded-full border-transparent bg-[#D63384] text-white hover:bg-[#D63384]/90"
                disabled={state === "sending"}
                onClick={submit}
              >
                {state === "sending" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Sending
                  </>
                ) : (
                  "Send report"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------ barrier dialog */

function BarrierDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "barrier", details: text }),
      });
    } catch {
      // quiet by design, the visitor's note is the point
    }
    setSending(false);
    onOpenChange(false);
    setText("");
    toast("Thank you, the accessibility team will review it");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:rounded-t-3xl max-md:border-b-0">
        <DialogHeader>
          <DialogTitle>Report a barrier</DialogTitle>
          <DialogDescription>
            Something on this page hard to use, see, hear or reach? One line is enough.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="For example, the contrast on the chart, or a control too small to tap."
          aria-label="What was difficult"
          className="min-h-28"
        />
        <DialogFooter>
          <Button variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button className="min-h-11" disabled={sending} onClick={submit}>
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Sending
              </>
            ) : (
              "Send note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------ section */

export function TrustCenterSection() {
  const { ref: headerRef, style: headerStyle } = useReveal<HTMLDivElement>("s");
  const pulse = usePulse();
  const metrics = pulseMetrics(pulse);
  const fraud = useLiveCounter(PULSE_ANCHORS.fraudPerDay / 86400, metrics.fraudBlocked, 0);

  const [reportOpen, setReportOpen] = useState(false);
  const [barrierOpen, setBarrierOpen] = useState(false);

  return (
    <section
      id="trust"
      aria-labelledby="trust-title"
      className="trust-band grain relative scroll-mt-24 overflow-hidden py-20 sm:py-28"
    >
      <div className="relative z-[1] mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} style={headerStyle}>
          <p className="eyebrow flex items-center gap-2">
            <ShieldCheck className="size-4" style={{ color: MAGENTA }} aria-hidden />
            Trust center
          </p>
          <h2 id="trust-title" className="h-section mt-3 font-semibold tracking-tight">
            <T k="trust.title" />
          </h2>
          <p className="caption mt-4 max-w-xl text-base">
            <T k="trust.blurb" />
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex flex-col gap-6">
            <div className="glass rounded-2xl p-6">
              <p className="eyebrow flex items-center gap-3" style={{ color: MAGENTA }}>
                Live
                <span className="live-dot" style={{ ["--ibl-teal" as string]: MAGENTA }} aria-hidden />
              </p>
              <p className="h-display tabular mt-4 text-5xl sm:text-6xl" style={{ color: MAGENTA }}>
                {fraud.formatted}
              </p>
              <p className="caption mt-3 max-w-xs">
                Impersonation attempts blocked this year across our domains and channels.
              </p>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{ borderColor: `color-mix(in srgb, ${MAGENTA} 35%, transparent)` }}
            >
              <p className="caption flex items-start gap-3 text-base leading-relaxed">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" style={{ color: MAGENTA }} aria-hidden />
                We never ask for payment to private accounts. Verify on this page before you act.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="min-h-11 rounded-full border-transparent bg-[#D63384] text-white hover:bg-[#D63384]/90"
                onClick={() => setReportOpen(true)}
              >
                <ShieldCheck className="size-4" aria-hidden />
                <T k="trust.report" />
              </Button>
              <button
                type="button"
                onClick={() => setBarrierOpen(true)}
                className="caption min-h-11 self-start rounded-full px-2 text-left underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Report a barrier instead
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {TRUSTED_CHANNELS.map((ch) => (
              <ChannelCard key={`${ch.kind}-${ch.label}`} ch={ch} />
            ))}
          </div>
        </div>
      </div>

      <ReportImpersonationDialog open={reportOpen} onOpenChange={setReportOpen} />
      <BarrierDialog open={barrierOpen} onOpenChange={setBarrierOpen} />
    </section>
  );
}
