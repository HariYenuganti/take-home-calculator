"use client";

import {
  bracketBreakdown,
  FED_SUPP_MILLION_CAP,
  FEDERAL_BRACKETS_2026,
  SS_WAGE_BASE_2026,
  type CalcResult,
} from "@/lib/tax";
import { fmt, fmtPct, fmtSigned } from "@/lib/format";

// Color per federal bracket rate. Warms up as the rate climbs — calm at the
// bottom of the stair, intense at the top — so heavier brackets visually
// feel heavier.
const BRACKET_COLORS: Record<number, string> = {
  0.1: "#E8DFC4",
  0.12: "#D6C080",
  0.22: "#C99742",
  0.24: "#A84D1E",
  0.32: "#7A3615",
  0.35: "#5A2810",
  0.37: "#3D1A08",
};

interface Props {
  result: CalcResult;
  otherPostTax: number;
  label?: string;
  accent?: string;
}

const PERIODS = [
  { label: "Annual", div: 1 },
  { label: "Monthly", div: 12 },
  { label: "Bi-weekly", div: 26 },
  { label: "Weekly", div: 52 },
];

export default function ScenarioDetail({
  result,
  otherPostTax,
  label,
  accent = "#1A1812",
}: Props) {
  const hasSupplemental = result.supp.gross > 0;

  return (
    <div className="space-y-6">
      {label && (
        <div
          className="mono text-[10px] uppercase tracking-[0.15em] pb-2 border-b"
          style={{ color: accent, borderColor: accent }}
        >
          {label}
        </div>
      )}

      {/* Supplemental analysis */}
      {hasSupplemental &&
        (() => {
          const underwithheld = result.supp.gap > 0.5;
          const overwithheld = result.supp.gap < -0.5;
          const suppAccent = underwithheld
            ? "#A84D1E"
            : overwithheld
              ? "#0E3B2E"
              : "#4A4638";
          const bg = underwithheld
            ? "#FBEEE2"
            : overwithheld
              ? "#E5EDE6"
              : "#EDE6D4";
          return (
            <div
              className="border p-6"
              style={{ borderColor: "#1A1812", background: bg }}
            >
              <div className="flex items-baseline justify-between mb-4 flex-wrap gap-3">
                <div>
                  <div
                    className="mono text-[10px] uppercase tracking-[0.2em]"
                    style={{ color: suppAccent }}
                  >
                    Supplemental Pay · Withholding vs. Reality
                  </div>
                  <div
                    className="serif text-2xl md:text-[28px] mt-1 leading-tight"
                    style={{ maxWidth: "420px" }}
                  >
                    {underwithheld &&
                      "Under-withheld — expect to owe at filing"}
                    {overwithheld && "Over-withheld — expect a refund"}
                    {!underwithheld &&
                      !overwithheld &&
                      "Withholding roughly matches reality"}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="mono text-[10px] uppercase tracking-[0.15em]"
                    style={{ color: "#6B6550" }}
                  >
                    April surprise
                  </div>
                  <div
                    className="serif text-5xl numeric mt-1"
                    style={{ color: suppAccent }}
                  >
                    {fmtSigned(result.supp.gap)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="border p-4"
                  style={{ borderColor: "#D9D2C1", background: "#FFFDF7" }}
                >
                  <div
                    className="mono text-[10px] uppercase tracking-[0.15em]"
                    style={{ color: "#6B6550" }}
                  >
                    Your paycheck withholds
                  </div>
                  <div className="serif text-3xl numeric mt-1">
                    {fmt(result.supp.totalWithheld)}
                  </div>
                  <div className="text-xs mt-3 space-y-1 mono numeric">
                    <LineItem
                      label={`Fed supplemental @ 22%${result.supp.subjectToWH > FED_SUPP_MILLION_CAP ? " / 37%" : ""}`}
                      value={fmt(result.supp.fedWH)}
                    />
                    <LineItem
                      label={`State supp @ ${fmtPct(result.stateSuppRate)}`}
                      value={fmt(result.supp.stateWH)}
                    />
                    <LineItem
                      label="FICA (SS + Medicare)"
                      value={fmt(result.supp.ficaWH)}
                    />
                  </div>
                </div>

                <div
                  className="border p-4"
                  style={{ borderColor: "#D9D2C1", background: "#FFFDF7" }}
                >
                  <div
                    className="mono text-[10px] uppercase tracking-[0.15em]"
                    style={{ color: "#6B6550" }}
                  >
                    You actually owe on {fmt(result.supp.gross)} supplemental
                  </div>
                  <div className="serif text-3xl numeric mt-1">
                    {fmt(result.supp.trueTax)}
                  </div>
                  <div
                    className="text-xs mt-3"
                    style={{ color: "#4A4638", lineHeight: 1.5 }}
                  >
                    Your marginal federal rate is{" "}
                    <span className="mono">{fmtPct(result.fedMarginal)}</span>,
                    plus state{" "}
                    <span className="mono">{fmtPct(result.stateRate)}</span>{" "}
                    and FICA on the additional wages.
                  </div>
                </div>
              </div>

              <div
                className="mt-4 text-xs leading-relaxed"
                style={{ color: "#3A3628" }}
              >
                {underwithheld && (
                  <span>
                    <strong>Heads up:</strong> Employers withhold federal tax
                    on bonuses & RSUs at a flat{" "}
                    <span className="mono">22%</span>, but your marginal
                    bracket is{" "}
                    <span className="mono">{fmtPct(result.fedMarginal)}</span>.
                    You&apos;ll likely owe around{" "}
                    <span className="mono">{fmt(result.supp.gap)}</span> at
                    filing. Fixes: increase W-4 extra withholding (line 4c),
                    make a Q4 estimated payment, or sell additional RSU shares
                    at vest to cover the gap.
                  </span>
                )}
                {overwithheld && (
                  <span>
                    <strong>Good news:</strong> Flat{" "}
                    <span className="mono">22%</span> federal supplemental
                    withholding is higher than your actual marginal rate of{" "}
                    <span className="mono">{fmtPct(result.fedMarginal)}</span>.
                    You should see roughly{" "}
                    <span className="mono">
                      {fmt(Math.abs(result.supp.gap))}
                    </span>{" "}
                    back as a refund.
                  </span>
                )}
                {!underwithheld && !overwithheld && (
                  <span>
                    The 22% supplemental rate lines up with your actual
                    marginal rate — no big surprise expected.
                  </span>
                )}
              </div>
            </div>
          );
        })()}

      {/* By pay period */}
      <div className="border p-5" style={{ borderColor: "#1A1812" }}>
        <div className="flex items-baseline justify-between mb-3">
          <div className="serif text-xl">By pay period</div>
          <div
            className="mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: "#6B6550" }}
          >
            annual take-home ÷ frequency
          </div>
        </div>
        <div
          className="grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:gap-y-0 sm:divide-x"
          style={{ borderColor: "#D9D2C1" }}
        >
          {PERIODS.map((p) => (
            <div
              key={p.label}
              className="sm:px-3 sm:first:pl-0"
              style={{ borderColor: "#D9D2C1" }}
            >
              <div
                className="mono text-[10px] uppercase tracking-[0.15em]"
                style={{ color: "#6B6550" }}
              >
                {p.label}
              </div>
              <div className="serif text-2xl md:text-3xl numeric mt-1">
                {fmt(result.takeHome / p.div)}
              </div>
            </div>
          ))}
        </div>
        {hasSupplemental && (
          <div
            className="mono text-[10px] mt-3"
            style={{ color: "#6B6550" }}
          >
            * Pay-period views assume even distribution across the year.
            Actual bonus/RSU paychecks will be larger and lumpy.
          </div>
        )}
      </div>

      {/* Visual breakdown */}
      <div className="border p-5" style={{ borderColor: "#1A1812" }}>
        <div className="serif text-xl mb-4">
          Where each dollar of total comp goes
        </div>
        {(() => {
          const g = Math.max(result.inputs.totalGross, 1);
          const segs = [
            { label: "Take-home", value: result.takeHome, color: "#0E3B2E" },
            { label: "Federal tax", value: result.fedTax, color: "#A84D1E" },
            { label: "State tax", value: result.stateTax, color: "#C99742" },
            {
              label: "Social Security",
              value: result.ss,
              color: "#6B6550",
            },
            { label: "Medicare", value: result.medicare, color: "#8C7D5C" },
            {
              label: "Pre-tax deductions",
              value: result.preTaxDeductions,
              color: "#3D5A4A",
            },
            {
              label: "Post-tax deductions",
              value: result.postTaxDeductions,
              color: "#B8A98A",
            },
          ].filter((s) => s.value > 0);
          return (
            <>
              <div
                className="flex h-8 overflow-hidden"
                style={{ background: "#EDE6D4" }}
              >
                {segs.map((s, i) => (
                  <div
                    key={i}
                    title={`${s.label}: ${fmt(s.value)}`}
                    style={{
                      width: `${(s.value / g) * 100}%`,
                      background: s.color,
                    }}
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {segs.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5"
                        style={{ background: s.color }}
                      />
                      <span>{s.label}</span>
                    </div>
                    <span className="mono numeric">
                      {fmt(s.value)}{" "}
                      <span style={{ color: "#6B6550" }}>
                        ({((s.value / g) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </div>

      {/* Federal bracket breakdown */}
      {result.fedTaxable > 0 &&
        (() => {
          const segments = bracketBreakdown(
            result.fedTaxable,
            FEDERAL_BRACKETS_2026[result.filingStatus],
          );
          const effective =
            result.fedTaxable > 0 ? result.fedTax / result.fedTaxable : 0;
          return (
            <div
              className="border p-5"
              style={{ borderColor: "#1A1812" }}
            >
              <div className="flex items-baseline justify-between mb-1 flex-wrap gap-3">
                <div className="serif text-xl">Federal bracket breakdown</div>
                <div
                  className="mono text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: "#6B6550" }}
                >
                  marginal {fmtPct(result.fedMarginal)} · effective on
                  taxable {fmtPct(effective)}
                </div>
              </div>
              <div
                className="text-xs mb-4"
                style={{ color: "#6B6550", lineHeight: 1.6 }}
              >
                Each dollar of your {fmt(result.fedTaxable)} federal taxable
                income is taxed at the bracket it lands in — so only your{" "}
                <em>last</em> dollars hit the {fmtPct(result.fedMarginal)}{" "}
                rate.
              </div>

              {/* Segmented bar */}
              <div
                className="flex h-10 overflow-hidden"
                style={{ background: "#EDE6D4" }}
              >
                {segments.map((s, i) => {
                  const pct = (s.amount / result.fedTaxable) * 100;
                  const color = BRACKET_COLORS[s.rate] ?? "#6B6550";
                  // Short label ("10%", "22%") fits narrower segments than the
                  // decimal-formatted fmtPct would; the legend below has the
                  // full form.
                  const shortLabel = `${Math.round(s.rate * 100)}%`;
                  const labelVisible = pct > 4;
                  const dark = s.rate >= 0.22;
                  return (
                    <div
                      key={i}
                      title={`${fmtPct(s.rate)} bracket: ${fmt(s.amount)} taxed → ${fmt(s.tax)}`}
                      style={{
                        width: `${pct}%`,
                        background: color,
                        color: dark ? "#F5F1E8" : "#1A1812",
                      }}
                      className="mono text-[10px] flex items-center justify-center"
                    >
                      {labelVisible && shortLabel}
                    </div>
                  );
                })}
              </div>

              {/* Per-bracket detail */}
              <div className="mt-4 space-y-1.5 text-sm mono numeric">
                {segments.map((s, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[auto_1fr_auto] gap-x-4 items-baseline"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5"
                        style={{
                          background: BRACKET_COLORS[s.rate] ?? "#6B6550",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          minWidth: "3.5ch",
                        }}
                      >
                        {fmtPct(s.rate)}
                      </span>
                    </div>
                    <div style={{ color: "#6B6550" }}>
                      {fmt(s.from)} –{" "}
                      {s.to === Infinity ? "∞" : fmt(s.to)}
                      <span className="ml-2">
                        ({fmt(s.amount)} in bracket)
                      </span>
                    </div>
                    <div>{fmt(s.tax)}</div>
                  </div>
                ))}
                <div
                  className="grid grid-cols-[auto_1fr_auto] gap-x-4 pt-2 mt-2 border-t font-semibold"
                  style={{ borderColor: "#1A1812" }}
                >
                  <span />
                  <span
                    style={{
                      fontFamily: "'IBM Plex Sans', sans-serif",
                    }}
                  >
                    Federal income tax
                  </span>
                  <span>{fmt(result.fedTax)}</span>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Line-item ledger */}
      <div className="border p-5" style={{ borderColor: "#1A1812" }}>
        <div className="serif text-xl mb-3">Line-item ledger</div>
        <table className="w-full text-sm numeric mono">
          <tbody>
            <LedgerRow
              label="Base salary"
              value={fmt(result.inputs.salary)}
            />
            {result.inputs.bonus > 0 && (
              <LedgerRow
                label="Cash bonus"
                value={fmt(result.inputs.bonus)}
              />
            )}
            {result.inputs.rsuValue > 0 && (
              <LedgerRow
                label="RSU vest value"
                value={fmt(result.inputs.rsuValue)}
              />
            )}
            <LedgerRow
              label="Total gross compensation"
              value={fmt(result.inputs.totalGross)}
              bold
            />
            <LedgerRow
              label="— Traditional 401(k)"
              value={`(${fmt(result.trad401kAmt)})`}
            />
            <LedgerRow
              label="— Section 125 pre-tax"
              value={`(${fmt(result.section125)})`}
            />
            <LedgerRow
              label="Federal taxable income (after std. deduction)"
              value={fmt(result.fedTaxable)}
              muted
            />
            <LedgerRow
              label="Federal income tax"
              value={`(${fmt(result.fedTax)})`}
            />
            <LedgerRow
              label="State income tax"
              value={`(${fmt(result.stateTax)})`}
            />
            <LedgerRow
              label={`Social Security (6.2% up to ${fmt(SS_WAGE_BASE_2026)})`}
              value={`(${fmt(result.ss)})`}
            />
            <LedgerRow
              label={`Medicare (1.45%${result.addMedicare > 0 ? " + 0.9% surcharge" : ""})`}
              value={`(${fmt(result.medicare)})`}
            />
            <LedgerRow
              label="— Roth 401(k) contribution"
              value={`(${fmt(result.roth401kAmt)})`}
            />
            {otherPostTax > 0 && (
              <LedgerRow
                label="— Other post-tax"
                value={`(${fmt(otherPostTax)})`}
              />
            )}
            <tr>
              <td colSpan={2}>
                <div
                  className="border-t my-1"
                  style={{ borderColor: "#1A1812" }}
                />
              </td>
            </tr>
            <LedgerRow
              label="Annual take-home"
              value={fmt(result.takeHome)}
              bold
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LedgerRow({
  label,
  value,
  bold = false,
  muted = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <tr style={{ color: muted ? "#6B6550" : "#1A1812" }}>
      <td
        className={`py-1.5 ${bold ? "font-semibold" : ""}`}
        style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
      >
        {label}
      </td>
      <td className={`py-1.5 text-right ${bold ? "font-semibold" : ""}`}>
        {value}
      </td>
    </tr>
  );
}

function LineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span
        style={{ color: "#4A4638", fontFamily: "'IBM Plex Sans', sans-serif" }}
      >
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}
