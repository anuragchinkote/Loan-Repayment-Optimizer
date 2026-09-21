import { describe, expect, it } from "vitest";
import type { ScheduleRow } from "../types/loan";
import {
  cumulativeInterest,
  domainValue,
  linearPoints,
  monthTicks,
  seriesEndValue,
  tickLabel,
  valueTicks,
} from "./chart";

function rows(months: number, interest = "1000"): ScheduleRow[] {
  const out: ScheduleRow[] = [];
  for (let i = 1; i <= months; i += 1) {
    out.push({
      month: i,
      opening_balance: "100000",
      payment: "2000",
      interest,
      principal: "1000",
      lump_sum: "0",
      closing_balance: "0.00",
    });
  }
  return out;
}

describe("cumulativeInterest", () => {
  it("accumulates interest across the schedule", () => {
    expect(cumulativeInterest(rows(3, "1000"))).toEqual([1000, 2000, 3000]);
  });
});

describe("seriesEndValue / domainValue", () => {
  it("uses the final cumulative value", () => {
    expect(seriesEndValue([10, 20, 30])).toBe(30);
    expect(seriesEndValue([])).toBe(0);
  });

  it("takes the larger of the two series as the domain", () => {
    expect(domainValue([[1, 2, 3], [5, 6]])).toBe(6);
    expect(domainValue([[], []])).toBe(1);
  });
});

describe("linearPoints (month spacing)", () => {
  it("places the first point at x=0 and the last at x=1", () => {
    const pts = linearPoints([0, 100, 200], 3, 200);
    expect(pts[0].x).toBe(0);
    expect(pts[pts.length - 1].x).toBe(1);
  });

  it("uses linear month spacing and monotonically increasing x", () => {
    const pts = linearPoints([0, 1, 2, 3, 4], 5, 4);
    expect(pts.map((p) => p.x)).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it("keeps the final value at y=0 and empty value at y=1", () => {
    const pts = linearPoints([400, 100, 0], 3, 400);
    expect(pts[0].y).toBe(0);
    expect(pts[2].y).toBe(1);
  });

  it("deals with a single-month loan without division by zero", () => {
    const pts = linearPoints([50], 1, 50);
    expect(pts[0].x).toBe(0);
    expect(pts[0].y).toBe(0);
  });
});

describe("monthTicks / tickLabel", () => {
  it("always includes Start and the final month", () => {
    const ticks = monthTicks(89);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBe(89);
  });

  it("uses roughly 2..6 year ticks for typical loans", () => {
    expect(monthTicks(180).length).toBeLessThanOrEqual(7);
    expect(monthTicks(480).filter((m) => m > 0 && m < 480).length).toBeGreaterThan(0);
  });

  it("labels Start and the payoff month clearly", () => {
    expect(tickLabel(0, 180)).toBe("Start");
    expect(tickLabel(180, 180)).toBe("180 mo");
    expect(tickLabel(60, 180)).toBe("Yr 5");
  });
});

describe("valueTicks", () => {
  it("spans from zero to the max value", () => {
    expect(valueTicks(400, 4)).toEqual([0, 100, 200, 300, 400]);
  });
});