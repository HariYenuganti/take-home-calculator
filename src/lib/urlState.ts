import { STATES, type FilingStatus } from "./tax";

export type PayType = "annual" | "hourly";

export interface CalcState {
  payType: PayType;
  annualSalary: number;
  hourlyRate: number;
  hoursPerWeek: number;
  weeksPerYear: number;
  bonus: number;
  rsuValue: number;
  defer401kFromBonus: boolean;
  filingStatus: FilingStatus;
  stateKey: string;
  customStateRate: number;
  trad401k: number;
  roth401k: number;
  employerMatch: number;
  hsa: number;
  healthPremium: number;
  fsa: number;
  otherPreTax: number;
  otherPostTax: number;
}

// FROZEN wire-format baseline. The URL encodes only the fields that differ
// from this, so these values must never change — shared links in the wild
// decode their omitted fields against them. Kept separate from the UI seed
// below so the demo can evolve without altering the wire format.
export const SERIALIZATION_BASELINE: CalcState = {
  payType: "annual",
  annualSalary: 140000,
  hourlyRate: 40,
  hoursPerWeek: 40,
  weeksPerYear: 52,
  bonus: 20000,
  rsuValue: 40000,
  defer401kFromBonus: true,
  filingStatus: "single",
  stateKey: "nc",
  customStateRate: 6,
  trad401k: 6,
  roth401k: 0,
  employerMatch: 4,
  hsa: 0,
  healthPremium: 2400,
  fsa: 0,
  otherPreTax: 0,
  otherPostTax: 0,
};

// Scenario shown to a first-time visitor (a populated demo). A spread copy, so
// it may diverge from the frozen baseline freely — it does not affect URL
// serialization.
export const DEFAULT_STATE: CalcState = { ...SERIALIZATION_BASELINE };

// Annual salary derived from the pay-type fields. Centralizes the
// annual-vs-hourly rule used by both the inputs readout and the calc.
export function deriveSalary(state: CalcState): number {
  return state.payType === "annual"
    ? state.annualSalary
    : state.hourlyRate * state.hoursPerWeek * state.weeksPerYear;
}

// Short-ish, human-readable URL keys. Stable; don't rename casually — shared
// links out in the wild will break.
const KEYS = {
  payType: "payType",
  annualSalary: "salary",
  hourlyRate: "rate",
  hoursPerWeek: "hrs",
  weeksPerYear: "wks",
  bonus: "bonus",
  rsuValue: "rsu",
  defer401kFromBonus: "deferBonus",
  filingStatus: "filing",
  stateKey: "state",
  customStateRate: "stateRate",
  trad401k: "trad",
  roth401k: "roth",
  employerMatch: "match",
  hsa: "hsa",
  healthPremium: "premium",
  fsa: "fsa",
  otherPreTax: "preTax",
  otherPostTax: "postTax",
} as const satisfies Record<keyof CalcState, string>;

const NUMERIC_FIELDS = [
  "annualSalary",
  "hourlyRate",
  "hoursPerWeek",
  "weeksPerYear",
  "bonus",
  "rsuValue",
  "customStateRate",
  "trad401k",
  "roth401k",
  "employerMatch",
  "hsa",
  "healthPremium",
  "fsa",
  "otherPreTax",
  "otherPostTax",
] as const satisfies ReadonlyArray<keyof CalcState>;

const FILING_STATUSES: readonly FilingStatus[] = ["single", "mfj", "hoh", "mfs"];

// Write each non-default field into `params`. Used by both serializeState
// (prefix="") and comparison mode (prefix="b_" for scenario B).
function writeStateParams(
  params: URLSearchParams,
  state: CalcState,
  prefix: string,
): void {
  (Object.keys(KEYS) as Array<keyof CalcState>).forEach((k) => {
    const value = state[k];
    if (value === SERIALIZATION_BASELINE[k]) return;
    const urlKey = prefix + KEYS[k];
    if (typeof value === "boolean") params.set(urlKey, value ? "1" : "0");
    else params.set(urlKey, String(value));
  });
}

// Serialize only fields that differ from the default. Keeps URLs short.
export function serializeState(state: CalcState, prefix = ""): string {
  const params = new URLSearchParams();
  writeStateParams(params, state, prefix);
  return params.toString();
}

// Parse a URLSearchParams into a partial state. Unknown / invalid values are
// dropped silently rather than rejected — a malformed URL should degrade to
// defaults, not a crash.
export function parseState(
  params: URLSearchParams,
  prefix = "",
): Partial<CalcState> {
  const out: Partial<CalcState> = {};
  const get = (k: string) => params.get(prefix + k);

  const payType = get(KEYS.payType);
  if (payType === "annual" || payType === "hourly") out.payType = payType;

  const filing = get(KEYS.filingStatus);
  if (filing && (FILING_STATUSES as readonly string[]).includes(filing)) {
    out.filingStatus = filing as FilingStatus;
  }

  const stateKey = get(KEYS.stateKey);
  if (stateKey && stateKey in STATES) out.stateKey = stateKey;

  const defer = get(KEYS.defer401kFromBonus);
  if (defer === "1" || defer === "0") out.defer401kFromBonus = defer === "1";

  for (const field of NUMERIC_FIELDS) {
    const raw = get(KEYS[field]);
    if (raw === null) continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) out[field] = n;
  }

  return out;
}

// Comparison serialization: both scenarios packed into one query string.
// When `b` is null, emits just scenario A. When `b` is provided, adds
// `compare=1` plus `b_`-prefixed copies of scenario B's non-default fields.
export function serializeComparison(
  a: CalcState,
  b: CalcState | null,
): string {
  const params = new URLSearchParams();
  writeStateParams(params, a, "");
  if (b) {
    params.set("compare", "1");
    writeStateParams(params, b, "b_");
  }
  return params.toString();
}

// Parse both scenarios out of a query string. Returns `b: null` when
// `compare=1` is absent, so the caller can tell compare-mode state apart
// from "B happens to match A".
export function parseComparison(params: URLSearchParams): {
  a: Partial<CalcState>;
  b: Partial<CalcState> | null;
} {
  const a = parseState(params);
  const compareOn = params.get("compare") === "1";
  return { a, b: compareOn ? parseState(params, "b_") : null };
}
