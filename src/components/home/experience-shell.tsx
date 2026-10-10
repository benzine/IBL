"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "@/store/app-store";
import { LENSES } from "@/lib/lens";
import { EASE } from "@/lib/brand";
import { useLang } from "./t";

import { SiteNav } from "./site-nav";
import { Loader } from "./loader";
import { ScrollProgressBar } from "./scroll-progress";
import { CursorGlow } from "./cursor-glow";
import { CustomCursor } from "./custom-cursor";
import { PulseHud } from "./pulse-hud";
import { SurfaceControl } from "./surface-control";
import { HeroSection } from "./hero";
import { AskPanel } from "./overlays/ask-panel";
import { CommandPalette } from "./overlays/command-palette";
import { A11yPanel } from "./overlays/a11y-panel";
import { LedgerOverlay } from "./overlays/ledger";
import { CurtainPanel } from "./overlays/curtain";
import { BuilderBridge } from "./overlays/builder-bridge";
import { SoundEngine } from "./sound-engine";
import { CopyProtection } from "./copy-protection";
import { PulseSection } from "./pulse-section";
import { TimeMachineSection } from "./time-machine";
import { ConstellationSection } from "./constellation";
import { ClusterFloods } from "./cluster-floods";
import { MovementsBoard } from "./movements-board";
import { BasketApp } from "./basket-app";
import { OceanMapSection } from "./ocean-map";
import { PeopleMosaicSection } from "./people-mosaic";
import { PlanetSection } from "./planet-section";
import { InvestorsSection } from "./investors-section";
import { NewsroomSection } from "./newsroom-section";
import { TrustCenterSection } from "./trust-center";
import { SiteFooter } from "./site-footer";

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  pulse: PulseSection,
  timemachine: TimeMachineSection,
  constellation: ConstellationSection,
  clusters: ClusterFloods,
  movements: MovementsBoard,
  basket: BasketApp,
  map: OceanMapSection,
  mosaic: PeopleMosaicSection,
  planet: PlanetSection,
  investors: InvestorsSection,
  newsroom: NewsroomSection,
  trust: TrustCenterSection,
};

function portLouisIsDay(): boolean {
  const h = (new Date().getUTCHours() + 4) % 24;
  return h >= 6 && h < 18;
}

