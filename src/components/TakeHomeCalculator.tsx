"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateAll } from "@/lib/tax";
import { fmt, fmtPct, fmtSigned } from "@/lib/format";
import {
  type CalcState,
  DEFAULT_STATE,
  parseComparison,
  serializeComparison,
} from "@/lib/urlState";
import ScenarioInputs from "./ScenarioInputs";
import ScenarioDetail from "./ScenarioDetail";

export default function TakeHomeCalculator() {
  const [state, setState] = useState<CalcState>(DEFAULT_STATE);
  const updateState = (patch: Partial<CalcState>) =>
    setState((prev) => ({ ...prev, ...patch }));

  // Compare mode: when scenarioB is non-null, a second scenario is being
  // edited alongside `state`. Toggling on clones A into B so the user starts
  // from a sensible baseline.
  const [scenarioB, setScenarioB] = useState<CalcState | null>(null);
  const compareMode = scenarioB !== null;
  const updateScenarioB = (patch: Partial<CalcState>) =>
    setScenarioB((prev) => (prev ? { ...prev, ...patch } : prev));
  const toggleCompare = () => {
    setScenarioB((prev) => (prev ? null : { ...state }));
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      // Clipboard API blocked (non-https, sandboxed iframe, etc.). Silent
      // failure — the user can still copy from the address bar.
    }
  };

  // Hydrate both scenarios from the URL on first mount. Runs after SSR
  // hydration so it never produces a markup mismatch with the server-rendered
  // HTML.
  useEffect(() => {
    const { a, b } = parseComparison(
      new URLSearchParams(window.location.search),
    );
    /* eslint-disable react-hooks/set-state-in-effect -- legitimate one-time
       hydration from window.location (external source, not derived state) */
    if (Object.keys(a).length > 0) {
      setState((prev) => ({ ...prev, ...a }));
    }
    if (b !== null) {
      setScenarioB({ ...DEFAULT_STATE, ...b });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Keep the URL in sync with current state so every change is shareable.
  // Uses replaceState so the back button isn't polluted by each keystroke.
  useEffect(() => {
    const qs = serializeComparison(state, scenarioB);
    const next = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, "", next);
  }, [state, scenarioB]);

  const salary = useMemo(
    () =>
      state.payType === "annual"
        ? state.annualSalary
        : state.hourlyRate * state.hoursPerWeek * state.weeksPerYear,
    [
      state.payType,
      state.annualSalary,
      state.hourlyRate,
      state.hoursPerWeek,
      state.weeksPerYear,
    ],
  );

  const result = useMemo(
    () => calculateAll({ ...state, salary }),
    [state, salary],
  );

  const resultB = useMemo(() => {
    if (!scenarioB) return null;
    const salaryB =
      scenarioB.payType === "annual"
        ? scenarioB.annualSalary
        : scenarioB.hourlyRate *
          scenarioB.hoursPerWeek *
          scenarioB.weeksPerYear;
    return calculateAll({ ...scenarioB, salary: salaryB });
  }, [scenarioB]);

  const hasSupplemental = result.supp.gross > 0;

  return (
    <div className="min-h-screen w-full" style={{ background: "#F5F1E8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .serif { font-family: 'Instrument Serif', 'Times New Roman', serif; font-weight: 400; letter-spacing: -0.01em; }
        .sans  { font-family: 'IBM Plex Sans', system-ui, sans-serif; }
        .mono  { font-family: 'IBM Plex Mono', 'Menlo', monospace; }
        .numeric { font-variant-numeric: tabular-nums; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .fld { background: #FFFDF7; border: 1px solid #D9D2C1; padding: 10px 12px; font-size: 14px; width: 100%; transition: border-color 0.15s; font-family: 'IBM Plex Mono', monospace; }
        .fld:focus { outline: none; border-color: #0E3B2E; }
        .fld-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #4A4638; margin-bottom: 6px; display: block; font-family: 'IBM Plex Sans', sans-serif; }
        .seg { display: flex; background: #EDE6D4; padding: 3px; }
        .seg button { flex: 1; padding: 7px 10px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; background: transparent; border: none; cursor: pointer; color: #6B6550; font-family: 'IBM Plex Sans', sans-serif; }
        .seg button.active { background: #0E3B2E; color: #F5F1E8; }
        .checkbox-row { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #4A4638; margin-top: 10px; cursor: pointer; line-height: 1.4; }
        .checkbox-row input { accent-color: #0E3B2E; margin-top: 2px; }
      `}</style>

      <div
        className="max-w-[1280px] mx-auto px-6 md:px-10 py-10 md:py-14 sans"
        style={{ color: "#1A1812" }}
      >
        <header
          className="border-b pb-6 mb-10"
          style={{ borderColor: "#1A1812" }}
        >
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <div
                className="mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: "#0E3B2E" }}
              >
                Take-Home Ledger · Tax Year 2026 · With Supplemental Wages
              </div>
              <h1 className="serif text-[54px] md:text-[72px] leading-[0.95] mt-2">
                What you <em>actually</em> keep.
              </h1>
            </div>
            <div className="flex flex-col items-end gap-3 max-w-[280px]">
              <button
                type="button"
                onClick={handleCopyLink}
                aria-label="Copy shareable link to this scenario"
                className="mono uppercase tracking-[0.15em] text-[10px] px-3 py-2 transition-colors cursor-pointer"
                style={{
                  border: "1px solid #1A1812",
                  color: linkCopied ? "#F5F1E8" : "#1A1812",
                  background: linkCopied ? "#0E3B2E" : "transparent",
                  minWidth: "148px",
                }}
              >
                {linkCopied ? "Link copied" : "Copy share link"}
              </button>
              <div
                className="mono text-[11px]"
                style={{ color: "#4A4638" }}
              >
                2026 brackets per IRS Rev. Proc. 2025-32. SS wage base
                $184,500. Supplemental withheld at 22% fed (37% over $1M/yr)
                per Pub. 15.
              </div>
            </div>
          </div>
        </header>

        <div
          className={
            compareMode
              ? "space-y-8"
              : "grid grid-cols-1 lg:grid-cols-12 gap-8"
          }
        >
          {compareMode && scenarioB && resultB ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div
                  className="mono text-[10px] uppercase tracking-[0.15em] mb-5 pb-2 border-b"
                  style={{ color: "#0E3B2E", borderColor: "#0E3B2E" }}
                >
                  Scenario A · current
                </div>
                <ScenarioInputs
                  state={state}
                  onChange={updateState}
                  result={result}
                />
              </div>
              <div>
                <div
                  className="mono text-[10px] uppercase tracking-[0.15em] mb-5 pb-2 border-b"
                  style={{ color: "#A84D1E", borderColor: "#A84D1E" }}
                >
                  Scenario B · compare
                </div>
                <ScenarioInputs
                  state={scenarioB}
                  onChange={updateScenarioB}
                  result={resultB}
                />
              </div>
            </div>
          ) : (
            <section className="lg:col-span-5">
              <ScenarioInputs
                state={state}
                onChange={updateState}
                result={result}
              />
            </section>
          )}

          <section
            className={
              compareMode ? "space-y-6" : "lg:col-span-7 space-y-6"
            }
          >
            {compareMode && resultB ? (
              <div
                className="relative overflow-hidden p-8 md:p-10"
                style={{ background: "#0E3B2E", color: "#F5F1E8" }}
              >
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-70">
                    Annual take-home · Scenario A vs Scenario B
                  </div>
                  <button
                    type="button"
                    onClick={toggleCompare}
                    aria-label="Exit compare mode"
                    className="mono uppercase tracking-[0.15em] text-[10px] px-3 py-2 transition-colors cursor-pointer"
                    style={{
                      border: "1px solid rgba(245,241,232,0.35)",
                      color: "#F5F1E8",
                      background: "transparent",
                    }}
                  >
                    ✕ Exit compare
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <div className="mono text-[10px] uppercase tracking-[0.15em] opacity-70">
                      Scenario A · current
                    </div>
                    <div
                      data-testid="take-home"
                      className="serif text-[56px] md:text-[64px] leading-[0.95] mt-1 numeric"
                    >
                      {fmt(result.takeHome)}
                    </div>
                    <div
                      className="mono text-xs mt-3 opacity-70 numeric"
                      style={{ lineHeight: 1.7 }}
                    >
                      Effective {fmtPct(result.effectiveRate)}
                      <br />
                      Marginal {fmtPct(result.fedMarginal)}
                      <br />
                      Total tax {fmt(result.totalTax)}
                    </div>
                  </div>
                  <div>
                    <div
                      className="mono text-[10px] uppercase tracking-[0.15em]"
                      style={{ color: "#C99742" }}
                    >
                      Scenario B · compare
                    </div>
                    <div
                      data-testid="take-home-b"
                      className="serif text-[56px] md:text-[64px] leading-[0.95] mt-1 numeric"
                    >
                      {fmt(resultB.takeHome)}
                    </div>
                    <div
                      className="mono text-xs mt-3 opacity-70 numeric"
                      style={{ lineHeight: 1.7 }}
                    >
                      Effective {fmtPct(resultB.effectiveRate)}
                      <br />
                      Marginal {fmtPct(resultB.fedMarginal)}
                      <br />
                      Total tax {fmt(resultB.totalTax)}
                    </div>
                  </div>
                  <div
                    className="border-l pl-8"
                    style={{ borderColor: "rgba(245,241,232,0.25)" }}
                  >
                    <div
                      className="mono text-[10px] uppercase tracking-[0.15em]"
                      style={{ color: "#C99742" }}
                    >
                      Δ B minus A
                    </div>
                    <div
                      className="serif text-[56px] md:text-[64px] leading-[0.95] mt-1 numeric"
                      style={{ color: "#C99742" }}
                    >
                      {fmtSigned(resultB.takeHome - result.takeHome)}
                    </div>
                    <div
                      className="mono text-xs mt-3 numeric"
                      style={{ lineHeight: 1.7, color: "#C99742" }}
                    >
                      Effective {pctDelta(resultB.effectiveRate, result.effectiveRate)}
                      <br />
                      Marginal {pctDelta(resultB.fedMarginal, result.fedMarginal)}
                      <br />
                      Tax {fmtSigned(resultB.totalTax - result.totalTax)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="relative overflow-hidden p-8 md:p-10"
                style={{ background: "#0E3B2E", color: "#F5F1E8" }}
              >
                <div className="absolute top-4 right-6 mono text-[10px] uppercase tracking-[0.2em] opacity-60">
                  annual take-home
                </div>
                <div className="mono text-[10px] uppercase tracking-[0.2em] opacity-70">
                  From {fmt(result.inputs.totalGross)} total comp
                  {hasSupplemental &&
                    ` (salary ${fmt(result.inputs.salary)} + supplemental ${fmt(result.supp.gross)})`}
                </div>
                <div
                  data-testid="take-home"
                  className="serif text-[72px] md:text-[96px] leading-[0.95] mt-1 numeric"
                >
                  {fmt(result.takeHome)}
                </div>
                <div
                  className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t"
                  style={{ borderColor: "rgba(245,241,232,0.2)" }}
                >
                  <div>
                    <div className="mono text-[10px] uppercase tracking-[0.15em] opacity-70">
                      Effective tax rate
                    </div>
                    <div className="serif text-3xl numeric mt-1">
                      {fmtPct(result.effectiveRate)}
                    </div>
                  </div>
                  <div>
                    <div className="mono text-[10px] uppercase tracking-[0.15em] opacity-70">
                      Marginal federal
                    </div>
                    <div className="serif text-3xl numeric mt-1">
                      {fmtPct(result.fedMarginal)}
                    </div>
                  </div>
                  <div>
                    <div className="mono text-[10px] uppercase tracking-[0.15em] opacity-70">
                      Total tax paid
                    </div>
                    <div className="serif text-3xl numeric mt-1">
                      {fmt(result.totalTax)}
                    </div>
                  </div>
                </div>
                <div
                  className="mt-6 pt-4 border-t flex justify-end"
                  style={{ borderColor: "rgba(245,241,232,0.2)" }}
                >
                  <button
                    type="button"
                    onClick={toggleCompare}
                    aria-label="Compare this scenario with another side-by-side"
                    className="mono uppercase tracking-[0.15em] text-[10px] px-3 py-2 transition-colors cursor-pointer"
                    style={{
                      border: "1px solid rgba(245,241,232,0.35)",
                      color: "#F5F1E8",
                      background: "transparent",
                    }}
                  >
                    + Compare with another scenario
                  </button>
                </div>
              </div>
            )}

            {compareMode && resultB && scenarioB ? (
              <>
                <ScenarioDetail
                  result={result}
                  otherPostTax={state.otherPostTax}
                  label="Scenario A · current"
                  accent="#0E3B2E"
                />
                <ScenarioDetail
                  result={resultB}
                  otherPostTax={scenarioB.otherPostTax}
                  label="Scenario B · compare"
                  accent="#A84D1E"
                />
              </>
            ) : (
              <ScenarioDetail
                result={result}
                otherPostTax={state.otherPostTax}
              />
            )}

            <div
              className="text-xs leading-relaxed mono"
              style={{ color: "#4A4638" }}
            >
              <div
                className="mb-1 uppercase tracking-[0.15em] text-[10px]"
                style={{ color: "#0E3B2E" }}
              >
                Notes & caveats
              </div>
              Uses 2026 federal brackets and standard deduction (no itemizing
              or credits like CTC). Supplemental withholding uses the federal
              percentage method — 22% up to $1M/year, 37% above — per IRS Pub.
              15. State supp rate uses the published statutory rate where
              available; otherwise the regular rate. Under/over-withheld gap
              isolates the tax owed on bonus+RSU vs. what&apos;s withheld,
              assuming this is your only supplemental income. RSU shares are
              treated as having cash-equivalent value at vest. Estimates only
              — not tax advice.
            </div>
          </section>
        </div>

        <footer
          className="mt-14 pt-6 border-t flex justify-between items-center mono text-[10px] uppercase tracking-[0.2em]"
          style={{ borderColor: "#1A1812", color: "#6B6550" }}
        >
          <span>Tax Year 2026</span>
          <span>Defaults: single filer · North Carolina</span>
        </footer>
      </div>
    </div>
  );
}

// Format a delta between two rates as signed percentage points.
// e.g. pctDelta(0.24, 0.22) -> "+2.00 pp"
function pctDelta(b: number, a: number): string {
  const diff = (b - a) * 100;
  const sign = diff >= 0 ? "+" : "\u2212";
  return `${sign}${Math.abs(diff).toFixed(2)} pp`;
}
