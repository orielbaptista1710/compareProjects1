import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import BudgetFilter from "./BudgetFilter";
import { formatCurrencyShort } from "../../../../utils/formatters";

describe("BudgetFilter", () => {
  it("shows 'Any budget' when no limit is applied", () => {
    render(<BudgetFilter value={null} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Minimum budget")).toHaveDisplayValue("Min");
    expect(screen.getByLabelText("Maximum budget")).toHaveDisplayValue("Max");
    expect(screen.getByText("Any budget")).toBeInTheDocument();
  });

  it("shows a value that is exactly on the ladder as-is", () => {
    render(<BudgetFilter value={{ min: 5_000_000, max: 10_000_000 }} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Minimum budget")).toHaveDisplayValue(formatCurrencyShort(5_000_000));
    expect(screen.getByLabelText("Maximum budget")).toHaveDisplayValue(formatCurrencyShort(10_000_000));
  });

  it("snaps an off-ladder range outward (min down, max up) instead of showing 'Any'", () => {
    // 72L and 93L are not ladder steps (the ladder moves in 5L steps up to 1Cr).
    render(<BudgetFilter value={{ min: 7_200_000, max: 9_300_000 }} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Minimum budget")).toHaveDisplayValue(formatCurrencyShort(7_000_000));
    expect(screen.getByLabelText("Maximum budget")).toHaveDisplayValue(formatCurrencyShort(9_500_000));
    expect(screen.queryByText("Any budget")).not.toBeInTheDocument();
  });

  it("treats an off-ladder maximum above the top step as 'Max'", () => {
    render(<BudgetFilter value={{ min: null, max: 99_000_000 }} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Maximum budget")).toHaveDisplayValue("Max");
  });

  describe("slider extremes", () => {
    const LAST_STEP = 37; // the "Max" slot, Infinity
    const drag = (label, to) => fireEvent.change(screen.getByLabelText(label), { target: { value: String(to) } });

    it("stops the minimum slider at the top real step instead of sending Infinity", () => {
      const onChange = vi.fn();
      render(<BudgetFilter value={null} onChange={onChange} />);

      drag("Minimum budget slider", LAST_STEP);

      expect(onChange).toHaveBeenCalledWith({ min: 50_000_000, max: null });
    });

    it("stops the maximum slider at the first real step instead of sending 0", () => {
      const onChange = vi.fn();
      render(<BudgetFilter value={null} onChange={onChange} />);

      drag("Maximum budget slider", 0);

      expect(onChange).toHaveBeenCalledWith({ min: null, max: 500_000 });
    });

    it("never reports Infinity, zero or a negative price from any slider position", () => {
      const sent = [];
      const onChange = (v) => v && sent.push(v.min, v.max);
      render(<BudgetFilter value={null} onChange={onChange} />);

      for (let i = 0; i <= LAST_STEP; i++) {
        drag("Minimum budget slider", i);
        drag("Maximum budget slider", i);
      }

      const prices = sent.filter((p) => p != null);
      expect(prices.length).toBeGreaterThan(0);
      for (const p of prices) {
        expect(Number.isFinite(p)).toBe(true);
        expect(p).toBeGreaterThan(0);
      }
    });
  });

  it("emits ladder values and null when the range is cleared", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BudgetFilter value={{ min: 7_200_000, max: null }} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("Minimum budget"), "0");

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
