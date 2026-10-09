import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

export const maxDuration = 60;

const KNOWLEDGE = `You answer as the official IBL Group knowledge base. Only use the facts below. If a question falls outside them, say you are not certain and suggest the WhatsApp handoff.

GROUP FACTS
- IBL Group, founded in Mauritius in 1830 (Blyth Brothers, joined by Ireland Fraser and Co in 1850, merged into Ireland Blyth Ltd in 1972, listed on the Stock Exchange of Mauritius in 1994, majority held by GML from 2010, renamed IBL Ltd in 2016).
- Purpose: Shaping better lives and better tomorrows. Together.
- Values: truth, trust, together.
- Group CEO Arnaud Lagesse (since 2005, succeeded his father). Deputy Group CEO Patrice Robert.
- Head office: IBL House, Caudan Waterfront, Port Louis, Mauritius. Phone +230 203 2000, fax +230 203 2002, WhatsApp +230 203 2000, email info@iblgroup.com.
- Around 39,500 to 40,000 team members across 20 countries. FY revenue Rs 124.3 billion (+13%), EBITDA Rs 14.5 billion, total assets Rs 151.1 billion, 51% of revenue generated outside Mauritius. USD 2.6 billion revenue. First market capitalisation in Mauritius outside banking.
- Four strategic clusters since 2024.

CLUSTERS
- Retail: Rs 60.9 Bn revenue, Rs 2.7 Bn operating profit, 16,275 team members, 130+ stores across Mauritius, Kenya and Reunion. Key companies: Winner's (since 1994), Naivas (Kenya), Run Market (Reunion).
- Consumer Brands & Distribution: Rs 30.5 Bn revenue, Rs 2.3 Bn operating profit, 3,888 team members, more than 400 brands. Key companies: Phoenix Beverages, BrandActiv (2011), HealthActiv, Harley (Madagascar).
- Industrials: Rs 20.2 Bn revenue, Rs 1.5 Bn operating profit, 13,564 team members. Key companies: Alteo (sugar and energy), CNOI shipyard (2001, repairs French Navy frigates), Scomat (Caterpillar dealership since 1929), Manser Saxon, Blychem, IBL Energy, Froid des Mascareignes, Marine Biotechnology, MIWA (Madagascar seafood), CMH.
- Services: Rs 19.5 Bn revenue, Rs 3.2 Bn operating profit, 6,339 team members. Key companies: LUX* Collectiv, LUX* Resorts, DTOS, Mauritian Eagle Insurance (1973, first ISO 27001 in the Indian Ocean), Logidis, IBL Aviation, IBL Shopping.

HISTORY MILESTONES
1830 Blyth Brothers founded. 1850 Ireland Fraser and Co founded on 1 July. 1929 Caterpillar dealership signed. 1939 Joseph Lagesse acquires Mon Loisir sugar estate. 1970 CIDL established by Cyril Lagesse. 1972 merger into Ireland Blyth Ltd. 1973 Mauritian Eagle Insurance founded. 1994 SEM listing, first Winner's store. 2005 Arnaud Lagesse becomes Group CEO. 2010 GML becomes majority shareholder. 2016 amalgamation, renamed IBL Ltd. 2021 Beyond Borders regional strategy. 2022 to 2025 regional expansion and acquisitions across East Africa and the Indian Ocean. 2024 new four cluster structure. DotExe Ventures, a humble entry into African venture capital.

NEWS
- IBL reports 13.2% revenue growth entering a new phase of regional integration (nine month revenue Rs 90.4 billion, +19%).
- Scam alert: fraudulent content impersonating IBL and its Group CEO. Official channels are listed on the trust center.
- Together Magazine, issue ten, field notes from twenty countries.

SUSTAINABILITY
- Solar and bagasse renewable energy, water stewardship, packaging recycling, 184,000 mangrove trees programme scale.

DIVIDENDS
- Interim declared around December, final around June. Annual dividend around Rs 0.78 per share, yield near 3.7 percent at the reference price of Rs 21. AGM held around 15 November in Port Louis.

CAREERS
- Opportunities across retail, distribution, industry and services in 20 countries. The mosaic on the homepage shows opt-in employee stories. Portraits on this redesign are illustrative.`;

const SOURCE_LABELS = [
  "IBL About and History pages",
  "FY key financial figures",
  "Business cluster pages",
  "Newsroom announcements",
  "Trust center verified channels",
];

function guessSources(q: string): string[] {
  const t = q.toLowerCase();
  const out: string[] = [];
  if (/financ|revenue|dividend|ebitda|asset|profit|share|agm|invest/.test(t)) out.push(SOURCE_LABELS[1]);
  if (/cluster|retail|brand|industrial|service|winner|naivas|phoenix|cnoi|scomat|lux|eagle|alteo/.test(t)) out.push(SOURCE_LABELS[2]);
  if (/history|1830|1972|founded|blyth|ireland|lagesse|milestone/.test(t)) out.push(SOURCE_LABELS[0]);
  if (/news|scam|fraud|dotexe|growth/.test(t)) out.push(SOURCE_LABELS[3]);
  if (/contact|whatsapp|phone|email|domain|official|verify/.test(t)) out.push(SOURCE_LABELS[4]);
  if (out.length === 0) out.push(SOURCE_LABELS[0]);
  return out;
}

export async function POST(req: Request) {
  try {
    const { question, history } = (await req.json()) as {
      question?: string;
      history?: { role: string; content: string }[];
    };
    if (!question || question.trim().length < 2) {
      return NextResponse.json({ error: "A question is required" }, { status: 400 });
    }

    const messages = [
      {
        role: "system" as const,
        content: `${KNOWLEDGE}

Reply rules:
- Answer in at most 120 words, warm and factual, corporate but human.
- Never invent numbers or companies beyond the knowledge above.
- If the question is off topic or you are not certain, reply briefly with "I am not certain about that one" and recommend continuing on WhatsApp.
- End your reply with a line listing the source labels you used, formatted exactly as: SOURCES: label 1 | label 2`,
      },
      ...(history ?? []).slice(-6).map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(m.content).slice(0, 2000),
      })),
      { role: "user" as const, content: question.slice(0, 2000) },
    ];

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
      temperature: 0.4,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const srcMatch = raw.match(/SOURCES:\s*(.+)$/i);
    const answer = raw.replace(/SOURCES:\s*.+$/i, "").trim();
    const sources = srcMatch
      ? srcMatch[1].split("|").map((s) => s.trim()).filter(Boolean)
      : guessSources(question);

    const handoff = /not certain|whatsapp/i.test(raw) || answer.length < 12;

    try {
      await db.engagementEvent.create({
        data: {
          kind: "ask-query",
          meta: question.slice(0, 180),
        },
      });
    } catch {
      // logging is best effort, never block an answer
    }

    return NextResponse.json({
      answer: answer || "I am not certain about that one, let us continue on WhatsApp.",
      sources,
      handoff,
    });
  } catch (e) {
    console.error("ask route", e);
    return NextResponse.json(
      {
        answer:
          "The knowledge desk is unreachable at the moment. Continue on WhatsApp and a colleague will pick it up.",
        sources: [SOURCE_LABELS[4]],
        handoff: true,
      },
      { status: 200 }
    );
  }
}
