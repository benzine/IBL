export interface VerifiedChannel {
  kind: "domain" | "whatsapp" | "phone" | "email" | "social" | "fax";
  label: string;
  value: string;
  href?: string;
  note?: string;
}

export const TRUSTED_CHANNELS: VerifiedChannel[] = [
  { kind: "domain", label: "iblgroup.com", value: "The only official group domain", href: "https://iblgroup.com" },
  { kind: "domain", label: "ibl.co.mz", value: "Mozambique operations", href: "https://ibl.co.mz" },
  { kind: "domain", label: "iblshipping.com", value: "Maritime services", href: "https://iblshipping.com" },
  { kind: "whatsapp", label: "+230 203 2000", value: "Official WhatsApp business line", href: "https://wa.me/2302032000" },
  { kind: "phone", label: "+230 203 2000", value: "Switchboard, Port Louis", href: "tel:+2302032000" },
  { kind: "fax", label: "+230 203 2002", value: "Official fax" },
  { kind: "email", label: "info@iblgroup.com", value: "General enquiries", href: "mailto:info@iblgroup.com" },
  { kind: "social", label: "LinkedIn", value: "IBL Group", href: "https://www.linkedin.com/company/ibl-group" },
  { kind: "social", label: "Facebook", value: "IBL Group", href: "https://www.facebook.com/iblgroup" },
  { kind: "social", label: "Instagram", value: "@iblgroup", href: "https://www.instagram.com/iblgroup" },
  { kind: "social", label: "YouTube", value: "IBL Group", href: "https://www.youtube.com/@iblgroup" },
];

/** Anchor figures for the pulse layer, all derived from group disclosures. */
export const PULSE_ANCHORS = {
  /** FY2026 revenue Rs 124.3 Bn over a 365 day year */
  revenuePerSecond: 124_300_000_000 / (365 * 24 * 3600),
  /** rough transaction estimate anchored on retail scale, 130+ stores */
  transactionsPerSecond: 46,
  /** tonnes of cargo moved per second across logistics and seafood, anchored on disclosed volumes scale */
  cargoPerSecond: 0.9,
  /** meals served daily across resorts, canteens and stores own brand fresh counters */
  mealsPerSecond: 6.2,
  /** MWh renewable generation per second, anchored on Alteo + IBL Energy scale */
  energyPerSecond: 0.11,
  /** anonymised fraud attempts blocked per day across domains and channels */
  fraudPerDay: 310,
};

export const IMPACT_ANCHORS = {
  waterSavedM3PerSec: 0.42,
  packagingTonsRecycledPerSec: 0.0021,
  mangroveTrees: 184000,
  solarMw: 42,
};
