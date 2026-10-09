export interface Era {
  id: string;
  year: string;
  range: [number, number];
  title: string;
  body: string;
  detail: string;
  image?: string;
  palette: [string, string];
  typeStyle: "archival" | "midcentury" | "modern";
}

/** Timeline anchored on IBL’s published history page. */
export const ERAS: Era[] = [
  {
    id: "e1830",
    year: "1830",
    range: [1830, 1860],
    title: "The harbour awakens",
    body: "Blyth Brothers opens in Port Louis. Ships, sugar, correspondence.",
    detail:
      "James Blyth founds a trading house at the heart of the Mascarenes. Cotton, sugar and spices move through the harbour while Ireland Fraser will soon join the same quays, in 1850.",
    image: "/images/era-1830.jpg",
    palette: ["#3b2f20", "#c9a35a"],
    typeStyle: "archival",
  },
  {
    id: "e1850",
    year: "1850",
    range: [1850, 1900],
    title: "Two houses, one harbour",
    body: "Ireland Fraser and Co is born on the first of July. The two trading houses grow in step.",
    detail:
      "George Ireland, Hugh Hunter and James Fraser register Hunter Ireland and Co. When Hunter departs in 1860 the firm becomes Ireland Fraser and Co. Sugar barons rely on both houses to reach Europe.",
    image: "/images/era-1850.jpg",
    palette: ["#42341f", "#d6b268"],
    typeStyle: "archival",
  },
  {
    id: "e1900",
    year: "1929",
    range: [1900, 1945],
    title: "Machines arrive",
    body: "Blyth Brothers signs the Caterpillar dealership. Heavy machinery lands on the island.",
    detail:
      "In 1929 one of IBL’s predecessor houses signs an agreement with a young American machine maker named Caterpillar. The same agreement still stands, almost a century later. In 1939 Joseph Lagesse buys Mon Loisir sugar estate and modernises it.",
    image: "/images/era-1929.jpg",
    palette: ["#2e3421", "#b8862f"],
    typeStyle: "midcentury",
  },
  {
    id: "e1972",
    year: "1972",
    range: [1946, 1985],
    title: "Ireland Blyth Ltd",
    body: "The two rivals merge. One company carries both names forward.",
    detail:
      "Cyril Lagesse had founded CIDL in 1970. In 1972 Blyth Brothers and Ireland Fraser merge into Ireland Blyth Ltd. Mauritian Eagle Insurance follows in 1973. The group diversifies past trade into insurance, engineering and logistics.",
    image: "/images/era-1972.jpg",
    palette: ["#22403c", "#e3a72f"],
    typeStyle: "midcentury",
  },
  {
    id: "e1994",
    year: "1994",
    range: [1986, 2005],
    title: "The public years",
    body: "Listed on the Stock Exchange of Mauritius. Winner’s opens its first aisles.",
    detail:
      "The group joins the official list of the SEM in 1994, the same year Winner’s opens its first supermarket. Arnaud Lagesse succeeds his father as group chief executive in 2005.",
    image: "/images/era-1994.jpg",
    palette: ["#1d3b52", "#4bbdc8"],
    typeStyle: "modern",
  },
  {
    id: "e2010",
    year: "2016",
    range: [2006, 2018],
    title: "IBL, plainly",
    body: "GML takes the helm in 2010. Amalgamation in 2016 shortens the name to IBL Ltd.",
    detail:
      "GML Investissement becomes majority shareholder in 2010 after buying out the CIEL stake. The 2016 amalgamation unites the holding and the operating group under one name, IBL Ltd, traded on the SEM.",
    image: "/images/era-2016.jpg",
    palette: ["#16324a", "#4bbdc8"],
    typeStyle: "modern",
  },
  {
    id: "e2021",
    year: "2021",
    range: [2019, 2023],
    title: "Beyond Borders",
    body: "A regional strategy is announced. East Africa becomes home turf.",
    detail:
      "The Beyond Borders strategy takes the group into Kenya with Naivas, deeper into Madagascar, and across the Indian Ocean rim. DotExe Ventures follows, a humble entry into African venture capital.",
    image: "/images/era-2021.jpg",
    palette: ["#122b42", "#4bbdc8"],
    typeStyle: "modern",
  },
  {
    id: "e2026",
    year: "Now",
    range: [2024, 2030],
    title: "Four clusters, full ocean",
    body: "Retail, Consumer Brands and Distribution, Industrials, Services. One hundred and ninety six years of momentum.",
    detail:
      "The group reorganises into four strategic clusters and reports 13.2 percent revenue growth as regional integration deepens. Forty thousand people, twenty countries, one purpose.",
    image: "/images/era-2026.jpg",
    palette: ["#0a0e23", "#4bbdc8"],
    typeStyle: "modern",
  },
];

export const LEDGER_ENTRIES = [
  { date: "14 March 1830", entry: "Consigned per barque Doris, Sydney. 41 bales wool, 12 casks tallow.", amount: "£112 4s" },
  { date: "2 June 1830", entry: "Sold for account of Messrs Blyth, 9 hogsheads muscovado sugar.", amount: "£37 16s 6d" },
  { date: "19 August 1830", entry: "Freight received, schooner Adèle, Port Louis to Bourbon.", amount: "£8 10s" },
  { date: "5 October 1830", entry: "Advance to Capt. Roquebert, passage and pilotage, Grand Port.", amount: "£5 2s 8d" },
  { date: "30 December 1830", entry: "Closing balance, second account current. Carried forward.", amount: "£748 19s 3d" },
];
