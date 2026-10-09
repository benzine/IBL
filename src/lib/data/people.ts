import type { ClusterId } from "@/lib/brand";

export interface Person {
  id: string;
  name: string;
  role: string;
  cluster: ClusterId;
  country: string;
  seniority: "professional" | "leader";
  image: string;
  storyTitle: string;
  /** story told in about thirty seconds, roughly sixty five words */
  story: string;
}

/** The twelve faces below are the group's published leadership directory,
    real people in the roles they actually hold. */
export const PEOPLE: Person[] = [
  {
    id: "p1",
    name: "Andreas von Paleske",
    role: "CEO, Naivas",
    cluster: "retail",
    country: "Kenya",
    seniority: "leader",
    image: "/images/faces/face-01.jpg",
    storyTitle: "The Naivas neighbourhoods",
    story:
      "Andreas runs Naivas, the group's Kenyan retail arm, from Nairobi. The stores he looks after are neighbourhood institutions, the vegetable row priced for the street outside them. He measures the business the way a shopkeeper would, one basket at a time, then multiplies by eighty four.",
  },
  {
    id: "p2",
    name: "Jean-Philippe Da Costa",
    role: "COO, Winner's",
    cluster: "retail",
    country: "Mauritius",
    seniority: "leader",
    image: "/images/faces/face-02.jpg",
    storyTitle: "Twenty one stores by morning",
    story:
      "Jean-Philippe keeps the island's homegrown supermarket honest. Overnight, while the island sleeps, the flow from the Riche Terre distribution centre refills twenty one stores so every aisle opens full. He treats that rhythm like a tide table. It is simply what the island can rely on.",
  },
  {
    id: "p3",
    name: "Preetee Jhamna",
    role: "CFO, Group Operations",
    cluster: "retail",
    country: "Mauritius",
    seniority: "professional",
    image: "/images/faces/face-03.jpg",
    storyTitle: "The honest ledger",
    story:
      "Preetee reads the group the way a navigator reads a chart. As chief financial officer for group operations she sits between four clusters and twenty countries, reconciling what each of them promised with what the day actually delivered. Ask her about a number and she will not guess. She opens the ledger and walks you through it.",
  },
  {
    id: "p4",
    name: "Shabnam Gungabissoon-Le Bellec",
    role: "Head of Group Accounting, Consolidation and Reporting",
    cluster: "cbd",
    country: "Mauritius",
    seniority: "professional",
    image: "/images/faces/face-04.jpg",
    storyTitle: "One set of books",
    story:
      "Twenty countries, four clusters, dozens of companies, and at the end of every quarter exactly one set of books. Shabnam's team consolidates all of it into the results the group publishes. The annual report you can assemble further down this page rests on her team's quiet discipline.",
  },
  {
    id: "p5",
    name: "Cougen Purseramen",
    role: "Group Head of Industrial, Engineering, Seafood and Logistics",
    cluster: "industrials",
    country: "Mauritius",
    seniority: "leader",
    image: "/images/faces/face-05.jpg",
    storyTitle: "The harbour portfolio",
    story:
      "Cougen's portfolio reads like the harbour itself. Engineering, seafood, logistics. From the CNOI dry dock where frigates come to be refitted, to cold rooms holding minus twenty two degrees for a season of catch, his beat is the industrial muscle the islands lean on without ever having to think about it.",
  },
  {
    id: "p6",
    name: "Neeraj Hurbungs",
    role: "COO, Manser Saxon",
    cluster: "industrials",
    country: "Mauritius",
    seniority: "professional",
    image: "/images/faces/face-06.jpg",
    storyTitle: "Cranes over Port Louis",
    story:
      "Neeraj runs operations at Manser Saxon, the engineering contractor that has been building the island's skyline, its plants and its hotels for decades. His working day is measured in lifts, pours and handover dates. Half the buildings you can see from the harbour passed through one of his site meetings.",
  },
  {
    id: "p7",
    name: "Steena Kistnen",
    role: "Acting Group Chief People Officer",
    cluster: "services",
    country: "Mauritius",
    seniority: "professional",
    image: "/images/faces/face-07.jpg",
    storyTitle: "Forty thousand and sixty six",
    story:
      "Forty thousand and sixty six people work somewhere across this group, and Steena carries the count personally. Training rosters in Kisumu and safety briefings at the graving dock sit in the same breath of her day. Her rule is short. Look after the people who look after the islands.",
  },
  {
    id: "p8",
    name: "Anaick Larabi",
    role: "Head of Group Legal Affairs, Reunion and Indian Ocean area",
    cluster: "services",
    country: "Réunion",
    seniority: "professional",
    image: "/images/faces/face-08.jpg",
    storyTitle: "The Indian Ocean register",
    story:
      "Anaick anchors the group's legal affairs across the Indian Ocean, working out of Réunion where French law meets the region's commercial rhythms. Contracts in several jurisdictions, one handshake of a company behind them all. Her desk is where the group's borders are drawn, politely and on paper.",
  },
  {
    id: "p9",
    name: "Sarah Rougé",
    role: "Head of Risk and Compliance",
    cluster: "services",
    country: "Mauritius",
    seniority: "professional",
    image: "/images/faces/face-09.jpg",
    storyTitle: "The verification chain",
    story:
      "Sarah runs the group's risk and compliance desk. When someone impersonates the group or its chief executive online, and the trust center on this page takes the report, verification lands in territory like hers. Every verified channel you can call from this site has been through a desk built on her discipline.",
  },
  {
    id: "p10",
    name: "Diane Henry",
    role: "Head of Corporate Affairs",
    cluster: "cbd",
    country: "Mauritius",
    seniority: "professional",
    image: "/images/faces/face-10.jpg",
    storyTitle: "The group's voice",
    story:
      "When the group speaks, Diane has usually read the sentence twice. Corporate affairs means the group's voice, to the islands it operates on, to regulators, to the press. Her team keeps the distance between what the group says and what it does at exactly zero, which is the only distance that survives a century.",
  },
  {
    id: "p11",
    name: "Christine Marot",
    role: "Group Head of Sustainability and Social Impact",
    cluster: "cbd",
    country: "Mauritius",
    seniority: "leader",
    image: "/images/faces/face-11.jpg",
    storyTitle: "Promises to the island",
    story:
      "Christine keeps the group's promises to the island itself. Water counted in megalitres, packaging in tonnes, energy in megawatt hours, mangroves by the hundred thousand. Behind every number she reports there is a site visit, because a promise you have not stood on the ground of is just a slide.",
  },
  {
    id: "p12",
    name: "Désiré Elliah",
    role: "CEO, LUX* Island Resorts",
    cluster: "services",
    country: "Mauritius",
    seniority: "leader",
    image: "/images/faces/face-12.jpg",
    storyTitle: "The welcome before the welcome",
    story:
      "Désiré runs LUX* Island Resorts, where the group's hospitality promise meets the traveller at the door. His preoccupation is the first ninety seconds of arrival, the walk from the taxi to the lobby. Guests never see the work behind it. They only feel that the island seems glad they came.",
  },
];

export const SENIORITY_FILTERS = [
  { value: "all", label: "Everyone" },
  { value: "professional", label: "Professionals" },
  { value: "leader", label: "Leaders" },
];
