import type { LensId } from "@/store/app-store";

export interface LensConfig {
  id: LensId;
  label: string;
  labelFr: string;
  labelCr: string;
  /** section order for this lens */
  order: string[];
  hero: {
    kicker: string;
    accentWord: string;
    accentWordItalic: string;
    stat: { value: string; label: string }[];
    primaryCta: { label: string; action: "report" | "jobs" | "partner" | "presskit" };
    primaryCtaLabel: string;
    secondaryCta: { label: string; anchor: string };
  };
  temperature: string;
  blurb: string;
}

export const LENSES: Record<LensId, LensConfig> = {
  investor: {
    id: "investor",
    label: "Investor",
    labelFr: "Investisseur",
    labelCr: "Investiser",
    order: [
      "pulse",
      "timemachine",
      "newsroom",
      "constellation",
      "clusters",
      "movements",
      "basket",
      "map",
      "mosaic",
      "planet",
      "investors",
      "trust",
    ],
    hero: {
      kicker: "SEM · IBL · first capitalisation outside banking",
      accentWord: "A regional force.",
      accentWordItalic: "Global expertise.",
      stat: [
        { value: "Rs 124.3 Bn", label: "FY revenue, +13%" },
        { value: "+65%", label: "underlying PAT" },
        { value: "51%", label: "revenue beyond Mauritius" },
      ],
      primaryCta: { label: "Build the annual report", action: "report" },
      primaryCtaLabel: "Annual report in one tap",
      secondaryCta: { label: "See the live group pulse", anchor: "pulse" },
    },
    temperature: "#4BBDC8",
    blurb: "Disciplined growth, transparent governance, steady expansion. Long term value.",
  },
  talent: {
    id: "talent",
    label: "Talent",
    labelFr: "Talents",
    labelCr: "Talann",
    order: [
      "pulse",
      "timemachine",
      "newsroom",
      "constellation",
      "mosaic",
      "planet",
      "map",
      "clusters",
      "movements",
      "basket",
      "investors",
      "trust",
    ],
    hero: {
      kicker: "40 000 people · 20 countries · one direction",
      accentWord: "A Mauritian heart.",
      accentWordItalic: "Human momentum.",
      stat: [
        { value: "40 066", label: "people across the group" },
        { value: "20", label: "countries to grow in" },
        { value: "4", label: "clusters of craft" },
      ],
      primaryCta: { label: "Meet the people of IBL", action: "jobs" },
      primaryCtaLabel: "Join the team",
      secondaryCta: { label: "Hear thirty second stories", anchor: "mosaic" },
    },
    temperature: "#EE6C2B",
    blurb: "Opportunities to grow, learn and lead. Come shape better tomorrows with us.",
  },
  partner: {
    id: "partner",
    label: "Partner",
    labelFr: "Partenaire",
    labelCr: "Partener",
    order: [
      "pulse",
      "timemachine",
      "newsroom",
      "constellation",
      "map",
      "clusters",
      "movements",
      "basket",
      "mosaic",
      "planet",
      "investors",
      "trust",
    ],
    hero: {
      kicker: "400+ brands carried · Caterpillar since 1929 · French Navy at CNOI",
      accentWord: "A Mauritian heart.",
      accentWordItalic: "A dependable hand.",
      stat: [
        { value: "400+", label: "brands distributed" },
        { value: "20", label: "countries served" },
        { value: "195", label: "years of keeping promises" },
      ],
      primaryCta: { label: "Find your counterpart in the constellation", action: "partner" },
      primaryCtaLabel: "Partner with the group",
      secondaryCta: { label: "Explore the cluster map", anchor: "constellation" },
    },
    temperature: "#2FA96E",
    blurb: "Hands-on operators and active investors. We build side by side.",
  },
  press: {
    id: "press",
    label: "Press",
    labelFr: "Presse",
    labelCr: "Lapres",
    order: [
      "pulse",
      "timemachine",
      "newsroom",
      "constellation",
      "clusters",
      "movements",
      "basket",
      "mosaic",
      "map",
      "planet",
      "investors",
      "trust",
    ],
    hero: {
      kicker: "Verified sources only · fraud attempts blocked daily",
      accentWord: "A regional force.",
      accentWordItalic: "On the record.",
      stat: [
        { value: "13.2%", label: "revenue growth headline" },
        { value: "1 tap", label: "press kit, always fresh" },
        { value: "1830", label: "years of archives" },
      ],
      primaryCta: { label: "Assemble a press kit now", action: "presskit" },
      primaryCtaLabel: "Press kit builder",
      secondaryCta: { label: "Read the newsroom", anchor: "newsroom" },
    },
    temperature: "#D63384",
    blurb: "Facts, figures, verified contacts. Everything citable, everything sourced.",
  },
};

export const LENS_LIST = [LENSES.investor, LENSES.talent, LENSES.partner, LENSES.press];
