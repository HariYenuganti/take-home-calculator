export const fmt = (n: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

export const fmtSigned = (n: number): string =>
  (n >= 0 ? "+" : "\u2212") + fmt(Math.abs(n)).replace("-", "");

export const fmtPct = (n: number): string => `${(n * 100).toFixed(2)}%`;

// Signed percentage-point delta between two rates.
// e.g. pctDelta(0.24, 0.22) -> "+2.00 pp"
export const pctDelta = (b: number, a: number): string => {
  const diff = (b - a) * 100;
  const sign = diff >= 0 ? "+" : "−";
  return `${sign}${Math.abs(diff).toFixed(2)} pp`;
};
