# Take-Home Calculator · Tax Year 2026

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Tests](https://img.shields.io/badge/tests-42%20passing-brightgreen)](./src/lib/tax.test.ts)

A tight, opinionated paycheck calculator for U.S. salaried employees who
get **bonuses and RSUs** — built because generic take-home calculators
quietly mislead you about supplemental-wage withholding.

![Take-Home Calculator screenshot](./public/screenshot.png)

**Live demo:** _not yet deployed — add URL here after shipping._

It models:

- 2026 federal brackets, standard deduction, Social Security (capped at the
  $184,500 wage base), Medicare, and the 0.9% additional Medicare surcharge.
- Traditional and Roth 401(k) deferrals — including the nuance that traditional
  deferrals reduce federal taxable wages but not FICA wages.
- Section 125 pre-tax deductions (HSA / health premium / FSA) — which reduce
  both federal and FICA wages.
- State income tax for ~15 common states plus a custom-rate escape hatch, and
  state **supplemental** rates where they differ from the regular rate.
- The IRS percentage method for supplemental wages: flat **22%** up to
  $1M / year, **37%** above.
- An "April surprise" delta that isolates the *incremental true tax* on your
  bonus + RSUs versus what your paycheck actually withholds — so you know
  whether to expect a refund or a bill.

> Estimates only. Not tax advice.

## Stack

- **Next.js 16** (App Router, React 19)
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **Vitest** + **React Testing Library** + **jsdom**

Calculation logic lives in [`src/lib/tax.ts`](src/lib/tax.ts) as a pure,
side-effect-free module so it can be tested in isolation and, if desired,
reused outside the UI.

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command               | What it does                                |
| --------------------- | ------------------------------------------- |
| `npm run dev`         | Start the Next.js dev server                |
| `npm run build`       | Production build                            |
| `npm run start`       | Run the production build                    |
| `npm run lint`        | ESLint (Next.js config)                     |
| `npm run typecheck`   | `tsc --noEmit`                              |
| `npm test`            | Run the Vitest suite once                   |
| `npm run test:watch`  | Vitest in watch mode                        |

## Project structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout + metadata
│   └── page.tsx                # Renders <TakeHomeCalculator />
├── components/
│   ├── TakeHomeCalculator.tsx  # Client component: inputs + results UI
│   └── TakeHomeCalculator.test.tsx
└── lib/
    ├── format.ts               # USD / percent / signed formatters
    ├── format.test.ts
    ├── tax.ts                  # 2026 tax constants + calculation logic
    └── tax.test.ts
```

## What the tests cover

The suite lives alongside the code it tests and focuses on the parts most
likely to be wrong:

- **Bracket math** — zero/negative income, exact bracket tops, straddling two
  brackets, and a full top-of-chart walkthrough at $700k income.
- **Marginal rate lookup** — parameterized across every bracket boundary.
- **FICA** — Social Security wage-base cap, uncapped Medicare, the 0.9%
  additional-Medicare surcharge, and the MFJ-vs-single threshold difference.
- **Pre-tax deduction semantics** — traditional 401(k) reduces federal
  taxable wages but *not* FICA; Section 125 reduces both.
- **Accounting identity** — `takeHome + totalTax + preTax + postTax ==
  totalGross`, with a full real-world input set.
- **Input clamping** — negative salary / bonus / RSU values are treated as 0.
- **Supplemental wages** — over-withholding (low-bracket filer → refund),
  under-withholding (high-bracket filer → bill), the $1M / 37% cap, and
  `defer401kFromBonus` reducing the withholding base without touching FICA.
- **State handling** — zero-tax states, NC flat rate + standard deduction,
  `other` with a custom rate, and states where supp rate ≠ regular rate (IN).
- **Component smoke test** — renders defaults, verifies a plausible take-home,
  and confirms the number updates when salary changes.

Run `npm test` to execute the whole thing. Typical runtime is under a second.

## 2026 tax data sources

- Federal brackets & standard deduction: IRS Rev. Proc. 2025-32
- Social Security wage base: SSA 2026 fact sheet ($184,500)
- Medicare + additional Medicare: IRS Pub. 15
- Supplemental wage percentage method: IRS Pub. 15 (22% up to $1M, 37% above)
- State rates: respective state revenue department publications

## License

[MIT](./LICENSE)
