"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { ArrowUpRight, Check, Download } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { T } from "@/components/home/t";
import { BRAND, CLUSTERS, GROUP } from "@/lib/brand";
import { NEWS, type NewsItem } from "@/lib/data/dividends";
import { TRUSTED_CHANNELS } from "@/lib/data/trust";
import { useReveal } from "@/hooks/use-reveal";

const INK = "#212979";
const TEAL = "var(--ibl-teal)";

/* Paper-grade rules, scoped to this section (dark grades stay untouched).
   .news-lift presses soft ink shadows under the editorial cards on flat ivory,
   .news-deepen multiplies an ink veil over the screen-blend duotone so the
   photography keeps lithographic density on paper (masked away from text).
   .news-hairline firms up quiet glass chips so they read as printed tabs. */
const PAPER_GRADE_CSS = `
html[data-theme="light"] .news-lift,
html[data-theme="sepia"] .news-lift {
  box-shadow:
    0 1px 2px color-mix(in srgb, var(--foreground) 10%, transparent),
    0 22px 55px -30px color-mix(in srgb, var(--foreground) 26%, transparent);
  /* carries .lift's transform leg too: without it the shorthand would replace
     the base rule and the hover lift would snap instead of glide */
  transition: transform 0.6s var(--ease-luxe), box-shadow 0.7s var(--ease-luxe);
}
.news-deepen { opacity: 0; transition: opacity 0.7s var(--ease-luxe); }
html[data-theme="light"] .news-deepen,
html[data-theme="sepia"] .news-deepen { opacity: 1; }
html[data-theme="light"] .news-hairline,
html[data-theme="sepia"] .news-hairline {
  border-color: color-mix(in srgb, var(--foreground) 22%, transparent);
}
/* Paper grade: the ghost quote mark gains a little printed weight, a 0.18
   outline ink stroke all but disappears on ivory */
html[data-theme="light"] .news-quote-mark,
html[data-theme="sepia"] .news-quote-mark {
  opacity: 0.32;
}
`;

/* Category hues resolve through the cluster vars so colorblind corrected
   profiles keep their luminance split, and the badge mixes them toward ink
   on paper / toward light on abyss for contrast. */
const CATEGORY_COLORS: Record<string, string> = {
  "Financial news": "var(--cluster-retail)",
  Trust: "var(--cluster-services)",
  Digital: "var(--cluster-cbd)",
  People: "var(--cluster-industrials)",
};

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? TEAL;
}

function CategoryBadge({ category }: { category: string }) {
  const color = categoryColor(category);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        /* the hue stays in the dot and the tint, while the label leans most of
           the way toward ink on paper (and toward light on abyss) so the text
           keeps comfortable contrast on both grades */
        color: `color-mix(in srgb, ${color} 48%, var(--foreground))`,
        backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {category}
    </span>
  );
}

function NewsImage({
  item,
  className,
  alt,
}: {
  item: NewsItem;
  className?: string;
  alt: string;
}) {
  const duoStyle = { "--duo-a": INK, "--duo-b": categoryColor(item.category) } as CSSProperties;
  return (
    <div className={`duotone relative overflow-hidden ${className ?? ""}`} style={duoStyle}>
      <span
        className="absolute inset-0"
        style={{
          background: `linear-gradient(150deg, ${INK}, ${categoryColor(item.category)} 170%)`,
        }}
        aria-hidden
      />
      {item.image && (
        <img
          src={item.image}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.opacity = "0";
          }}
        />
      )}
      {/* Paper grade: ink veil pressed into the duotone for print density */}
      <span
        aria-hidden
        className="news-deepen pointer-events-none absolute inset-0 z-[1] mix-blend-multiply"
        style={{
          background: `linear-gradient(168deg, rgba(33,41,121,0.34), rgba(33,41,121,0.20) 52%, rgba(10,14,35,0.38))`,
          maskImage: "linear-gradient(to top, transparent 18%, black 40%)",
          WebkitMaskImage: "linear-gradient(to top, transparent 18%, black 40%)",
        }}
      />
    </div>
  );
}

function FeaturedCard({ item }: { item: NewsItem }) {
  return (
    <article className="news-lift glass lift group relative overflow-hidden rounded-2xl lg:col-span-7">
      <a
        href="#newsroom"
        className="absolute inset-0 z-[3]"
        aria-label={`Read, ${item.title}`}
      >
        <span className="sr-only">Read the story</span>
      </a>
      <NewsImage
        item={item}
        alt={item.title}
        className="diag-cut-b aspect-[16/9] w-full"
      />
      <div className="p-5 sm:p-7">
        <CategoryBadge category={item.category} />
        <h3 className="h-sub mt-4 max-w-2xl">{item.title}</h3>
        <p className="caption mt-3 max-w-xl">{item.blurb}</p>
        <p className="caption tabular mt-5 flex items-center gap-3">
          <span>{item.date}</span>
          <span aria-hidden>·</span>
          <span>{item.readTime}</span>
          <ArrowUpRight
            className="size-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            aria-hidden
          />
        </p>
      </div>
    </article>
  );
}

