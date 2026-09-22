import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RepaymentMode } from "./RepaymentMode";

describe("RepaymentMode", () => {
  it("renders both strategy options as tabs", () => {
    render(<RepaymentMode mode={null} onModeChange={vi.fn()} />);

    expect(screen.getByRole("tab", { name: /extra monthly/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /target payoff term/i })).toBeInTheDocument();
  });

  it("renders strategy options with clear interactive affordance", () => {
    render(<RepaymentMode mode={null} onModeChange={vi.fn()} />);

    const extra = screen.getByRole("tab", { name: /extra monthly/i });
    const target = screen.getByRole("tab", { name: /target payoff term/i });
    for (const tab of [extra, target]) {
      expect(tab).toHaveClass("cursor-pointer");
      expect(tab).toHaveClass("border");
      expect(tab).toHaveClass("transition-colors");
      expect(tab.className).toContain("focus-visible:ring-2");
    }
    expect(extra).toHaveClass("border-outline");
  });

  it("calls onModeChange and reflects the selected state", () => {
    const onModeChange = vi.fn();
    const { rerender } = render(<RepaymentMode mode={null} onModeChange={onModeChange} />);

    const extra = screen.getByRole("tab", { name: /extra monthly/i });
    fireEvent.click(extra);
    expect(onModeChange).toHaveBeenCalledWith("extra");

    rerender(<RepaymentMode mode="extra" onModeChange={onModeChange} />);
    expect(extra).toHaveAttribute("aria-selected", "true");
    expect(extra).toHaveClass("bg-primary-container");
    expect(extra).toHaveClass("border-primary");
  });
});