import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CheckboxGroup from "./CheckboxGroup";

describe("CheckboxGroup", () => {
  it("renders all checkbox options", () => {
    render(
      <CheckboxGroup
        options={["Apartment", "Villa", "Plot"]}
        value={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("checkbox", { name: "Apartment" }))
      .toBeInTheDocument();

    expect(screen.getByRole("checkbox", { name: "Villa" }))
      .toBeInTheDocument();

    expect(screen.getByRole("checkbox", { name: "Plot" }))
      .toBeInTheDocument();
  });

  it("checks an unselected option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CheckboxGroup
        options={["Apartment", "Villa"]}
        value={[]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("checkbox", { name: "Apartment" }));

    expect(onChange).toHaveBeenCalledWith(["Apartment"]);
  });

  it("unchecks a selected option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CheckboxGroup
        options={["Apartment", "Villa"]}
        value={["Apartment"]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("checkbox", { name: "Apartment" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("reflects controlled checked state", () => {
    render(
      <CheckboxGroup
        options={["Apartment", "Villa"]}
        value={["Villa"]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("checkbox", { name: "Villa" }))
      .toBeChecked();

    expect(screen.getByRole("checkbox", { name: "Apartment" }))
      .not.toBeChecked();
  });

  it("renders counts when provided", () => {
    render(
      <CheckboxGroup
        options={["Apartment", "Villa"]}
        value={[]}
        onChange={vi.fn()}
        counts={{ Apartment: 1250, Villa: 8 }}
      />
    );

    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("does not render a count when it is undefined", () => {
    render(
      <CheckboxGroup
        options={["Apartment"]}
        value={[]}
        onChange={vi.fn()}
        counts={{}}
      />
    );

    expect(screen.queryByText("undefined")).not.toBeInTheDocument();
  });

  it("adds the scrollable class when scrollable=true", () => {
    const { container } = render(
      <CheckboxGroup
        options={["Apartment"]}
        value={[]}
        onChange={vi.fn()}
        scrollable
      />
    );

    expect(container.firstChild).toHaveClass("scrollable");
  });

  it("uses renderLabel when provided", () => {
    render(
      <CheckboxGroup
        options={["Apartment"]}
        value={[]}
        onChange={vi.fn()}
        renderLabel={(value) => `Type: ${value}`}
      />
    );

    expect(screen.getByRole("checkbox", { name: "Type: Apartment" }))
      .toBeInTheDocument();
  });

  it("handles empty options", () => {
    render(
      <CheckboxGroup
        options={[]}
        value={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});