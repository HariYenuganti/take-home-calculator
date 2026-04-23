import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TakeHomeCalculator from "./TakeHomeCalculator";

describe("<TakeHomeCalculator />", () => {
  it("renders the masthead and a plausible default take-home", () => {
    render(<TakeHomeCalculator />);
    expect(
      screen.getByRole("heading", { level: 1, name: /actually/i }),
    ).toBeInTheDocument();
    const takeHome = screen.getByTestId("take-home");
    // Default inputs: $140k salary + $20k bonus + $40k RSU in NC.
    // Take-home should comfortably exceed $100k.
    const parsed = Number(takeHome.textContent?.replace(/[^0-9.-]/g, ""));
    expect(parsed).toBeGreaterThan(100_000);
    expect(parsed).toBeLessThan(160_000);
  });

  it("recomputes when the salary input changes", async () => {
    const user = userEvent.setup();
    render(<TakeHomeCalculator />);
    const takeHome = screen.getByTestId("take-home");
    const before = takeHome.textContent;

    const salary = screen.getByLabelText(/annual salary/i) as HTMLInputElement;
    await user.clear(salary);
    await user.type(salary, "250000");

    expect(takeHome.textContent).not.toBe(before);
  });
});
