import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, RefreshCw, TriangleAlert } from "lucide-react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import {
  fetchRates,
  SUPPORTED_CURRENCIES,
  STEAM_POINTS_PER_USD,
  pointsToCurrency,
  currencyToPoints,
  type RatesResult,
} from "../lib/exchangeRates";

type Direction = "pointsToCurrency" | "currencyToPoints";

const PRESET_POINTS = [100, 500, 1000, 2500, 5000];
const PRESET_AMOUNTS = [1, 5, 10, 25, 50];

export function SteamPointsConverter() {
  const [direction, setDirection] = useState<Direction>("pointsToCurrency");
  const [currency, setCurrency] = useState("USD");
  const [rawValue, setRawValue] = useState("100");
  const [ratesState, setRatesState] = useState<RatesResult | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadRates() {
    setLoading(true);
    const result = await fetchRates();
    setRatesState(result);
    setLoading(false);
  }

  useEffect(() => {
    loadRates();
  }, []);

  const rate = ratesState?.rates[currency] ?? null;

  const numericValue = rawValue.trim() === "" ? null : Number(rawValue);
  const isValid = numericValue !== null && !Number.isNaN(numericValue) && numericValue >= 0;
  const showError = rawValue.trim() !== "" && !isValid;

  const result = useMemo(() => {
    if (!isValid || numericValue === null || rate === null) return null;
    return direction === "pointsToCurrency"
      ? pointsToCurrency(numericValue, rate)
      : currencyToPoints(numericValue, rate);
  }, [isValid, numericValue, rate, direction]);

  const currencyMeta = SUPPORTED_CURRENCIES.find((entry) => entry.code === currency);
  const presets = direction === "pointsToCurrency" ? PRESET_POINTS : PRESET_AMOUNTS;
  const inputLabel = direction === "pointsToCurrency" ? "Steam Points" : `Amount (${currency})`;
  const inputSuffix = direction === "pointsToCurrency" ? "pts" : currency;

  function swapDirection() {
    setDirection((current) => (current === "pointsToCurrency" ? "currencyToPoints" : "pointsToCurrency"));
    setRawValue(result !== null ? String(Number(result.toFixed(2))) : rawValue);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink-dim">
          <span>Steam rate: 100 pts = $1.00 USD</span>
        </div>
        <RateStatus loading={loading} ratesState={ratesState} onRetry={loadRates} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-end gap-4">
        <div className="flex flex-col gap-3">
          <Input
            label={inputLabel}
            inputMode="decimal"
            value={rawValue}
            onChange={(event) => setRawValue(event.target.value)}
            suffix={inputSuffix}
            error={showError ? "Enter a valid, non-negative number" : undefined}
            placeholder="0"
          />
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRawValue(String(preset))}
                className="h-7 px-2.5 rounded-sm border border-border text-xs text-ink-dim hover:text-ink hover:border-border-strong transition-colors duration-150"
              >
                {direction === "pointsToCurrency" ? `${preset} pts` : `${preset}`}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={swapDirection}
          aria-label="Swap conversion direction"
          className="h-10 w-10 shrink-0 mx-auto rounded border border-border flex items-center justify-center text-ink-dim hover:text-accent hover:border-border-strong transition-colors duration-150"
        >
          <ArrowLeftRight size={16} />
        </button>

        <div className="flex flex-col gap-3">
          <Select
            label={direction === "pointsToCurrency" ? "Currency" : "Currency"}
            value={currency}
            onChange={setCurrency}
            options={SUPPORTED_CURRENCIES.map((entry) => ({
              value: entry.code,
              label: `${entry.code} — ${entry.label}`,
            }))}
          />
          <ResultDisplay
            direction={direction}
            result={result}
            rate={rate}
            currencySymbol={currencyMeta?.symbol ?? ""}
            currencyCode={currency}
          />
        </div>
      </div>

      <p className="text-xs text-ink-faint leading-relaxed border-t border-border pt-4">
        This is an unofficial calculator and is not affiliated with or endorsed by Valve. Steam
        Points are converted at the fixed rate of {STEAM_POINTS_PER_USD} points per US dollar,
        then translated to your selected currency using the exchange rate above.
      </p>
    </div>
  );
}

function ResultDisplay({
  direction,
  result,
  rate,
  currencySymbol,
  currencyCode,
}: {
  direction: Direction;
  result: number | null;
  rate: number | null;
  currencySymbol: string;
  currencyCode: string;
}) {
  const label = direction === "pointsToCurrency" ? "You receive" : "Steam Points needed";

  return (
    <div className="rounded border border-border bg-raised px-3 py-2.5 h-[62px] flex flex-col justify-center">
      <span className="text-xs text-ink-faint">{label}</span>
      {result === null || rate === null ? (
        <span className="text-lg font-mono text-ink-faint">—</span>
      ) : direction === "pointsToCurrency" ? (
        <span className="text-lg font-mono text-ink">
          {currencySymbol}
          {result.toFixed(2)}{" "}
          <span className="text-sm text-ink-faint">{currencyCode}</span>
        </span>
      ) : (
        <span className="text-lg font-mono text-ink">
          {Math.ceil(result).toLocaleString()} <span className="text-sm text-ink-faint">pts</span>
        </span>
      )}
    </div>
  );
}

function RateStatus({
  loading,
  ratesState,
  onRetry,
}: {
  loading: boolean;
  ratesState: RatesResult | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-ink-faint">
        <RefreshCw size={12} className="animate-spin" />
        Loading exchange rates
      </span>
    );
  }

  if (!ratesState) return null;

  if (ratesState.source === "fallback") {
    return (
      <div className="flex items-center gap-2 text-xs text-accent">
        <TriangleAlert size={12} />
        <span>Live rates unavailable, using fallback</span>
        <Button type="button" variant="ghost" size="sm" onClick={onRetry} className="h-6 px-2 text-accent">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <span className="text-xs text-ink-faint">
      Rates updated {new Date(ratesState.updatedAt).toLocaleString()}
    </span>
  );
}
