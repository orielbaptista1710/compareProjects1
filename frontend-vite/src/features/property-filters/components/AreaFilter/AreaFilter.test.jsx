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
