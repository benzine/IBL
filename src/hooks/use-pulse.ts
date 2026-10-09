"use client";

import { useEffect, useState } from "react";
import { PULSE_ANCHORS } from "@/lib/data/trust";

export interface PulseData {
  /** Port Louis weather, live when available */
  weather: { tempC: number; windKph: number; windDir: number; cloud: number; condition: string; live: boolean };
  /** delayed simulated share ticker anchored near the reference price */
  share: { price: number; changePct: number; currency: "MUR"; live: false };
  /** shipments modelled at sea right now */
  shipments: { atSea: number; arrivalsToday: number };
  /** seconds since local midnight, drives the day counters */
  daySecond: number;
  seed: number;
  fetchedAt: string;
}

/**
 * The live pulse. Tries the server route (which blends real Port Louis weather),
 * falls back to a local model so the page is alive even offline.
 */
export function usePulse(pollMs = 30000) {
  const [data, setData] = useState<PulseData | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/pulse", { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as PulseData;
          // day counters follow the visitor's own clock
          const now = new Date();
          json.daySecond = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
          if (alive) setData(json);
          return;
        }
        throw new Error("pulse route unavailable");
      } catch {
        if (alive) setData(localPulse());
      }
    };
    load();
    const id = setInterval(load, pollMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pollMs]);

  return data;
}

export function localPulse(): PulseData {
  const now = new Date();
  const daySecond =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const seed = Math.floor(now.getTime() / 60000);
  const r = mulberry(seed);
  const hour = now.getHours();
  // Port Louis seasonal approximation when live weather is unavailable
  const baseTemp = 24 + 4 * Math.sin(((hour - 4) / 24) * Math.PI * 2);
  return {
    weather: {
      tempC: Math.round(baseTemp + r() * 2),
      windKph: Math.round(14 + r() * 18),
      windDir: Math.round(r() * 360),
      cloud: Math.round(30 + r() * 45),
      condition: "trade winds",
      live: false,
    },
    share: {
      price: Math.round((21 + (r() - 0.5) * 0.8) * 100) / 100,
      changePct: Math.round((r() - 0.45) * 4 * 100) / 100,
      currency: "MUR",
      live: false,
    },
    shipments: {
      atSea: 9 + Math.floor(r() * 7),
      arrivalsToday: Math.floor(2 + r() * 5),
    },
    daySecond,
    seed,
    fetchedAt: now.toISOString(),
  };
}

function mulberry(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derived live metrics from pulse data, used across sections. */
export function pulseMetrics(p: PulseData | null) {
  const daySecond = p?.daySecond ?? 0;
  const revenueToday = PULSE_ANCHORS.revenuePerSecond * daySecond;
  const transactionsToday = Math.floor(PULSE_ANCHORS.transactionsPerSecond * daySecond);
  const cargoToday = PULSE_ANCHORS.cargoPerSecond * daySecond;
  const mealsToday = PULSE_ANCHORS.mealsPerSecond * daySecond;
  const energyToday = PULSE_ANCHORS.energyPerSecond * daySecond;
  const fraudBlocked = PULSE_ANCHORS.fraudPerDay * (daySecond / 86400);
  return {
    revenueToday,
    transactionsToday,
    cargoToday,
    mealsToday,
    energyToday,
    fraudBlocked: Math.floor(fraudBlocked),
    share: p?.share ?? { price: 21, changePct: 0, currency: "MUR" as const, live: false },
    weather: p?.weather ?? {
      tempC: 26,
      windKph: 18,
      windDir: 120,
      cloud: 40,
      condition: "trade winds",
      live: false,
    },
    shipments: p?.shipments ?? { atSea: 12, arrivalsToday: 3 },
    seed: p?.seed ?? 1,
  };
}
