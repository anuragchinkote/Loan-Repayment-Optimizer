import type { LoanInputs, LoanPlanResponse, RepaymentMode } from "../types/loan";
import { formatINR, formatYears, formatYearsShort } from "../utils/format";
import { cn } from "../lib/utils";
import { InterestChart } from "./InterestChart";
import { RepaymentSchedule } from "./RepaymentSchedule";
import { ShareActions } from "./ShareActions";
import type { ApiErrorInfo } from "../services/api";

export type PlanStatus = "idle" | "loading" | "updating";

const absNum = (value: string): number => Math.abs(Number(value));

interface ResultsPlaceholderProps {
  status: PlanStatus;
  error: ApiErrorInfo | null;
  badgeText: string;
  badgeFlash: boolean;
}

export function ResultsPlaceholder({ status, error, badgeText, badgeFlash }: ResultsPlaceholderProps) {
  return (
    <div className="border border-outline-variant bg-surface-container-lowest p-6 md:p-8">
      <div className="mb-6 flex flex-col justify-between gap-2 border-b border-outline-variant pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-primary">
            Your repayment comparison
          </h2>
          <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
            Compared with continuing your current repayment plan.
          </p>
        </div>
        <Badge text={badgeText} flash={badgeFlash} error={error} status={status} noResult />
      </div>
      <div className="flex flex-col items-center gap-4 border-2 border-dashed border-outline-variant p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-outline">query_stats</span>
        {status === "loading" ? (
          <>
            <h3 className="font-headline-md text-headline-md tracking-tight text-primary">
              Working out the numbers…
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              LoanPilot is building your current loan projection.
            </p>
          </>
        ) : (
          <>
            {error ? (
              <>
                <h3 className="font-headline-md text-headline-md tracking-tight text-primary">
                  We could not calculate your loan
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {error.message}
                </p>
              </>
            ) : (
              <>
                <h3 className="font-headline-md text-headline-md tracking-tight text-primary">
                  Your current plan summary will appear here
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Enter your loan details and hit “Calculate” to see your current projected payoff,
                  amount paid, and interest paid.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface CurrentPlanPanelProps {
  result: LoanPlanResponse;
  tenureMonths: number;
  stale: boolean;
}

export function CurrentPlanPanel({ result, tenureMonths, stale }: CurrentPlanPanelProps) {
  const baseline = result.baseline;
  const instalment = baseline.monthly_payment;
  const standard = result.standard_monthly_instalment ?? null;

  let warning: string | null = null;
  if (!stale && standard && standard !== instalment) {
    const inst = Number(instalment);
    const std = Number(standard);
    if (inst < std) {
      warning =
        `Your instalment (${formatINR(instalment, 0)}) is below the standard instalment ` +
        `(${formatINR(standard, 0)}) that would clear this loan in the lender's stated tenure of ` +
        `${tenureMonths} months. The model therefore projects a longer payoff at the current rate.`;
    } else {
      warning =
        `Your instalment (${formatINR(instalment, 0)}) is above the standard instalment ` +
        `(${formatINR(standard, 0)}) for the lender's stated tenure of ${tenureMonths} months, ` +
        `so the model projects an earlier payoff.`;
    }
  }

  return (
    <div className="border border-outline-variant bg-surface-container-lowest p-6 md:p-8" id="current-plan-card">
      <div className="mb-5 flex flex-col justify-between gap-2 border-b border-outline-variant pb-4 sm:flex-row sm:items-baseline">
        <div>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-primary">
            Your Current Plan
          </h2>
          <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
            Projected from the instalment you pay today.
          </p>
        </div>
        <span className="whitespace-nowrap border border-outline-variant bg-surface-container-low px-2.5 py-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          Stage A — Baseline
        </span>
      </div>

      {stale && (
        <div className="mb-6 border border-outline-variant bg-surface-container-low p-3 font-body-sm text-body-sm text-on-surface-variant">
          Your loan details have changed since this summary was calculated. Press “Calculate” to
          refresh it.
        </div>
      )}

      {warning && (
        <div
          role="note"
          className="mb-6 border border-tertiary-container bg-tertiary-container/40 p-4 font-body-sm text-body-sm leading-relaxed text-on-surface-variant"
        >
          <p className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base text-tertiary">info</span>
            <span>{warning}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <MetricStat
          label="Monthly instalment"
          value={formatINR(instalment, 0)}
          sub="what you pay each month"
        />
        <MetricStat
          label="Amount paid"
          value={formatINR(baseline.total_payment, 0)}
          sub="total cash over the life"
        />
        <MetricStat
          label="Interest paid"
          value={formatINR(baseline.total_interest, 0)}
          sub="of that amount"
        />
        <MetricStat
          label="Paid off in"
          value={`${baseline.number_of_months} mo`}
          sub={formatYearsShort(baseline.number_of_months).replace(" ", "")}
        />
      </div>
    </div>
  );
}

function MetricStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="min-w-0 border border-outline-variant bg-surface-container-low p-4">
      <span className="mb-1 block font-label-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <span className="mb-0.5 block min-w-0 whitespace-nowrap font-headline-sm text-headline-sm font-serif tabular-nums text-primary sm:text-headline-md lg:text-headline-lg">
        {value}
      </span>
      <span className="block font-body-sm text-body-sm text-on-surface-variant">{sub}</span>
    </div>
  );
}

function Badge({
  text,
  flash,
  error,
  status,
  noResult,
}: {
  text: string;
  flash: boolean;
  error: ApiErrorInfo | null;
  status: PlanStatus;
  noResult?: boolean;
}) {
  const updating = status === "updating" || (status === "loading" && !noResult);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-primary-container bg-surface-container-low px-2.5 py-1 font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary-container",
        flash && "border-primary bg-primary text-on-primary",
        error && "border-error bg-error-container text-on-error-container",
      )}
      id="update-badge"
      role="status"
    >
      {updating ? (
        <>
          <span className="material-symbols-outlined text-sm animate-spin">sync</span>
          Updating comparison…
        </>
      ) : (
        <>
          <span className="material-symbols-outlined">{error ? "error" : "check_circle"}</span>
          {error ? "Update failed — showing last result" : text}
        </>
      )}
    </span>
  );
}

interface NewPlanPanelProps {
  result: LoanPlanResponse;
  status: PlanStatus;
  error: ApiErrorInfo | null;
  badgeText: string;
  badgeFlash: boolean;
  mode: RepaymentMode | null;
  extra: number;
  targetMonths: number;
  inputs: LoanInputs;
  hasLumps: boolean;
  strategyActive: boolean;
}

export function NewPlanPanel(props: NewPlanPanelProps) {
  const { result, status, error, badgeText, badgeFlash, strategyActive } = props;

  return (
    <div className="border border-outline-variant bg-surface-container-lowest p-6 md:p-8" id="plan-card">
      <div className="mb-6 flex flex-col justify-between gap-2 border-b border-outline-variant pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-headline-lg text-headline-lg tracking-tight text-primary">
            Your Repayment Strategy
          </h2>
          <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">
            Compared with your current plan above.
          </p>
        </div>
        <Badge text={badgeText} flash={badgeFlash} error={error} status={status} />
      </div>

      {error && (
        <div role="alert" className="mb-6 border border-error/40 bg-error-container p-4 text-on-error-container">
          <p className="flex items-start gap-2 font-body-md text-body-md">
            <span className="material-symbols-outlined text-base">warning</span>
            <span>
              <strong>Something went wrong:</strong> {error.message}
            </span>
          </p>
        </div>
      )}

      {!strategyActive ? (
        <div className="flex flex-col items-center gap-4 border-2 border-dashed border-outline-variant p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-outline">tune</span>
          <h3 className="font-headline-md text-headline-md tracking-tight text-primary">
            Your plan comparison appears once you configure a strategy
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Use the panel on the left to pick “Extra monthly + lump sums” or “Target payoff term”,
            adjust its controls, then press “Calculate Savings”. Your current plan stays visible
            above so you can compare honestly.
          </p>
        </div>
      ) : (
        <PlanComparison
          baseline={result.baseline}
          strategy={result.strategy}
          comparison={result.comparison}
          mode={props.mode}
          extra={props.extra}
          targetMonths={props.targetMonths}
          inputs={props.inputs}
          hasLumps={props.hasLumps}
          result={result}
        />
      )}
    </div>
  );
}

function PlanComparison({
  baseline,
  strategy,
  comparison,
  mode,
  extra,
  targetMonths,
  inputs,
  hasLumps,
  result,
}: {
  baseline: LoanPlanResponse["baseline"];
  strategy: LoanPlanResponse["strategy"];
  comparison: LoanPlanResponse["comparison"];
  mode: RepaymentMode | null;
  extra: number;
  targetMonths: number;
  inputs: LoanInputs;
  hasLumps: boolean;
  result: LoanPlanResponse;
}) {
  const saved = Number(comparison.interest_saved);
  const monthsSaved = comparison.months_saved;
  const unchanged =
    mode === "extra" && extra === 0 && !hasLumps;

  const additionalMonthly = Number(strategy.monthly_payment) - Number(baseline.monthly_payment);

  return (
    <>
      {unchanged && (
        <p className="mb-4 border border-outline-variant bg-surface-container-low p-3 font-body-sm text-body-sm text-on-surface-variant">
          No extra payment or lump sum configured yet — your plan currently matches your current
          loan. Move the slider or add a lump sum to see a real change.
        </p>
      )}

      <div className="mb-6 border-2 border-primary-container bg-surface-container-low p-6">
        <span className="mb-1 block font-label-md text-label-md font-bold uppercase tracking-wider text-primary">
          {saved > 0
            ? "Potential interest saved"
            : saved < 0
              ? "Interest vs your current loan"
              : "Interest vs your current loan"}
        </span>
        <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span
            className="break-words font-headline-lg text-headline-lg font-serif tracking-tight tabular-nums text-primary-container sm:text-display-hero"
            id="hero-savings"
          >
            {formatINR(String(absNum(comparison.interest_saved)), 0)}
          </span>
          <span className="font-label-md text-label-md font-semibold uppercase tracking-wider text-primary">
            {saved > 0 ? "less interest" : saved < 0 ? "more interest" : "no change"}
          </span>
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          The estimated difference in total interest between your current loan and the selected
          plan. Estimates are based on the information you entered.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="border border-outline-variant bg-surface-container-lowest p-4">
          <span className="mb-1 block font-label-md text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
            Time saved
          </span>
          <span className="mb-1 block font-headline-md text-headline-md font-serif tabular-nums text-primary" id="time-saved-val">
            {monthsSaved > 0
              ? `${monthsSaved} months`
              : monthsSaved < 0
                ? `Takes ${absNum(String(monthsSaved))} months longer`
                : "Same time"}
            <span className="font-body-md text-body-md font-sans text-on-surface-variant">
              {" "}
              {formatYears(monthsSaved)}
            </span>
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Compared with continuing your current instalment.
          </p>
        </div>
        <div className="border border-outline-variant bg-surface-container-lowest p-4">
          <span className="mb-1 block font-label-md text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
            New payoff time
          </span>
          <span className="mb-1 block font-headline-md text-headline-md font-serif tabular-nums text-primary" id="payoff-time-val">
            {strategy.number_of_months} months{" "}
            <span className="font-body-md text-body-md font-sans text-on-surface-variant">
              {formatYears(strategy.number_of_months)}
            </span>
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Estimated time remaining under your selected repayment plan.
          </p>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto border border-outline-variant">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Comparison of amount paid, interest paid, and payoff time between your current plan and
            your new plan.
          </caption>
          <thead>
            <tr className="border-b-2 border-primary bg-surface-container-low">
              <th className="px-3 py-2.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
                Metric
              </th>
              <th className="px-3 py-2.5 text-right font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Current Plan
              </th>
              <th className="px-3 py-2.5 text-right font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary">
                New Plan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-body-md text-body-md">
            <tr className="bg-surface-container-lowest">
              <td className="px-3 py-2.5 font-medium text-on-surface">Monthly payment</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-on-surface-variant">
                {formatINR(baseline.monthly_payment, 0)}
              </td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums text-primary" id="table-payment-val">
                {formatINR(strategy.monthly_payment, 0)}
                {additionalMonthly !== 0 && (
                  <span className="font-label-sm text-label-sm font-normal text-primary">
                    {" "}
                    ({additionalMonthly > 0 ? "+" : "−"}
                    {formatINR(String(absNum(String(additionalMonthly))), 0)})
                  </span>
                )}
              </td>
            </tr>
            <tr className="bg-surface-container-low/50">
              <td className="px-3 py-2.5 font-medium text-on-surface">Amount paid</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-on-surface-variant">
                {formatINR(baseline.total_payment, 0)}
              </td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums text-primary" id="table-cash-val">
                {formatINR(strategy.total_payment, 0)}
              </td>
            </tr>
            <tr className="bg-surface-container-lowest">
              <td className="px-3 py-2.5 font-medium text-on-surface">Interest paid</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-on-surface-variant">
                {formatINR(baseline.total_interest, 0)}
              </td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums text-primary" id="table-interest-val">
                {formatINR(strategy.total_interest, 0)}
              </td>
            </tr>
            <tr className="bg-surface-container-low/50">
              <td className="px-3 py-2.5 font-medium text-on-surface">Paid off in</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-on-surface-variant">
                {baseline.number_of_months} mo ({formatYearsShort(baseline.number_of_months)})
              </td>
              <td className="px-3 py-2.5 text-right font-bold tabular-nums text-primary" id="table-payoff-val">
                {strategy.number_of_months} mo ({formatYearsShort(strategy.number_of_months)})
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="border border-outline-variant bg-surface-container-lowest p-3">
          <span className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Interest saved
          </span>
          <span className="block whitespace-nowrap font-headline-sm text-headline-sm font-serif tabular-nums text-primary sm:text-headline-md" id="diff-interest">
            {saved < 0 ? "−" : ""}{formatINR(String(absNum(comparison.interest_saved)), 0)}
          </span>
        </div>
        <div className="border border-outline-variant bg-surface-container-lowest p-3">
          <span className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Time saved
          </span>
          <span className="block font-headline-md text-headline-md font-serif tabular-nums text-primary" id="diff-time">
            {monthsSaved < 0 ? "−" : ""}{absNum(String(monthsSaved))} mo
          </span>
        </div>
        <div className="border border-outline-variant bg-surface-container-lowest p-3">
          <span className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Change in monthly payment
          </span>
          <span className="block font-headline-md text-headline-md font-serif tabular-nums text-primary" id="diff-monthly">
            {additionalMonthly < 0 ? "−" : "+"}{formatINR(String(absNum(String(additionalMonthly))), 0)}
          </span>
        </div>
      </div>

      <InterestChart baseline={baseline} strategy={strategy} />

      <RepaymentSchedule strategy={strategy} />

      <ShareActions
        mode={mode}
        extra={extra}
        targetMonths={targetMonths}
        inputs={inputs}
        result={result}
      />
    </>
  );
}