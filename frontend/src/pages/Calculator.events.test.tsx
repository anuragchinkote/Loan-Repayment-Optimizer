import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Calculator from "./Calculator";
import { trackEvent } from "../services/analytics";
import type { LoanPlanRequest, LoanPlanResponse, ScheduleRow } from "../types/loan";

vi.mock("../services/analytics", () => ({
  initAnalytics: vi.fn(),
  trackEvent: vi.fn(),
  trackPageView: vi.fn(),
}));

const trackEventMock = vi.mocked(trackEvent);

function makeSchedule(months: number, payment: string): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  for (let i = 1; i <= months; i += 1) {
    rows.push({
      month: i,
      opening_balance: "800000",
      payment,
      interest: "4000.00",
      principal: "4000.00",
      lump_sum: "0",
      closing_balance: i === months ? "0.00" : "500000",
    });
  }
  return rows;
}

function makeResult(plan?: "extra" | "lump" | "target"): LoanPlanResponse {
  const baseline = {
    monthly_payment: "8000",
    total_payment: "712000",
    total_interest: "200000",
    number_of_months: 89,
    schedule: makeSchedule(89, "8000"),
  };
  if (!plan) {
    return {
      baseline,
      strategy: baseline,
      comparison: { interest_saved: "0.00", months_saved: 0, payment_difference: "0.00" },
      standard_monthly_instalment: "6607.54",
    };
  }
  const strategy = {
    monthly_payment: plan === "lump" ? "8000" : "10000",
    total_payment: "632000",
    total_interest: "150000",
    number_of_months: 75,
    schedule: makeSchedule(75, plan === "lump" ? "8000" : "10000"),
  };
  return {
    baseline,
    strategy,
    comparison: { interest_saved: "50000", months_saved: 14, payment_difference: "80000" },
    standard_monthly_instalment: "6607.54",
  };
}

function installFetchMock() {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String((init as RequestInit).body)) as LoanPlanRequest;
    const requested =
      body.strategy !== null &&
      body.strategy !== undefined &&
      (Number(body.strategy.extra_monthly_payment) > 0 ||
        (body.strategy.lump_sum_events?.length ?? 0) > 0 ||
        body.strategy.target_months != null);
    const result = makeResult(requested ? "extra" : undefined);
    return { ok: true, status: 200, json: async () => result } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const fillLoanDetails = () => {
  fireEvent.change(screen.getByLabelText("Current required monthly instalment"), {
    target: { value: "8000" },
  });
  fireEvent.change(screen.getByLabelText("Outstanding loan balance"), {
    target: { value: "600000" },
  });
  fireEvent.change(screen.getByLabelText("Annual interest rate"), {
    target: { value: "8.5" },
  });
  fireEvent.change(screen.getByLabelText("Tenure"), {
    target: { value: "180" },
  });
};

const clickCalculate = () => {
  fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("GA4 calculator events", () => {
  it("fires no analytics events before any user action", () => {
    installFetchMock();
    render(<Calculator />);
    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it("fires calculator_started and baseline_calculated on the first Calculate", async () => {
    installFetchMock();
    render(<Calculator />);
    fillLoanDetails();
    clickCalculate();

    await screen.findByText("Your Current Plan");
    expect(trackEventMock).toHaveBeenCalledWith("calculator_started");
    expect(trackEventMock).toHaveBeenCalledWith("baseline_calculated");
  });

  it("fires strategy_selected when the user picks a repayment mode", async () => {
    installFetchMock();
    render(<Calculator />);
    fillLoanDetails();
    clickCalculate();
    await screen.findByText("Your Current Plan");

    fireEvent.click(screen.getByRole("tab", { name: /extra monthly/i }));
    expect(trackEventMock).toHaveBeenCalledWith("strategy_selected", { strategy: "extra" });

    fireEvent.click(screen.getByRole("tab", { name: /target payoff term/i }));
    expect(trackEventMock).toHaveBeenCalledWith("strategy_selected", { strategy: "target" });
  });

  it("fires savings_calculated after a strategy comparison succeeds", async () => {
    installFetchMock();
    render(<Calculator />);
    fillLoanDetails();
    clickCalculate();
    await screen.findByText("Your Current Plan");

    fireEvent.click(screen.getByRole("tab", { name: /extra monthly/i }));
    fireEvent.change(screen.getByLabelText("Extra monthly payment"), {
      target: { value: "2000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Calculate Savings" }));

    await screen.findByText("Potential interest saved");
    expect(trackEventMock).toHaveBeenCalledWith("savings_calculated", { strategy: "extra" });
  });

  it("fires lump_sum_added when a new lump sum is saved", async () => {
    installFetchMock();
    render(<Calculator />);
    fillLoanDetails();
    clickCalculate();
    await screen.findByText("Your Current Plan");

    fireEvent.click(screen.getByRole("tab", { name: /extra monthly/i }));
    fireEvent.click(screen.getByRole("button", { name: /add lump sum/i }));
    fireEvent.change(screen.getByLabelText("Month"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "100000" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(trackEventMock).toHaveBeenCalledWith("lump_sum_added"),
    );
    expect(
      trackEventMock.mock.calls.filter((call) => call[0] === "lump_sum_added"),
    ).toHaveLength(1);
  });

  it("never passes financial or PII values in any event parameter", async () => {
    installFetchMock();
    render(<Calculator />);

    fillLoanDetails();
    clickCalculate();
    await screen.findByText("Your Current Plan");

    fireEvent.click(screen.getByRole("tab", { name: /extra monthly/i }));
    fireEvent.change(screen.getByLabelText("Extra monthly payment"), {
      target: { value: "3000" },
    });
    clickCalculate();
    await waitFor(() => expect(trackEventMock).toHaveBeenCalledWith("baseline_calculated"));

    fireEvent.click(screen.getByRole("tab", { name: /extra monthly/i }));
    fireEvent.change(screen.getByLabelText("Extra monthly payment"), {
      target: { value: "2000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Calculate Savings" }));
    await screen.findByText("Potential interest saved");

    fireEvent.click(screen.getByRole("button", { name: /add lump sum/i }));
    fireEvent.change(screen.getByLabelText("Month"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "100000" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() =>
      expect(trackEventMock).toHaveBeenCalledWith("lump_sum_added"),
    );

    const financialValues = [
      "600000",
      "8000",
      "3000",
      "2000",
      "100000",
      "8.5",
      "180",
      "12",
      "6607.54",
    ];
    for (const call of trackEventMock.mock.calls) {
      const params = call[1] ?? {};
      const json = JSON.stringify(params);
      for (const value of financialValues) {
        expect(json).not.toContain(value);
      }
      const keys = Object.keys(params);
      for (const key of keys) {
        expect(["strategy"]).toContain(key);
      }
    }
  });
});