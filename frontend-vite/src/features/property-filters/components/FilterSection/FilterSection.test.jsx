import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FilterSection from "./FilterSection";

describe("FilterSection", () => {
  it("renders the title and children when initially open", () => {
    render(
      <FilterSection title="Property type">
        <div>Filter content</div>
      </FilterSection>
    );

    expect(screen.getByText("Property type")).toBeInTheDocument();
    expect(screen.getByText("Filter content")).toBeInTheDocument();
  });

  it("is closed when initiallyOpen=false", () => {
    render(
      <FilterSection title="Area" initiallyOpen={false}>
        <div>Area content</div>
      </FilterSection>
    );

    expect(screen.queryByText("Area content")).not.toBeInTheDocument();
  });

  it("opens when the header is clicked", async () => {
    const user = userEvent.setup();

    render(
      <FilterSection title="Area" initiallyOpen={false}>
        <div>Area content</div>
      </FilterSection>
    );

    const header = screen.getByRole("button");

    await user.click(header);

    expect(screen.getByText("Area content")).toBeInTheDocument();
  });

  it("closes when the header is clicked again", async () => {
    const user = userEvent.setup();

    render(
      <FilterSection title="Area">
        <div>Area content</div>
      </FilterSection>
    );

    const header = screen.getByRole("button");

    await user.click(header);

    expect(screen.queryByText("Area content")).not.toBeInTheDocument();
  });

  it("updates aria-expanded correctly", async () => {
    const user = userEvent.setup();

    render(
      <FilterSection title="Area">
        <div>Area content</div>
      </FilterSection>
    );

    const header = screen.getByRole("button");

    expect(header).toHaveAttribute("aria-expanded", "true");

    await user.click(header);

    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles with Enter", async () => {
    const user = userEvent.setup();

    render(
      <FilterSection title="Area" initiallyOpen={false}>
        <div>Area content</div>
      </FilterSection>
    );

    const header = screen.getByRole("button");

    header.focus();

    await user.keyboard("{Enter}");

    expect(screen.getByText("Area content")).toBeInTheDocument();
  });

  it("toggles with Space", async () => {
    const user = userEvent.setup();

    render(
      <FilterSection title="Area" initiallyOpen={false}>
        <div>Area content</div>
      </FilterSection>
    );

    const header = screen.getByRole("button");

    header.focus();

    await user.keyboard(" ");

    expect(screen.getByText("Area content")).toBeInTheDocument();
  });

  it("does not toggle for unrelated keys", async () => {
    const user = userEvent.setup();

    render(
      <FilterSection title="Area" initiallyOpen={false}>
        <div>Area content</div>
      </FilterSection>
    );

    const header = screen.getByRole("button");

    header.focus();

    await user.keyboard("a");

    expect(screen.queryByText("Area content")).not.toBeInTheDocument();
  });

  it("renders without an icon", () => {
    render(
      <FilterSection title="Area">
        <div>Area content</div>
      </FilterSection>
    );

    expect(screen.getByText("Area")).toBeInTheDocument();
  });

  it("renders with an icon", () => {
    const Icon = () => <span data-testid="test-icon" />;

    render(
      <FilterSection title="Area" icon={Icon}>
        <div>Area content</div>
      </FilterSection>
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });
});