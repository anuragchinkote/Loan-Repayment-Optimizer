import type { LoanResultData } from "../types/loan";
import { compactINR, formatINR } from "../utils/format";
import {
  cumulativeInterest,
  domainValue,
  domainYears,
  linearPoints,
  monthTicks,
  tickLabel,
  valueTicks,
} from "../utils/chart";

const W = 560;
const H = 300;
const PAD_L = 84;
const PAD_R = 16;
const PAD_T = 14;
const PAD_B = 30;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

interface InterestChartProps {
  baseline: LoanResultData;
  strategy: LoanResultData;
}

export function InterestChart({ baseline, strategy }: InterestChartProps) {
  if (baseline.schedule.length === 0 || strategy.schedule.length === 0) return null;

  const baseCum = cumulativeInterest(baseline.schedule);
  const stratCum = cumulativeInterest(strategy.schedule);
  const totalMonths = domainYears([baseCum, stratCum]);
  const maxValue = domainValue([baseCum, stratCum]);

  const toCanvas = (p: { x: number; y: number }) => ({
    x: PAD_L + p.x * PLOT_W,
    y: PAD_T + p.y * PLOT_H,
  });

  const pathFor = (cum: number[]): string =>
    linearPoints(cum, totalMonths, maxValue)
      .map(toCanvas)
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");

  const basePath = pathFor(baseCum);
  const stratPath = pathFor(stratCum);
  const baseEnd = toCanvas(linearPoints(baseCum, totalMonths, maxValue)[baseCum.length - 1]);
  const stratPts = linearPoints(stratCum, totalMonths, maxValue);
  const stratEnd = toCanvas(stratPts[stratPts.length - 1]);

  const xTicks = monthTicks(totalMonths);
  const yTicks = valueTicks(maxValue, 4);

  const baseTotal = formatINR(String(Math.round(baseCum[baseCum.length - 1])), 0);
  const stratTotal = formatINR(String(Math.round(stratCum[stratCum.length - 1])), 0);

  return (
    <div className="mb-6 border border-outline-variant bg-surface-container-lowest p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-headline-md text-headline-md tracking-tight text-primary">
          Interest paid over time
        </h3>
        <div className="flex items-center gap-4 font-label-sm text-label-sm uppercase">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-outline" aria-hidden="true" />
            <span className="whitespace-nowrap text-on-surface-variant">Current Plan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-3 bg-primary-container" aria-hidden="true" />
            <span className="whitespace-nowrap font-bold text-primary">New Plan</span>
          </div>
        </div>
      </div>
      <p className="mb-4 font-body-sm text-body-sm text-on-surface-variant">
        Cumulative interest from the repayment schedule, month by month. Your New Plan line ends
        wherever the loan is actually paid off.
      </p>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Interest paid over time. Current Plan: ${baseTotal} total interest over ${baseline.schedule.length} months. New Plan: ${stratTotal} total interest over ${strategy.schedule.length} months.`}
        >
          {yTicks.map((value) => {
            const y = PAD_T + (1 - value / maxValue) * PLOT_H;
            const isAxis = value === 0;
            return (
              <line
                key={`y-${value}`}
                x1={PAD_L}
                y1={y}
                x2={W - PAD_R}
                y2={y}
                stroke="#bec9c7"
                strokeWidth={isAxis ? 1.25 : 0.75}
                strokeDasharray={isAxis ? undefined : "2 2"}
              />
            );
          })}

          {xTicks.map((month) => {
            const x = PAD_L + (month / totalMonths) * PLOT_W;
            const isEnd = month === totalMonths;
            return (
              <line
                key={`x-${month}`}
                x1={x}
                y1={PAD_T}
                x2={x}
                y2={H - PAD_B}
                stroke="#bec9c7"
                strokeWidth={isEnd ? 1.25 : 0.5}
                strokeDasharray={isEnd ? undefined : "2 2"}
              />
            );
          })}

          <path d={basePath} fill="none" stroke="#6f7977" strokeWidth="2.5" strokeLinejoin="round">
            <title>
              {`Current Plan: ${baseTotal} total interest over ${baseline.schedule.length} months`}
            </title>
          </path>
          <circle cx={baseEnd.x} cy={baseEnd.y} r="4" fill="#6f7977">
            <title>
              {`Current Plan paid off in ${baseline.schedule.length} months with ${baseTotal} interest`}
            </title>
          </circle>

          <path
            d={stratPath}
            fill="none"
            stroke="#115e59"
            strokeWidth="3"
            strokeLinejoin="round"
            id="svg-plan-path"
          >
            <title>
              {`New Plan: ${stratTotal} total interest over ${strategy.schedule.length} months`}
            </title>
          </path>
          <line
            x1={stratEnd.x}
            y1={stratEnd.y}
            x2={stratEnd.x}
            y2={PAD_T + 4}
            stroke="#115e59"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <circle
            cx={stratEnd.x}
            cy={stratEnd.y}
            r="4.5"
            fill="#115e59"
            stroke="#ffffff"
            strokeWidth="1.5"
            id="svg-plan-end"
          >
            <title>
              {`New Plan paid off in ${strategy.schedule.length} months with ${stratTotal} interest`}
            </title>
          </circle>
        </svg>

        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          {yTicks.map((value) => {
            const y = PAD_T + (1 - value / maxValue) * PLOT_H;
            if (value === 0) return null;
            return (
              <span
                key={`yl-${value}`}
                className="absolute -translate-y-1/2 text-right font-mono text-[10px] text-on-surface-variant"
                style={{ left: `${(4 / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(PAD_L - 12) / W * 100}%` }}
              >
                {compactINR(String(Math.round(value)))}
              </span>
            );
          })}
          <span
            className="absolute -translate-y-1/2 text-right font-mono text-[10px] text-on-surface-variant"
            style={{ left: `${(4 / W) * 100}%`, top: `${((PAD_T + PLOT_H) / H) * 100}%`, width: `${(PAD_L - 12) / W * 100}%` }}
          >
            ₹0
          </span>

          {xTicks.map((month) => {
            const x = PAD_L + (month / totalMonths) * PLOT_W;
            return (
              <span
                key={`xl-${month}`}
                className="absolute -translate-x-1/2 text-center font-mono text-[10px] text-on-surface-variant"
                style={{ left: `${(x / W) * 100}%`, top: `${((H - PAD_B + 8) / H) * 100}%` }}
              >
                {tickLabel(month, totalMonths)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}