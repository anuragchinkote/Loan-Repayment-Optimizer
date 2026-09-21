import type { FieldErrors, LoanInputs } from "../types/loan";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { groupIndian } from "../utils/format";

interface LoanFormProps {
  inputs: LoanInputs;
  errors: FieldErrors | null;
  onChange: (next: LoanInputs) => void;
}

export function LoanForm({ inputs, errors, onChange }: LoanFormProps) {
  const setBalance = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    onChange({ ...inputs, balance: digits ? groupIndian(digits) : "" });
  };
  const setRate = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const [int, dec] = cleaned.split(".");
    const value = dec !== undefined ? `${int.slice(0, 4)}.${dec.slice(0, 2)}` : int.slice(0, 4);
    onChange({ ...inputs, rate: value });
  };
  const setTenure = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "").slice(0, 4);
    onChange({ ...inputs, tenure: digits });
  };
  const setInstalment = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    onChange({ ...inputs, instalment: digits ? groupIndian(digits) : "" });
  };

  return (
    <div className="border-b border-outline-variant pb-8 mb-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md tracking-tight text-primary">Your loan</h2>
        <span className="border border-outline-variant bg-surface-container-low px-2 py-0.5 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
          Base Parameters
        </span>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="loan-balance">Outstanding loan balance</Label>
          <div
            className={cn(
              "flex border border-outline-variant focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container",
              errors?.balance && "border-error focus-within:border-error focus-within:ring-error",
            )}
          >
            <span className="inline-flex items-center border-r border-outline-variant bg-surface-container-low px-4 font-label-md text-label-md font-semibold text-on-surface-variant">
              ₹
            </span>
            <Input
              id="loan-balance"
              className="tabular-nums"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 600000"
              value={inputs.balance}
              onChange={(e) => setBalance(e.target.value)}
              aria-invalid={Boolean(errors?.balance)}
              aria-describedby={errors?.balance ? "balance-error" : "balance-helper"}
            />
          </div>
          {errors?.balance ? (
            <p id="balance-error" role="alert" className="mt-1 font-body-sm text-body-sm text-error">
              {errors.balance}
            </p>
          ) : (
            <p id="balance-helper" className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Total remaining principal balance on your existing loan account.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="loan-rate">Annual interest rate</Label>
            <div
              className={cn(
                "flex border border-outline-variant focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container",
                errors?.rate && "border-error focus-within:border-error focus-within:ring-error",
              )}
            >
              <Input
                id="loan-rate"
                className="tabular-nums"
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 10"
                value={inputs.rate}
                onChange={(e) => setRate(e.target.value)}
                aria-invalid={Boolean(errors?.rate)}
                aria-describedby={errors?.rate ? "rate-error" : "rate-helper"}
              />
              <span className="inline-flex items-center border-l border-outline-variant bg-surface-container-low px-3 font-label-md text-label-md font-semibold text-on-surface-variant">
                %
              </span>
            </div>
            {errors?.rate ? (
              <p id="rate-error" role="alert" className="mt-1 font-body-sm text-body-sm text-error">
                {errors.rate}
              </p>
            ) : (
              <p id="rate-helper" className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                Fixed annual rate of interest.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="loan-tenure">Tenure</Label>
            <div
              className={cn(
                "flex border border-outline-variant focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container",
                errors?.tenure && "border-error focus-within:border-error focus-within:ring-error",
              )}
            >
              <Input
                id="loan-tenure"
                className="tabular-nums"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 144"
                value={inputs.tenure}
                onChange={(e) => setTenure(e.target.value)}
                aria-invalid={Boolean(errors?.tenure)}
                aria-describedby={errors?.tenure ? "tenure-error" : "tenure-helper"}
              />
              <span className="inline-flex items-center border-l border-outline-variant bg-surface-container-low px-3 font-label-md text-label-md font-semibold text-on-surface-variant">
                Months
              </span>
            </div>
            {errors?.tenure ? (
              <p id="tenure-error" role="alert" className="mt-1 font-body-sm text-body-sm text-error">
                {errors.tenure}
              </p>
            ) : (
              <p id="tenure-helper" className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                Remaining tenure in months.
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="loan-instalment">Current required monthly instalment</Label>
          <div
            className={cn(
              "flex border border-outline-variant focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container",
              errors?.instalment && "border-error focus-within:border-error focus-within:ring-error",
            )}
          >
            <span className="inline-flex items-center border-r border-outline-variant bg-surface-container-low px-4 font-label-md text-label-md font-semibold text-on-surface-variant">
              ₹
            </span>
            <Input
              id="loan-instalment"
              className="tabular-nums"
              inputMode="numeric"
              autoComplete="off"
              placeholder="e.g. 8,500"
              value={inputs.instalment}
              onChange={(e) => setInstalment(e.target.value)}
              aria-invalid={Boolean(errors?.instalment)}
              aria-describedby={errors?.instalment ? "instalment-error" : "instalment-helper"}
            />
          </div>
          {errors?.instalment ? (
            <p id="instalment-error" role="alert" className="mt-1 font-body-sm text-body-sm text-error">
              {errors.instalment}
            </p>
          ) : (
            <p id="instalment-helper" className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              The payment you actually make each month today. LoanPilot models your current loan from
              this amount, so the projected payoff time may differ from the lender's stated tenure.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}