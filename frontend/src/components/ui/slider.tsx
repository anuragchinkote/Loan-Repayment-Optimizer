import * as React from "react";
import { cn } from "../../lib/utils";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: number;
  onValueChange?: (value: number) => void;
  fillFrom?: string;
  fillTo?: string;
  trackColor?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value = 0,
      min = 0,
      max = 100,
      step = 1,
      onValueChange,
      fillFrom = "#115e59",
      fillTo = "#115e59",
      trackColor = "#bec9c7",
      disabled,
      ...props
    },
    ref,
  ) => {
    const numericMin = Number(min);
    const numericMax = Number(max);
    const span = numericMax - numericMin;
    const percent = span === 0 ? 0 : ((Number(value) - numericMin) / span) * 100;

    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onValueChange?.(Number(event.target.value));
        }}
        aria-valuetext={String(value)}
        className={cn("lp-range", className)}
        style={{
          background: `linear-gradient(to right, ${fillFrom} 0%, ${fillTo} ${percent}%, ${trackColor} ${percent}%, ${trackColor} 100%)`,
        }}
        {...props}
      />
    );
  },
);
Slider.displayName = "Slider";

export { Slider };