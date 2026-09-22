import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LumpSumEditor } from "./LumpSumEditor";
import type { LumpSumDraft } from "../types/loan";

describe("LumpSumEditor", () => {
  it("shows an empty state when no lump sums exist", () => {
    render(
      <LumpSumEditor lumps={[]} maxMonth={120} onUpsert={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(screen.getByText("No one-time payments added yet.")).toBeInTheDocument();

    const addButton = screen.getByRole("button", { name: /add lump sum/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveClass("cursor-pointer");
    expect(addButton).toHaveClass("border");
    expect(addButton.className).toContain("focus-visible:ring-2");
  });

  it("starts a new lump sum with empty fields and placeholders", () => {
    render(
      <LumpSumEditor lumps={[]} maxMonth={120} onUpsert={vi.fn()} onRemove={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add lump sum/i }));
    expect(screen.getByLabelText("Month")).toHaveValue("");
    expect(screen.getByLabelText("Amount")).toHaveValue("");
    expect(screen.getByPlaceholderText("e.g. 24")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. 10000")).toBeInTheDocument();
  });

  it("adds a valid lump sum through the Add button", async () => {
    const user = userEvent.setup();
    const onUpsert = vi.fn();
    const { rerender } = render(
      <LumpSumEditor lumps={[]} maxMonth={120} onUpsert={onUpsert} onRemove={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add lump sum/i }));
    expect(screen.getByLabelText("Month")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Month"));
    await user.type(screen.getByLabelText("Month"), "24");
    await user.clear(screen.getByLabelText("Amount"));
    await user.type(screen.getByLabelText("Amount"), "50000");
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onUpsert).toHaveBeenCalledTimes(1);
    const draft = onUpsert.mock.calls[0][0] as LumpSumDraft;
    expect(draft.month).toBe(24);
    expect(draft.amount).toBe("50000");

    // Simulate the parent accepting the lump and re-rendering.
    rerender(
      <LumpSumEditor lumps={[draft]} maxMonth={120} onUpsert={onUpsert} onRemove={vi.fn()} />,
    );
    expect(screen.getByText("₹50,000")).toBeInTheDocument();
    expect(screen.getByText(/scheduled at Month 24/i)).toBeInTheDocument();
  });

  it("rejects a month beyond the loan term without saving", async () => {
    const user = userEvent.setup();
    const onUpsert = vi.fn();
    render(
      <LumpSumEditor lumps={[]} maxMonth={120} onUpsert={onUpsert} onRemove={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add lump sum/i }));
    await user.clear(screen.getByLabelText("Month"));
    await user.type(screen.getByLabelText("Month"), "130");
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onUpsert).not.toHaveBeenCalled();
    expect(screen.getByText(/Max month for this loan is 120/i)).toBeInTheDocument();
  });

  it("edits an existing lump sum", async () => {
    const user = userEvent.setup();
    const onUpsert = vi.fn();
    const existing: LumpSumDraft = { id: "lump-1", month: 12, amount: "100000" };
    const { rerender } = render(
      <LumpSumEditor lumps={[existing]} maxMonth={120} onUpsert={onUpsert} onRemove={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.clear(screen.getByLabelText("Amount"));
    await user.type(screen.getByLabelText("Amount"), "200000");
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onUpsert).toHaveBeenCalledTimes(1);
    const draft = onUpsert.mock.calls[0][0] as LumpSumDraft;
    expect(draft.id).toBe("lump-1");
    expect(draft.amount).toBe("200000");

    rerender(
      <LumpSumEditor lumps={[draft]} maxMonth={120} onUpsert={onUpsert} onRemove={vi.fn()} />,
    );
    expect(screen.getByText("₹2,00,000")).toBeInTheDocument();
  });

  it("removes an existing lump sum", () => {
    const onRemove = vi.fn();
    const existing: LumpSumDraft = { id: "lump-1", month: 12, amount: "100000" };
    render(
      <LumpSumEditor lumps={[existing]} maxMonth={120} onUpsert={vi.fn()} onRemove={onRemove} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^remove$/i }));
    expect(onRemove).toHaveBeenCalledWith("lump-1");
  });
});