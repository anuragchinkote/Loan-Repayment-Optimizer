import { formatINR } from "../utils/format";
import { Slider } from "./ui/slider";

interface ExtraPaymentSliderProps {
  value: number;
  baseInstalment: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const MAX_EXTRA = 25000;

const parseAmount = (value: string): number =>
  Number(value.replace(/[₹,\s]/g, ""));

export function ExtraPaymentSlider({ value, baseInstalment, onChange, disabled }: ExtraPaymentSliderProps) {
  const baseNum = parseAmount(baseInstalment);
  const totalNum = Number.isFinite(baseNum) ? baseNum + value : value;

  return (
    <div className="relative mb-5 border-2 border-primary-container bg-surface-container-low p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-primary">
            Focal Accelerator
          </span>
          <label
            htmlFor="extra-slider"
            className="mt-0.5 block font-headline-md text-headline-md font-semibold text-primary"
          >
            Extra monthly payment
          </label>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            How much more could you comfortably add to your current instalment each month?
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 border border-primary-container bg-surface-container-lowest px-3 py-1.5 text-right">
          <span className="font-metric-md text-metric-md font-bold tabular-nums text-primary-container" id="slider-display-badge">
            {formatINR(String(value), 0)}
          </span>
          <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">/ mo</span>
        </div>
      </div>

      <div className="py-3">
        <Slider
          id="extra-slider"
          min={0}
          max={MAX_EXTRA}
          step={500}
          value={value}
          disabled={disabled}
          onValueChange={onChange}
          aria-label="Extra monthly payment"
        />
        <div className="mt-2 flex justify-between font-mono font-label-sm text-label-sm text-on-surface-variant">
          <span>₹0 (None)</span>
          <span>₹10,000</span>
          <span>₹25,000 / mo</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 border border-outline-variant/60 bg-surface-container-lowest p-3 font-body-sm text-body-sm">
        <div>
          <span className="block font-label-sm text-label-sm uppercase text-on-surface-variant">
            Current instalment
          </span>
          <span className="tabular-nums text-on-surface">{formatINR(baseInstalment, 0)}</span>
        </div>
        <div>
          <span className="block font-label-sm text-label-sm uppercase text-on-surface-variant">
            Extra
          </span>
          <span className="tabular-nums text-primary-container">+{formatINR(String(value), 0)}</span>
        </div>
        <div>
          <span className="block font-label-sm text-label-sm uppercase text-on-surface-variant">
            Planned monthly
          </span>
          <span className="font-bold tabular-nums text-primary">
            {formatINR(String(totalNum), 0)}
          </span>
        </div>
      </div>

      <p className="mt-1 font-body-sm text-body-sm italic text-tertiary-container">
        Move the slider to see how a higher or lower extra payment could change your loan.
      </p>

      <div className="mt-4 border border-outline-variant/60 border-t bg-surface-container-lowest p-4 pt-4">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary-container">info</span>
          <h3 className="font-label-md text-label-md font-semibold uppercase tracking-wide text-primary">
            Why does paying extra help?
          </h3>
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          Your regular payment covers interest and principal. When you pay extra toward the
          principal, the outstanding balance can fall faster. A lower balance can mean less interest
          accumulating over the remaining loan. Try moving the slider to compare different repayment
          amounts.
        </p>
      </div>
    </div>
  );
}