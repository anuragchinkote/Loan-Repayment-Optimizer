import { useState } from "react";
import type { LoanResultData, ScheduleRow } from "../types/loan";
import { compactINR, formatINR } from "../utils/format";
import { cn } from "../lib/utils";

const INITIAL_ROWS = 24;

interface RepaymentScheduleProps {
  strategy: LoanResultData;
}

export function RepaymentSchedule({ strategy }: RepaymentScheduleProps) {
  const [expanded, setExpanded] = useState(false);
  const rows = strategy.schedule;
  if (rows.length === 0) return null;

  const hasLumpRows = rows.some((row) => toNum(row.lump_sum) > 0);
  const finalRow = rows[rows.length - 1];
  const preview = expanded ? rows : rows.slice(0, INITIAL_ROWS);
  const showFinalPill = !expanded && rows.length > INITIAL_ROWS && rows.length > 1;

  return (
    <div className="mb-6 border border-outline-variant">
      <details className="group" open={expanded} onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}>
        <summary className="flex cursor-pointer items-center justify-between bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-low">
          <div>
            <span className="font-headline-md text-headline-md font-medium tracking-tight text-primary">
              Repayment schedule
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              See how each payment affects interest and principal over time.
            </p>
          </div>
          <span className="material-symbols-outlined text-primary transition-transform group-open:rotate-180">
            expand_more
          </span>
        </summary>
        <div className="overflow-x-auto border-t border-outline-variant bg-surface-container-lowest p-3">
          <table className="w-full text-left font-body-sm text-body-sm">
            <thead>
              <tr className="border-b border-outline-variant font-label-sm uppercase text-on-surface-variant">
                <th className="px-2 py-2">Month</th>
                <th className="px-2 py-2 text-right">Payment</th>
                <th className="px-2 py-2 text-right">Interest</th>
                <th className="px-2 py-2 text-right">Principal</th>
                {hasLumpRows && <th className="px-2 py-2 text-right">Lump sum</th>}
                <th className="px-2 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50 tabular-nums">
              {preview.map((row) => (
                <RowRow key={row.month} row={row} hasLumpColumn={hasLumpRows} />
              ))}
              {showFinalPill && (
                <tr>
                  <td colSpan={hasLumpRows ? 6 : 5} className="px-2 py-2 text-center font-medium text-on-surface-variant">
                    … {rows.length - INITIAL_ROWS} more months …
                  </td>
                </tr>
              )}
              {showFinalPill && <RowRow row={finalRow} hasLumpColumn={hasLumpRows} />}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

const toNum = (value: string): number => Number(value.replace(/,/g, ""));

function RowRow({ row, hasLumpColumn }: { row: ScheduleRow; hasLumpColumn: boolean }) {
  const lump = toNum(row.lump_sum);
  const isFinal = toNum(row.closing_balance) === 0;
  return (
    <tr className={cn("transition-colors", (lump > 0 || isFinal) && "bg-surface-container-low/60 font-bold text-primary")}>
      <td className="px-2 py-2 font-medium">
        Month {row.month}
        {lump > 0 && (
          <span className="ml-1 bg-secondary-container px-1.5 py-0.5 text-[10px] font-semibold uppercase text-on-secondary-container">
            +{compactINR(row.lump_sum)} lump
          </span>
        )}
        {isFinal && <span className="ml-1 text-[10px] uppercase opacity-80">(Final)</span>}
      </td>
      <td className="px-2 py-2 text-right">{formatINR(row.payment, 0)}</td>
      <td className="px-2 py-2 text-right">{formatINR(row.interest, 0)}</td>
      <td className="px-2 py-2 text-right">{formatINR(row.principal, 0)}</td>
      {hasLumpColumn && <td className="px-2 py-2 text-right">{formatINR(row.lump_sum, 0)}</td>}
      <td className="px-2 py-2 text-right">{formatINR(row.closing_balance, 0)}</td>
    </tr>
  );
}