import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import BoxcheckGroup from "./BoxcheckGroup";

describe("BoxcheckGroup", () => {
  it("renders all options", () => {
    render(
      <BoxcheckGroup
        options={["Lift", "Gym", "Pool"]}
        value={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Lift" }))
      .toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Gym" }))
      .toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Pool" }))
      .toBeInTheDocument();
  });

  it("selects an option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <BoxcheckGroup
        options={["Lift", "Gym"]}
        value={[]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Lift" }));

    expect(onChange).toHaveBeenCalledWith(["Lift"]);
  });

  it("deselects an option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <BoxcheckGroup
        options={["Lift", "Gym"]}
        value={["Lift"]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Lift" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("marks selected options with aria-pressed=true", () => {
    render(
      <BoxcheckGroup
        options={["Lift", "Gym"]}
        value={["Lift"]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Lift" }))
      .toHaveAttribute("aria-pressed", "true");

    expect(screen.getByRole("button", { name: "Gym" }))
      .toHaveAttribute("aria-pressed", "false");
  });

  it("renders a checkmark only for selected options", () => {
    const { container } = render(
      <BoxcheckGroup
        options={["Lift", "Gym"]}
        value={["Lift"]}
        onChange={vi.fn()}
      />
    );

    const selectedButton = screen.getByRole("button", { name: "Lift" });
    const unselectedButton = screen.getByRole("button", { name: "Gym" });

    expect(selectedButton.querySelector("svg")).toBeInTheDocument();
    expect(unselectedButton.querySelector("svg")).not.toBeInTheDocument();
  });

  it("uses renderLabel when provided", () => {
    render(
      <BoxcheckGroup
        options={["Lift"]}
        value={[]}
        onChange={vi.fn()}
        renderLabel={(value) => `Amenity: ${value}`}
      />
    );

    expect(screen.getByRole("button", { name: "Amenity: Lift" }))
      .toBeInTheDocument();
  });

  it("handles empty options", () => {
    render(
      <BoxcheckGroup
        options={[]}
        value={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});