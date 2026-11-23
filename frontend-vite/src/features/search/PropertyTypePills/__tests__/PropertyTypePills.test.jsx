import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PropertyTypePills from "../PropertyTypePills";

const setup = (valueMap = {}) => {
  const onChange = vi.fn();
  render(<PropertyTypePills valueMap={valueMap} onChange={onChange} />);
  // The trigger's label changes with the selection, so take the first button.
  return { onChange, trigger: screen.getAllByRole("button")[0] };
};

describe("PropertyTypePills", () => {
  it("starts closed with the default label", () => {
    const { trigger } = setup();

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Villa" })).not.toBeInTheDocument();
  });

  it("opens the panel and reports a toggled type", async () => {
    const user = userEvent.setup();
    const { trigger, onChange } = setup();

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Villa" }));

    expect(onChange).toHaveBeenCalledWith("propertyType", ["Villa"]);
  });

  it("removes a value that is already selected", async () => {
    const user = userEvent.setup();
    const { trigger, onChange } = setup({ propertyType: ["Villa", "Plot"] });

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Villa" }));

    expect(onChange).toHaveBeenCalledWith("propertyType", ["Plot"]);
  });

  it("marks selected pills with aria-pressed", async () => {
    const user = userEvent.setup();
    // Two selected, so the trigger reads "Villa +1" and pill names stay unique.
    const { trigger } = setup({ propertyType: ["Villa", "Plot"] });

    await user.click(trigger);

    expect(screen.getByRole("button", { name: "Plot" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Flats / Apartments" })).toHaveAttribute("aria-pressed", "false");
  });

  it("summarises the selection on the trigger", () => {
    const { trigger } = setup({ propertyType: ["Villa", "Plot"] });

    expect(trigger).toHaveTextContent("Villa +1");
  });

  it("ignores a value map entry that is not a list", async () => {
    const user = userEvent.setup();
    const { trigger } = setup({ propertyType: "Villa" });

    await user.click(trigger);

    expect(screen.getByRole("button", { name: "Villa" })).toHaveAttribute("aria-pressed", "false");
  });

  it("closes on Escape and on an outside click", async () => {
    const user = userEvent.setup();
    const { trigger } = setup();

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    await user.click(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
