import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import CompareTray from "../CompareTray";
import {
  renderWithRouter,
  makeProperty,
  skyline,
  greenValley,
} from "../../../../../test/compareTestUtils";

const renderTray = (compareList = [skyline, greenValley]) => {
  const removeFromCompare = vi.fn();
  renderWithRouter(
    <CompareTray compareList={compareList} removeFromCompare={removeFromCompare} />,
    { initialPath: "/properties" }
  );
  return { removeFromCompare };
};

describe("CompareTray", () => {
  it("renders nothing for an empty list", () => {
    renderTray([]);
    expect(screen.queryByRole("button", { name: /preview/i })).not.toBeInTheDocument();
  });

  it("shows title, developer and location for each property", () => {
    renderTray();

    expect(screen.getByText("Skyline Heights")).toBeInTheDocument();
    expect(screen.getByText(/Andheri, Mumbai/)).toBeInTheDocument();
    expect(screen.getByText(/Baner, Pune/)).toBeInTheDocument();
  });

  it("falls back to placeholders when fields are missing", () => {
    renderTray([makeProperty({ title: "", developerName: "", city: "", locality: "", price: undefined })]);

    expect(screen.getByText("Untitled")).toBeInTheDocument();
    expect(screen.getByText(/Unknown Developer/)).toBeInTheDocument();
    expect(screen.getByText(/Price on Request/)).toBeInTheDocument();
  });

  it("removes a property without navigating away from the listing", () => {
    const { removeFromCompare } = renderTray();

    fireEvent.click(screen.getByRole("button", { name: "Remove Green Valley from compare" }));

    expect(removeFromCompare).toHaveBeenCalledWith("p2");
    expect(screen.getByTestId("location")).toHaveTextContent("/properties");
  });

  it("navigates to /compare from the Compare button", () => {
    renderTray();

    fireEvent.click(screen.getByRole("button", { name: /^compare/i }));

    expect(screen.getByTestId("location")).toHaveTextContent("/compare");
  });

  it("opens the preview panel", () => {
    renderTray();

    fireEvent.click(screen.getByRole("button", { name: /preview/i }));

    expect(screen.getByRole("dialog", { name: "Compare properties" })).toBeInTheDocument();
  });
});
