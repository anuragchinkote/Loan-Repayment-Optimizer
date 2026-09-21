import { formatYearsShort } from "../utils/format";
import { Slider } from "./ui/slider";

interface TargetTermProps {
  value: number;
  maxMonth: number;
  currentPayoff?: number | null;
  onChange: (value: number) => void;
}

export function TargetTerm({ value, maxMonth, currentPayoff, onChange }: TargetTermProps) {
  const min = maxMonth >= 6 ? 6 : 1;
  const clamped = Math.min(maxMonth, Math.max(min, value));
  const mid = Math.max(min, Math.round(maxMonth / 2));

  return (
    <div className="relative mb-5 border-2 border-primary-container bg-surface-container-low p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-primary">
            Focal Accelerator
          </span>
          <label
            htmlFor="target-slider"
            className="mt-0.5 block font-headline-md text-headline-md font-semibold text-primary"
          >
            Target payoff term
          </label>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            Pick the month by which you would like the loan paid off.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 border border-primary-container bg-surface-container-lowest px-3 py-1.5 text-right">
          <span className="font-metric-md text-metric-md font-bold tabular-nums text-primary-container" id="target-display-badge">
            {clamped} mo
          </span>
          <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
            ({formatYearsShort(clamped)})
          </span>
        </div>
      </div>

      <div className="py-3">
        <Slider
          id="target-slider"
          min={min}
          max={maxMonth}
          step={1}
          value={value}
          onValueChange={onChange}
          aria-label="Target payoff term in months"
        />
        <div className="mt-2 flex justify-between font-mono font-label-sm text-label-sm text-on-surface-variant">
          <span>{min} mo</span>
          <span>{mid} mo</span>
          <span>{maxMonth} mo (tenure)</span>
        </div>
      </div>

      {currentPayoff != null && currentPayoff > 0 && (
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Your current loan pays off in about {currentPayoff} months. Choose a term below that to
          finish sooner (and pay more each month), or above it to pay less each month.
        </p>
      )}

      <p className="mt-1 font-body-sm text-body-sm italic text-tertiary-container">
        LoanPilot computes the monthly payment needed to finish in your chosen term.
      </p>

      <div className="mt-4 border border-outline-variant/60 border-t bg-surface-container-lowest p-4 pt-4">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary-container">info</span>
          <h3 className="font-label-md text-label-md font-semibold uppercase tracking-wide text-primary">
            How target terms work
          </h3>
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          Instead of choosing an extra amount, set the month by which you want the loan cleared.
          LoanPilot works out the monthly payment it takes to reach a zero balance in that time —
          it may be higher or lower than your current instalment — and shows you the honest
          comparison against continuing to pay as you do today.
        </p>
      </div>
    </div>
  );
}