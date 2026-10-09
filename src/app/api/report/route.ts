import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      kind?: string;
      channel?: string;
      details?: string;
    };
    const kind = body.kind === "barrier" ? "barrier" : "impersonation";
    const report = await db.incidentReport.create({
      data: {
        kind,
        channel: (body.channel ?? "").slice(0, 120) || null,
        details: (body.details ?? "").slice(0, 2000) || null,
      },
    });
    return NextResponse.json({
      ok: true,
      id: report.id.slice(0, 8).toUpperCase(),
      receivedAt: report.createdAt,
    });
  } catch (e) {
    console.error("report route", e);
    return NextResponse.json({ ok: false, error: "Could not file the report" }, { status: 500 });
  }
}
