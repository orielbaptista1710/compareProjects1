import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import CompareSectionNav from "../CompareSectionNav/CompareSectionNav";

const sections = [
  { id: "overview", title: "Overview" },
  { id: "location", title: "Location" },
];

const renderNav = (props = {}) =>
  render(
    <>
      <CompareSectionNav
        sections={sections}
        diffOnly={false}
        onDiffOnlyChange={vi.fn()}
        diffDisabled={false}
        {...props}
      />
      <div id="compare-overview" />
      <div id="compare-location" />
    </>
  );

describe("CompareSectionNav", () => {
  it("renders one link per section, first one active", () => {
    renderNav();

    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Overview", "Location"]);
    expect(links[0]).toHaveAttribute("href", "#compare-overview");
    expect(links[0]).toHaveAttribute("aria-current", "true");
  });

  it("scrolls to a section and marks it active on click", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderNav();

    fireEvent.click(screen.getByRole("link", { name: "Location" }));

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
    expect(screen.getByRole("link", { name: "Location" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
    scrollTo.mockRestore();
  });

  it("reports the Only differences switch and respects disabled", () => {
    const onDiffOnlyChange = vi.fn();
    const { unmount } = renderNav({ onDiffOnlyChange });

    fireEvent.click(screen.getByRole("checkbox", { name: "Only differences" }));
    expect(onDiffOnlyChange).toHaveBeenCalledWith(true);

    unmount();
    renderNav({ diffDisabled: true });
    expect(screen.getByRole("checkbox", { name: "Only differences" })).toBeDisabled();
  });
});
