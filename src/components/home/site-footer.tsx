"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Accessibility, BadgeCheck, Eye, Mail, MessageCircle, Moon, Phone, Sun } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { T } from "@/components/home/t";
import { IblOfficialMark } from "@/components/home/ibl-mark";
import { BRAND, CLUSTERS } from "@/lib/brand";
import { TRUSTED_CHANNELS } from "@/lib/data/trust";
import { useApp, type LangId, type ThemeId } from "@/store/app-store";

const TEAL = "var(--ibl-teal)";
/* The closing statement leans the teal toward brand ink so the huge tel number
   carries print weight on paper and stays luminous on the dark grades */
const TEAL_INK = "color-mix(in srgb, var(--ibl-teal) 82%, var(--ibl-ink))";

type Grade = "light" | "sepia" | "abyss";

/** Live grade from the root html, so the toaster chrome follows regrades. */
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

/* Paper-grade rules, scoped to the footer (dark grades stay untouched).
   The colophon cards and utility chips get a pressed ink shadow on flat ivory. */
const PAPER_GRADE_CSS = `
html[data-theme="light"] .footer-lift,
html[data-theme="sepia"] .footer-lift {
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--foreground) 10%, transparent),
    0 22px 55px -30px color-mix(in srgb, var(--foreground) 26%, transparent);
  transition: box-shadow 0.7s var(--ease-luxe);
}
html[data-theme="light"] .footer-hairline,
html[data-theme="sepia"] .footer-hairline {
  border-color: color-mix(in srgb, var(--foreground) 22%, transparent);
}
`;

/* Cluster accents resolve through CSS vars so colorblind profiles stay honest */
const clusterVar = (id: string) => `var(--cluster-${id})`;

const GROUP_ANCHORS = [
  { href: "#pulse", label: "Live pulse" },
  { href: "#timemachine", label: "Since 1830" },
  { href: "#constellation", label: "Constellation" },
  { href: "#map", label: "Where we stand" },
  { href: "#mosaic", label: "The people" },
  { href: "#planet", label: "Sustainability" },
  { href: "#investors", label: "Investor room" },
  { href: "#newsroom", label: "Newsroom" },
  { href: "#trust", label: "Trust center" },
];

const MINI_ANCHORS = [
  { href: "#pulse", label: "Pulse" },
  { href: "#timemachine", label: "History" },
  { href: "#constellation", label: "Constellation" },
  { href: "#mosaic", label: "People" },
  { href: "#planet", label: "Planet" },
  { href: "#investors", label: "Investors" },
  { href: "#newsroom", label: "Newsroom" },
  { href: "#trust", label: "Trust" },
];

const THEME_ORDER: ThemeId[] = ["abyss", "light", "oled", "sepia"];

function DirectoryCard({
  title,
  ruleColor,
  children,
  label,
}: {
  title: string;
  ruleColor?: string;
  children: ReactNode;
  label: string;
}) {
  const ruleStyle = (ruleColor ? { "--active-cluster": ruleColor } : {}) as CSSProperties;
  return (
    <nav aria-label={label} className="footer-lift glass rounded-2xl p-5">
      <div className="rule-cluster w-16" style={ruleStyle} />
      <p className="mt-3 text-base font-medium">{title}</p>
      {children}
    </nav>
  );
}

function UtilityButton({
  onClick,
  icon,
  label,
  srLabel,
}: {
  onClick: () => void;
  icon: ReactNode;
  label?: string;
  srLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={srLabel}
      className="glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm text-muted-foreground transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:text-foreground"
    >
      {icon}
      {label ? <span className="hidden sm:inline">{label}</span> : null}
    </button>
  );
}

