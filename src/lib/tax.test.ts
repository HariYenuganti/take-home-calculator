import { describe, expect, it } from "vitest";
import {
  ADD_MEDICARE_RATE,
  ADD_MEDICARE_THRESHOLD,
  bracketBreakdown,
  calcBracketTax,
  calculateAll,
  FED_STD_DEDUCTION_2026,
  FED_SUPP_MILLION_CAP,
  FED_SUPP_RATE,
  FED_SUPP_RATE_HIGH,
  FEDERAL_BRACKETS_2026,
  marginalRate,
  MEDICARE_RATE,
  SS_RATE,
  SS_WAGE_BASE_2026,
  scenario,
  type CalcInput,
  type FilingStatus,
} from "./tax";

const baseInput = (overrides: Partial<CalcInput> = {}): CalcInput => ({
  salary: 140000,
  bonus: 0,
  rsuValue: 0,
  filingStatus: "single",
  stateKey: "none",
  customStateRate: 0,
  trad401k: 0,
  roth401k: 0,
  defer401kFromBonus: false,
  hsa: 0,
  healthPremium: 0,
  fsa: 0,
  otherPreTax: 0,
  otherPostTax: 0,
  ...overrides,
});

describe("calcBracketTax", () => {
  const single = FEDERAL_BRACKETS_2026.single;

  it("returns 0 for zero or negative taxable income", () => {
    expect(calcBracketTax(0, single)).toBe(0);
    expect(calcBracketTax(-5000, single)).toBe(0);
  });

  it("taxes entirely within the first bracket", () => {
    // $10,000 single: 10% of 10,000 = $1,000
    expect(calcBracketTax(10000, single)).toBeCloseTo(1000, 4);
  });

  it("handles the exact top of a bracket", () => {
    // Top of 10% bracket for single: $12,400
    expect(calcBracketTax(12400, single)).toBeCloseTo(1240, 4);
  });

  it("correctly straddles two brackets", () => {
    // $20,000 single:
    //   12,400 @ 10% = 1,240
    //   7,600  @ 12% =   912
    //   total         = 2,152
    expect(calcBracketTax(20000, single)).toBeCloseTo(2152, 4);
  });

  it("steps through every bracket for very high incomes", () => {
    // $700,000 single — walks past the $640,600 breakpoint into 37%.
    const expected =
      12400 * 0.1 +
      (50400 - 12400) * 0.12 +
      (105700 - 50400) * 0.22 +
      (201775 - 105700) * 0.24 +
      (256225 - 201775) * 0.32 +
      (640600 - 256225) * 0.35 +
      (700000 - 640600) * 0.37;
    expect(calcBracketTax(700000, single)).toBeCloseTo(expected, 2);
  });
});

describe("bracketBreakdown", () => {
  const single = FEDERAL_BRACKETS_2026.single;

  it("returns an empty array for zero or negative income", () => {
    expect(bracketBreakdown(0, single)).toEqual([]);
    expect(bracketBreakdown(-100, single)).toEqual([]);
  });

  it("produces one segment for income entirely in the first bracket", () => {
    const segs = bracketBreakdown(10000, single);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ rate: 0.1, amount: 10000, tax: 1000 });
  });

  it("splits income across two brackets when it straddles the first boundary", () => {
    // $20,000 single: 12,400 @ 10% ($1,240), 7,600 @ 12% ($912)
    const segs = bracketBreakdown(20000, single);
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({ rate: 0.1, amount: 12400, tax: 1240 });
    expect(segs[1]).toMatchObject({ rate: 0.12, amount: 7600, tax: 912 });
  });

  it("stops building segments once all income is accounted for", () => {
    // $169,500 single ends partway through the 24% bracket.
    const segs = bracketBreakdown(169500, single);
    expect(segs.map((s) => s.rate)).toEqual([0.1, 0.12, 0.22, 0.24]);
    const lastSeg = segs[segs.length - 1];
    expect(lastSeg.amount).toBeCloseTo(169500 - 105700, 2); // 63,800
  });

  it("tax totals across segments equal calcBracketTax", () => {
    const segs = bracketBreakdown(169500, single);
    const sum = segs.reduce((s, seg) => s + seg.tax, 0);
    expect(sum).toBeCloseTo(calcBracketTax(169500, single), 2);
  });

  it("sum of segment amounts equals the original taxable income", () => {
    for (const taxable of [5000, 25000, 80000, 169500, 500000]) {
      const total = bracketBreakdown(taxable, single).reduce(
        (s, seg) => s + seg.amount,
        0,
      );
      expect(total).toBeCloseTo(taxable, 2);
    }
  });
});

