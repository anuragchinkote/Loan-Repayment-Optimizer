import { describe, expect, it } from "vitest";
import type { LoanInputs, LoanPlanResponse } from "../types/loan";
import { buildCalculatorShareText, buildResultsShareText } from "./share";

const inputs: LoanInputs = {
  balance: "5,00,000",
  rate: "8.5",
  tenure: "180",
  instalment: "8,000",
};

function makeResult(plan: boolean): LoanPlanResponse {
  const baseline = {
    monthly_payment: "8000",
    total_payment: "900000",
    total_interest: "400000",
    number_of_months: 100,
    schedule: [],
  };
  return {
    baseline,
    strategy: plan
      ? {
          monthly_payment: "10000",
          total_payment: "820000",
          total_interest: "350000",
          number_of_months: 75,
          schedule: [],
        }
      : baseline,
    comparison: plan
      ? { interest_saved: "50000", months_saved: 25, payment_difference: "80000" }
      : { interest_saved: "0.00", months_saved: 0, payment_difference: "0.00" },
    standard_monthly_instalment: "6607.54",
  };
}

describe("buildResultsShareText", () => {
  it("always includes the values valid in the current state", () => {
    const text = buildResultsShareText(inputs, makeResult(false));
    expect(text).toContain("CURRENT PLAN");
    expect(text).toContain("Monthly instalment: ₹8,000/mo");
    expect(text).toContain("Amount paid: ₹9,00,000");
    expect(text).toContain("Interest paid: ₹4,00,000");
    expect(text).toContain("Paid off in: 100 mo (8.3 yrs)");
    expect(text).toContain("Try LoanPilot:");
    expect(text).toContain("180 mo tenure");
    expect(text).not.toContain("PDF");
    expect(text).not.toContain("pdf");
  });

  it("adds the plan comparison only when a plan is actually active", () => {
    const text = buildResultsShareText(inputs, makeResult(true));
    expect(text).toContain("NEW PLAN");
    expect(text).toContain("Monthly payment: ₹10,000/mo");
    expect(text).toContain("Interest saved: ₹50,000");
    expect(text).toContain("Time saved: 25 mo");
    expect(text).toContain("Paid off in: 75 mo (6.3 yrs)");
  });

  it("omits plan lines when the strategy matches the baseline", () => {
    const text = buildResultsShareText(inputs, makeResult(false));
    expect(text).not.toContain("Planned monthly payment");
    expect(text).not.toContain("Time saved");
  });
});

describe("buildCalculatorShareText", () => {
  it("is a simple invitation with no numeric results", () => {
    const text = buildCalculatorShareText();
    expect(text).toContain("Try LoanPilot:");
    expect(text).not.toContain("Interest");
    expect(text).not.toContain("PDF");
  });
});