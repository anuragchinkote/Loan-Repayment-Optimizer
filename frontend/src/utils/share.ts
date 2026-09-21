import { PUBLIC_URL } from "../config";
import { formatINR, formatYearsShort } from "./format";
import type { LoanInputs, LoanPlanResponse } from "../types/loan";

function inputsLine(inputs: LoanInputs): string {
  const rate = inputs.rate.trim() || "—";
  return (
    `Loan: ${formatINR(inputs.balance, 0)} at ${rate}% over the lender's stated ` +
    `${inputs.tenure.trim() || "—"} mo tenure; current instalment ${formatINR(inputs.instalment, 0)}/mo`
  );
}

export function buildResultsShareText(inputs: LoanInputs, result: LoanPlanResponse): string {
  const { baseline, strategy, comparison } = result;
  const isPlanActive =
    Number(strategy.monthly_payment) !== Number(baseline.monthly_payment) ||
    strategy.number_of_months !== baseline.number_of_months;

  const lines: string[] = [
    "Here's how my loan compares on LoanPilot:",
    "",
    "CURRENT PLAN",
    `Monthly instalment: ${formatINR(baseline.monthly_payment, 0)}/mo`,
    `Amount paid: ${formatINR(baseline.total_payment, 0)}`,
    `Interest paid: ${formatINR(baseline.total_interest, 0)}`,
    `Paid off in: ${baseline.number_of_months} mo (${formatYearsShort(baseline.number_of_months)})`,
  ];

  if (isPlanActive) {
    lines.push("");
    lines.push("NEW PLAN");
    lines.push(`Monthly payment: ${formatINR(strategy.monthly_payment, 0)}/mo`);
    lines.push(`Amount paid: ${formatINR(strategy.total_payment, 0)}`);
    lines.push(`Interest paid: ${formatINR(strategy.total_interest, 0)}`);
    lines.push(
      `Paid off in: ${strategy.number_of_months} mo (${formatYearsShort(strategy.number_of_months)})`,
    );
    lines.push("");
    lines.push(
      `Interest ${Number(comparison.interest_saved) >= 0 ? "saved" : "increase"}: ` +
        `${formatINR(comparison.interest_saved, 0)}`,
    );
    lines.push(
      `Time ${comparison.months_saved >= 0 ? "saved" : "added"}: ` +
        `${Math.abs(comparison.months_saved)} mo`,
    );
  }

  lines.push("");
  lines.push(inputsLine(inputs));
  lines.push("");
  lines.push("Estimates only — not financial advice.");
  lines.push(`Try LoanPilot: ${PUBLIC_URL}`);
  return lines.join("\n");
}

export function buildCalculatorShareText(): string {
  return [
    "I use LoanPilot to see how extra loan payments could reduce interest and payoff time.",
    "No sign-up, no data stored — just honest estimates.",
    "",
    `Try LoanPilot: ${PUBLIC_URL}`,
  ].join("\n");
}

export function openWhatsApp(message: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}