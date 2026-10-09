export const BRAND = {
  teal: "#4BBDC8",
  tealDeep: "#2E8F9C",
  ink: "#212979",
  abyss: "#0A0E23",
  logoUrl: "/brand/ibl-logo.svg",
  established: 1830,
  hq: "IBL House, Caudan Waterfront, Port Louis, Mauritius",
  phone: "+230 203 2000",
  fax: "+230 203 2002",
  whatsapp: "2302032000",
  founded: "Blyth Brothers and Ireland Fraser, Mauritius, 1830",
} as const;

export type ClusterId = "retail" | "cbd" | "industrials" | "services";

export interface ClusterDef {
  id: ClusterId;
  name: string;
  short: string;
  tagline: string;
  description: string;
  color: string;
  colorVar: string;
  revenue: string;
  operatingProfit: string;
  team: number;
  teamLabel: string;
  keyStats: { label: string; value: string }[];
  keyCompanies: string[];
  foundedNote?: string;
}

export const CLUSTERS: ClusterDef[] = [
  {
    id: "retail",
    name: "Retail",
    short: "Retail",
    tagline: "Fulfilling the daily needs of our communities.",
    description:
      "Trusted supermarket and hypermarket brands across Mauritius, East Africa and Réunion keep daily life accessible and affordable.",
    color: "#4BBDC8",
    colorVar: "--cluster-retail",
    revenue: "Rs 60.9 Bn",
    operatingProfit: "Rs 2.7 Bn",
    team: 16275,
    teamLabel: "team members",
    keyStats: [
      { label: "Stores", value: "130+" },
      { label: "Countries", value: "3" },
      { label: "Revenue", value: "Rs 60.9 Bn" },
    ],
    keyCompanies: ["Winner's", "Naivas", "Run Market"],
    foundedNote: "Winner's opened its first store in 1994.",
  },
  {
    id: "cbd",
    name: "Consumer Brands & Distribution",
    short: "Brands",
    tagline: "Bringing exciting brands to the consumers we serve.",
    description:
      "More than four hundred trusted brands, from beverages and healthcare to household goods, reach homes, shops and pharmacies across the region.",
    color: "#2FA96E",
    colorVar: "--cluster-cbd",
    revenue: "Rs 30.5 Bn",
    operatingProfit: "Rs 2.3 Bn",
    team: 3888,
    teamLabel: "team members",
    keyStats: [
      { label: "Brands", value: "400+" },
      { label: "Countries", value: "5" },
      { label: "Revenue", value: "Rs 30.5 Bn" },
    ],
    keyCompanies: ["Phoenix Beverages", "BrandActiv", "HealthActiv", "Harley"],
    foundedNote: "BrandActiv was formed in 2011 from two IBL distribution houses.",
  },
  {
    id: "industrials",
    name: "Industrials",
    short: "Industrials",
    tagline: "World-class manufacturing and resource processing.",
    description:
      "From construction and shipbuilding to energy and seafood processing, these businesses build infrastructure and bring power to communities.",
    color: "#EE6C2B",
    colorVar: "--cluster-industrials",
    revenue: "Rs 20.2 Bn",
    operatingProfit: "Rs 1.5 Bn",
    team: 13564,
    teamLabel: "team members",
    keyStats: [
      { label: "Sectors", value: "3" },
      { label: "Shipyard", value: "CNOI, since 2001" },
      { label: "Revenue", value: "Rs 20.2 Bn" },
    ],
    keyCompanies: ["Alteo", "CNOI", "Scomat", "Manser Saxon", "Blychem", "IBL Energy", "Froid des Mascareignes", "Marine Biotechnology", "MIWA", "CMH"],
    foundedNote: "Scomat has held the Caterpillar dealership since 1929.",
  },
  {
    id: "services",
    name: "Services",
    short: "Services",
    tagline: "Serving people, businesses and communities in the region.",
    description:
      "World-class hospitality and real estate, financial services, logistics and healthcare support people every day, at home and beyond.",
    color: "#D63384",
    colorVar: "--cluster-services",
    revenue: "Rs 19.5 Bn",
    operatingProfit: "Rs 3.2 Bn",
    team: 6339,
    teamLabel: "team members",
    keyStats: [
      { label: "Lines", value: "4" },
      { label: "Resorts", value: "LUX* collective" },
      { label: "Revenue", value: "Rs 19.5 Bn" },
    ],
    keyCompanies: ["LUX* Collectiv", "LUX* Resorts", "DTOS", "Mauritian Eagle", "Logidis", "IBL Aviation", "IBL Shopping"],
    foundedNote: "Mauritian Eagle has insured the region since 1973.",
  },
];

export const CLUSTER_MAP = Object.fromEntries(CLUSTERS.map((c) => [c.id, c])) as Record<ClusterId, ClusterDef>;

export const EASE = {
  luxe: [0.16, 1, 0.3, 1] as const,
  luxeInOut: [0.83, 0, 0.17, 1] as const,
};

export const GROUP = {
  team: 40066,
  teamLabel: "39 500+",
  countries: 20,
  revenue: "Rs 124.3 Bn",
  revenueUsd: "USD 2.6 Bn",
  revenueGrowth: "+13%",
  ebitda: "Rs 14.5 Bn",
  assets: "Rs 151.1 Bn",
  outsideMauritius: 51,
  purpose: "Shaping better lives and better tomorrows. Together.",
  ceo: "Arnaud Lagesse",
  deputyCeo: "Patrice Robert",
} as const;