function SideCard({ item }: { item: NewsItem }) {
  return (
    <article className="news-lift glass lift group relative flex flex-col overflow-hidden rounded-2xl sm:flex-row">
      <a href="#newsroom" className="absolute inset-0 z-[3]" aria-label={`Read, ${item.title}`}>
        <span className="sr-only">Read the story</span>
      </a>
      <NewsImage item={item} alt={item.title} className="aspect-[16/10] w-full shrink-0 sm:aspect-auto sm:w-[42%]" />
      <div className="flex-1 p-4 sm:p-5">
        <CategoryBadge category={item.category} />
        <h3 className="mt-3 text-base font-medium leading-snug">{item.title}</h3>
        <p className="caption tabular mt-3">
          {item.date} · {item.readTime}
        </p>
      </div>
    </article>
  );
}

function PullQuoteCard({ item }: { item: NewsItem }) {
  return (
    <article className="news-lift glass lift relative overflow-hidden rounded-2xl p-6 sm:p-10 lg:col-span-12">
      <a href="#newsroom" className="absolute inset-0 z-[3]" aria-label={`Read, ${item.title}`}>
        <span className="sr-only">Read the story</span>
      </a>
      <span
        className="news-quote-mark font-display pointer-events-none absolute -top-8 left-4 select-none text-[10rem] leading-none text-outline opacity-[0.18]"
        aria-hidden
      >
        &ldquo;
      </span>
      <blockquote className="relative max-w-3xl">
        <p className="font-display text-2xl italic leading-snug sm:text-3xl">
          {item.blurb}&rdquo;
        </p>
        <footer className="caption mt-5 flex flex-wrap items-center gap-3">
          <CategoryBadge category={item.category} />
          <span>
            {item.title} · {item.date} · {item.readTime}
          </span>
        </footer>
      </blockquote>
    </article>
  );
}

/* ------------------------------------------------ press kit */

const KIT_ITEMS = [
  "Official logo, SVG",
  "Group fact sheet, txt",
  "Boilerplate paragraph",
  "Leadership line",
  "Latest results",
  "Verified contacts",
];

function buildFactSheet(lang: "en" | "fr"): string {
  const fr = lang === "fr";
  const L: [string, string][] = fr
    ? [
        ["IBL GROUP · FICHE DE PRESSE", ""],
        ["Maurice, depuis 1830 · 20 pays · 40 066 collaborateurs", ""],
        ["", ""],
        ["CHIFFRES CLÉS", ""],
        [`Chiffre d'affaires, ${GROUP.revenue} (${GROUP.revenueGrowth})`, ""],
        [`EBITDA, ${GROUP.ebitda}`, ""],
        [`Total du bilan, ${GROUP.assets}`, ""],
        [`Chiffre d'affaires hors Maurice, ${GROUP.outsideMauritius}%`, ""],
        [`Collaborateurs, ${GROUP.team.toLocaleString("fr-FR")}`, ""],
        ["", ""],
        ["LES QUATRE PÔLES", ""],
      ]
    : [
        ["IBL GROUP · PRESS FACT SHEET", ""],
        ["Mauritius, since 1830 · 20 countries · 40 066 people", ""],
        ["", ""],
        ["KEY FIGURES", ""],
        [`Revenue, ${GROUP.revenue} (${GROUP.revenueGrowth})`, ""],
        [`EBITDA, ${GROUP.ebitda}`, ""],
        [`Total assets, ${GROUP.assets}`, ""],
        [`Revenue outside Mauritius, ${GROUP.outsideMauritius}%`, ""],
        [`Team, ${GROUP.team.toLocaleString("en-US")}`, ""],
        ["", ""],
        ["THE FOUR CLUSTERS", ""],
      ];

  const lines: string[] = [];
  for (const [a] of L) lines.push(a);
  for (const c of CLUSTERS) {
    lines.push(
      `${c.name}. ${c.revenue} revenue, ${c.operatingProfit} operating profit, ${c.team.toLocaleString("en-US")} people. ${c.keyCompanies.join(", ")}.`
    );
  }
  lines.push("");
  lines.push(fr ? "PRÉSENTATION" : "BOILERPLATE");
  lines.push(
    fr
      ? "IBL Group est un groupe mauricien fondé en 1830. Quatre pôles, Retail, Consumer Brands & Distribution, Industrials et Services, emploient 40 066 personnes dans 20 pays. Le groupe est coté à la Stock Exchange of Mauritius. Shaping better lives and better tomorrows. Together."
      : "IBL Group is a Mauritian group of companies established in 1830. Four clusters, Retail, Consumer Brands & Distribution, Industrials and Services, employ 40 066 people across 20 countries. The group is listed on the Stock Exchange of Mauritius. Shaping better lives and better tomorrows. Together."
  );
  lines.push("");
  lines.push(fr ? "CONTACTS" : "CONTACTS");
  lines.push(BRAND.hq);
  lines.push(`${BRAND.phone} · fax ${BRAND.fax}`);
  lines.push(`WhatsApp, wa.me/${BRAND.whatsapp}`);
  lines.push("info@iblgroup.com");
  lines.push("");
  lines.push(fr ? "CANAUX VÉRIFIÉS" : "VERIFIED CHANNELS");
  for (const ch of TRUSTED_CHANNELS) {
    lines.push(`${ch.label} · ${ch.value}${ch.href ? ` · ${ch.href}` : ""}`);
  }
  lines.push("");
  lines.push(fr ? "Généré depuis iblgroup.com" : "Generated from the live site, iblgroup.com");
  return lines.join("\n");
}

