// 2026 tax data (IRS Rev. Proc. 2025-32, SSA, NCDOR, IRS Pub. 15).
// Kept as plain data so tests can import constants directly.

export type FilingStatus = "single" | "mfj" | "hoh" | "mfs";

export interface Bracket {
  rate: number;
  upTo: number;
}

export const FEDERAL_BRACKETS_2026: Record<FilingStatus, Bracket[]> = {
  single: [
    { rate: 0.1, upTo: 12400 },
    { rate: 0.12, upTo: 50400 },
    { rate: 0.22, upTo: 105700 },
    { rate: 0.24, upTo: 201775 },
    { rate: 0.32, upTo: 256225 },
    { rate: 0.35, upTo: 640600 },
    { rate: 0.37, upTo: Infinity },
  ],
  mfj: [
    { rate: 0.1, upTo: 24800 },
    { rate: 0.12, upTo: 100800 },
    { rate: 0.22, upTo: 211400 },
    { rate: 0.24, upTo: 403550 },
    { rate: 0.32, upTo: 512450 },
    { rate: 0.35, upTo: 768700 },
    { rate: 0.37, upTo: Infinity },
  ],
  hoh: [
    { rate: 0.1, upTo: 17700 },
    { rate: 0.12, upTo: 67450 },
    { rate: 0.22, upTo: 105700 },
    { rate: 0.24, upTo: 201775 },
    { rate: 0.32, upTo: 256200 },
    { rate: 0.35, upTo: 640600 },
    { rate: 0.37, upTo: Infinity },
  ],
  mfs: [
    { rate: 0.1, upTo: 12400 },
    { rate: 0.12, upTo: 50400 },
    { rate: 0.22, upTo: 105700 },
    { rate: 0.24, upTo: 201775 },
    { rate: 0.32, upTo: 256225 },
    { rate: 0.35, upTo: 384350 },
    { rate: 0.37, upTo: Infinity },
  ],
};

export const FED_STD_DEDUCTION_2026: Record<FilingStatus, number> = {
  single: 16100,
  mfj: 32200,
  hoh: 24150,
  mfs: 16100,
};

export const ADD_MEDICARE_THRESHOLD: Record<FilingStatus, number> = {
  single: 200000,
  mfj: 250000,
  hoh: 200000,
  mfs: 125000,
};

export const SS_WAGE_BASE_2026 = 184500;
export const SS_RATE = 0.062;
export const MEDICARE_RATE = 0.0145;
export const ADD_MEDICARE_RATE = 0.009;

export const FED_SUPP_RATE = 0.22;
export const FED_SUPP_RATE_HIGH = 0.37;
export const FED_SUPP_MILLION_CAP = 1_000_000;

export const EMPLOYEE_401K_LIMIT_2026 = 23500;

export interface StateDef {
  name: string;
  // Flat rate (or null for "other" / progressive states). Ignored when
  // `brackets` is provided.
  rate: number | null;
  suppRate: number | null;
  stdDed: Record<FilingStatus, number>;
  // Progressive bracket schedules per filing status. When present, state
  // income tax is computed bracket-wise and `rate` is not used. See the
  // template below for how to add a progressive state.
  brackets?: Record<FilingStatus, Bracket[]>;
}

