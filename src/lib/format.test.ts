import { describe, expect, it } from "vitest";
import { fmt, fmtPct, fmtSigned } from "./format";

describe("fmt", () => {
  it("formats as whole-dollar USD with no cents", () => {
    expect(fmt(1234.56)).toBe("$1,235");
    expect(fmt(0)).toBe("$0");
  });

  it("guards against non-finite numbers", () => {
    expect(fmt(Number.NaN)).toBe("$0");
    expect(fmt(Number.POSITIVE_INFINITY)).toBe("$0");
  });
});

describe("fmtSigned", () => {
  it("prefixes positive amounts with '+'", () => {
    expect(fmtSigned(500)).toBe("+$500");
  });

  it("prefixes negative amounts with a Unicode minus", () => {
    expect(fmtSigned(-500)).toBe("\u2212$500");
  });
});

describe("fmtPct", () => {
  it("renders rates with two decimal places", () => {
    expect(fmtPct(0.22)).toBe("22.00%");
    expect(fmtPct(0.0399)).toBe("3.99%");
  });
});
