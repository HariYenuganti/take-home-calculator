"use client";

import { useMemo, useState } from "react";
import { calculateAll, type CalcInput, type CalcResult } from "@/lib/tax";
import { fmt, fmtPct } from "@/lib/format";

const RAISES = [5000, 10000, 25000, 50000];

// "What if I got a raise?" — re-runs the engine with salary + delta to show
// what you actually keep of the next dollars, including the real marginal hit
// (federal + state + FICA, with any SS-cap / additional-Medicare edge).
export default function MarginalDollar({
  base,
  baseResult,
}: {
  base: CalcInput;
  baseResult: CalcResult;
}) {
  const [raise, setRaise] = useState(10000);
  const bumped = useMemo(
    () => calculateAll({ ...base, salary: base.salary + raise }),
    [base, raise],
  );
  const deltaTakeHome = Math.max(0, bumped.takeHome - baseResult.takeHome);
  const keepRate = raise > 0 ? deltaTakeHome / raise : 0;

  return (
    <div className="border p-5" style={{ borderColor: "var(--c-ink)" }}>
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <h2 className="serif text-xl">If you got a raise</h2>
        <div
          className="mono text-[10px] uppercase tracking-[0.15em]"
          style={{ color: "var(--c-muted)" }}
        >
          what your next dollars keep
        </div>
      </div>

      <div className="seg mb-4" role="group" aria-label="Raise amount">
        {RAISES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={raise === r}
            className={raise === r ? "active" : ""}
            onClick={() => setRaise(r)}
          >
            +{fmt(r)}
          </button>
        ))}
      </div>

      <div
        className="serif text-4xl md:text-5xl numeric leading-none"
        style={{ color: "var(--c-forest)" }}
      >
        {fmt(deltaTakeHome)}
      </div>
      <div
        className="mono text-xs mt-2"
        style={{ color: "var(--c-muted-strong)" }}
      >
        is what you actually keep from a {fmt(raise)} raise.
      </div>

      <div
        className="text-sm mt-3"
        style={{ color: "var(--c-ink-soft)", lineHeight: 1.6 }}
      >
        You keep <span className="mono">{fmtPct(keepRate)}</span> of every extra
        dollar — your real marginal hit (federal + state + FICA, including any
        Social Security cap or additional-Medicare edge) is{" "}
        <span className="mono">{fmtPct(1 - keepRate)}</span>.
      </div>
    </div>
  );
}
