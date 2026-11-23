import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AreaFilter from "./AreaFilter";

describe("AreaFilter", () => {
  it("clears the filter instead of applying a full range when the unit changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AreaFilter value={null} onChange={onChange} />);

    const unitButtons = within(screen.getByRole("group", { name: "Area unit" })).getAllByRole("button");
    const other = unitButtons.find((b) => b.getAttribute("aria-pressed") === "false");
    await user.click(other);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null);
    // The picked unit is remembered even though no filter is active.
    expect(other).toHaveAttribute("aria-pressed", "true");
  });

  describe("unit after the filter is emptied", () => {
    const pressedLabel = () =>
      within(screen.getByRole("group", { name: "Area unit" }))
        .getAllByRole("button")
        .find((b) => b.getAttribute("aria-pressed") === "true").textContent;

    // Holds the value the way the page does (the URL), and lets a test empty it from outside.
    const Harness = ({ initial }) => {
      const [value, setValue] = useState(initial);
      return (
        <>
          <button type="button" onClick={() => setValue(null)}>outside clear</button>
          <AreaFilter value={value} onChange={setValue} />
        </>
      );
    };

    const defaultLabel = () => {
      const { unmount } = render(<AreaFilter value={null} onChange={vi.fn()} />);
      const label = pressedLabel();
      unmount();
      return label;
    };

    it("goes back to the default unit when emptied from outside (page Clear all)", async () => {
      const user = userEvent.setup();
      const fallback = defaultLabel();
      render(<Harness initial={null} />);
      // The user picks another unit with the buttons, then narrows the range.
      const other = within(screen.getByRole("group", { name: "Area unit" }))
        .getAllByRole("button")
        .find((b) => b.getAttribute("aria-pressed") === "false");
      await user.click(other);
      fireEvent.change(screen.getByLabelText("Minimum area"), { target: { value: "5" } });
      expect(pressedLabel()).not.toBe(fallback);

      await user.click(screen.getByRole("button", { name: "outside clear" }));

      expect(pressedLabel()).toBe(fallback);
    });

    it("keeps the unit when the filter's own Clear button is used", async () => {
      const user = userEvent.setup();
      const fallback = defaultLabel();
      render(<Harness initial={{ min: 5, max: 20, unit: "acres" }} />);
      const acres = pressedLabel();
      expect(acres).not.toBe(fallback);

      await user.click(screen.getByRole("button", { name: "Clear area filter" }));

      expect(pressedLabel()).toBe(acres);
    });

    it("keeps the unit when the sliders are dragged back to the full range", () => {
      const fallback = defaultLabel();
      render(<Harness initial={{ min: 5, max: null, unit: "acres" }} />);
      const acres = pressedLabel();
      expect(acres).not.toBe(fallback);

      fireEvent.change(screen.getByLabelText("Minimum area"), { target: { value: "0" } });

      expect(pressedLabel()).toBe(acres);
    });
  });

  it("sends no upper limit for the top preset (5k+)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AreaFilter value={null} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "5k+" }));

    expect(onChange).toHaveBeenCalledWith({ min: 5000, max: null, unit: "sqft" });
  });

  it("keeps a real upper limit for a bounded preset", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AreaFilter value={null} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "< 500" }));

    expect(onChange).toHaveBeenCalledWith({ min: 0, max: 500, unit: "sqft" });
  });

  it("reports no filter when the sliders are dragged back to the full range", () => {
    const onChange = vi.fn();
    render(<AreaFilter value={{ min: 500, max: null, unit: "sqft" }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Minimum area"), { target: { value: "0" } });

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
