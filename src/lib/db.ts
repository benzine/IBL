/**
 * The deployment ledger.
 *
 * The authoring sandbox ships this interface on Prisma and SQLite so
 * engagement events and incident reports persist between sessions. A
 * serverless deployment has no durable disk, so this build of the same
 * interface keeps an in-memory ledger per warm instance and mirrors
 * every entry to the server logs, which survive in the platform's log
 * drains (Vercel: Observability / Logs). Nothing else in the app knows
 * the difference: same surface, same call sites.
 *
 * To give the deployed site a durable ledger later, install Prisma,
 * point DATABASE_URL at your database and restore this module to a
 * PrismaClient singleton. Nothing else needs to change.
 */

interface EngagementCreate {
  kind: string;
  meta?: string | null;
}

interface IncidentCreate {
  kind: string;
  channel?: string | null;
  details?: string | null;
}

interface IncidentRecord extends IncidentCreate {
  id: string;
  createdAt: Date;
}

interface LedgerDb {
  engagementEvent: {
    create: (args: { data: EngagementCreate }) => Promise<{ kind: string }>;
  };
  incidentReport: {
    create: (args: { data: IncidentCreate }) => Promise<{ id: string; createdAt: Date }>;
  };
}

const events: EngagementCreate[] = [];
const incidents: IncidentRecord[] = [];

function ledgerId(): string {
  const uuid =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  return uuid.replace(/-/g, "").slice(0, 12);
}

export const db: LedgerDb = {
  engagementEvent: {
    create: async ({ data }) => {
      events.push(data);
      console.log(`[ledger] engagement ${data.kind}${data.meta ? ` · ${data.meta}` : ""}`);
      return { kind: data.kind };
    },
  },
  incidentReport: {
    create: async ({ data }) => {
      const record: IncidentRecord = { ...data, id: ledgerId(), createdAt: new Date() };
      incidents.push(record);
      console.log(
        `[ledger] incident ${record.id} · ${data.kind} · channel ${data.channel ?? "unknown"}`
      );
      if (data.details) console.log(`[ledger] details ${data.details}`);
      return { id: record.id, createdAt: record.createdAt };
    },
  },
};
