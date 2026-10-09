"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/store/app-store";
import { LENS_LIST } from "@/lib/lens";
import { T } from "./t";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Search,
  Accessibility,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Languages,
} from "lucide-react";
import { EASE } from "@/lib/brand";
import { IblOfficialMark } from "./ibl-mark";

type Grade = "light" | "sepia" | "abyss";

/* Small teal labels lean toward brand ink so 10-14px text keeps AA contrast
   on paper glass (deep teal alone sits near 3:1 on ivory), and toward light on
   the dark grades where the bright teal already glows. One var mix, both ways. */
const TEAL_TEXT = "color-mix(in srgb, var(--ibl-teal) 72%, var(--foreground))";

/** Live grade read from the root html and followed across regrades, so the
 *  auto sunrise theme keeps the chrome honest without a reload. Mirrors the
 *  pattern the constellation uses. */
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

/* Heritage gold marks. On paper glass the raw golds sit too close to the sheet,
   so they deepen toward brand ink, pressed like an old seal. Dark grades keep
   the luminous vault gold untouched. */
const NAV_GRADE_CSS = `
.hist-mark { color: #c9a35a; }
.hist-mark-soft { color: #d6b268; }
html[data-theme="light"] .hist-mark,
html[data-theme="sepia"] .hist-mark {
  color: color-mix(in srgb, #c9a35a 55%, var(--foreground));
}
html[data-theme="light"] .hist-mark-soft,
html[data-theme="sepia"] .hist-mark-soft {
  color: color-mix(in srgb, #d6b268 55%, var(--foreground));
}
/* Paper grade: the scrolled bar carries a nearly-solid warm cream sheet so
   live figures cannot ghost through and the frost never reads as cool acrylic:
   the base leans ivory, opacity rises to 94 percent, and the backdrop loses the
   saturate boost that amplifies teal photography underneath. Dark grades keep
   the standard .glass depth untouched. */
html[data-theme="light"] .nav-paper.glass,
html[data-theme="sepia"] .nav-paper.glass {
  background: color-mix(in srgb, #fdf8ec 94%, transparent);
  border-color: rgba(33, 41, 121, 0.16);
  backdrop-filter: blur(18px) saturate(1.02);
  -webkit-backdrop-filter: blur(18px) saturate(1.02);
}
/* Over-hero ink. At rest the bar floats transparent over the hero film and
   the right-hand controls sit over open footage (the veil only covers the
   typography zone), so the paper grades print those controls in paper-white
   until the first scroll frosts the bar and the ink returns. The logo and
   the section links stay ink: they live over the heavy ivory side of the
   veil. Scope is class-gated so dropdown panels never inherit the white. */
html[data-theme="light"] header.nav-hero .nav-ink,
html[data-theme="sepia"] header.nav-hero .nav-ink {
  color: rgba(255, 255, 255, 0.95);
}
html[data-theme="light"] header.nav-hero .nav-ink:hover,
html[data-theme="sepia"] header.nav-hero .nav-ink:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.16);
}
html[data-theme="light"] header.nav-hero .nav-kbd,
html[data-theme="sepia"] header.nav-hero .nav-kbd {
  background: rgba(255, 255, 255, 0.22);
  color: rgba(255, 255, 255, 0.9);
}
html[data-theme="light"] header.nav-hero .nav-lens,
html[data-theme="sepia"] header.nav-hero .nav-lens {
  border-color: rgba(255, 255, 255, 0.38);
  background: rgba(255, 255, 255, 0.1);
}
html[data-theme="light"] header.nav-hero .nav-lens button,
html[data-theme="sepia"] header.nav-hero .nav-lens button {
  color: rgba(255, 255, 255, 0.8);
}
html[data-theme="light"] header.nav-hero .nav-lens button:hover,
html[data-theme="sepia"] header.nav-hero .nav-lens button:hover {
  color: #ffffff;
}
`;

/** Historical marks, simplified tributes. Hold the logo to travel the vault. */
const MARKS = [
  { id: "1830", label: "Blyth Brothers, 1830", node: <BlythMark /> },
  { id: "1850", label: "Ireland Fraser and Co, 1850", node: <IrelandMark /> },
  { id: "1972", label: "Ireland Blyth Ltd, 1972", node: <IrelandBlythMark /> },
  { id: "2016", label: "IBL Ltd, 2016", node: <IblLtdMark teal="var(--ibl-teal)" /> },
  { id: "now", label: "IBL, today", node: <CurrentMark /> },
];

