import type { ScheduleRow } from "../types/loan";

export function cumulativeInterest(rows: ScheduleRow[]): number[] {
  let acc = 0;
  const out: number[] = [];
  for (const row of rows) {
    acc += Number(row.interest.replace(/,/g, ""));
    out.push(acc);
  }
  return out;
}

export function seriesEndValue(cumulative: number[]): number {
  const last = cumulative[cumulative.length - 1];
  return Number.isFinite(last) ? last : 0;
}

export function domainYears(series: number[][]): number {
  const months = Math.max(...series.map((s) => s.length), 1);
  return Math.max(1, months);
}

export function domainValue(series: number[][]): number {
  return Math.max(...series.map((s) => seriesEndValue(s)), 1);
}

export interface ChartPoint {
  x: number;
  y: number;
}

/** Normalize a cumulative-interest series onto a 0..1 plane (x = maturity, y = fraction of max). */
export function linearPoints(cum: number[], totalMonths: number, maxValue: number): ChartPoint[] {
  const span = Math.max(totalMonths - 1, 1);
  const denom = maxValue > 0 ? maxValue : 1;
  return cum.map((value, i) => ({
    x: i / span,
    y: 1 - value / denom,
  }));
}

function pickYearStep(totalMonths: number): number {
  const candidates = [12, 24, 36, 48, 60, 120, 240];
  for (const step of candidates) {
    if (totalMonths / step <= 5) return step;
  }
  return 240;
}

/** Year-boundary month positions for x-axis ticks, including Start (0) and the end. */
export function monthTicks(totalMonths: number): number[] {
  const step = pickYearStep(totalMonths);
  const ticks: number[] = [];
  for (let m = 0; m < totalMonths; m += step) ticks.push(m);
  ticks.push(totalMonths);
  return [...new Set(ticks)];
}

export function tickLabel(month: number, totalMonths: number): string {
  if (month === 0) return "Start";
  if (month === totalMonths) {
    return `${totalMonths} mo`;
  }
  return `Yr ${month / 12}`;
}

/** Evenly spaced vertical scale values from 0 to maxValue, inclusive. */
export function valueTicks(maxValue: number, count = 4): number[] {
  const out: number[] = [];
  for (let i = 0; i <= count; i += 1) out.push((maxValue * i) / count);
  return out;
}