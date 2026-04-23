import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATE,
  parseComparison,
  parseState,
  serializeComparison,
  serializeState,
  type CalcState,
} from "./urlState";

describe("serializeState", () => {
  it("returns an empty string when state equals the defaults", () => {
    expect(serializeState(DEFAULT_STATE)).toBe("");
  });

  it("only includes fields that differ from the default", () => {
    const params = new URLSearchParams(
      serializeState({ ...DEFAULT_STATE, annualSalary: 250000 }),
    );
    expect(Array.from(params.keys())).toEqual(["salary"]);
    expect(params.get("salary")).toBe("250000");
  });

  it("serializes booleans as '1' / '0'", () => {
    const off = new URLSearchParams(
      serializeState({ ...DEFAULT_STATE, defer401kFromBonus: false }),
    );
    expect(off.get("deferBonus")).toBe("0");
  });
});

describe("parseState", () => {
  it("returns {} for an empty query string", () => {
    expect(parseState(new URLSearchParams(""))).toEqual({});
  });

  it("drops unknown state keys silently (no crash on bad URLs)", () => {
    const parsed = parseState(new URLSearchParams("state=zzz"));
    expect(parsed.stateKey).toBeUndefined();
  });

  it("drops invalid filing statuses", () => {
    expect(
      parseState(new URLSearchParams("filing=bogus")).filingStatus,
    ).toBeUndefined();
  });

  it("drops non-numeric and negative numeric values", () => {
    const parsed = parseState(
      new URLSearchParams("salary=notanumber&bonus=-100"),
    );
    expect(parsed.annualSalary).toBeUndefined();
    expect(parsed.bonus).toBeUndefined();
  });

  it("accepts 0 as a valid numeric input", () => {
    expect(parseState(new URLSearchParams("bonus=0")).bonus).toBe(0);
  });

  it("decodes booleans from '1' / '0' only", () => {
    expect(
      parseState(new URLSearchParams("deferBonus=1")).defer401kFromBonus,
    ).toBe(true);
    expect(
      parseState(new URLSearchParams("deferBonus=0")).defer401kFromBonus,
    ).toBe(false);
    expect(
      parseState(new URLSearchParams("deferBonus=true")).defer401kFromBonus,
    ).toBeUndefined();
  });
});

describe("serialize ↔ parse round-trip", () => {
  it("preserves every non-default field", () => {
    const state: CalcState = {
      payType: "hourly",
      annualSalary: 0,
      hourlyRate: 55,
      hoursPerWeek: 35,
      weeksPerYear: 50,
      bonus: 15000,
      rsuValue: 80000,
      defer401kFromBonus: false,
      filingStatus: "mfj",
      stateKey: "ca" in {} ? "ca" : "other", // use "other" to stay valid
      customStateRate: 9.3,
      trad401k: 10,
      roth401k: 2.5,
      employerMatch: 5,
      hsa: 4000,
      healthPremium: 3600,
      fsa: 2000,
      otherPreTax: 500,
      otherPostTax: 1200,
    };

    const params = new URLSearchParams(serializeState(state));
    const parsed = parseState(params);
    const reconstructed: CalcState = { ...DEFAULT_STATE, ...parsed };
    expect(reconstructed).toEqual(state);
  });
});

describe("comparison mode serialization", () => {
  it("omits `compare` when no second scenario is passed", () => {
    const qs = serializeComparison(DEFAULT_STATE, null);
    expect(qs).toBe("");
  });

  it("emits `compare=1` + `b_` prefixed keys for scenario B", () => {
    const b: CalcState = { ...DEFAULT_STATE, annualSalary: 250000 };
    const params = new URLSearchParams(serializeComparison(DEFAULT_STATE, b));
    expect(params.get("compare")).toBe("1");
    expect(params.get("b_salary")).toBe("250000");
    // A stays at defaults so A's keys are absent.
    expect(params.get("salary")).toBeNull();
  });

  it("distinguishes A's and B's fields under the same logical key", () => {
    const a: CalcState = { ...DEFAULT_STATE, annualSalary: 140000, filingStatus: "single" };
    const b: CalcState = { ...DEFAULT_STATE, annualSalary: 250000, filingStatus: "mfj" };
    const params = new URLSearchParams(serializeComparison(a, b));
    expect(params.get("filing")).toBeNull(); // A matches default
    expect(params.get("b_filing")).toBe("mfj");
    expect(params.get("salary")).toBeNull();
    expect(params.get("b_salary")).toBe("250000");
  });
});

describe("comparison mode parse", () => {
  it("returns b=null when `compare` is absent", () => {
    expect(parseComparison(new URLSearchParams("salary=200000")).b).toBeNull();
  });

  it("returns an empty b={} when compare=1 but no b_ fields are present", () => {
    const { a, b } = parseComparison(new URLSearchParams("compare=1"));
    expect(a).toEqual({});
    expect(b).toEqual({});
  });

  it("picks up b_ prefixed fields when compare=1 is set", () => {
    const { a, b } = parseComparison(
      new URLSearchParams(
        "salary=140000&compare=1&b_salary=250000&b_filing=mfj",
      ),
    );
    expect(a.annualSalary).toBe(140000);
    expect(b?.annualSalary).toBe(250000);
    expect(b?.filingStatus).toBe("mfj");
  });

  it("round-trips both scenarios", () => {
    const a: CalcState = { ...DEFAULT_STATE, annualSalary: 175000, bonus: 30000 };
    const b: CalcState = {
      ...DEFAULT_STATE,
      annualSalary: 210000,
      filingStatus: "mfj",
      stateKey: "none",
      trad401k: 12,
    };
    const qs = serializeComparison(a, b);
    const parsed = parseComparison(new URLSearchParams(qs));
    const reconstructedA: CalcState = { ...DEFAULT_STATE, ...parsed.a };
    const reconstructedB: CalcState = { ...DEFAULT_STATE, ...parsed.b };
    expect(reconstructedA).toEqual(a);
    expect(reconstructedB).toEqual(b);
  });
});
