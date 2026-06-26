<div align="center">

# Take-Home Calculator · Tax Year 2026

**What you actually keep from salary, bonuses, and RSUs.**

[**Live demo →**](https://take-home-calculator-nine.vercel.app/)

[![CI](https://github.com/HariYenuganti/take-home-calculator/actions/workflows/ci.yml/badge.svg)](https://github.com/HariYenuganti/take-home-calculator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](./tsconfig.json)
[![Tests](https://img.shields.io/badge/tests-89%20passing-brightgreen)](./src/lib/tax.test.ts)

![Take-Home Calculator preview](./public/og-image.png)

</div>

---

## Why this exists

Generic take-home calculators quietly mislead you about **supplemental-wage
withholding**. Your employer withholds a flat 22% federal tax on bonuses and
RSUs, regardless of your actual bracket. If your marginal rate is 24%+, you're
under-withheld and will owe at filing; if you're in the 12% bracket, you're
over-withheld and can expect a refund.

Most tools hide this. This one makes the **"April surprise"** the hero of the
page — alongside the standard federal / state / FICA breakdown.

> Estimates only. Not tax advice.

## What it does

- **Isolates the April surprise.** A dedicated card shows the delta between
  paycheck supplemental withholding (flat 22% / 37%) and your *actual*
  incremental tax on bonuses + RSUs — so you know whether you'll owe or get a
  refund, with concrete fixes (the exact W-4 line-4c amount or estimated
  payment to close the gap).
- **What a raise nets you.** An "if you got a raise" panel re-runs the engine
  on a +$5k / $10k / $25k / $50k bump and shows how much of the next dollar you
  actually keep — your real marginal rate, including the Social Security cap and
  additional-Medicare edges.
- **Side-by-side compare mode.** Toggle on to run two scenarios at once —
  "current job vs offer", "CA vs NY", "single vs MFJ" — with a full A / B / Δ
  breakdown across take-home, effective rate, marginal rate, and tax.
- **Federal bracket breakdown.** Visual stack showing how many of your dollars
  land in each bracket. Makes the difference between marginal and effective
  rates immediately readable.
- **Shareable URL state.** Every input serializes to the URL. Copy the link
  and your spouse, advisor, or future self lands on the exact scenario.
- **Accurate tax semantics.** Traditional 401(k) reduces federal taxable wages
  but *not* FICA wages. HSA / health / FSA (Section 125) reduce both. Social
  Security caps at the $184,500 wage base. 0.9% additional Medicare kicks in
  past the per-filing-status threshold. None of this is glossed over.
- **State income tax** for ~15 states — flat-rate states plus full
  progressive brackets for **California** (incl. the 1% mental-health surcharge
  over $1M) and **New York** (2026 state rates) — with a no-tax option and a
  custom-rate escape hatch for the rest.
- **Dark mode and print.** A parchment-on-ink dark theme (follows your OS by
  default, toggle to override), and a print / save-as-PDF button for a clean
  one-page summary to hand an advisor.

<details>
<summary><strong>Full interface preview</strong></summary>

<br>

![Full UI · single-scenario mode](./public/screenshot.png)

</details>

## Stack

- **Next.js 16** · App Router · React 19
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **Vitest** + React Testing Library + jsdom

Calculation logic lives in [`src/lib/tax.ts`](src/lib/tax.ts) as a pure,
side-effect-free module — testable in isolation, reusable outside the UI.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command               | What it does                        |
| --------------------- | ----------------------------------- |
| `npm run dev`         | Start the Next.js dev server        |
| `npm run build`       | Production build                    |
| `npm run start`       | Run the production build            |
| `npm run lint`        | ESLint (Next.js config)             |
| `npm run typecheck`   | `tsc --noEmit`                      |
| `npm test`            | Run the Vitest suite once           |
| `npm run test:watch`  | Vitest in watch mode                |

## Project structure

```
src/
├── app/
│   ├── layout.tsx                     # Root layout · fonts · theme-color · OG
│   ├── page.tsx                       # Renders <TakeHomeCalculator />
│   ├── globals.css                    # Design tokens · light/dark · print
│   └── icon.svg                       # Branded favicon
├── components/
│   ├── TakeHomeCalculator.tsx         # Top-level client component
│   ├── TakeHomeCalculator.test.tsx
│   ├── ScenarioInputs.tsx             # Input form (reused by A + B)
│   ├── NumberField.tsx                # Editable numeric input w/ clamping
│   ├── MarginalDollar.tsx             # "If you got a raise" explorer
│   └── ScenarioDetail.tsx             # Supp analysis · pay period ·
│                                      # visual breakdown · bracket
│                                      # breakdown · ledger
└── lib/
    ├── tax.ts                         # 2026 tax constants + logic
    ├── tax.test.ts
    ├── format.ts                      # USD / percent / signed formatters
    ├── format.test.ts
    ├── urlState.ts                    # URL ↔ state serialization
    └── urlState.test.ts               # + compare-mode support
```

## What the tests cover

89 tests across 4 files, sub-second runtime. Focused on the parts most likely
to be wrong:

- **Bracket math** — zero / negative income, exact bracket tops, straddling
  boundaries, full top-of-chart walkthrough at $700k.
- **Bracket breakdown** — segment sum equals total tax, segment amounts sum
  to taxable income, top-bracket segment correctly partial.
- **Marginal-rate lookup** — parameterized across every bracket boundary.
- **FICA** — Social Security wage-base cap, uncapped Medicare, the 0.9%
  additional-Medicare surcharge, MFJ-vs-single threshold difference.
- **Pre-tax deduction semantics** — traditional 401(k) reduces federal
  taxable wages but *not* FICA; Section 125 reduces both.
- **Accounting identity** — `takeHome + totalTax + preTax + postTax ==
  totalGross`.
- **Input clamping** — negative salary / bonus / RSU values treated as 0.
- **Supplemental wages** — over-withholding (refund), under-withholding
  (bill), the $1M / 37% cap, `defer401kFromBonus` correctly reducing the
  withholding base without touching FICA.
- **State handling** — zero-tax states, flat-rate states with standard
  deductions, custom-rate (`other`), progressive brackets (CA, NY, the MA
  millionaire surtax), the per-state 401(k) / §125 wage base (PA), and states
  where the supp rate ≠ regular rate (CO).
- **401(k) rules** — RSUs excluded from the deferral base, the bonus included
  only when deferral is on, and the combined trad+Roth deferral capped at the
  annual limit.
- **URL state** — serialize ↔ parse round-trip for every field, compare-mode
  `b_` prefix, invalid params dropped silently rather than crashing.
- **Component smoke test** — default render, take-home computed correctly,
  updates reactively when inputs change.

Run `npm test` to execute the full suite.

## 2026 tax data sources

- Federal brackets & standard deduction — IRS Rev. Proc. 2025-32
- Social Security wage base — SSA 2026 fact sheet ($184,500)
- Medicare + additional Medicare — IRS Pub. 15
- Supplemental wage percentage method — IRS Pub. 15 (22% up to $1M, 37% above)
- State rates — respective state revenue department publications. New York uses
  the final 2026 state rates (Ch. 59, Laws of 2025); California uses the latest
  published FTB schedules (2025 — the FTB had not released 2026 as of mid-2026,
  flagged in `tax.ts` to refresh when it does).

## License

[MIT](./LICENSE)
