import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Calculator from "./Calculator";
import type { LoanPlanRequest, LoanPlanResponse, ScheduleRow } from "../types/loan";

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

function installFailingFetchMock() {
  const fetchMock = vi.fn(
    async () =>
      ({ ok: false, status: 500, json: async () => ({ detail: "boom" }) }) as Response,
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function stubScrollIntoView() {
  const spy = vi.fn();
  (Element.prototype as unknown as { scrollIntoView: unknown }).scrollIntoView = spy;
  return spy;
}

const setInstalment = (value: string) =>
  fireEvent.change(screen.getByLabelText("Current required monthly instalment"), {
    target: { value },
  });

const fillLoanDetails = () => {
  setInstalment("8000");
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

const clickCalculateSavings = () => {
  fireEvent.click(screen.getByRole("button", { name: "Calculate Savings" }));
};

const revealPlan = async () => {
  fillLoanDetails();
  clickCalculate();
  await screen.findByText("Your Current Plan");
  fireEvent.click(screen.getByRole("tab", { name: /extra monthly/i }));
  fireEvent.change(screen.getByLabelText("Extra monthly payment"), {
    target: { value: "2000" },
  });
  clickCalculateSavings();
  await screen.findByText("Potential interest saved");
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Calculator two-stage flow", () => {
  it("does not run a comparison before the user calculates", async () => {
    const fetchMock = installFetchMock();
    render(<Calculator />);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Your Current Plan")).not.toBeInTheDocument();
  });

  it("requires the current monthly instalment before calculating", async () => {
    const fetchMock = installFetchMock();
    render(<Calculator />);

    await clickCalculate();
    expect(await screen.findByText("Enter your current monthly instalment.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("starts with empty inputs and placeholders for the tenure-moths entry", () => {
    installFetchMock();
    render(<Calculator />);

    expect(screen.getByLabelText("Outstanding loan balance")).toHaveValue("");
    expect(screen.getByLabelText("Annual interest rate")).toHaveValue("");
    expect(screen.getByLabelText("Tenure")).toHaveValue("");
    expect(screen.getByLabelText("Current required monthly instalment")).toHaveValue("");
    expect(screen.getByPlaceholderText("e.g. 144")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. 600000")).toBeInTheDocument();
  });

  it("calculates the baseline first, then reveals an unstained planner", async () => {
    const fetchMock = installFetchMock();
    render(<Calculator />);

    fillLoanDetails();
    await clickCalculate();

    await screen.findByText("Your Current Plan");
    expect(screen.getByText("Stage A — Baseline")).toBeInTheDocument();
    expect(screen.getByText("Make a Plan")).toBeInTheDocument();
    expect(screen.getByText("Your Repayment Strategy")).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body)) as LoanPlanRequest;
    expect(body.current_monthly_instalment).toBe("8000");
    expect(body.strategy).toBeNull();

    expect(screen.queryByLabelText("Extra monthly payment")).not.toBeInTheDocument();
  });

  it("only shows a plan comparison after the user presses Calculate Savings", async () => {
    const fetchMock = installFetchMock();
    render(<Calculator />);

    fillLoanDetails();
    await clickCalculate();
    await screen.findByText("Your Current Plan");

    fireEvent.click(screen.getByRole("tab", { name: /extra monthly/i }));
    expect(screen.getByLabelText("Extra monthly payment")).toBeInTheDocument();
    expect(
      screen.getByText("Your plan comparison appears once you configure a strategy"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Extra monthly payment"), {
      target: { value: "2000" },
    });

    // Tuning the slider must NOT fetch while the plan is still unrevealed.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    clickCalculateSavings();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await screen.findByText("Potential interest saved");
    // The comparison row adds a second "Amount paid" line besides the current-plan card.
    expect(screen.getAllByText("Amount paid").length).toBeGreaterThan(1);
    expect(screen.getAllByText("₹10,000").length).toBeGreaterThan(0);

    const body = JSON.parse(
      String((fetchMock.mock.calls[1][1] as RequestInit).body),
    ) as LoanPlanRequest;
    expect(body.strategy?.extra_monthly_payment).toBe("2000");
    expect(body.current_monthly_instalment).toBe("8000");
  });

  it("updates the comparison live once the plan is revealed", async () => {
    const fetchMock = installFetchMock();
    render(<Calculator />);

    await revealPlan();

    fireEvent.change(screen.getByLabelText("Extra monthly payment"), {
      target: { value: "5000" },
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const body = JSON.parse(
      String((fetchMock.mock.calls[2][1] as RequestInit).body),
    ) as LoanPlanRequest;
    expect(body.strategy?.extra_monthly_payment).toBe("5000");
  });

  it("resets the comparison when the user switches strategy mode", async () => {
    installFetchMock();
    render(<Calculator />);

    await revealPlan();

    fireEvent.click(screen.getByRole("tab", { name: /target payoff term/i }));
    expect(screen.getByLabelText("Target payoff term in months")).toBeInTheDocument();
    expect(
      screen.getByText("Your plan comparison appears once you configure a strategy"),
    ).toBeInTheDocument();
  });

  it("flags stale results when loan inputs change after calculating", async () => {
    installFetchMock();
    render(<Calculator />);

    await revealPlan();

    fireEvent.change(screen.getByLabelText("Outstanding loan balance"), {
      target: { value: "550000" },
    });
    expect(
      await screen.findByText(/Your loan details have changed since this summary was calculated/),
    ).toBeInTheDocument();
  });
});

describe("Calculator lump sums", () => {
  it("adds a lump sum through the Add button and compares after Calculate Savings", async () => {
    const user = userEvent.setup();
    const fetchMock = installFetchMock();
    render(<Calculator />);

    fillLoanDetails();
    await clickCalculate();
    await screen.findByText("Your Current Plan");

    fireEvent.click(screen.getByRole("tab", { name: /extra monthly/i }));
    fireEvent.click(screen.getByRole("button", { name: /add lump sum/i }));

    await user.type(screen.getByLabelText("Month"), "12");
    await user.type(screen.getByLabelText("Amount"), "100000");
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    clickCalculateSavings();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await screen.findByText("Potential interest saved");

    const body = JSON.parse(
      String((fetchMock.mock.calls[1][1] as RequestInit).body),
    ) as LoanPlanRequest;
    expect(body.strategy?.lump_sum_events).toEqual([{ month: 12, amount: "100000" }]);
    expect(screen.getByText(/scheduled at Month 12/i)).toBeInTheDocument();
  });
});

describe("EMI guidance and auto-scroll", () => {
  it("shows the calculated EMI beside the instalment field after the baseline calculates", async () => {
    installFetchMock();
    render(<Calculator />);

    fillLoanDetails();
    clickCalculate();
    await screen.findByText("Your Current Plan");

    expect(screen.getByText(/^EMI: ₹6,607\.54$/)).toBeInTheDocument();
  });

  it("shows a highlighted EMI hint when Calculate is pressed without an instalment", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("/loan/emi")) {
        return { ok: true, status: 200, json: async () => ({ emi: "6607.54" }) } as Response;
      }
      const body = JSON.parse(String((init as RequestInit).body)) as LoanPlanRequest;
      const requested =
        body.strategy !== null &&
        body.strategy !== undefined &&
        (Number(body.strategy.extra_monthly_payment) > 0 ||
          (body.strategy.lump_sum_events?.length ?? 0) > 0 ||
          body.strategy.target_months != null);
      return { ok: true, status: 200, json: async () => makeResult(requested ? "extra" : undefined) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Calculator />);

    fireEvent.change(screen.getByLabelText("Outstanding loan balance"), {
      target: { value: "500000" },
    });
    fireEvent.change(screen.getByLabelText("Annual interest rate"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Tenure"), {
      target: { value: "120" },
    });
    clickCalculate();

    expect(await screen.findByText("Enter your current monthly instalment.")).toBeInTheDocument();
    expect(await screen.findByText(/^EMI: ₹6,607\.54$/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes("/loan/emi"))).toBe(true);
  });

  it("keeps the button and guides to the slider when Calculate Savings is pressed with no extra configured", async () => {
    const fetchMock = installFetchMock();
    const scrollSpy = stubScrollIntoView();
    render(<Calculator />);

    fillLoanDetails();
    clickCalculate();
    await screen.findByText("Your Current Plan");
    scrollSpy.mockClear();

    fireEvent.click(screen.getByRole("tab", { name: /extra monthly/i }));
    clickCalculateSavings();

    expect(
      await screen.findByText(/Try dragging the slider dot to pick an extra monthly amount/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calculate Savings" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect((scrollSpy.mock.instances[0] as HTMLElement).id).toBe("extra-slider");
  });

  it("reveals the comparison normally once a real extra amount is set", async () => {
    const fetchMock = installFetchMock();
    render(<Calculator />);

    await revealPlan();

    expect(screen.getByText("Potential interest saved")).toBeInTheDocument();
    expect(
      screen.queryByText(/Try dragging the slider dot to pick an extra monthly amount/),
    ).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects an instalment below the calculated EMI without calling the server", async () => {
    const fetchMock = installFetchMock();
    render(<Calculator />);

    await revealPlan();

    setInstalment("5000");
    expect(
      await screen.findByText(/must be at least the EMI of ₹6,607\.54/),
    ).toBeInTheDocument();

    clickCalculate();
    await screen.findByText(/Check the highlighted fields and try again/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("accepts an instalment above the calculated EMI", async () => {
    const fetchMock = installFetchMock();
    render(<Calculator />);

    await revealPlan();

    setInstalment("6608");
    expect(screen.queryByText(/must be at least the EMI/)).not.toBeInTheDocument();

    clickCalculate();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const body = JSON.parse(
      String((fetchMock.mock.calls[2][1] as RequestInit).body),
    ) as LoanPlanRequest;
    expect(body.current_monthly_instalment).toBe("6608");
  });

  it("accepts an instalment equal to the calculated EMI", async () => {
    const wholeEmiResult = { ...makeResult(), standard_monthly_instalment: "6607" };
    const fetchMock = vi.fn(
      async () => ({ ok: true, status: 200, json: async () => wholeEmiResult }) as Response,
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<Calculator />);

    fillLoanDetails();
    clickCalculate();
    await screen.findByText("Your Current Plan");
    expect(screen.getByText(/^EMI: ₹6,607\.00$/)).toBeInTheDocument();

    setInstalment("6607");
    expect(screen.queryByText(/must be at least the EMI/)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("scrolls to the current plan after the first successful baseline calculation", async () => {
    const scrollSpy = stubScrollIntoView();
    installFetchMock();
    render(<Calculator />);

    fillLoanDetails();
    clickCalculate();
    await screen.findByText("Your Current Plan");

    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({ block: "start" }),
    );
  });

  it("does not scroll when the first calculation fails", async () => {
    const scrollSpy = stubScrollIntoView();
    installFailingFetchMock();
    render(<Calculator />);

    fillLoanDetails();
    clickCalculate();
    await screen.findByText("We could not calculate your loan");

    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it("scrolls to the new plan after Calculate Savings succeeds", async () => {
    const scrollSpy = stubScrollIntoView();
    installFetchMock();
    render(<Calculator />);

    fillLoanDetails();
    clickCalculate();
    await screen.findByText("Your Current Plan");
    scrollSpy.mockClear();

    fireEvent.click(screen.getByRole("tab", { name: /extra monthly/i }));
    fireEvent.change(screen.getByLabelText("Extra monthly payment"), {
      target: { value: "2000" },
    });
    clickCalculateSavings();
    await screen.findByText("Potential interest saved");

    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });

  it("does not scroll when Calculate Savings fails", async () => {
    const fetchMock = installFetchMock();
    const scrollSpy = stubScrollIntoView();
    render(<Calculator />);

    fillLoanDetails();
    clickCalculate();
    await screen.findByText("Your Current Plan");
    scrollSpy.mockClear();

    fetchMock.mockImplementation(
      async () => ({ ok: false, status: 500, json: async () => ({ detail: "boom" }) }) as Response,
    );
    fireEvent.click(screen.getByRole("tab", { name: /extra monthly/i }));
    fireEvent.change(screen.getByLabelText("Extra monthly payment"), {
      target: { value: "2000" },
    });
    clickCalculateSavings();
    await screen.findByText(/Something went wrong/);

    expect(scrollSpy).not.toHaveBeenCalled();
  });
});