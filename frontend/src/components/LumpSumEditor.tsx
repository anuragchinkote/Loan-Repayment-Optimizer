import { useState } from "react";
import type { LumpSumDraft } from "../types/loan";
import { formatINR, groupIndian } from "../utils/format";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

interface LumpSumEditorProps {
  lumps: LumpSumDraft[];
  maxMonth: number;
  onUpsert: (lump: LumpSumDraft) => void;
  onRemove: (id: string) => void;
}

type EditingState = { id: string; month: string; amount: string } | null;

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `lump-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function LumpSumEditor({ lumps, maxMonth, onUpsert, onRemove }: LumpSumEditorProps) {
  const [editing, setEditing] = useState<EditingState>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const startAdd = () => {
    setLocalError(null);
    setEditing({ id: newId(), month: "", amount: "" });
  };

  const startEdit = (lump: LumpSumDraft) => {
    setLocalError(null);
    setEditing({ id: lump.id, month: String(lump.month), amount: lump.amount });
  };

  const setAmount = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    setEditing((prev) => (prev ? { ...prev, amount: digits ? groupIndian(digits) : "" } : prev));
  };

  const setMonth = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "").slice(0, 4);
    setEditing((prev) => (prev ? { ...prev, month: digits } : prev));
  };

  const save = () => {
    if (!editing) return;
    const month = Number(editing.month);
    const amountNum = Number(editing.amount.replace(/[₹,\s]/g, ""));
    if (!Number.isFinite(month) || month < 1 || month > maxMonth) {
      setLocalError(`Choose a month between 1 and ${maxMonth}.`);
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setLocalError("Enter an amount greater than ₹0.");
      return;
    }
    onUpsert({
      id: editing.id,
      month,
      amount: String(amountNum),
    });
    setEditing(null);
  };

  const editingMonthTooLarge = editing !== null && Number(editing.month) > maxMonth;

  const renderEditForm = () => {
    if (!editing) return null;
    return (
      <div
        className="border border-primary-container bg-surface-container-low p-3"
        role="group"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`lump-month-${editing.id}`}>Month</Label>
            <div className="flex border border-outline-variant focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container">
              <Input
                id={`lump-month-${editing.id}`}
                className="tabular-nums"
                inputMode="numeric"
                placeholder="e.g. 24"
                value={editing.month}
                onChange={(e) => setMonth(e.target.value)}
                aria-invalid={editingMonthTooLarge}
              />
            </div>
          </div>
          <div>
            <Label htmlFor={`lump-amount-${editing.id}`}>Amount</Label>
            <div className="flex border border-outline-variant focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container">
              <span className="inline-flex items-center border-r border-outline-variant bg-surface-container-low px-3 font-label-md text-label-md font-semibold text-on-surface-variant">
                ₹
              </span>
              <Input
                id={`lump-amount-${editing.id}`}
                className="tabular-nums"
                inputMode="numeric"
                placeholder="e.g. 10000"
                value={editing.amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button variant="primary" size="default" onClick={save}>
            Save
          </Button>
          <Button variant="ghost" size="default" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </div>
        {editingMonthTooLarge && (
          <p className="mt-2 font-body-sm text-body-sm text-error">
            Max month for this loan is {maxMonth}.
          </p>
        )}
        {localError && (
          <p role="alert" className="mt-2 font-body-sm text-body-sm text-error">
            {localError}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="mb-5 border border-outline-variant bg-surface-container-lowest p-4">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-headline-md text-headline-md tracking-tight text-on-surface">
            One-time payments
          </h3>
          <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
            Have extra cash at a particular time? Add a one-time payment and see how it could affect
            your payoff.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex shrink-0 items-center gap-1"
          onClick={startAdd}
        >
          <span className="material-symbols-outlined text-sm">add</span> Add lump sum
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {lumps.map((lump) => {
          const isEditing = editing?.id === lump.id;
          if (isEditing) {
            return (
              <div key={lump.id}>
                {renderEditForm()}
              </div>
            );
          }
          return (
            <div
              key={lump.id}
              className="flex items-center justify-between border border-outline-variant bg-surface-container-low p-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-base text-primary-container">
                  payments
                </span>
                <div>
                  <span className="font-bold tabular-nums text-on-surface">{formatINR(lump.amount, 0)}</span>
                  <span className="ml-2 font-body-sm text-body-sm text-on-surface-variant">
                    scheduled at Month {lump.month}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 font-label-sm text-label-sm">
                <button
                  type="button"
                  className="uppercase tracking-wider text-primary hover:underline"
                  onClick={() => startEdit(lump)}
                >
                  Edit
                </button>
                <span className="text-outline-variant">|</span>
                <button
                  type="button"
                  className="uppercase tracking-wider text-error hover:underline"
                  onClick={() => onRemove(lump.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}

        {editing && !lumps.some((l) => l.id === editing.id) && renderEditForm()}

        {lumps.length === 0 && editing === null && (
          <p className="py-2 font-body-sm text-body-sm text-on-surface-variant">
            No one-time payments added yet.
          </p>
        )}
      </div>

      <p className={cn("mt-2 hidden font-body-sm text-body-sm text-on-surface-variant")}>
        Scheduled lump sums reduce the balance the month they are applied.
      </p>
    </div>
  );
}