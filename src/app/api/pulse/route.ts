import { NextResponse } from "next/server";

/**
 * The live pulse route. Blends real weather over Port Louis (open meteo),
 * a delayed simulated share walk anchored at the reference price, and seeded
 * shipment activity. Every response carries a minute seed so the generative
 * hero never renders identically twice.
 */

interface WeatherCache {
  at: number;
  tempC: number;
  windKph: number;
  windDir: number;
  cloud: number;
  condition: string;
  live: boolean;
}

let cache: WeatherCache | null = null;
const CACHE_MS = 10 * 60 * 1000;

async function portLouisWeather(): Promise<WeatherCache> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=-20.165&longitude=57.5026&current=temperature_2m,wind_speed_10m,wind_direction_10m,cloud_cover,weather_code";
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error("weather upstream");
    const json = (await res.json()) as {
      current: {
        temperature_2m: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
        cloud_cover: number;
        weather_code: number;
      };
    };
    const c = json.current;
    cache = {
      at: Date.now(),
      tempC: Math.round(c.temperature_2m),
      windKph: Math.round(c.wind_speed_10m),
      windDir: Math.round(c.wind_direction_10m),
      cloud: Math.round(c.cloud_cover),
      condition: describeWeather(c.weather_code),
      live: true,
    };
    return cache;
  } catch {
    // seasonal fallback, still honest about being modelled
    const now = new Date();
    const hour = now.getUTCHours() + 4; // Port Louis
    const baseTemp = 24 + 4 * Math.sin((((hour - 4) % 24) / 24) * Math.PI * 2);
    return {
      at: Date.now(),
      tempC: Math.round(baseTemp),
      windKph: 16,
      windDir: 120,
      cloud: 42,
      condition: "trade winds",
      live: false,
    };
  }
}

function describeWeather(code: number): string {
  if (code === 0) return "clear sky";
  if (code <= 3) return "fair breeze";
  if (code <= 48) return "haze";
  if (code <= 67) return "showers";
  if (code <= 77) return "showers";
  if (code <= 82) return "passing showers";
  return "storm watch";
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

export async function GET() {
  const weather = await portLouisWeather();
  const now = new Date();
  const seed = Math.floor(now.getTime() / 60000);
  const r = mulberry(seed);

  // delayed share walk anchored near the reference price
  const price = Math.round((21 + (r() - 0.5) * 0.9) * 100) / 100;
  const changePct = Math.round(((price - 21) / 21) * 10000) / 100;

  const body = {
    weather,
    share: { price, changePct, currency: "MUR" as const, live: false as const },
    shipments: {
      atSea: 9 + Math.floor(r() * 7),
      arrivalsToday: Math.floor(2 + r() * 5),
    },
    daySecond: now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds(),
    seed,
    fetchedAt: now.toISOString(),
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
