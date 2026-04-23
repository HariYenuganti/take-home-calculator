"use client";

import {
  EMPLOYEE_401K_LIMIT_2026,
  STATES,
  type CalcResult,
  type FilingStatus,
} from "@/lib/tax";
import { fmt } from "@/lib/format";
import { type CalcState } from "@/lib/urlState";

interface Props {
  state: CalcState;
  onChange: (patch: Partial<CalcState>) => void;
  result: CalcResult;
}

export default function ScenarioInputs({ state, onChange, result }: Props) {
  const salary =
    state.payType === "annual"
      ? state.annualSalary
      : state.hourlyRate * state.hoursPerWeek * state.weeksPerYear;
  const totalContributions = result.trad401kAmt + result.roth401kAmt;
  const employerMatchAmt = salary * (state.employerMatch / 100);

  const num =
    <K extends keyof CalcState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ [key]: (+e.target.value || 0) as CalcState[K] } as Partial<
        CalcState
      >);

  return (
    <div className="space-y-7">
      {/* 01 · Base Income */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="serif text-2xl">01 · Base Income</h2>
          <span
            className="mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: "#6B6550" }}
          >
            regular wages
          </span>
        </div>
        <div className="seg mb-4">
          <button
            className={state.payType === "annual" ? "active" : ""}
            onClick={() => onChange({ payType: "annual" })}
          >
            Salary
          </button>
          <button
            className={state.payType === "hourly" ? "active" : ""}
            onClick={() => onChange({ payType: "hourly" })}
          >
            Hourly
          </button>
        </div>
        {state.payType === "annual" ? (
          <label className="block">
            <span className="fld-label">Annual salary</span>
            <input
              type="number"
              className="fld numeric"
              value={state.annualSalary}
              onChange={num("annualSalary")}
            />
          </label>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="fld-label">Rate / hr</span>
              <input
                type="number"
                className="fld numeric"
                value={state.hourlyRate}
                onChange={num("hourlyRate")}
              />
            </label>
            <label className="block">
              <span className="fld-label">Hrs / week</span>
              <input
                type="number"
                className="fld numeric"
                value={state.hoursPerWeek}
                onChange={num("hoursPerWeek")}
              />
            </label>
            <label className="block">
              <span className="fld-label">Weeks / yr</span>
              <input
                type="number"
                className="fld numeric"
                value={state.weeksPerYear}
                onChange={num("weeksPerYear")}
              />
            </label>
          </div>
        )}
        <div
          className="mt-3 mono text-xs numeric"
          style={{ color: "#6B6550" }}
        >
          Salary = {fmt(salary)} / year
        </div>
      </div>

      {/* 02 · Bonus & Equity */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="serif text-2xl">02 · Bonus & Equity</h2>
          <span
            className="mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: "#6B6550" }}
          >
            supplemental wages
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="fld-label">Annual cash bonus</span>
            <input
              type="number"
              className="fld numeric"
              value={state.bonus}
              onChange={num("bonus")}
            />
          </label>
          <label className="block">
            <span className="fld-label">RSU vest value / yr</span>
            <input
              type="number"
              className="fld numeric"
              value={state.rsuValue}
              onChange={num("rsuValue")}
            />
          </label>
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={state.defer401kFromBonus}
            onChange={(e) =>
              onChange({ defer401kFromBonus: e.target.checked })
            }
          />
          <span>
            Apply 401(k) deferral % to bonus (most cash-bonus plans do; RSUs are
            not deferrable)
          </span>
        </label>
        <div
          className="mt-3 mono text-xs numeric"
          style={{ color: "#6B6550" }}
        >
          Total comp = {fmt(salary + state.bonus + state.rsuValue)} ·
          Supplemental = {fmt(state.bonus + state.rsuValue)}
        </div>
      </div>

      {/* 03 · Filing & Location */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="serif text-2xl">03 · Filing & Location</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="fld-label">Filing status</span>
            <select
              className="fld"
              value={state.filingStatus}
              onChange={(e) =>
                onChange({ filingStatus: e.target.value as FilingStatus })
              }
            >
              <option value="single">Single</option>
              <option value="mfj">Married filing jointly</option>
              <option value="hoh">Head of household</option>
              <option value="mfs">Married filing separately</option>
            </select>
          </label>
          <label className="block">
            <span className="fld-label">State</span>
            <select
              className="fld"
              value={state.stateKey}
              onChange={(e) => onChange({ stateKey: e.target.value })}
            >
              {Object.entries(STATES).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {state.stateKey === "other" && (
          <label className="block mt-3">
            <span className="fld-label">
              Your effective state tax rate (%)
            </span>
            <input
              type="number"
              step="0.01"
              className="fld numeric"
              value={state.customStateRate}
              onChange={num("customStateRate")}
            />
          </label>
        )}
      </div>

      {/* 04 · Retirement */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="serif text-2xl">04 · Retirement</h2>
          <span
            className="mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: "#6B6550" }}
          >
            % of contributable wages
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="fld-label">Trad 401(k)</span>
            <input
              type="number"
              step="0.5"
              className="fld numeric"
              value={state.trad401k}
              onChange={num("trad401k")}
            />
          </label>
          <label className="block">
            <span className="fld-label">Roth 401(k)</span>
            <input
              type="number"
              step="0.5"
              className="fld numeric"
              value={state.roth401k}
              onChange={num("roth401k")}
            />
          </label>
          <label className="block">
            <span className="fld-label">Employer match</span>
            <input
              type="number"
              step="0.5"
              className="fld numeric"
              value={state.employerMatch}
              onChange={num("employerMatch")}
            />
          </label>
        </div>
        <div
          className="mt-3 mono text-xs numeric"
          style={{ color: "#6B6550" }}
        >
          Your contributions: {fmt(totalContributions)} · Employer match:{" "}
          {fmt(employerMatchAmt)}
          {totalContributions > EMPLOYEE_401K_LIMIT_2026 && (
            <div style={{ color: "#A84D1E" }} className="mt-1">
              ⚠ Exceeds 2026 employee limit of{" "}
              {fmt(EMPLOYEE_401K_LIMIT_2026)}.
            </div>
          )}
        </div>
      </div>

      {/* 05 · Pre-tax Deductions */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="serif text-2xl">05 · Pre-tax Deductions</h2>
          <span
            className="mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: "#6B6550" }}
          >
            annual $
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="fld-label">HSA</span>
            <input
              type="number"
              className="fld numeric"
              value={state.hsa}
              onChange={num("hsa")}
            />
          </label>
          <label className="block">
            <span className="fld-label">Health premium</span>
            <input
              type="number"
              className="fld numeric"
              value={state.healthPremium}
              onChange={num("healthPremium")}
            />
          </label>
          <label className="block">
            <span className="fld-label">FSA</span>
            <input
              type="number"
              className="fld numeric"
              value={state.fsa}
              onChange={num("fsa")}
            />
          </label>
          <label className="block">
            <span className="fld-label">Other pre-tax</span>
            <input
              type="number"
              className="fld numeric"
              value={state.otherPreTax}
              onChange={num("otherPreTax")}
            />
          </label>
        </div>
      </div>

      {/* 06 · Post-tax Deductions */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="serif text-2xl">06 · Post-tax Deductions</h2>
        </div>
        <label className="block">
          <span className="fld-label">Other post-tax (annual $)</span>
          <input
            type="number"
            className="fld numeric"
            value={state.otherPostTax}
            onChange={num("otherPostTax")}
          />
        </label>
      </div>
    </div>
  );
}