describe("marginalRate", () => {
  const single = FEDERAL_BRACKETS_2026.single;

  it.each<[number, number]>([
    [0, 0.1],
    [12400, 0.1],
    [12401, 0.12],
    [50400, 0.12],
    [100000, 0.22],
    [150000, 0.24],
    [250000, 0.32],
    [500000, 0.35],
    [1_000_000, 0.37],
  ])("taxable %s → marginal %s", (taxable, rate) => {
    expect(marginalRate(taxable, single)).toBe(rate);
  });
});

describe("FICA: Social Security and Medicare", () => {
  it("caps Social Security at the 2026 wage base", () => {
    const result = calculateAll(baseInput({ salary: 300000 }));
    expect(result.ss).toBeCloseTo(SS_WAGE_BASE_2026 * SS_RATE, 2);
  });

  it("does NOT cap Medicare — it applies to all wages", () => {
    const result = calculateAll(baseInput({ salary: 300000 }));
    // Base Medicare (pre-surcharge) is 1.45% of all wages.
    const baseMedicare = 300000 * MEDICARE_RATE;
    expect(result.medicare).toBeGreaterThan(baseMedicare); // includes surcharge
    expect(result.medicare - result.addMedicare).toBeCloseTo(baseMedicare, 2);
  });

  it("adds the 0.9% additional Medicare surcharge for single filers above $200k", () => {
    const result = calculateAll(baseInput({ salary: 300000 }));
    const expectedSurcharge =
      (300000 - ADD_MEDICARE_THRESHOLD.single) * ADD_MEDICARE_RATE;
    expect(result.addMedicare).toBeCloseTo(expectedSurcharge, 2);
  });

  it("uses the MFJ threshold ($250k), not the single threshold, for joint filers", () => {
    const single = calculateAll(
      baseInput({ salary: 240000, filingStatus: "single" }),
    );
    const mfj = calculateAll(
      baseInput({ salary: 240000, filingStatus: "mfj" }),
    );
    expect(single.addMedicare).toBeCloseTo(
      (240000 - 200000) * ADD_MEDICARE_RATE,
      2,
    );
    // MFJ threshold is $250k, so $240k salary is under it: no surcharge.
    expect(mfj.addMedicare).toBe(0);
  });
});

describe("Pre-tax deductions", () => {
  it("traditional 401(k) reduces federal taxable wages but not FICA wages", () => {
    const withoutDeferral = calculateAll(
      baseInput({ salary: 100000, trad401k: 0 }),
    );
    const withDeferral = calculateAll(
      baseInput({ salary: 100000, trad401k: 10 }),
    );
    expect(withDeferral.trad401kAmt).toBeCloseTo(10000, 2);
    // FICA base is unchanged.
    expect(withDeferral.ficaWages).toBeCloseTo(withoutDeferral.ficaWages, 2);
    expect(withDeferral.ss).toBeCloseTo(withoutDeferral.ss, 2);
    // Fed taxable drops by exactly the deferral amount.
    expect(withoutDeferral.fedWages - withDeferral.fedWages).toBeCloseTo(
      10000,
      2,
    );
    expect(withDeferral.fedTax).toBeLessThan(withoutDeferral.fedTax);
  });

  it("Section 125 (HSA/health/FSA) reduces both FICA and federal wages", () => {
    const without = calculateAll(baseInput({ salary: 100000 }));
    const withHSA = calculateAll(baseInput({ salary: 100000, hsa: 3000 }));
    expect(withHSA.ficaWages).toBeCloseTo(without.ficaWages - 3000, 2);
    expect(withHSA.fedWages).toBeCloseTo(without.fedWages - 3000, 2);
    expect(withHSA.ss).toBeLessThan(without.ss);
  });
});

