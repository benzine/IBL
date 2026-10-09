"use client";

/* The annual report, assembled as a true PDF file.
 *
 * Why a generated file instead of window.print(): the browser print
 * pipeline stamps its own header and footer onto every sheet, including
 * the page's web address, unless the visitor finds and unchecks the right
 * option in the dialog. A jsPDF document carries only what we draw:
 * our own running heads, our own page numbers, vector charts engraved to
 * the last dot, and no address anywhere.
 *
 * Drawing is pure jsPDF plus the site's live constants, so the same code
 * runs in the browser (downloads the file) and in a plain node context
 * (used by the preview script to proof the sheets). The logo is
 * rasterised from the official SVG at print resolution when a DOM is
 * available; headless runs fall back to the typographic lockup. */

import { BRAND, CLUSTERS, GROUP } from "@/lib/brand";
import { DIVIDENDS } from "@/lib/data/dividends";
import { IMPACT_ANCHORS, PULSE_ANCHORS, TRUSTED_CHANNELS, type VerifiedChannel } from "@/lib/data/trust";

export const REPORT_SECTIONS = [
  { id: "overview", label: "Group at a glance" },
  { id: "chairman", label: "Chairman letter" },
  { id: "financials", label: "Financial highlights" },
  { id: "clusters", label: "Cluster review" },
  { id: "sustainability", label: "Sustainability" },
  { id: "governance", label: "Governance" },
  { id: "risks", label: "Risk factors" },
  { id: "contacts", label: "Verified contacts" },
] as const;

export const REPORT_FILE_NAME = "IBL-Annual-Report-FY2026.pdf";

/* ------------------------------------------------ report data */

const PER_DAY = 86_400;
/** "Rs 60.9 Bn" -> 60.9 */
const rsBn = (s: string) => Number(s.replace(/[^\d.]/g, ""));
const CLUSTER_REVENUE_TOTAL = CLUSTERS.reduce((sum, c) => sum + rsBn(c.revenue), 0);
const CLUSTER_TEAM_TOTAL = CLUSTERS.reduce((sum, c) => sum + c.team, 0);
const fmtInt = (n: number) => n.toLocaleString("en-US");

const CHANNEL_KIND: Record<VerifiedChannel["kind"], string> = {
  domain: "Domain",
  whatsapp: "WhatsApp",
  phone: "Phone",
  email: "Email",
  social: "Social",
  fax: "Fax",
};

const REPORT_FACTS: [string, string][] = [
  ["Established", String(BRAND.established)],
  ["Incorporated", "Mauritius"],
  ["Listed SEM", "1994"],
  ["Headquarters", "Port Louis"],
  ["Countries", String(GROUP.countries)],
  ["Team", fmtInt(GROUP.team)],
  ["Revenue", `${GROUP.revenue} (${GROUP.revenueGrowth})`],
  ["Revenue beyond Mauritius", `${GROUP.outsideMauritius}%`],
];

const REPORT_FINANCIALS: [string, string][] = [
  ["Revenue", GROUP.revenue],
  ["Revenue growth", GROUP.revenueGrowth],
  ["EBITDA", GROUP.ebitda],
  ["Total assets", GROUP.assets],
  ["Revenue outside Mauritius", `${GROUP.outsideMauritius}%`],
  ["Team", fmtInt(GROUP.team)],
];

const REPORT_SUSTAINABILITY: [string, string][] = [
  ["Water saved, modelled", `${fmtInt(Math.round(IMPACT_ANCHORS.waterSavedM3PerSec * PER_DAY))} m\u00B3/day`],
  ["Packaging recycled", `${fmtInt(Math.round(IMPACT_ANCHORS.packagingTonsRecycledPerSec * PER_DAY))} t/day`],
  ["Renewable generation", `${fmtInt(Math.round(PULSE_ANCHORS.energyPerSecond * PER_DAY))} MWh/day`],
  ["Mangrove trees", `${fmtInt(IMPACT_ANCHORS.mangroveTrees)} standing`],
  ["Solar fleet", `${IMPACT_ANCHORS.solarMw} MW`],
];

const REPORT_GOVERNANCE: [string, string][] = [
  ["Group Chief Executive", GROUP.ceo],
  ["Deputy Chief Executive", GROUP.deputyCeo],
  ["Listing", "Stock Exchange of Mauritius, since 1994"],
  ["Majority shareholder", "GML"],
  ["Certification", "Mauritian Eagle, first ISO 27001 certified company in the Indian Ocean"],
];

/* ------------------------------------------------ palette + page geometry */

