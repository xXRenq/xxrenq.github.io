export type RatesResult = {
  rates: Record<string, number>;
  updatedAt: string;
  source: "live" | "fallback";
};

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  PLN: 3.98,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.52,
  BRL: 5.4,
};

const API_URL = "https://open.er-api.com/v6/latest/USD";
const CACHE_KEY = "xxrenq_exchange_rates_v1";
const CACHE_TTL_MS = 1000 * 60 * 60;

type Cache = {
  rates: Record<string, number>;
  fetchedAt: number;
};

function readCache(): Cache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cache;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(rates: Record<string, number>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, fetchedAt: Date.now() }));
  } catch {
    return;
  }
}

export async function fetchRates(): Promise<RatesResult> {
  const cached = readCache();
  if (cached) {
    return { rates: cached.rates, updatedAt: new Date(cached.fetchedAt).toISOString(), source: "live" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error("Request failed");

    const data = await response.json();
    if (!data.rates || typeof data.rates !== "object") throw new Error("Malformed response");

    writeCache(data.rates);

    return {
      rates: data.rates,
      updatedAt: data.time_last_update_utc ?? new Date().toISOString(),
      source: "live",
    };
  } catch {
    return {
      rates: FALLBACK_RATES,
      updatedAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

export const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "PLN", label: "Polish Złoty", symbol: "zł" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "CAD", label: "Canadian Dollar", symbol: "$" },
  { code: "AUD", label: "Australian Dollar", symbol: "$" },
  { code: "BRL", label: "Brazilian Real", symbol: "R$" },
];

export const STEAM_POINTS_PER_USD = 100;

export function pointsToCurrency(points: number, rate: number): number {
  return (points / STEAM_POINTS_PER_USD) * rate;
}

export function currencyToPoints(amount: number, rate: number): number {
  return (amount / rate) * STEAM_POINTS_PER_USD;
}