export function SiteFooter() {
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  const footerGrade = useGrade();

  const socials = TRUSTED_CHANNELS.filter((c) => c.kind === "social");

  const cycleTheme = () => {
    const idx = THEME_ORDER.indexOf(theme);
    setTheme(THEME_ORDER[(idx + 1 + THEME_ORDER.length) % THEME_ORDER.length] ?? "abyss");
  };

  const themeIcon =
    theme === "light" || theme === "sepia" ? (
      <Sun className="size-4" aria-hidden />
    ) : (
      <Moon className="size-4" aria-hidden />
    );

  return (
    <>
      <footer className="relative border-t border-border/40">
        <style>{PAPER_GRADE_CSS}</style>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Brand row */}
          <div className="flex flex-col gap-6 pb-2 pt-10">
            <IblOfficialMark label="IBL Group logo" className="h-12 w-auto sm:h-14" />
            <p className="font-display max-w-md text-lg italic text-muted-foreground">
              Shaping better lives and better tomorrows. Together.
            </p>
          </div>

          {/* CTA strip */}
          <div className="grid gap-8 border-b border-border/40 py-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="h-sub">Talk to the group</p>
              <a
                href="tel:+2302032000"
                className="h-display tabular mt-4 block text-4xl transition-opacity hover:opacity-80 sm:text-6xl"
                style={{ color: TEAL_INK }}
              >
                +230 203 2000
              </a>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/2302032000"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="footer-hairline glass inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  WhatsApp
                </a>
                <a
                  href="mailto:info@iblgroup.com"
                  className="footer-hairline glass inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
                >
                  <Mail className="size-4" aria-hidden />
                  info@iblgroup.com
                </a>
              </div>
            </div>
            <nav aria-label="Quick anchors" className="flex flex-wrap gap-x-6 gap-y-2 md:justify-end md:text-right">
              {MINI_ANCHORS.map((a) => (
                <a key={a.href} href={a.href} className="caption transition-colors duration-300 hover:text-foreground">
                  {a.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Directory */}
          <div className="pt-10">
            <p className="eyebrow">
              <T k="footer.directory" />
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CLUSTERS.map((c) => (
                <DirectoryCard key={c.id} title={c.name} ruleColor={clusterVar(c.id)} label={`${c.name} directory`}>
                  <p className="caption mt-1">
                    {c.revenue} · {c.team.toLocaleString("en-US")} people
                  </p>
                  <ul className="mt-4 space-y-2">
                    {c.keyCompanies.map((name) => (
                      <li key={name}>
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="caption inline-flex items-center gap-2 transition-colors duration-300 hover:text-foreground"
                          aria-label={`${name}, ${c.name}`}
                        >
                          <span
                            className="size-1.5 shrink-0 rounded-full"
                            style={{ background: clusterVar(c.id) }}
                            aria-hidden
                          />
                          {name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </DirectoryCard>
              ))}

              <DirectoryCard title="The group" label="About the group">
                <p className="caption mt-1">Est. {BRAND.established}, Mauritius</p>
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {GROUP_ANCHORS.map((a) => (
                    <li key={a.href}>
                      <a href={a.href} className="caption transition-colors duration-300 hover:text-foreground">
                        {a.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </DirectoryCard>

              <address className="footer-lift glass not-italic rounded-2xl p-5" aria-label="Contact the group">
                <div className="rule-cluster w-16" style={{ "--active-cluster": "var(--cluster-services)" } as CSSProperties} />
                <p className="mt-3 text-base font-medium">Contacts</p>
                <ul className="mt-4 space-y-2">
                  <li className="caption">{BRAND.hq}</li>
                  <li>
                    <a
                      href="tel:+2302032000"
                      className="caption inline-flex items-center gap-2 transition-colors hover:text-foreground"
                    >
                      <Phone className="size-3.5 shrink-0" aria-hidden />
                      {BRAND.phone}
                    </a>
                  </li>
                  <li className="caption">Fax {BRAND.fax}</li>
                  <li>
                    <a
                      href="https://wa.me/2302032000"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="caption inline-flex items-center gap-2 transition-colors hover:text-foreground"
                    >
                      <MessageCircle className="size-3.5 shrink-0" aria-hidden />
                      WhatsApp {BRAND.phone}
                    </a>
                  </li>
                  {socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="caption inline-flex items-center gap-2 transition-colors hover:text-foreground"
                      >
                        <BadgeCheck className="size-3.5 shrink-0" style={{ color: TEAL }} aria-hidden />
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </address>
            </div>
          </div>

          {/* Utility row */}
          <div className="flex flex-wrap items-center gap-2 py-10 sm:gap-3">
            <div className="footer-lift glass inline-flex rounded-full p-1" role="group" aria-label="Language">
              {(["en", "fr", "cr"] as LangId[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  /* ink on the teal chip passes AA in every grade: 5.6:1 on the deep
                     paper teal, 8.4:1 on the bright abyss teal. --primary-foreground
                     would flip to near-white on paper and fail at 3.2:1. */
                  className={`min-h-9 rounded-full px-3 text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                    lang === l ? "text-[#06131a]" : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={lang === l ? { background: TEAL } : undefined}
                >
                  {l}
                </button>
              ))}
            </div>
            <UtilityButton
              onClick={cycleTheme}
              icon={themeIcon}
              label={theme}
              srLabel={`Cycle the theme, currently ${theme}`}
            />
            <UtilityButton
              onClick={() => window.dispatchEvent(new CustomEvent("ibl:open-a11y"))}
              icon={<Accessibility className="size-4" aria-hidden />}
              label="Accessibility"
              srLabel="Open accessibility profiles"
            />
            <UtilityButton
              onClick={() => window.dispatchEvent(new CustomEvent("ibl:open-curtain"))}
              icon={<Eye className="size-4" aria-hidden />}
              label="Behind the curtain"
              srLabel="Open behind the curtain"
            />
          </div>

          {/* Legal row */}
          <div className="hairline" />
          <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="caption">
              © 2026 IBL Together. <T k="footer.rights" />
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <a href="#" onClick={(e) => e.preventDefault()} className="caption transition-colors hover:text-foreground">
                Privacy Policy
              </a>
              <a href="#" onClick={(e) => e.preventDefault()} className="caption transition-colors hover:text-foreground">
                Terms
              </a>
              <a
                href="#trust"
                className="caption inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <BadgeCheck className="size-3.5" style={{ color: TEAL }} aria-hidden />
                Official domains only, see Trust Center
              </a>
              <p className="caption sm:ml-4">Built for speed · PWA ready</p>
            </div>
          </div>
        </div>
      </footer>
      {/* Sonner stack. The layout ships the radix toaster, sonner needs its own mount.
          Remove here if a sonner Toaster lands in layout.tsx. The theme follows the
          live grade so its chrome matches the sheet the visitor is reading, and the
          toast itself is styled through the page vars so it lands as a paper note on
          ivory (warm popover fill, hairline, soft ink shadow) and as vault glass on
          the dark grades, never as sterile system white. */}
      <Toaster
        position="bottom-right"
        closeButton
        theme={footerGrade === "abyss" ? "dark" : "light"}
        toastOptions={{
          style: {
            background: "color-mix(in srgb, var(--popover) 88%, var(--background))",
            color: "var(--foreground)",
            border: "1px solid color-mix(in srgb, var(--foreground) 18%, transparent)",
            boxShadow: "0 18px 50px -24px color-mix(in srgb, var(--foreground) 30%, transparent)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          },
        }}
      />
    </>
  );
}