export const STATES: Record<string, StateDef> = {
  none: {
    name: "No state income tax (AK, FL, NV, NH, SD, TN, TX, WA, WY)",
    rate: 0,
    suppRate: 0,
    stdDed: { single: 0, mfj: 0, hoh: 0, mfs: 0 },
  },
  nc: {
    name: "North Carolina",
    rate: 0.0399,
    suppRate: 0.0399,
    stdDed: { single: 12750, mfj: 25500, hoh: 19125, mfs: 12750 },
  },
  pa: {
    name: "Pennsylvania",
    rate: 0.0307,
    suppRate: 0.0307,
    stdDed: { single: 0, mfj: 0, hoh: 0, mfs: 0 },
  },
  il: {
    name: "Illinois",
    rate: 0.0495,
    suppRate: 0.0495,
    stdDed: { single: 2850, mfj: 5700, hoh: 2850, mfs: 2850 },
  },
  ut: {
    name: "Utah",
    rate: 0.0455,
    suppRate: 0.0455,
    stdDed: { single: 0, mfj: 0, hoh: 0, mfs: 0 },
  },
  mi: {
    name: "Michigan",
    rate: 0.0425,
    suppRate: 0.0425,
    stdDed: { single: 5800, mfj: 11600, hoh: 5800, mfs: 5800 },
  },
  in: {
    name: "Indiana",
    rate: 0.03,
    suppRate: 0.0315,
    stdDed: { single: 1000, mfj: 2000, hoh: 1000, mfs: 1000 },
  },
  co: {
    name: "Colorado",
    rate: 0.044,
    suppRate: 0.0463,
    stdDed: { single: 16100, mfj: 32200, hoh: 24150, mfs: 16100 },
  },
  az: {
    name: "Arizona",
    rate: 0.025,
    suppRate: 0.025,
    stdDed: { single: 16100, mfj: 32200, hoh: 24150, mfs: 16100 },
  },
  ky: {
    name: "Kentucky",
    rate: 0.04,
    suppRate: 0.04,
    stdDed: { single: 3460, mfj: 3460, hoh: 3460, mfs: 3460 },
  },
  ga: {
    name: "Georgia",
    rate: 0.0519,
    suppRate: 0.0519,
    stdDed: { single: 12000, mfj: 24000, hoh: 12000, mfs: 12000 },
  },
  ma: {
    name: "Massachusetts",
    rate: 0.05,
    suppRate: 0.05,
    stdDed: { single: 0, mfj: 0, hoh: 0, mfs: 0 },
  },
  id: {
    name: "Idaho",
    rate: 0.053,
    suppRate: 0.053,
    stdDed: { single: 16100, mfj: 32200, hoh: 24150, mfs: 16100 },
  },
  la: {
    name: "Louisiana",
    rate: 0.03,
    suppRate: 0.03,
    stdDed: { single: 12500, mfj: 25000, hoh: 12500, mfs: 12500 },
  },
  other: {
    name: "Other / Progressive state — enter effective rate",
    rate: null,
    suppRate: null,
    stdDed: { single: 0, mfj: 0, hoh: 0, mfs: 0 },
  },
};

// ---------------------------------------------------------------------------
// Adding a progressive-bracket state (CA, NY, etc.)
// ---------------------------------------------------------------------------
// The calculation engine supports per-filing-status bracket schedules. To add
// e.g. California, slot a StateDef into STATES above with a `brackets` map:
//
//   ca: {
//     name: "California",
//     rate: null,          // unused when brackets is present
//     suppRate: 0.1023,    // CA FTB: 10.23% bonus / 6.6% other supp
//     stdDed: { single: <>, mfj: <>, hoh: <>, mfs: <> },
//     brackets: {
//       single: [{ rate: 0.01, upTo: <> }, ..., { rate: 0.123, upTo: Infinity }],
//       mfj:    [{ rate: 0.01, upTo: <> }, ..., { rate: 0.123, upTo: Infinity }],
//       hoh:    [{ rate: 0.01, upTo: <> }, ..., { rate: 0.123, upTo: Infinity }],
//       mfs:    [{ rate: 0.01, upTo: <> }, ..., { rate: 0.123, upTo: Infinity }],
//     },
//   },
//
// 2026 bracket thresholds must be verified against the authoritative source
// before shipping — they get inflation-adjusted annually:
//   • California: FTB Form 540 2026 instructions (usually published Nov–Dec 2025)
//   • New York:   NY DTF IT-201 / IT-203 2026 instructions
// ---------------------------------------------------------------------------

// Progressive bracket tax on a taxable amount.
export function calcBracketTax(taxable: number, brackets: Bracket[]): number {
  if (taxable <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (taxable <= b.upTo) return tax + (taxable - lower) * b.rate;
    tax += (b.upTo - lower) * b.rate;
    lower = b.upTo;
  }
  return tax;
}

export function marginalRate(taxable: number, brackets: Bracket[]): number {
  for (const b of brackets) if (taxable <= b.upTo) return b.rate;
  return brackets[brackets.length - 1].rate;
}

export interface BracketSegment {
  rate: number; // e.g. 0.22
  from: number; // lower bound of this bracket
  to: number; // upper bound (Infinity for top bracket)
  amount: number; // portion of taxable income that falls in this bracket
  tax: number; // tax owed on that portion
}