export function ExperienceShell() {
  const lens = useApp((s) => s.lens);
  const setLens = useApp((s) => s.setLens);
  const theme = useApp((s) => s.theme);
  const a11y = useApp((s) => s.a11y);
  const lang = useLang();
  const reducedMotion = useApp((s) => s.reducedMotion);
  const userAccent = useApp((s) => s.userAccent);
  const sound = useApp((s) => s.sound);

  const [booted, setBooted] = useState(false);
  const [renderedLens, setRenderedLens] = useState(lens);
  const [wipe, setWipe] = useState<"idle" | "in" | "out">("idle");
  const lastTrackedLens = useRef(lens);
  const silentSync = useRef(true);

  /* ---------- Rehydrate the persisted preferences after mount ---------- */
  useEffect(() => {
    useApp.persist.rehydrate();
  }, []);

  /* ---------- Apply theme, a11y, lang, motion to the root ---------- */
  useEffect(() => {
    const root = document.documentElement;
    const resolved =
      theme === "auto" ? (portLouisIsDay() ? "light" : "abyss") : theme;
    root.dataset.theme = resolved;
    root.classList.toggle("dark", resolved === "abyss" || resolved === "oled");
    if (theme === "auto") {
      const id = setInterval(() => {
        const r = portLouisIsDay() ? "light" : "abyss";
        root.dataset.theme = r;
        root.classList.toggle("dark", r === "abyss");
      }, 60000);
      return () => clearInterval(id);
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.a11y = a11y;
    root.dataset.motion = reducedMotion || a11y === "epilepsy" ? "reduced" : "full";
    root.dataset.lens = lens;
    if (userAccent) {
      root.dataset.accent = "custom";
      root.style.setProperty("--user-accent", userAccent);
    } else {
      delete root.dataset.accent;
    }
  }, [a11y, reducedMotion, lens, userAccent]);

  useEffect(() => {
    document.documentElement.lang = lang === "cr" ? "mfe" : lang;
  }, [lang]);

  /* ---------- Lens switching with the teal wipe ---------- */
  // step 1, a new lens while idle begins the cover
  useEffect(() => {
    if (lens === renderedLens) return;
    // the first sync after rehydration happens silently, no wipe
    if (silentSync.current) {
      silentSync.current = false;
      const t = setTimeout(() => setRenderedLens(lens), 0);
      return () => clearTimeout(t);
    }
    if (reducedMotion || a11y === "epilepsy") {
      const t = setTimeout(() => setRenderedLens(lens), 0);
      return () => clearTimeout(t);
    }
    if (wipe === "idle") {
      const t = setTimeout(() => setWipe("in"), 0);
      return () => clearTimeout(t);
    }
  }, [lens, renderedLens, wipe, reducedMotion, a11y]);

  // step 2, fully covered, swap the content and start the reveal
  useEffect(() => {
    if (wipe !== "in") return;
    const t = setTimeout(() => {
      setRenderedLens(useApp.getState().lens);
      setWipe("out");
    }, 600);
    return () => clearTimeout(t);
  }, [wipe]);

  // step 3, reveal finished
  useEffect(() => {
    if (wipe !== "out") return;
    const t = setTimeout(() => setWipe("idle"), 660);
    return () => clearTimeout(t);
  }, [wipe]);

  useEffect(() => {
    if (lens !== lastTrackedLens.current) {
      lastTrackedLens.current = lens;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "lens-switch", meta: lens }),
      }).catch(() => {});
    }
  }, [lens]);

  const order = useMemo(() => LENSES[renderedLens].order, [renderedLens]);
  const lensTemp = LENSES[renderedLens].temperature;

  /* No wrapper background on purpose: the body paints the brand field,
     and the fixed night-grade atmosphere (globals.css, THE NIGHT GRADE
     ATMOSPHERE) lives between the body paint and this content, so every
     open section inherits the cinematic lighting */
  return (
    <div
      className="flex min-h-svh flex-col text-foreground"
      style={{ ["--lens-temp" as string]: lensTemp }}
    >
      {!booted && (
        <Loader
          onDone={() => {
            setBooted(true);
            /* one quiet signal for the layers that greet after the
               loader, the ask desk teaser for one */
            (window as unknown as { __iblBooted?: boolean }).__iblBooted = true;
            window.dispatchEvent(new CustomEvent("ibl:booted"));
          }}
        />
      )}

      <ScrollProgressBar />
      <CursorGlow />
      <CustomCursor />
      <SiteNav />

      <main id="main" className="relative flex-1">
        {/* The lens wipe, a signature teal color transition */}
        <motion.div
          className="fixed inset-0 z-[210] bg-teal"
          initial={false}
          animate={{
            scaleY: wipe === "in" ? 1 : 0,
          }}
          style={{ transformOrigin: wipe === "in" ? "bottom center" : "top center" }}
          transition={{ duration: 0.55, ease: EASE.luxeInOut }}
          aria-hidden
        />

        <HeroSection />

        {/* Sections flow in the order the active lens wants */}
        {order.map((id) => {
          const Comp = SECTION_COMPONENTS[id];
          if (!Comp) return null;
          return (
            <motion.section
              key={id}
              layout
              initial={false}
              transition={{ duration: 0.8, ease: EASE.luxe }}
            >
              <Comp />
            </motion.section>
          );
        })}
      </main>

      {/* Conventional footer, second homepage, sticks to the bottom */}
      <SiteFooter />

      {/* The persistent layer */}
      <PulseHud />
      <SurfaceControl />
      <AskPanel />
      <CommandPalette />
      <A11yPanel />
      <LedgerOverlay />
      <CurtainPanel />
      <BuilderBridge />
      <SoundEngine />
      {/* guards the deployed build only, inert while developing */}
      <CopyProtection />

      {/* Skip link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[400] focus:rounded-full focus:bg-teal focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-[#06131A]"
      >
        Skip to content
      </a>

      {/* Sound state lives on the document for any component that cares */}
      <span className="hidden" data-sound={sound ? "on" : "off"} aria-hidden />
    </div>
  );
}
