export interface DividendYear {
  year: number;
  interim: number;
  final: number;
  total: number;
  note?: string;
}

/** Interim declared around December, final around June, per group practice. Figures in MUR per share. */
export const DIVIDENDS: DividendYear[] = [
  { year: 2018, interim: 0.2, final: 0.35, total: 0.55 },
  { year: 2019, interim: 0.22, final: 0.38, total: 0.6 },
  { year: 2020, interim: 0.0, final: 0.3, total: 0.3, note: "Interim suspended during the global pause" },
  { year: 2021, interim: 0.24, final: 0.4, total: 0.64, note: "Resumed as commerce recovered" },
  { year: 2022, interim: 0.26, final: 0.42, total: 0.68 },
  { year: 2023, interim: 0.28, final: 0.44, total: 0.72 },
  { year: 2024, interim: 0.2, final: 0.52, total: 0.72, note: "Interim Re 0.20 announced November 2024" },
  { year: 2025, interim: 0.3, final: 0.48, total: 0.78, note: "Yield near 3.7 percent at the year’s reference price" },
];

export interface NewsItem {
  id: string;
  category: string;
  title: string;
  blurb: string;
  date: string;
  readTime: string;
  image?: string;
  featured?: boolean;
}

export const NEWS: NewsItem[] = [
  {
    id: "n1",
    category: "Financial news",
    title: "IBL reports 13.2% revenue growth as it enters a new phase of regional integration",
    blurb:
      "Nine month revenue reached Rs 90.4 billion, up nineteen percent, with sixty five percent of growth driven by operations beyond Mauritius.",
    date: "12 February 2026",
    readTime: "4 min",
    image: "/images/news-01.jpg",
    featured: true,
  },
  {
    id: "n2",
    category: "Trust",
    title: "Scam alert. Fraudulent content impersonating IBL and its Group CEO, Arnaud Lagesse",
    blurb:
      "The group confirms which channels are official. Report impersonation attempts from the trust center in one tap.",
    date: "28 January 2026",
    readTime: "2 min",
    image: "/images/news-02.jpg",
  },
  {
    id: "n3",
    category: "Digital",
    title: "DotExe Ventures, a humble entry into African venture capital",
    blurb:
      "A new vehicle backs founders building for the continent, carrying the group’s operator instinct into early stage investing.",
    date: "9 January 2026",
    readTime: "5 min",
    image: "/images/news-03.jpg",
  },
  {
    id: "n4",
    category: "People",
    title: "Together Magazine, issue ten",
    blurb:
      "Field notes from twenty countries. Shrimp boats, solar farms, resort kitchens and the people who run them.",
    date: "December 2025",
    readTime: "Long read",
  },
];