describe("Take-home identity", () => {
  it("takeHome + totalTax + preTaxDeductions + postTaxDeductions == totalGross", () => {
    const r = calculateAll(
      baseInput({
        salary: 140000,
        bonus: 20000,
        rsuValue: 40000,
        trad401k: 6,
        roth401k: 2,
        hsa: 3000,
        healthPremium: 2400,
        stateKey: "nc",
      }),
    );
    expect(
      r.takeHome + r.totalTax + r.preTaxDeductions + r.postTaxDeductions,
    ).toBeCloseTo(r.inputs.totalGross, 2);
  });

  it("clamps negative inputs to zero", () => {
    const r = calculateAll(
      baseInput({ salary: -10000, bonus: -5000, rsuValue: -1000 }),
    );
    expect(r.inputs.salary).toBe(0);
    expect(r.inputs.bonus).toBe(0);
    expect(r.inputs.rsuValue).toBe(0);
    expect(r.inputs.totalGross).toBe(0);
    expect(r.effectiveRate).toBe(0);
    expect(r.takeHome).toBe(0);
  });
});

describe("Standard deduction applies per filing status", () => {
  it.each<FilingStatus>(["single", "mfj", "hoh", "mfs"])(
    "reduces taxable income by the std. deduction for %s",
    (status) => {
      const r = calculateAll(
        baseInput({ salary: 80000, filingStatus: status }),
      );
      expect(r.fedTaxable).toBeCloseTo(
        80000 - FED_STD_DEDUCTION_2026[status],
        2,
      );
    },
  );
});

describe("Supplemental-wage withholding vs. true marginal tax", () => {
  it("produces a negative gap (refund) when flat 22% withholding exceeds the actual marginal bracket", () => {
    // Low salary — actual marginal is 12%, but supp withholds at 22%.
    const r = calculateAll(
      baseInput({ salary: 50000, bonus: 10000, stateKey: "none" }),
    );
    expect(r.supp.gross).toBe(10000);
    expect(r.supp.gap).toBeLessThan(0);
  });

  it("produces a positive gap (owe at filing) for high marginal filers", () => {
    // Salary puts marginal at 35%; 22% supplemental withholding under-shoots.
    const r = calculateAll(
      baseInput({ salary: 500000, bonus: 100000, stateKey: "none" }),
    );
    expect(r.supp.gap).toBeGreaterThan(0);
  });

  it("applies the 37% rate above the $1M supplemental cap", () => {
    const supp = FED_SUPP_MILLION_CAP + 500_000; // $1.5M in bonus
    const r = calculateAll(
      baseInput({
        salary: 100_000,
        bonus: supp,
        stateKey: "none",
      }),
    );
    const expectedFedWH =
      FED_SUPP_MILLION_CAP * FED_SUPP_RATE + 500_000 * FED_SUPP_RATE_HIGH;
    expect(r.supp.fedWH).toBeCloseTo(expectedFedWH, 2);
  });

  it("defer401kFromBonus reduces the supplemental income-tax withholding base", () => {
    const off = calculateAll(
      baseInput({
        salary: 100000,
        bonus: 10000,
        trad401k: 10,
        defer401kFromBonus: false,
      }),
    );
    const on = calculateAll(
      baseInput({
        salary: 100000,
        bonus: 10000,
        trad401k: 10,
        defer401kFromBonus: true,
      }),
    );
    // With deferral on, 10% of the $10k bonus ($1,000) is pre-tax for WH.
    expect(off.supp.deferred).toBe(0);
    expect(on.supp.deferred).toBeCloseTo(1000, 2);
    expect(on.supp.subjectToWH).toBeCloseTo(9000, 2);
    expect(on.supp.fedWH).toBeCloseTo(9000 * FED_SUPP_RATE, 2);
    expect(off.supp.fedWH).toBeCloseTo(10000 * FED_SUPP_RATE, 2);
  });

  it("supp.trueTax equals full scenario tax minus salary-only scenario tax", () => {
    const input = baseInput({
      salary: 140000,
      bonus: 20000,
      rsuValue: 40000,
      stateKey: "nc",
      filingStatus: "single",
    });
    const full = scenario({
      gross: input.salary + input.bonus + input.rsuValue,
      bonus: input.bonus,
      filingStatus: input.filingStatus,
      trad401k: input.trad401k,
      roth401k: input.roth401k,
      defer401kFromBonus: input.defer401kFromBonus,
      section125: 0,
      stateRate: 0.0399,
      stateStdDed: 12750,
    });
    const salaryOnly = scenario({
      gross: input.salary,
      bonus: 0,
      filingStatus: input.filingStatus,
      trad401k: input.trad401k,
      roth401k: input.roth401k,
      defer401kFromBonus: input.defer401kFromBonus,
      section125: 0,
      stateRate: 0.0399,
      stateStdDed: 12750,
    });
    const r = calculateAll(input);
    expect(r.supp.trueTax).toBeCloseTo(
      full.totalTax - salaryOnly.totalTax,
      2,
    );
  });
});