const INK = "#212979";
const INK_STRONG = "#14161A";
const TEAL = "#4BBDC8";
const TEAL_DEEP = "#2E8F9C";
const MUTED = "#6B7280";
const RULE = "#D8DCE6";
const PAPER = "#FFFFFF";

const PW = 210;
const PH = 297;
const ML = 16;
const MR = 16;
const MT = 18;
const MB = 20;
const CW = PW - ML - MR;

type Pdf = import("jspdf").jsPDF;

/* ------------------------------------------------ logo rasterisation */

async function rasterizeLogo(): Promise<string | null> {
  if (typeof document === "undefined") return null;
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("logo did not load"));
      img.src = BRAND.logoUrl;
    });
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return null;
    const scale = Math.max(4, Math.ceil(1200 / w));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/* ------------------------------------------------ builder */

export async function buildAnnualReportPdf(selected: readonly string[]): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  doc.setProperties({
    title: "IBL Ltd Annual Report FY2026",
    subject: "Annual report assembled from live figures",
    author: "IBL Ltd",
    keywords: "IBL, Mauritius, annual report, FY2026",
    creator: "IBL Ltd",
  });

  const logo = await rasterizeLogo();
  const has = (id: string) => id === "overview" || selected.includes(id);
  const numbered = REPORT_SECTIONS.filter((s) => has(s.id));
  const total = numbered.length;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  let y = MT;
  let sectionNo = 0;

  /* --- shared drawing helpers, all bound to the y cursor --- */

  const newPage = () => {
    doc.addPage();
    doc.setLineWidth(0.25);
    doc.setDrawColor(RULE);
    doc.line(ML, MT + 3.5, PW - MR, MT + 3.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(MUTED);
    doc.text("IBL LTD \u00B7 ANNUAL REPORT FY2026", ML, MT, { charSpace: 0.55 });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(INK);
    doc.text(
      `${String(sectionNo).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
      PW - MR,
      MT,
      { align: "right" },
    );
    y = MT + 12;
  };

  const ensure = (h: number) => {
    if (y + h > PH - MB) newPage();
  };

  const sectionTitle = (label: string) => {
    sectionNo += 1;
    newPage();
    doc.setFillColor(TEAL);
    doc.rect(ML, y - 4.6, 9, 1.4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(INK);
    doc.text(label.toUpperCase(), ML, y + 4.2, { charSpace: 0.6 });
    y += 13;
  };

  const para = (
    text: string,
    opts?: { size?: number; color?: string; leading?: number; bold?: boolean; italic?: boolean; gap?: number },
  ) => {
    const size = opts?.size ?? 9.5;
    const leading = opts?.leading ?? size * 0.52;
    doc.setFont("helvetica", opts?.bold ? "bold" : opts?.italic ? "italic" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(opts?.color ?? INK_STRONG);
    const lines = doc.splitTextToSize(text, CW) as string[];
    for (const ln of lines) {
      ensure(leading);
      doc.text(ln, ML, y);
      y += leading;
    }
    y += opts?.gap ?? 2.5;
  };

  const subLabel = (text: string) => {
    ensure(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(text.toUpperCase(), ML, y + 3, { charSpace: 0.35 });
    y += 8;
  };

  interface Col {
    w: number;
    align?: "left" | "right";
    size?: number;
    bold?: boolean;
    color?: string;
  }

  const table = (headers: string[], rows: string[][], cols: Col[], opts?: { boldCol?: number }) => {
    const padV = 1.9;
    const headH = 7.5;

    const drawHead = () => {
      doc.setDrawColor(INK);
      doc.setLineWidth(0.5);
      doc.line(ML, y, ML + CW, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(MUTED);
      let x = ML;
      headers.forEach((h, i) => {
        const right = cols[i].align === "right";
        doc.text(h.toUpperCase(), right ? x + cols[i].w - 1 : x + 1, y + 3.4, {
          charSpace: 0.3,
          ...(right ? { align: "right" } : {}),
        });
        x += cols[i].w;
      });
      doc.setDrawColor(RULE);
      doc.setLineWidth(0.25);
      doc.line(ML, y + headH - 1.6, ML + CW, y + headH - 1.6);
      y += headH;
    };

    drawHead();
    rows.forEach((row) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const cellLines = row.map((cell, i) => {
        doc.setFontSize(cols[i].size ?? 9);
        return doc.splitTextToSize(cell, cols[i].w - 2.5) as string[];
      });
      const lines = Math.max(...cellLines.map((l) => l.length));
      const rowH = lines * 4.3 + padV * 2 - 0.4;
      if (y + rowH > PH - MB) {
        newPage();
        drawHead();
      }
      let x = ML;
      cellLines.forEach((cl, i) => {
        const c = cols[i];
        const bold = opts?.boldCol === i || c.bold;
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(c.size ?? 9);
        doc.setTextColor(c.color ?? INK_STRONG);
        const right = c.align === "right";
        const xx = right ? x + c.w - 1 : x + 1;
        cl.forEach((ln, li) => {
          doc.text(ln, xx, y + padV + 2.9 + li * 4.3, right ? { align: "right" } : undefined);
        });
        x += c.w;
      });
      y += rowH;
      doc.setDrawColor(RULE);
      doc.setLineWidth(0.25);
      doc.line(ML, y, ML + CW, y);
    });
    y += 5;
  };

  /* --- figures: vector charts, engraved the printed-report way --- */

  const drawDividendChart = () => {
    const plotL = ML + 13;
    const plotR = PW - MR;
    const plotW = plotR - plotL;
    const chartH = 52;
    const top = y + 5;
    const base = top + chartH;
    const max = 0.8;

    doc.setDrawColor(RULE);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([1.1, 1.5], 0);
    for (const v of [0.2, 0.4, 0.6, 0.8]) {
      const gy = base - (v / max) * chartH;
      doc.line(plotL, gy, plotR, gy);
    }
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(INK);
    doc.setLineWidth(0.5);
    doc.line(plotL, base, plotR, base);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(MUTED);
    for (const v of [0, 0.2, 0.4, 0.6, 0.8]) {
      const gy = base - (v / max) * chartH;
      doc.text(v.toFixed(1), plotL - 2, gy + 2.2, { align: "right" });
    }

    const n = DIVIDENDS.length;
    const slot = plotW / n;
    const barW = Math.min(11, slot * 0.55);
    DIVIDENDS.forEach((d, i) => {
      const x = plotL + slot * i + (slot - barW) / 2;
      const hF = (d.final / max) * chartH;
      const hI = (d.interim / max) * chartH;
      doc.setFillColor(INK);
      doc.rect(x, base - hF, barW, hF, "F");
      doc.setFillColor(TEAL);
      doc.rect(x, base - hF - hI, barW, hI, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.setTextColor(INK);
      doc.text(d.total.toFixed(2), x + barW / 2, base - hF - hI - 2, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(MUTED);
      doc.text(String(d.year), x + barW / 2, base + 4.4, { align: "center" });
    });

    let kx = plotL;
    const keyY = base + 10;
    doc.setFillColor(TEAL);
    doc.rect(kx, keyY - 2.6, 3.2, 3.2, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED);
    doc.text("Interim", kx + 5, keyY);
    kx += 24;
    doc.setFillColor(INK);
    doc.rect(kx, keyY - 2.6, 3.2, 3.2, "F");
    doc.text("Final", kx + 5, keyY);
    kx += 22;
    doc.text("MUR per share", kx, keyY);
    y = keyY + 6;
  };

  const drawClusterChart = () => {
    const labelW = 56;
    const barL = ML + labelW;
    const valueW = 47;
    const barMax = PW - MR - valueW - 6 - barL;
    const rowH = 10.5;
    const rows = CLUSTERS.map((c) => ({ ...c, value: rsBn(c.revenue) }));
    const max = Math.max(...rows.map((r) => r.value));

    rows.forEach((r, i) => {
      const ry = y + i * rowH;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(INK_STRONG);
      const name = r.id === "cbd" ? "Brands & Distribution" : r.name;
      doc.text(name, ML, ry + 4);
      const bw = Math.max(2, (barMax * r.value) / max);
      doc.setFillColor(r.color);
      doc.rect(barL, ry + 1.2, bw, 5.4, "F");
      const share = Math.round((r.value / CLUSTER_REVENUE_TOTAL) * 100);
      doc.setFontSize(7.5);
      doc.setTextColor(MUTED);
      doc.text(`Rs ${r.value.toFixed(1)} Bn \u00B7 ${share}% \u00B7 ${fmtInt(r.team)} team`, PW - MR, ry + 5, {
        align: "right",
      });
      doc.setDrawColor(RULE);
      doc.setLineWidth(0.25);
      doc.line(ML, ry + rowH - 1.5, PW - MR, ry + rowH - 1.5);
    });
    y += rows.length * rowH + 1.5;
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED);
    doc.text("Bar length proportional to revenue \u00B7 share of total cluster revenue", ML, y + 3);
    y += 8;
  };

  const drawSplitBar = () => {
    const h = 6.2;
    const x2 = ML + CW * (1 - GROUP.outsideMauritius / 100);
    doc.setFillColor(INK);
    doc.rect(ML, y, x2 - ML, h, "F");
    doc.setFillColor(TEAL);
    doc.rect(x2, y, ML + CW - x2, h, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(PAPER);
    doc.text(`MAURITIUS \u00B7 ${100 - GROUP.outsideMauritius}%`, ML + 3, y + 4.1);
    doc.text(`BEYOND MAURITIUS \u00B7 ${GROUP.outsideMauritius}%`, x2 + 3, y + 4.1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED);
    doc.text("Share of FY2026 revenue by origin", ML, y + h + 4.5);
    y += h + 10;
  };

  /* ------------------------------------------------ cover */

  doc.setFillColor(PAPER);
  doc.rect(0, 0, PW, PH, "F");

  if (logo) {
    const logoW = 40;
    const logoH = (logoW * 67.949) / 99.205;
    doc.addImage(logo, "PNG", ML, 20, logoW, logoH, undefined, "FAST");
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(INK);
    doc.text("IBL", ML, 36);
    doc.setFillColor(TEAL);
    doc.rect(ML + 22, 28, 4, 10, "F");
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text("IBL LTD", ML, 74, { charSpace: 1.1 });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(INK);
  doc.text("Annual Report", ML, 86);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(INK_STRONG);
  doc.text("Financial Year 2026", ML, 96);

  doc.setDrawColor(RULE);
  doc.setLineWidth(0.3);
  doc.line(ML, 106, PW - MR, 106);

  doc.setFontSize(10);
  doc.setTextColor(INK_STRONG);
  doc.text("Port Louis \u00B7 Mauritius", ML, 114);
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  doc.text(`Assembled ${today} from live figures`, ML, 120);

  /* cluster index strip */
  const stripY = 216;
  const colW = CW / 4;
  CLUSTERS.forEach((c, i) => {
    const x = ML + i * colW;
    doc.setFillColor(c.color);
    doc.rect(x, stripY, 5, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(INK_STRONG);
    const name = doc.splitTextToSize(c.name, colW - 10) as string[];
    name.slice(0, 2).forEach((ln, li) => doc.text(ln, x, stripY + 11 + li * 4));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(c.revenue, x, stripY + 11 + Math.min(2, name.length) * 4 + 1.5);
  });

  /* foot band */
  doc.setFillColor(TEAL);
  doc.rect(0, 283.4, PW, 0.8, "F");
  doc.setFillColor(INK);
  doc.rect(0, 284.2, PW, PH - 284.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(PAPER);
  doc.text("IBL LTD", ML, 291.5, { charSpace: 0.9 });
  doc.text("FOUNDED 1830 \u00B7 PORT LOUIS", PW - MR, 291.5, { align: "right", charSpace: 0.9 });

  /* ------------------------------------------------ sections */

  for (const { id, label } of numbered) {
    sectionTitle(label);

    if (id === "overview") {
      const colGap = 8;
      const cellW = (CW - colGap) / 2;
      const cellH = 14;
      REPORT_FACTS.forEach(([k, v], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = ML + col * (cellW + colGap);
        const ry = y + row * cellH;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.8);
        doc.setTextColor(MUTED);
        doc.text(k.toUpperCase(), x, ry + 3.2, { charSpace: 0.3 });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(INK_STRONG);
        doc.text(v, x, ry + 9.6);
        doc.setDrawColor(RULE);
        doc.setLineWidth(0.25);
        doc.line(x, ry + cellH - 2, x + cellW, ry + cellH - 2);
      });
      y += Math.ceil(REPORT_FACTS.length / 2) * cellH + 8;

      para(GROUP.purpose, { size: 11.5, italic: true, color: INK, gap: 0 });
    }

    if (id === "chairman") {
      para("Dear shareholders,", { bold: true, gap: 3.5 });
      para(
        "One hundred ninety six years of commerce teach a certain patience. We moved early into East Africa, we held through cyclones and global pauses, and we paid our obligations on time.",
      );
      para(
        "This year revenue grew thirteen percent, and more than half of it now comes from beyond Mauritius. That breadth is our balance.",
      );
      y += 6;
      ensure(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(INK);
      doc.text(GROUP.ceo, ML, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED);
      doc.text("Group Chief Executive", ML, y);
      y += 6;
    }

    if (id === "financials") {
      table(
        ["Metric", "FY2026"],
        REPORT_FINANCIALS.map(([k, v]) => [k, v]),
        [{ w: CW - 58 }, { w: 58, align: "right", bold: true }],
      );
      subLabel("Dividend per share, MUR");
      drawDividendChart();
      y += 2;
      table(
        ["Year", "Interim", "Final", "Total"],
        DIVIDENDS.map((d) => [
          String(d.year),
          d.interim.toFixed(2),
          d.final.toFixed(2),
          d.total.toFixed(2),
        ]),
        [{ w: 44, bold: true }, { w: 44, align: "right" }, { w: 44, align: "right" }, { w: 46, align: "right", bold: true }],
      );
      subLabel("Where the revenue comes from");
      drawSplitBar();
    }

    if (id === "clusters") {
      subLabel("Revenue by cluster");
      drawClusterChart();
      y += 2;
      table(
        ["Cluster", "Revenue (Rs Bn)", "Op. profit (Rs Bn)", "Team", "Key companies"],
        [
          ...CLUSTERS.map((c) => [
            c.id === "cbd" ? "Consumer Brands & Distribution" : c.name,
            String(rsBn(c.revenue)),
            String(rsBn(c.operatingProfit)),
            fmtInt(c.team),
            c.keyCompanies.join(", "),
          ]),
          [
            "Total of clusters",
            CLUSTER_REVENUE_TOTAL.toFixed(1),
            "",
            fmtInt(CLUSTER_TEAM_TOTAL),
            "",
          ],
        ],
        [
          { w: 44 },
          { w: 24, align: "right" },
          { w: 26, align: "right" },
          { w: 20, align: "right" },
          { w: 64, size: 7.5, color: MUTED },
        ],
      );
    }

    if (id === "sustainability") {
      table(
        ["Metric", "Value"],
        REPORT_SUSTAINABILITY.map(([k, v]) => [k, v]),
        [{ w: CW - 58 }, { w: 58, align: "right", bold: true }],
      );
      para("Modelled from live site anchors.", { size: 7.5, italic: true, color: MUTED, gap: 0 });
    }

    if (id === "governance") {
      REPORT_GOVERNANCE.forEach(([k, v]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(MUTED);
        const labelLines = doc.splitTextToSize(k.toUpperCase(), 48) as string[];
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(INK_STRONG);
        const valueLines = doc.splitTextToSize(v, CW - 56) as string[];
        const lines = Math.max(labelLines.length, valueLines.length);
        const rowH = lines * 4.6 + 5;
        ensure(rowH);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(MUTED);
        labelLines.forEach((ln, li) => doc.text(ln, ML, y + 3 + li * 3.6, { charSpace: 0.3 }));
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(INK_STRONG);
        valueLines.forEach((ln, li) => doc.text(ln, ML + 56, y + 3.4 + li * 4.6));
        y += rowH;
        doc.setDrawColor(RULE);
        doc.setLineWidth(0.25);
        doc.line(ML, y - 2, ML + CW, y - 2);
      });
      y += 4;
    }

    if (id === "risks") {
      const risks = [
        "Cyclone seasons touch Indian Ocean operations, most recently Belal.",
        "Currency movement shifts reported figures across twenty countries.",
        "Freight and grain supply stay exposed to global shocks.",
        "The board reviews these quarterly.",
      ];
      risks.forEach((r, i) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(INK);
        const num = `${i + 1}.`;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(INK_STRONG);
        const lines = doc.splitTextToSize(r, CW - 10) as string[];
        const rowH = lines.length * 4.9 + 4;
        ensure(rowH);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(INK);
        doc.text(num, ML, y + 3.4);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(INK_STRONG);
        lines.forEach((ln, li) => doc.text(ln, ML + 10, y + 3.4 + li * 4.9));
        y += rowH;
      });
    }

    if (id === "contacts") {
      table(
        ["Channel", "Detail"],
        TRUSTED_CHANNELS.map((ch) => [CHANNEL_KIND[ch.kind], `${ch.label}, ${ch.value}`]),
        [{ w: 38, bold: true }, { w: CW - 38 }],
      );
      y += 4;
      ensure(16);
      doc.setDrawColor(RULE);
      doc.setLineWidth(0.3);
      doc.line(ML, y, ML + CW, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(MUTED);
      doc.text(BRAND.hq, ML, y + 3);
      y += 6;
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(MUTED);
      doc.text(`Verified channels listed are the group's official ones. ${BRAND.phone}.`, ML, y + 3);
    }
  }

  /* ------------------------------------------------ page numbers */

  const pages = doc.getNumberOfPages();
  for (let p = 2; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(MUTED);
    doc.text(`Page ${p - 1} of ${pages - 1}`, PW / 2, PH - 10, { align: "center", charSpace: 0.4 });
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

/** Browser entry point: builds the document and hands it over as a download. */
export async function generateAnnualReportPdf(selected: readonly string[]): Promise<string> {
  const bytes = await buildAnnualReportPdf(selected);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = REPORT_FILE_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return REPORT_FILE_NAME;
}
