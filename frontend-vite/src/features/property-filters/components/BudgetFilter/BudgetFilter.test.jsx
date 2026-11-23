import { useState } from "react";
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
    const drag = (label, to) => fireEvent.change(screen.getByLabelText(label), { target: { value: String(to) } });
    // The last slider step is the "Max" slot (Infinity); read it from the control so the
    // tests follow the ladder if it changes.
    const lastStep = () => Number(screen.getByLabelText("Minimum budget slider").max);

    // Feeds every emitted value back in, like the page does, so combined states are reached.
    const Harness = ({ onEmit }) => {
      const [value, setValue] = useState(null);
      return (
        <BudgetFilter
          value={value}
          onChange={(v) => {
            onEmit(v);
            setValue(v);
          }}
        />
      );
    };

    it("stops the minimum slider at the top real step (5 Cr) instead of sending Infinity", () => {
      const onEmit = vi.fn();
      render(<Harness onEmit={onEmit} />);

      drag("Minimum budget slider", lastStep());

      expect(onEmit).toHaveBeenLastCalledWith({ min: 50_000_000, max: null });
    });

    it("stops the maximum slider at the first real step (5L) instead of sending 0", () => {
      const onEmit = vi.fn();
      render(<Harness onEmit={onEmit} />);

      drag("Maximum budget slider", 0);

      expect(onEmit).toHaveBeenLastCalledWith({ min: null, max: 500_000 });
    });

    it("never reports Infinity, zero, a negative price or an inverted range from any slider position, in any combination", () => {
      const sent = []; // whole { min, max } objects, so each pair can be checked
      render(<Harness onEmit={(v) => v && sent.push(v)} />);
      const last = lastStep();
      expect(last).toBeGreaterThan(1);

      // Both ends of the ladder (where the Min / Max slots live) and the middle,
      // each thumb against each, in both orders. A full 38 x 38 sweep takes ~70s.
      const positions = [0, 1, 2, Math.floor(last / 2), last - 2, last - 1, last];
      for (const i of positions) {
        for (const j of positions) {
          drag("Minimum budget slider", i);
          drag("Maximum budget slider", j);
          drag("Maximum budget slider", i);
          drag("Minimum budget slider", j);
        }
      }

      expect(sent.length).toBeGreaterThan(0);
      for (const { min, max } of sent) {
        for (const p of [min, max]) {
          if (p == null) continue; // null means "no limit on this side"
          expect(Number.isFinite(p)).toBe(true);
          expect(p).toBeGreaterThan(0);
        }
        // A minimum above the maximum would match nothing.
        if (min != null && max != null) expect(min).toBeLessThanOrEqual(max);
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