export function SiteNav() {
  const lens = useApp((s) => s.lens);
  const setLens = useApp((s) => s.setLens);
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const sound = useApp((s) => s.sound);
  const setSound = useApp((s) => s.setSound);
  const setPaletteOpen = useApp((s) => s.setPaletteOpen);

  const [scrolled, setScrolled] = useState(false);
  const [markIndex, setMarkIndex] = useState(4);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const startHold = () => {
    holdTimer.current = setTimeout(() => {
      setHolding(true);
      cycleTimer.current = setInterval(() => {
        setMarkIndex((i) => (i + 1) % MARKS.length);
      }, 900);
    }, 450);
  };
  const endHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (cycleTimer.current) clearInterval(cycleTimer.current);
    if (holding) {
      setTimeout(() => {
        setHolding(false);
        setMarkIndex(4);
      }, 1400);
    }
  };
  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (cycleTimer.current) clearInterval(cycleTimer.current);
    };
  }, [holding]);

  const links = [
    { id: "timemachine", label: <T k="nav.history" /> },
    { id: "clusters", label: <T k="nav.clusters" /> },
    { id: "mosaic", label: <T k="nav.people" /> },
    { id: "newsroom", label: <T k="nav.newsroom" /> },
    { id: "trust", label: <T k="nav.contact" /> },
  ];

  const go = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const lensTemp = LENS_LIST.find((l) => l.id === lens)?.temperature ?? "var(--ibl-teal)";
  /* Paper grades carry the lens pill in ink, dark grades in the lens temperature.
     Either way text-background keeps the contrast. The grade is read live from the
     root so the auto theme resolves the same way the sheet does. */
  const grade = useGrade();
  const paper = grade === "light" || grade === "sepia";
  /* Over the hero film the active pill inverts to paper-white with ink text,
     so the switcher stays a confident anchor over open footage */
  const overHero = !scrolled && paper;
  const activePillBg = overHero ? "#FDFBF6" : paper ? "var(--foreground)" : lensTemp;

  return (
    <header
      className={`nav-paper fixed inset-x-0 top-0 z-50 transition-all duration-700 ${
        scrolled ? "glass shadow-teal" : "bg-transparent nav-hero"
      }`}
      style={{ ["--lens-temp" as string]: lensTemp }}
    >
      <style>{NAV_GRADE_CSS}</style>
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 md:h-[72px] max-w-[1600px] items-center gap-3 px-4 md:px-8"
      >
        {/* The logo is a character. Hold it to cycle every historical mark. */}
        <button
          aria-label={`IBL Group logo, hold to browse historical marks. Currently ${MARKS[markIndex].label}`}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={MARKS[markIndex].id}
              initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 0.45, ease: EASE.luxe }}
              className="flex items-center justify-center"
            >
              {MARKS[markIndex].node}
            </motion.span>
          </AnimatePresence>
          {holding && (
            <span
              className="glass absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap caption rounded-full px-2.5 py-1 text-[10px] tracking-[0.22em] uppercase"
              style={{ color: TEAL_TEXT }}
            >
              {MARKS[markIndex].label}
            </span>
          )}
        </button>

        {/* Desktop links */}
        <ul className="ml-2 hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => go(l.id)}
                className="rounded-full px-4 py-2 text-sm text-foreground/80 transition-colors duration-500 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-2"
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Lens switcher, persistent across the visit */}
        <div
          role="radiogroup"
          aria-label="Choose your lens"
          className="nav-lens ml-auto hidden items-center rounded-full border border-border/70 bg-background/40 p-1 backdrop-blur-md sm:flex"
        >
          {LENS_LIST.map((l) => {
            const active = lens === l.id;
            return (
              <button
                key={l.id}
                role="radio"
                aria-checked={active}
                title={l.blurb}
                onClick={() => setLens(l.id)}
                className={`relative rounded-full px-3.5 py-1.5 text-xs font-medium tracking-wide transition-colors duration-500 ${
                  active ? "text-background" : "text-foreground/65 hover:text-foreground"
                }`}
                style={active && overHero ? { color: "#10152E" } : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="lens-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: activePillBg }}
                    transition={{ duration: 0.6, ease: EASE.luxe }}
                  />
                )}
                <span className="relative z-10">{l.label}</span>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="ml-auto flex items-center gap-1 sm:ml-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open command palette, keyboard shortcut Command or Control K"
            onClick={() => setPaletteOpen(true)}
            className="nav-ink relative h-11 w-11 rounded-full"
          >
            <Search className="h-[18px] w-[18px]" />
            <kbd className="nav-kbd absolute -bottom-0.5 right-0 hidden rounded bg-foreground/10 px-1 text-[9px] font-medium tracking-wider md:block">
              ⌘K
            </kbd>
          </Button>

          <div className="hidden items-center gap-1 md:flex">
            <LangMenu lang={lang} setLang={setLang} hero={overHero} />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Theme, currently ${theme}. Cycles abyss, light, OLED, sepia`}
              onClick={() => {
                const order = ["abyss", "light", "oled", "sepia"] as const;
                const next = order[(order.indexOf(theme as "abyss") + 1) % order.length];
                setTheme(next);
              }}
              className="nav-ink h-11 w-11 rounded-full"
            >
              {grade === "light" || grade === "sepia" ? (
                <Sun className="h-[18px] w-[18px]" aria-hidden />
              ) : (
                <Moon className="h-[18px] w-[18px]" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Accessibility profiles"
              onClick={() => window.dispatchEvent(new CustomEvent("ibl:open-a11y"))}
              className="nav-ink h-11 w-11 rounded-full"
            >
              <Accessibility className="h-[18px] w-[18px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={sound ? "Mute ambient sound" : "Enable ambient sound, default off"}
              onClick={() => setSound(!sound)}
              className="nav-ink h-11 w-11 rounded-full"
            >
              {sound ? <Volume2 className="h-[18px] w-[18px]" style={{ color: "var(--ibl-teal)" }} /> : <VolumeX className="h-[18px] w-[18px]" />}
            </Button>
          </div>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="nav-ink h-11 w-11 rounded-full lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="glass-strong w-[300px] p-6">
              <SheetTitle className="eyebrow mb-4 pt-6">Menu</SheetTitle>
              <ul className="mb-6 space-y-1">
                {links.map((l) => (
                  <li key={l.id}>
                    <button
                      onClick={() => go(l.id)}
                      className="w-full rounded-xl px-4 py-3 text-left text-lg hover:bg-foreground/5"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="eyebrow mb-2">Lens</p>
              <div className="mb-6 grid grid-cols-2 gap-2">
                {LENS_LIST.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLens(l.id)}
                    className={`rounded-xl border px-3 py-2.5 text-sm ${
                      lens === l.id ? "border-transparent text-background" : "border-border text-foreground/70"
                    }`}
                    style={lens === l.id ? { background: activePillBg } : undefined}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="eyebrow mb-2">Language</p>
              <div className="mb-6 flex gap-2">
                {(["en", "fr", "cr"] as const).map((lg) => (
                  <button
                    key={lg}
                    onClick={() => setLang(lg)}
                    className={`rounded-full border px-4 py-2 text-sm uppercase ${
                      lang === lg ? "border-teal bg-teal/15" : "border-border text-foreground/60"
                    }`}
                    style={lang === lg ? { color: TEAL_TEXT } : undefined}
                  >
                    {lg}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.dispatchEvent(new CustomEvent("ibl:open-a11y"))}
                >
                  <Accessibility className="mr-2 h-4 w-4" /> A11y
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSound(!sound)}
                  aria-label="Toggle ambient sound"
                >
                  {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

function LangMenu({ lang, setLang, hero }: { lang: string; setLang: (l: "en" | "fr" | "cr") => void; hero?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Language, currently ${lang.toUpperCase()}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={hero ? "nav-ink h-11 w-11 rounded-full" : "h-11 w-11 rounded-full"}
      >
        <Languages className="h-[18px] w-[18px]" />
      </Button>
      {open && (
        <div className="glass-strong absolute right-0 top-12 z-50 w-36 rounded-2xl p-2">
          {(["en", "fr", "cr"] as const).map((lg) => (
            <button
              key={lg}
              onClick={() => {
                setLang(lg);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-foreground/5 ${
                lang === lg ? "font-medium" : ""
              }`}
              style={lang === lg ? { color: TEAL_TEXT } : undefined}
            >
              {lg === "en" ? "English" : lg === "fr" ? "Français" : "Kreol Morisien"}
              <span className="text-[10px] uppercase tracking-widest opacity-60">{lg}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Historical marks, drawn tributes ---------- */

/* The current mark is the official lockup, exact geometry from the group's own
   logo file, re-inked per grade: navy on paper, light on the abyss. */
function CurrentMark() {
  return <IblOfficialMark className="h-9 w-auto" />;
}

function BlythMark() {
  return (
    <svg viewBox="0 0 64 64" className="hist-mark h-8 w-8" aria-hidden>
      <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="22"
        fill="currentColor"
        letterSpacing="1"
      >
        BB
      </text>
    </svg>
  );
}

function IrelandMark() {
  return (
    <svg viewBox="0 0 64 64" className="hist-mark-soft h-8 w-8" aria-hidden>
      <rect x="6" y="6" width="52" height="52" fill="none" stroke="currentColor" strokeWidth="2" />
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="17"
        fill="currentColor"
        fontStyle="italic"
      >
        IF
      </text>
    </svg>
  );
}

function IrelandBlythMark() {
  return (
    <svg viewBox="0 0 120 44" className="hist-mark h-7 w-auto" aria-hidden>
      <rect x="0" y="0" width="44" height="44" fill="#1D2760" />
      <text x="22" y="30" textAnchor="middle" fontFamily="Georgia, serif" fontSize="18" fill="currentColor">
        IB
      </text>
      <text x="52" y="30" fontFamily="Georgia, serif" fontSize="13" className="fill-foreground" opacity="0.85">
        Ireland Blyth
      </text>
    </svg>
  );
}

function IblLtdMark({ teal }: { teal: string }) {
  return (
    <svg viewBox="0 0 96 48" className="h-8 w-auto" aria-hidden>
      {/* 2016 mark, but the accent square still follows the live grade */}
      <rect width="10" height="10" style={{ fill: teal }} />
      <text x="16" y="34" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="26" fill="currentColor" letterSpacing="2">
        IBL
      </text>
      <text x="17" y="44" fontFamily="Arial, sans-serif" fontSize="7" fill="currentColor" opacity="0.6" letterSpacing="3">
        LTD
      </text>
    </svg>
  );
}
