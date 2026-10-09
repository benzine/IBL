import type { Metadata } from "next";
import { ExperienceShell } from "@/components/home/experience-shell";

export const metadata: Metadata = {
  title: "IBL Group · Shaping better lives since 1830",
  description:
    "A Mauritian heart. A regional force. Global expertise. The leading diversified group of the Indian Ocean and East Africa, live.",
};

export default function Home() {
  return <ExperienceShell />;
}
