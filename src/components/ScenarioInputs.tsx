"use client";

import {
  EMPLOYEE_401K_LIMIT_2026,
  STATES,
  type CalcResult,
  type FilingStatus,
} from "@/lib/tax";
import { fmt } from "@/lib/format";
import { type CalcState } from "@/lib/urlState";
import NumberField from "./NumberField";

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

  return (
    <div className="space-y-7">
      {/* 01 · Base Income */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="serif text-2xl">01 · Base Income</h2>
          <span
            className="mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: "var(--c-muted)" }}
          >
            regular wages
          </span>
        </div>
        <div className="seg mb-4" role="group" aria-label="Pay type">
          <button
            type="button"
            aria-pressed={state.payType === "annual"}
            className={state.payType === "annual" ? "active" : ""}
            onClick={() => onChange({ payType: "annual" })}
          >
            Salary
          </button>
          <button
            type="button"
            aria-pressed={state.payType === "hourly"}
            className={state.payType === "hourly" ? "active" : ""}
            onClick={() => onChange({ payType: "hourly" })}
          >
            Hourly
          </button>
        </div>
        {state.payType === "annual" ? (
          <NumberField
            label="Annual salary"
            value={state.annualSalary}
            onChange={(v) => onChange({ annualSalary: v })}
            min={0}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NumberField
              label="Rate / hr"
              value={state.hourlyRate}
              onChange={(v) => onChange({ hourlyRate: v })}
              min={0}
            />
            <NumberField
              label="Hrs / week"
              value={state.hoursPerWeek}
              onChange={(v) => onChange({ hoursPerWeek: v })}
              min={0}
              max={168}
            />
            <NumberField
              label="Weeks / yr"
              value={state.weeksPerYear}
              onChange={(v) => onChange({ weeksPerYear: v })}
              min={0}
              max={52}
            />
          </div>
        )}
        <div
          className="mt-3 mono text-xs numeric"
          style={{ color: "var(--c-muted)" }}
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
            style={{ color: "var(--c-muted)" }}
          >
            supplemental wages
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Annual cash bonus"
            value={state.bonus}
            onChange={(v) => onChange({ bonus: v })}
            min={0}
          />
          <NumberField
            label="RSU vest value / yr"
            value={state.rsuValue}
            onChange={(v) => onChange({ rsuValue: v })}
            min={0}
          />
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
          style={{ color: "var(--c-muted)" }}
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
          <div className="mt-3">
            <NumberField
              label="Your effective state tax rate (%)"
              value={state.customStateRate}
              onChange={(v) => onChange({ customStateRate: v })}
              min={0}
              max={20}
            />
          </div>
        )}
      </div>

      {/* 04 · Retirement */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="serif text-2xl">04 · Retirement</h2>
          <span
            className="mono text-[10px] uppercase tracking-[0.15em]"
            style={{ color: "var(--c-muted)" }}
          >
            % of contributable wages
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <NumberField
            label="Trad 401(k)"
            value={state.trad401k}
            onChange={(v) => onChange({ trad401k: v })}
            min={0}
            max={100}          />
          <NumberField
            label="Roth 401(k)"
            value={state.roth401k}
            onChange={(v) => onChange({ roth401k: v })}
            min={0}
            max={100}          />
          <NumberField
            label="Employer match"
            value={state.employerMatch}
            onChange={(v) => onChange({ employerMatch: v })}
            min={0}
            max={100}          />
        </div>
        <div
          className="mt-3 mono text-xs numeric"
          style={{ color: "var(--c-muted)" }}
        >
          Your contributions: {fmt(totalContributions)} · Employer match:{" "}
          {fmt(employerMatchAmt)}
          {totalContributions > EMPLOYEE_401K_LIMIT_2026 && (
            <div style={{ color: "var(--c-rust)" }} className="mt-1" role="alert">
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
            style={{ color: "var(--c-muted)" }}
          >
            annual $
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="HSA"
            value={state.hsa}
            onChange={(v) => onChange({ hsa: v })}
            min={0}
          />
          <NumberField
            label="Health premium"
            value={state.healthPremium}
            onChange={(v) => onChange({ healthPremium: v })}
            min={0}
          />
          <NumberField
            label="FSA"
            value={state.fsa}
            onChange={(v) => onChange({ fsa: v })}
            min={0}
          />
          <NumberField
            label="Other pre-tax"
            value={state.otherPreTax}
            onChange={(v) => onChange({ otherPreTax: v })}
            min={0}
          />
        </div>
      </div>

      {/* 06 · Post-tax Deductions */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="serif text-2xl">06 · Post-tax Deductions</h2>
        </div>
        <NumberField
          label="Other post-tax (annual $)"
          value={state.otherPostTax}
          onChange={(v) => onChange({ otherPostTax: v })}
          min={0}
        />
      </div>
    </div>
  );
}
