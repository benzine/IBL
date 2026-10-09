import type { ClusterId } from "@/lib/brand";

export interface Subsidiary {
  id: string;
  name: string;
  cluster: ClusterId;
  sector: string;
  country: string;
  countryCode: string;
  since: number;
  note: string;
  collaborations?: string[];
  x: number;
  y: number;
}

/**
 * Constellation coordinates are normalised 0..1 within the map field.
 * Subsidiary names, clusters, sectors and years come from IBL public cluster pages.
 */
export const SUBSIDIARIES: Subsidiary[] = [
  { id: "winners", name: "Winner's", cluster: "retail", sector: "Supermarkets", country: "Mauritius", countryCode: "MU", since: 1994, note: "Integrated chain of supermarkets. One hundred percent IBL since 2015.", collaborations: ["logidis", "fdm"], x: 0.62, y: 0.38 },
  { id: "naivas", name: "Naivas", cluster: "retail", sector: "Hypermarkets", country: "Kenya", countryCode: "KE", since: 2022, note: "One of Kenya’s leading supermarket chains, carrying the group into East Africa.", collaborations: ["iblenergy"], x: 0.86, y: 0.16 },
  { id: "runmarket", name: "Run Market", cluster: "retail", sector: "Convenience", country: "Réunion", countryCode: "RE", since: 2019, note: "Neighbourhood retail serving daily needs on the sister island.", collaborations: ["brandactiv"], x: 0.58, y: 0.5 },
  { id: "phoenix", name: "Phoenix Beverages", cluster: "cbd", sector: "Beverages", country: "Mauritius", countryCode: "MU", since: 1962, note: "The island’s brewer. Flagship beers and soft drinks across the Indian Ocean.", collaborations: ["brandactiv", "logidis"], x: 0.56, y: 0.31 },
  { id: "brandactiv", name: "BrandActiv", cluster: "cbd", sector: "FMCG Distribution", country: "Mauritius", countryCode: "MU", since: 2011, note: "Born from two IBL distribution houses. Carries more than one hundred international brands.", collaborations: ["healthactiv", "logidis", "runmarket"], x: 0.68, y: 0.3 },
  { id: "healthactiv", name: "HealthActiv", cluster: "cbd", sector: "Healthcare Distribution", country: "Mauritius", countryCode: "MU", since: 2006, note: "Pharmaceutical and healthcare distribution reaching hospitals and pharmacies.", collaborations: ["brandactiv"], x: 0.74, y: 0.44 },
  { id: "harley", name: "Harley", cluster: "cbd", sector: "FMCG Distribution", country: "Madagascar", countryCode: "MG", since: 1994, note: "Distribution leader in Madagascar, from household goods to beverages.", collaborations: ["phoenix"], x: 0.34, y: 0.44 },
  { id: "alteo", name: "Alteo", cluster: "industrials", sector: "Agri & Energy", country: "Mauritius", countryCode: "MU", since: 1912, note: "Sugar milling, renewable energy from bagasse, land stewardship.", collaborations: ["iblenergy", "blychem"], x: 0.48, y: 0.55 },
  { id: "cnoi", name: "CNOI", cluster: "industrials", sector: "Shipbuilding", country: "Mauritius", countryCode: "MU", since: 2001, note: "Indian Ocean shipyard. Dry-docks French Navy frigates, builds patrol vessels.", collaborations: ["iblaviation", "scomat"], x: 0.6, y: 0.62 },
  { id: "scomat", name: "Scomat", cluster: "industrials", sector: "Engineering", country: "Mauritius", countryCode: "MU", since: 1929, note: "Caterpillar dealership since 1929, one of the oldest in the world.", collaborations: ["cnoi", "mansersaxon"], x: 0.5, y: 0.4 },
  { id: "mansersaxon", name: "Manser Saxon", cluster: "industrials", sector: "Building & Engineering", country: "Mauritius", countryCode: "MU", since: 1979, note: "Mechanical and electrical engineering for landmark regional projects.", collaborations: ["scomat"], x: 0.42, y: 0.36 },
  { id: "blychem", name: "Blychem", cluster: "industrials", sector: "Chemicals & Water", country: "Mauritius", countryCode: "MU", since: 1976, note: "Water treatment and specialty chemicals for industry.", collaborations: ["alteo"], x: 0.36, y: 0.58 },
  { id: "iblenergy", name: "IBL Energy", cluster: "industrials", sector: "Energy", country: "Mauritius", countryCode: "MU", since: 2017, note: "Solar farms and storage pushing the island’s renewable share upward.", collaborations: ["alteo", "naivas"], x: 0.66, y: 0.52 },
  { id: "fdm", name: "Froid des Mascareignes", cluster: "industrials", sector: "Cold Chain", country: "Mauritius", countryCode: "MU", since: 1983, note: "Cold logistics keeping the region’s food and pharma supply unbroken.", collaborations: ["winners", "healthactiv"], x: 0.54, y: 0.7 },
  { id: "marinebiotech", name: "Marine Biotechnology", cluster: "industrials", sector: "Seafood", country: "Mauritius", countryCode: "MU", since: 2008, note: "Seafood processing and marine ingredients for world markets.", collaborations: ["cnoi"], x: 0.72, y: 0.64 },
  { id: "miwa", name: "MIWA", cluster: "industrials", sector: "Seafood", country: "Madagascar", countryCode: "MG", since: 1992, note: "Madagascar seafood processing, from the reef to the plate.", collaborations: ["harley"], x: 0.3, y: 0.56 },
  { id: "cmh", name: "CMH", cluster: "industrials", sector: "Building Materials", country: "Mauritius", countryCode: "MU", since: 1972, note: "Construction materials shaping the built environment of the islands.", collaborations: ["mansersaxon"], x: 0.46, y: 0.64 },
  { id: "luxcollectiv", name: "LUX* Collectiv", cluster: "services", sector: "Hospitality", country: "Mauritius", countryCode: "MU", since: 1987, note: "A collective of island resorts reimagining Indian Ocean hospitality.", collaborations: ["luxresorts"], x: 0.64, y: 0.24 },
  { id: "luxresorts", name: "LUX* Resorts", cluster: "services", sector: "Hospitality", country: "Mauritius", countryCode: "MU", since: 2011, note: "Resorts across Mauritius, Réunion and the wider Indian Ocean.", collaborations: ["luxcollectiv", "iblaviation"], x: 0.7, y: 0.18 },
  { id: "dtos", name: "DTOS", cluster: "services", sector: "Fiduciary & Corporate", country: "Mauritius", countryCode: "MU", since: 2004, note: "Corporate services, structuring and administration for global business.", collaborations: ["eagle"], x: 0.78, y: 0.3 },
  { id: "eagle", name: "Mauritian Eagle", cluster: "services", sector: "Insurance", country: "Mauritius", countryCode: "MU", since: 1973, note: "First company in the Indian Ocean certified ISO 27001.", collaborations: ["dtos"], x: 0.82, y: 0.4 },
  { id: "logidis", name: "Logidis", cluster: "services", sector: "Logistics", country: "Mauritius", countryCode: "MU", since: 1975, note: "Warehousing and distribution backbone for the group’s goods.", collaborations: ["winners", "brandactiv", "phoenix"], x: 0.58, y: 0.45 },
  { id: "iblaviation", name: "IBL Aviation", cluster: "services", sector: "Aviation", country: "Mauritius", countryCode: "MU", since: 1996, note: "Ground handling and aviation services at Sir Seewoosagur Ramgoolam airport.", collaborations: ["luxresorts", "cnoi"], x: 0.44, y: 0.48 },
  { id: "iblshopping", name: "IBL Shopping", cluster: "services", sector: "Duty Free", country: "Mauritius", countryCode: "MU", since: 2014, note: "Duty free retail and travel shopping experiences.", collaborations: ["logidis"], x: 0.66, y: 0.36 },
];

export const COLLABORATION_PAIRS: [string, string][] = SUBSIDIARIES.flatMap((s) =>
  (s.collaborations ?? []).map((c) => [s.id, c] as [string, string])
).filter(([a, b], i, arr) => {
  const seen = arr.slice(0, i).findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
  return seen === -1;
});

export const SECTORS = Array.from(new Set(SUBSIDIARIES.map((s) => s.sector))).sort();
export const COUNTRIES_IN_CONSTELLATION = Array.from(
  new Set(SUBSIDIARIES.map((s) => s.country))
).sort();
export const YEAR_FILTERS = [
  { label: "All years", value: "all" },
  { label: "Before 1950", value: "p1950" },
  { label: "1950 to 1999", value: "p2000" },
  { label: "2000 and after", value: "p2020" },
];

export function yearBucket(since: number): string {
  if (since < 1950) return "p1950";
  if (since < 2000) return "p2000";
  return "p2020";
}
