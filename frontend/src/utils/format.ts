export const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const RATING_LABELS: Record<number, string> = { 1: "Poor", 2: "Fair", 3: "Moderate", 4: "Good", 5: "Excellent" };
const COST_LABELS: Record<number, string> = { 1: "Very low", 2: "Low", 3: "Medium", 4: "High", 5: "Very high" };
const GAS_LABELS: Record<number, string> = {
  1: "Very low (near-hermetic)", 2: "Low", 3: "Moderate", 4: "High", 5: "Very high (breathable)",
};

export const ratingLabel = (n: number) => RATING_LABELS[n] ?? String(n);
export const costLabel = (n: number) => COST_LABELS[n] ?? String(n);
export const gasLabel = (n: number) => GAS_LABELS[n] ?? String(n);

export function formatNumber(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  if (n < 1) return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return n.toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

export const formatRange = (min: number, max: number, unit?: string) =>
  `${formatNumber(min)} – ${formatNumber(max)}${unit ? ` ${unit}` : ""}`;

export const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;

export const MAP_MODE_LABELS: Record<string, string> = {
  passive: "Passive MAP",
  gas_flush: "Gas-flush MAP",
  none: "Not required",
};