// Decompose a taxable income into per-bracket segments. Used for the
// visual bracket breakdown so users can see why their effective rate lies
// below their marginal rate.
export function bracketBreakdown(
  taxable: number,
  brackets: Bracket[],
): BracketSegment[] {
  if (taxable <= 0) return [];
  const out: BracketSegment[] = [];
  let lower = 0;
  for (const b of brackets) {
    const top = Math.min(taxable, b.upTo);
    const amount = Math.max(0, top - lower);
    if (amount > 0) {
      out.push({
        rate: b.rate,
        from: lower,
        to: b.upTo,
        amount,
        tax: amount * b.rate,
      });
    }
    if (taxable <= b.upTo) break;
    lower = b.upTo;
  }
  return out;
}

interface ScenarioInput {
  gross: number;
  bonus: number;
  filingStatus: FilingStatus;
  trad401k: number;
  roth401k: number;
  defer401kFromBonus: boolean;
  section125: number;
  // Flat state rate. Ignored when `stateBrackets` is provided.
  stateRate: number;
  // Progressive bracket schedule for the filing status. When provided,
  // overrides `stateRate`.
  stateBrackets?: Bracket[];
  stateStdDed: number;
}

export interface ScenarioResult {
  ficaWages: number;
  fedWages: number;
  fedTaxable: number;
  fedTax: number;
  stateTax: number;
  ss: number;
  medicare: number;
  trad401kAmt: number;
  roth401kAmt: number;
  totalTax: number;
  fedMarginal: number;
  // Marginal state rate at the user's income. For flat-rate states this equals
  // the flat rate; for progressive states it is looked up from the brackets.
  stateMarginal: number;
}

// Liability for a given gross. Called twice by `calculateAll`: once for
// salary+supplemental, once for salary alone, so we can isolate the true
// incremental tax cost of the supplemental wages.
export function scenario(inp: ScenarioInput): ScenarioResult {
  const {
    gross,
    bonus,
    filingStatus,
    trad401k,
    roth401k,
    defer401kFromBonus,
    section125,
    stateRate,
    stateBrackets,
    stateStdDed,
  } = inp;

  const contributable = gross - bonus + (defer401kFromBonus ? bonus : 0);
  const trad401kAmt = contributable * (trad401k / 100);
  const roth401kAmt = contributable * (roth401k / 100);
  const ficaWages = Math.max(0, gross - section125);
  const fedWages = Math.max(0, gross - section125 - trad401kAmt);
  const ss = Math.min(ficaWages, SS_WAGE_BASE_2026) * SS_RATE;
  const addMed =
    Math.max(0, ficaWages - ADD_MEDICARE_THRESHOLD[filingStatus]) *
    ADD_MEDICARE_RATE;
  const medicare = ficaWages * MEDICARE_RATE + addMed;
  const fedStdDed = FED_STD_DEDUCTION_2026[filingStatus];
  const fedTaxable = Math.max(0, fedWages - fedStdDed);
  const fedTax = calcBracketTax(fedTaxable, FEDERAL_BRACKETS_2026[filingStatus]);
  const stateTaxable = Math.max(0, fedWages - stateStdDed);
  const stateTax = stateBrackets
    ? calcBracketTax(stateTaxable, stateBrackets)
    : stateTaxable * stateRate;
  const stateMarginal = stateBrackets
    ? marginalRate(stateTaxable, stateBrackets)
    : stateRate;

  return {
    ficaWages,
    fedWages,
    fedTaxable,
    fedTax,
    stateTax,
    ss,
    medicare,
    trad401kAmt,
    roth401kAmt,
    totalTax: fedTax + stateTax + ss + medicare,
    fedMarginal: marginalRate(fedTaxable, FEDERAL_BRACKETS_2026[filingStatus]),
    stateMarginal,
  };
}

export interface CalcInput {
  salary: number;
  bonus: number;
  rsuValue: number;
  filingStatus: FilingStatus;
  stateKey: string;
  customStateRate: number; // percent, e.g. 6 for 6%
  trad401k: number;
  roth401k: number;
  defer401kFromBonus: boolean;
  hsa: number;
  healthPremium: number;
  fsa: number;
  otherPreTax: number;
  otherPostTax: number;
}

export interface CalcResult extends ScenarioResult {
  inputs: {
    salary: number;
    bonus: number;
    rsuValue: number;
    supplemental: number;
    totalGross: number;
  };
  filingStatus: FilingStatus;
  stateRate: number;
  stateSuppRate: number;
  addMedicare: number;
  section125: number;
  preTaxDeductions: number;
  postTaxDeductions: number;
  takeHome: number;
  effectiveRate: number;
  supp: {
    gross: number;
    deferred: number;
    subjectToWH: number;
    fedWH: number;
    stateWH: number;
    ficaWH: number;
    totalWithheld: number;
    trueTax: number;
    gap: number;
  };
}

