"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BRAND, CLUSTERS } from "@/lib/brand";
import { PEOPLE } from "@/lib/data/people";
import { Briefcase, Handshake, FileText, Newspaper, MapPin, MessageCircle, ExternalLink } from "lucide-react";

type BuilderKind = "report" | "jobs" | "partner" | "presskit";

export function BuilderBridge() {
  const [kind, setKind] = useState<BuilderKind | null>(null);
  const [jobCountry, setJobCountry] = useState<string | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind: BuilderKind; country?: string };
      if (!detail?.kind) return;
      setJobCountry(detail.country ?? null);
      setKind(detail.kind);
    };
    window.addEventListener("ibl:open-builder", onOpen);
    return () => window.removeEventListener("ibl:open-builder", onOpen);
  }, []);

  const close = () => setKind(null);

  const triggerInPage = (sectionId: string, buttonId: string) => {
    close();
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        document.getElementById(buttonId)?.click();
      }, 700);
    });
  };

  const kenyaPeople = PEOPLE.filter((p) => p.country === "Kenya");
  const countryLabel = jobCountry ?? "the region";

  return (
    <Dialog open={kind !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent className="glass-strong max-w-lg rounded-3xl">
        {kind === "jobs" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg tracking-tight">
                <Briefcase className="h-5 w-5 text-teal" />
                Careers {jobCountry ? `in ${jobCountry}` : "across the group"}
              </DialogTitle>
              <DialogDescription className="caption">
                Forty thousand people, twenty countries, four clusters of craft.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm leading-relaxed">
              {jobCountry === "Kenya" && (
                <div className="rounded-2xl border border-border p-4">
                  <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-teal">
                    <MapPin className="h-3.5 w-3.5" /> Kenya today
                  </p>
                  <p className="mt-2">
                    Naivas anchors the retail cluster across the Rift Valley and beyond, with store
                    operations, fresh produce and logistics roles opening through the year.
                  </p>
                  {kenyaPeople.length > 0 && (
                    <p className="caption mt-2">
                      Field voices to start with: {kenyaPeople.map((p) => p.name).join(", ")}.
                    </p>
                  )}
                </div>
              )}
              <p>
                Roles move across {CLUSTERS.map((c) => c.name.toLowerCase()).join(", ")}. From the
                first store aisle to the dry dock, from grain contracts to resort kitchens.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://iblgroup.com/careers/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-teal px-5 text-sm font-medium text-[#06131A] hover:brightness-110"
                >
                  All open roles <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent("Hello IBL, I would like to talk about career opportunities.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[#25D366]/50 px-5 text-sm hover:bg-[#25D366]/10"
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366]" /> Ask on WhatsApp
                </a>
              </div>
            </div>
          </>
        )}

        {kind === "partner" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg tracking-tight">
                <Handshake className="h-5 w-5 text-teal" />
                Partner with the group
              </DialogTitle>
              <DialogDescription className="caption">
                Hands-on operators and active investors. We build side by side.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm leading-relaxed">
              <p>
                The group carries more than four hundred brands, has held the Caterpillar dealership
                since 1929, dry docks French Navy frigates at CNOI and runs cold chains across two oceans.
              </p>
              <ul className="space-y-2">
                {CLUSTERS.map((c) => (
                  <li key={c.id} className="flex items-baseline gap-2">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span>
                      <strong className="font-medium">{c.name}</strong>{" "}
                      <span className="text-muted-foreground">{c.tagline.toLowerCase()}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:info@iblgroup.com?subject=${encodeURIComponent("Partnership enquiry")}`}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-teal px-5 text-sm font-medium text-[#06131A] hover:brightness-110"
                >
                  Write to the group
                </a>
                <a
                  href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent("Hello IBL, I would like to discuss a partnership.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-[#25D366]/50 px-5 text-sm hover:bg-[#25D366]/10"
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp
                </a>
              </div>
            </div>
          </>
        )}

        {kind === "report" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg tracking-tight">
                <FileText className="h-5 w-5 text-teal" />
                Your annual report, one tap away
              </DialogTitle>
              <DialogDescription className="caption">
                Pick the chapters you care about, print or save as PDF.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm leading-relaxed">
              The builder assembles a fresh document from live figures: financial highlights, cluster
              reviews, dividends, sustainability and governance.
            </p>
            <Button
              className="mt-2 h-12 w-full rounded-full bg-teal text-[#06131A] hover:bg-teal/90"
              onClick={() => triggerInPage("investors", "report-builder-trigger")}
            >
              Open the builder
            </Button>
          </>
        )}

        {kind === "presskit" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg tracking-tight">
                <Newspaper className="h-5 w-5 text-teal" />
                Press kit in one tap
              </DialogTitle>
              <DialogDescription className="caption">
                Official logo, fact sheet, boilerplate and verified contacts.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm leading-relaxed">
              Everything citable, nothing invented. Sources on request, verified channels only.
            </p>
            <Button
              className="mt-2 h-12 w-full rounded-full bg-teal text-[#06131A] hover:bg-teal/90"
              onClick={() => triggerInPage("newsroom", "press-kit-trigger")}
            >
              Assemble the kit
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
