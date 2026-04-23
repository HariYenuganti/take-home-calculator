export const fmt = (n: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

export const fmtSigned = (n: number): string =>
  (n >= 0 ? "+" : "\u2212") + fmt(Math.abs(n)).replace("-", "");

export const fmtPct = (n: number): string => `${(n * 100).toFixed(2)}%`;
