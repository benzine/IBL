import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const ALLOWED = new Set([
  "face-met",
  "press-kit",
  "report-built",
  "ask-query",
  "lang-switch",
  "lens-switch",
]);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { kind?: string; meta?: unknown };
    if (!body.kind || !ALLOWED.has(body.kind)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await db.engagementEvent.create({
      data: {
        kind: body.kind,
        meta: typeof body.meta === "string" ? body.meta.slice(0, 500) : null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("track route", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