function PressKitBuilder() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "fr">("en");

  const assemble = () => {
    // The logo file first
    const a = document.createElement("a");
    a.href = "/brand/ibl-logo.svg";
    a.download = "ibl-logo.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Then the fact sheet
    const sheet = buildFactSheet(lang);
    const url = URL.createObjectURL(new Blob([sheet], { type: "text/plain;charset=utf-8" }));
    const b = document.createElement("a");
    b.href = url;
    b.download = `ibl-press-kit-${lang}.txt`;
    document.body.appendChild(b);
    b.click();
    b.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "press-kit", meta: lang }),
    }).catch(() => {});

    toast("Press kit downloaded, logo plus fact sheet");
    setOpen(false);
  };

  return (
    <>
      <div className="news-lift glass mt-6 flex flex-col gap-5 rounded-2xl p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="h-sub">For the press room</p>
          <p className="caption mt-2 max-w-md">
            Logo, fact sheet, boilerplate, verified contacts. One tap, two files, no forms to fill.
          </p>
        </div>
        <Button id="press-kit-trigger" size="lg" className="min-h-11 shrink-0 rounded-full" onClick={() => setOpen(true)}>
          <Download className="size-4" aria-hidden />
          Press kit in one tap
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:max-w-full max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-b-none max-md:rounded-t-3xl max-md:border-b-0">
          <DialogHeader>
            <DialogTitle>Press kit in one tap</DialogTitle>
            <DialogDescription>Everything below lands in your downloads folder.</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2 sm:grid-cols-2">
            {KIT_ITEMS.map((i) => (
              <li key={i} className="flex min-h-11 items-center gap-2 rounded-lg border border-border/40 px-3 text-sm">
                <Check className="size-4 shrink-0" style={{ color: TEAL }} aria-hidden />
                {i}
              </li>
            ))}
          </ul>
          <div>
            <p className="text-sm font-medium">Language</p>
            <Select value={lang} onValueChange={(v) => setLang(v === "fr" ? "fr" : "en")}>
              <SelectTrigger className="mt-2 min-h-11 w-full" aria-label="Press kit language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-11" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button className="min-h-11" onClick={assemble}>
              <Download className="size-4" aria-hidden />
              Assemble
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------ section */

export function NewsroomSection() {
  const { ref: headerRef, style: headerStyle } = useReveal<HTMLDivElement>("s");
  const [feature, second, third, magazine] = NEWS;

  return (
    <section id="newsroom" className="scroll-mt-24 py-20 sm:py-28" aria-labelledby="newsroom-title">
      <style>{PAPER_GRADE_CSS}</style>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} style={headerStyle} className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Newsroom</p>
            <h2 id="newsroom-title" className="h-section mt-3 font-semibold tracking-tight">
              <T k="newsroom.title" />
            </h2>
          </div>
          <a
            href="#newsroom"
            className="news-hairline glass inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            All stories
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </div>

        <div className="mt-10 grid gap-4 md:gap-6 lg:grid-cols-12">
          {feature && <FeaturedCard item={feature} />}
          <div className="flex flex-col gap-4 md:gap-6 lg:col-span-5">
            {second && <SideCard item={second} />}
            {third && <SideCard item={third} />}
          </div>
          {magazine && <PullQuoteCard item={magazine} />}
        </div>

        <PressKitBuilder />
      </div>
    </section>
  );
}
