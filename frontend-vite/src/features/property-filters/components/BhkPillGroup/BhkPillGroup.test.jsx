import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import BhkPillGroup from "./BhkPillGroup";

describe("BhkPillGroup", () => {
  it("renders all options", () => {
    render(
      <BhkPillGroup
        options={["1", "2", "3"]}
        value={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
  });

  it("selects an unselected option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <BhkPillGroup
        options={["1", "2", "3"]}
        value={[]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "2" }));

    expect(onChange).toHaveBeenCalledWith(["2"]);
  });

  it("deselects an already selected option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <BhkPillGroup
        options={["1", "2", "3"]}
        value={["1", "2"]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "2" }));

    expect(onChange).toHaveBeenCalledWith(["1"]);
  });

  it("supports multiple selections", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <BhkPillGroup
        options={["1", "2", "3"]}
        value={[]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "1" }));

    expect(onChange).toHaveBeenLastCalledWith(["1"]);

    // Simulate the parent updating its controlled value.
    rerender(
      <BhkPillGroup
        options={["1", "2", "3"]}
        value={["1"]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "2" }));

    expect(onChange).toHaveBeenLastCalledWith(["1", "2"]);
  });

  it("marks selected options with aria-pressed=true", () => {
    render(
      <BhkPillGroup
        options={["1", "2"]}
        value={["2"]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "1" }))
      .toHaveAttribute("aria-pressed", "false");

    expect(screen.getByRole("button", { name: "2" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("uses renderLabel when provided", () => {
    render(
      <BhkPillGroup
        options={["1", "2"]}
        value={[]}
        onChange={vi.fn()}
        renderLabel={(value) => `${value} BHK`}
      />
    );

    expect(screen.getByRole("button", { name: "1 BHK" }))
      .toBeInTheDocument();
  });

  it("handles empty options", () => {
    render(
      <BhkPillGroup
        options={[]}
        value={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});