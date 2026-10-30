import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

import CompareTable from "../CompareTable/CompareTable";
import { buildCompareModel } from "../../model/buildCompareModel";
import { makeProperty, skyline, greenValley } from "../../../../test/compareTestUtils";

const renderTable = (properties, handlers = {}) =>
  render(
    <CompareTable
      properties={properties}
      sections={buildCompareModel(properties)}
      onRemove={handlers.onRemove ?? vi.fn()}
      onView={handlers.onView ?? vi.fn()}
    />
  );

const rowFor = (label) => screen.getByRole("rowheader", { name: label }).closest("tr");

describe("CompareTable", () => {
  it("lines values up in one row per field, one column per property", () => {
    renderTable([skyline, greenValley]);

    const cells = within(rowFor("Possession")).getAllByRole("cell");
    expect(cells.map((c) => c.textContent)).toEqual(["Ready to Move", "Under Construction"]);
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
  });

  it("marks rows that differ and leaves identical rows unmarked", () => {
    renderTable([skyline, greenValley]);

    expect(rowFor("Possession")).toHaveClass("is-diff");
    expect(rowFor("BHK")).not.toHaveClass("is-diff");
  });

  it("drops rows that are empty for every property", () => {
    renderTable([skyline, greenValley]);
    expect(screen.queryByRole("rowheader", { name: "Bathrooms" })).not.toBeInTheDocument();
  });

  it("shows amenities as Yes / not specified with per-property counts", () => {
    renderTable([skyline, makeProperty({ _id: "p2", amenities: ["gym "], security: ["CCTV"] })]);

    const pool = within(rowFor("Swimming Pool")).getAllByRole("cell");
    expect(pool[0]).toHaveTextContent("Yes");
    expect(within(pool[1]).getByLabelText("Not specified")).toBeInTheDocument();

    // "Gym" and "gym " are the same amenity
    expect(screen.getAllByRole("rowheader", { name: /gym/i })).toHaveLength(1);
    expect(screen.getAllByText("2 / 3")).toHaveLength(2);
  });

  it("only links http(s) map URLs", () => {
    renderTable([
      makeProperty({ mapLink: "https://maps.example.com/x" }),
      makeProperty({ _id: "p2", mapLink: "javascript:alert(1)" }),
    ]);

    const links = screen.getAllByRole("link", { name: /view on map/i });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("labels sections with no differences, hidden until diff mode reveals it", () => {
    renderTable([skyline, greenValley]);

    // Both fixtures list the same amenities; Overview differs (possession)
    const same = within(screen.getByRole("rowheader", { name: "Amenities & Features" }).closest("tbody"))
      .getByText("All the same");
    expect(same).not.toBeVisible();
    expect(screen.getByRole("rowheader", { name: "Overview" }).closest("tbody")).toHaveClass("has-diff");
  });

  it("renders a hidden-from-screen-readers mini header with each title", () => {
    const { container } = renderTable([skyline, greenValley]);

    const mini = container.querySelector(".ct-mini");
    expect(mini).toHaveAttribute("aria-hidden", "true");
    expect(within(mini).getByText("Skyline Heights")).toBeInTheDocument();
    expect(within(mini).getByText("Green Valley")).toBeInTheDocument();
  });

  it("removes a property without opening it", () => {
    const onRemove = vi.fn();
    const onView = vi.fn();
    renderTable([skyline, greenValley], { onRemove, onView });

    fireEvent.click(screen.getAllByRole("button", { name: "Remove from comparison" })[1]);
    expect(onRemove).toHaveBeenCalledWith("p2");
    expect(onView).not.toHaveBeenCalled();
  });
});