describe("Progressive state brackets", () => {
  // Synthetic progressive schedule — stands in for CA/NY until verified 2026
  // data is dropped into STATES.
  const syntheticBrackets = [
    { rate: 0.02, upTo: 50_000 },
    { rate: 0.05, upTo: 200_000 },
    { rate: 0.09, upTo: Infinity },
  ];

  it("computes state tax bracket-wise when stateBrackets is provided", () => {
    const result = scenario({
      gross: 180_000,
      bonus: 0,
      filingStatus: "single",
      trad401k: 0,
      roth401k: 0,
      defer401kFromBonus: false,
      section125: 0,
      stateRate: 0, // ignored when brackets present
      stateBrackets: syntheticBrackets,
      stateStdDed: 0,
    });
    // $180,000 taxable: 50k @ 2% + 130k @ 5% = $1,000 + $6,500 = $7,500
    expect(result.stateTax).toBeCloseTo(7500, 2);
    expect(result.stateMarginal).toBe(0.05);
  });

  it("picks up the top-bracket marginal for very high incomes", () => {
    const result = scenario({
      gross: 500_000,
      bonus: 0,
      filingStatus: "single",
      trad401k: 0,
      roth401k: 0,
      defer401kFromBonus: false,
      section125: 0,
      stateRate: 0,
      stateBrackets: syntheticBrackets,
      stateStdDed: 0,
    });
    expect(result.stateMarginal).toBe(0.09);
  });

  it("falls back to the flat stateRate when stateBrackets is not provided", () => {
    const result = scenario({
      gross: 100_000,
      bonus: 0,
      filingStatus: "single",
      trad401k: 0,
      roth401k: 0,
      defer401kFromBonus: false,
      section125: 0,
      stateRate: 0.05,
      stateStdDed: 0,
    });
    expect(result.stateTax).toBeCloseTo(5000, 2);
    expect(result.stateMarginal).toBe(0.05);
  });
});

describe("State handling", () => {
  it("charges zero state tax for the 'none' pseudo-state", () => {
    const r = calculateAll(baseInput({ salary: 150000, stateKey: "none" }));
    expect(r.stateTax).toBe(0);
    expect(r.stateRate).toBe(0);
  });

  it("applies the NC flat rate and its standard deduction", () => {
    const r = calculateAll(baseInput({ salary: 100000, stateKey: "nc" }));
    // NC: 3.99% on (fedWages - $12,750).
    const expectedStateTaxable = 100000 - 12750;
    expect(r.stateTax).toBeCloseTo(expectedStateTaxable * 0.0399, 2);
  });

  it("uses the custom rate when stateKey is 'other'", () => {
    const r = calculateAll(
      baseInput({ salary: 100000, stateKey: "other", customStateRate: 5 }),
    );
    expect(r.stateRate).toBe(0.05);
    expect(r.stateTax).toBeCloseTo(100000 * 0.05, 2);
  });

  it("uses the state's supp rate (not regular rate) for supp withholding where they differ", () => {
    // Indiana: regular 3.00%, supp 3.15%.
    const r = calculateAll(
      baseInput({ salary: 100000, bonus: 10000, stateKey: "in" }),
    );
    expect(r.stateRate).toBeCloseTo(0.03, 4);
    expect(r.stateSuppRate).toBeCloseTo(0.0315, 4);
    expect(r.supp.stateWH).toBeCloseTo(10000 * 0.0315, 2);
  });
});