export function calculateAll(inp: CalcInput): CalcResult {
  const {
    salary,
    bonus,
    rsuValue,
    filingStatus,
    stateKey,
    customStateRate,
    trad401k,
    roth401k,
    defer401kFromBonus,
    hsa,
    healthPremium,
    fsa,
    otherPreTax,
    otherPostTax,
  } = inp;

  const s = Math.max(0, salary || 0);
  const b = Math.max(0, bonus || 0);
  const r = Math.max(0, rsuValue || 0);
  const supplemental = b + r;
  const totalGross = s + b + r;
  const section125 = hsa + healthPremium + fsa + otherPreTax;

  const stateDef = STATES[stateKey];
  const stateBrackets = stateDef.brackets?.[filingStatus];
  // Flat rate used only when the state is not progressive. For "other", the
  // user-entered custom rate acts as the flat rate.
  const flatStateRate = stateBrackets
    ? 0
    : stateKey === "other"
      ? (customStateRate || 0) / 100
      : stateDef.rate || 0;
  const stateStdDed = stateDef.stdDed[filingStatus] || 0;

  const full = scenario({
    gross: totalGross,
    bonus: b,
    filingStatus,
    trad401k,
    roth401k,
    defer401kFromBonus,
    section125,
    stateRate: flatStateRate,
    stateBrackets,
    stateStdDed,
  });

  const salaryOnly = scenario({
    gross: s,
    bonus: 0,
    filingStatus,
    trad401k,
    roth401k,
    defer401kFromBonus,
    section125,
    stateRate: flatStateRate,
    stateBrackets,
    stateStdDed,
  });

  // Rate shown in the UI ("plus state X%"). For flat states this equals the
  // flat rate; for progressive states it's the marginal bracket at the user's
  // income.
  const displayStateRate = full.stateMarginal;
  const stateSuppRate =
    stateKey === "other"
      ? displayStateRate
      : stateDef.suppRate ?? displayStateRate;

  const incrementalTrueTax = full.totalTax - salaryOnly.totalTax;

  // Paycheck withholding on supplemental wages. A traditional 401(k) deferral
  // applied to the bonus reduces income-tax withholding but not FICA; RSUs
  // typically are not 401(k)-deferrable.
  const suppDeferred = defer401kFromBonus ? b * (trad401k / 100) : 0;
  const suppSubjectToIncomeWH = Math.max(0, supplemental - suppDeferred);
  const fedSuppWH =
    Math.min(suppSubjectToIncomeWH, FED_SUPP_MILLION_CAP) * FED_SUPP_RATE +
    Math.max(0, suppSubjectToIncomeWH - FED_SUPP_MILLION_CAP) *
      FED_SUPP_RATE_HIGH;
  const stateSuppWH = suppSubjectToIncomeWH * stateSuppRate;
  const suppFICA =
    full.ss - salaryOnly.ss + (full.medicare - salaryOnly.medicare);
  const totalSuppWithheld = fedSuppWH + stateSuppWH + suppFICA;
  const withholdingGap = incrementalTrueTax - totalSuppWithheld;

  const preTaxDeductions = full.trad401kAmt + section125;
  const postTaxDeductions = full.roth401kAmt + (otherPostTax || 0);
  const takeHome =
    totalGross - full.totalTax - preTaxDeductions - postTaxDeductions;

  return {
    inputs: { salary: s, bonus: b, rsuValue: r, supplemental, totalGross },
    filingStatus,
    ...full,
    stateRate: displayStateRate,
    stateSuppRate,
    addMedicare:
      Math.max(0, full.ficaWages - ADD_MEDICARE_THRESHOLD[filingStatus]) *
      ADD_MEDICARE_RATE,
    section125,
    preTaxDeductions,
    postTaxDeductions,
    takeHome,
    effectiveRate: totalGross > 0 ? full.totalTax / totalGross : 0,
    supp: {
      gross: supplemental,
      deferred: suppDeferred,
      subjectToWH: suppSubjectToIncomeWH,
      fedWH: fedSuppWH,
      stateWH: stateSuppWH,
      ficaWH: suppFICA,
      totalWithheld: totalSuppWithheld,
      trueTax: incrementalTrueTax,
      gap: withholdingGap,
    },
  };
}
