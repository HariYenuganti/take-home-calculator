"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateAll } from "@/lib/tax";
import { fmt, fmtPct, fmtSigned } from "@/lib/format";
import {
  type CalcState,
  DEFAULT_STATE,
  SERIALIZATION_BASELINE,
  deriveSalary,
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

  // Restore the default scenario and drop compare mode. The URL-sync effect
  // then collapses the query string back to a bare path.
  const handleReset = () => {
    setState(DEFAULT_STATE);
    setScenarioB(null);
  };

  // Theme toggle. The <html data-theme> is set pre-paint by the inline script
  // in layout; here we mirror it into state and flip it on click.
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    // One-time sync from the pre-paint theme on <html> (external DOM source).
    const current = document.documentElement.dataset.theme;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (current === "dark" || current === "light") setTheme(current);
  }, []);
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* localStorage unavailable */
      }
      return next;
    });
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setFailedUrl(null);
      window.setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      // Clipboard API blocked (non-https, sandboxed iframe, etc.). Reveal the
      // URL so the user can select and copy it manually.
      setFailedUrl(url);
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
      setState({ ...SERIALIZATION_BASELINE, ...a });
    }
    if (b !== null) {
      setScenarioB({ ...SERIALIZATION_BASELINE, ...b });
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

  const salary = useMemo(() => deriveSalary(state), [state]);

  const result = useMemo(
    () => calculateAll({ ...state, salary }),
    [state, salary],
  );

  const resultB = useMemo(() => {
    if (!scenarioB) return null;
    return calculateAll({ ...scenarioB, salary: deriveSalary(scenarioB) });
  }, [scenarioB]);

  const hasSupplemental = result.supp.gross > 0;

  // Debounced screen-reader announcement of the headline result, so SR users
  // hear the take-home / April-surprise change after typing settles rather
  // than on every keystroke.
  const [liveMessage, setLiveMessage] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => {
      let msg = `Annual take-home ${fmt(result.takeHome)}.`;
      if (hasSupplemental && result.supp.gap > 0.5) {
        msg += ` Under-withheld on bonus and RSU by ${fmt(result.supp.gap)}; expect to owe at filing.`;
      } else if (hasSupplemental && result.supp.gap < -0.5) {
        msg += ` Over-withheld on bonus and RSU by ${fmt(Math.abs(result.supp.gap))}; expect a refund.`;
      }
      setLiveMessage(msg);
    }, 600);
    return () => window.clearTimeout(t);
  }, [result, hasSupplemental]);

  return (
    <div className="min-h-screen w-full" style={{ background: "var(--c-bg)" }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 mono text-[11px] px-3 py-2"
        style={{ background: "var(--c-forest)", color: "var(--c-on-forest)" }}
      >
        Skip to main content
      </a>
      <div
        className="max-w-[1280px] mx-auto px-6 md:px-10 py-10 md:py-14 sans"
        style={{ color: "var(--c-ink)" }}
      >
        <header
          className="border-b pb-6 mb-10"
          style={{ borderColor: "var(--c-ink)" }}
        >
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <div
                className="mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: "var(--c-forest)" }}
              >
                Take-Home Ledger · Tax Year 2026 · With Supplemental Wages
              </div>
              <h1 className="serif text-[54px] md:text-[72px] leading-[0.95] mt-2">
                What you <em>actually</em> keep.
              </h1>
            </div>
            <div className="flex flex-col items-end gap-3 max-w-[280px]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  aria-label="Copy shareable link to this scenario"
                  className="mono uppercase tracking-[0.15em] text-[10px] px-3 py-2 transition-colors cursor-pointer"
                  style={{
                    border: "1px solid var(--c-ink)",
                    color: linkCopied ? "var(--c-on-forest)" : "var(--c-ink)",
                    background: linkCopied ? "var(--c-forest)" : "transparent",
                    minWidth: "148px",
                  }}
                >
                  {linkCopied ? "Link copied" : "Copy share link"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Reset to defaults and clear the shared link"
                  className="mono uppercase tracking-[0.15em] text-[10px] px-3 py-2 transition-colors cursor-pointer"
                  style={{
                    border: "1px solid var(--c-ink)",
                    color: "var(--c-ink)",
                    background: "transparent",
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={
                    theme === "dark"
                      ? "Switch to light theme"
                      : "Switch to dark theme"
                  }
                  className="mono uppercase tracking-[0.15em] text-[10px] px-3 py-2 transition-colors cursor-pointer"
                  style={{
                    border: "1px solid var(--c-ink)",
                    color: "var(--c-ink)",
                    background: "transparent",
                  }}
                >
                  {theme === "dark" ? "Light" : "Dark"}
                </button>
              </div>
              {failedUrl && (
                <input
                  readOnly
                  value={failedUrl}
                  onFocus={(e) => e.target.select()}
                  aria-label="Shareable link — copy it manually"
                  className="fld mono"
                  style={{ width: "260px", fontSize: "11px" }}
                />
              )}
              <div
                className="mono text-[11px]"
                style={{ color: "var(--c-muted-strong)" }}
              >
                2026 brackets per IRS Rev. Proc. 2025-32. SS wage base
                $184,500. Supplemental withheld at 22% fed (37% over $1M/yr)
                per Pub. 15.
              </div>
            </div>
          </div>
        </header>

        <main
          id="main"
          className={
            compareMode
              ? "space-y-8"
              : "grid grid-cols-1 lg:grid-cols-12 gap-8"
          }
        >
          <div className="sr-only" role="status" aria-live="polite">
            {liveMessage}
          </div>
          {compareMode && scenarioB && resultB ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div
                  className="mono text-[10px] uppercase tracking-[0.15em] mb-5 pb-2 border-b"
                  style={{ color: "var(--c-forest)", borderColor: "var(--c-forest)" }}
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
                  style={{ color: "var(--c-rust)", borderColor: "var(--c-rust)" }}
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
            <section className="lg:col-span-5" aria-label="Your inputs">
              <ScenarioInputs
                state={state}
                onChange={updateState}
                result={result}
              />
            </section>
          )}

          <section
            aria-label="Results"
            className={
              compareMode ? "space-y-6" : "lg:col-span-7 space-y-6"
            }
          >
            {compareMode && resultB ? (
              <div
                className="relative overflow-hidden p-8 md:p-10"
                style={{ background: "var(--c-forest)", color: "var(--c-on-forest)" }}
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
                      color: "var(--c-on-forest)",
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
                      style={{ color: "var(--c-gold)" }}
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
                      style={{ color: "var(--c-gold)" }}
                    >
                      Δ B minus A
                    </div>
                    <div
                      className="serif text-[56px] md:text-[64px] leading-[0.95] mt-1 numeric"
                      style={{ color: "var(--c-gold)" }}
                    >
                      {fmtSigned(resultB.takeHome - result.takeHome)}
                    </div>
                    <div
                      className="mono text-xs mt-3 numeric"
                      style={{ lineHeight: 1.7, color: "var(--c-gold)" }}
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
                style={{ background: "var(--c-forest)", color: "var(--c-on-forest)" }}
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
                    className="mono uppercase tracking-[0.15em] text-[10px] px-4 py-2 transition-colors cursor-pointer"
                    style={{
                      border: "1px solid var(--c-gold)",
                      color: "var(--c-ink)",
                      background: "var(--c-gold)",
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
                  accent="var(--c-forest)"
                />
                <ScenarioDetail
                  result={resultB}
                  otherPostTax={scenarioB.otherPostTax}
                  label="Scenario B · compare"
                  accent="var(--c-rust)"
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
              style={{ color: "var(--c-muted-strong)" }}
            >
              <div
                className="mb-1 uppercase tracking-[0.15em] text-[10px]"
                style={{ color: "var(--c-forest)" }}
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
        </main>

        <footer
          className="mt-14 pt-6 border-t flex justify-between items-center mono text-[10px] uppercase tracking-[0.2em]"
          style={{ borderColor: "var(--c-ink)", color: "var(--c-muted)" }}
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
