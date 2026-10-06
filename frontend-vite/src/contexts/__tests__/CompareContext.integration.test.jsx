import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, renderHook, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { CompareProvider, useCompare } from "../CompareContext";
import CompareBar from "../../shared/CompareBar/CompareBar";
import Compare from "../../pages/Compare/Compare";
import { makeProperty, skyline, greenValley } from "../../test/compareTestUtils";

const extra = [3, 4, 5].map((n) => makeProperty({ _id: `p${n}`, title: `Property ${n}` }));

// Stands in for PropertyCard / PropertyPage: any component that calls addToCompare.
const ListingPage = ({ properties }) => {
  const { addToCompare } = useCompare();
  const [status, setStatus] = useState("");
  return (
    <>
      {properties.map((p) => (
        <button key={p._id} onClick={() => setStatus(addToCompare(p))}>
          add {p.title}
        </button>
      ))}
      <output data-testid="status">{status}</output>
    </>
  );
};

// Mirrors how App.jsx wires the Header's CompareBar and the /compare route to the context.
const Shell = () => {
  const { compareList, setCompareList, removeFromCompare } = useCompare();
  return (
    <>
      <CompareBar
        compareList={compareList}
        setCompareList={setCompareList}
        removeFromCompare={removeFromCompare}
        isOpen
        onClose={() => {}}
      />
      <Routes>
        <Route
          path="/properties"
          element={<ListingPage properties={[skyline, greenValley, ...extra]} />}
        />
        <Route
          path="/compare"
          element={
            <Compare
              compareList={compareList}
              setCompareList={setCompareList}
              removeFromCompare={removeFromCompare}
            />
          }
        />
      </Routes>
    </>
  );
};

const renderApp = (initialPath = "/properties") =>
  render(
    <CompareProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Shell />
      </MemoryRouter>
    </CompareProvider>
  );

const stored = () => JSON.parse(localStorage.getItem("compareList"));

describe("CompareContext", () => {
  beforeEach(() => localStorage.clear());

  it("throws a helpful error when used outside CompareProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCompare())).toThrow(
      "useCompare must be used inside CompareProvider"
    );
    vi.restoreAllMocks();
  });

  it("runs the full add → bar → compare page → remove → clear flow", async () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "add Skyline Heights" }));
    fireEvent.click(screen.getByRole("button", { name: "add Green Valley" }));
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /compare now/i }));
    expect(
      await screen.findByRole("heading", { name: /Skyline Heights vs Green Valley/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove from comparison" })[0]);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    // Summary needs at least two properties
    expect(screen.queryByRole("heading", { name: / vs /i })).not.toBeInTheDocument();
    await waitFor(() => expect(stored().map((p) => p._id)).toEqual(["p2"]));

    fireEvent.click(screen.getAllByRole("button", { name: /clear all/i })[0]);
    expect(screen.getByText("Nothing to compare yet")).toBeInTheDocument();
    await waitFor(() => expect(stored()).toEqual([]));
  });

  it("reports duplicate and limit statuses to the caller", () => {
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "add Skyline Heights" }));
    expect(screen.getByTestId("status")).toHaveTextContent("added");

    fireEvent.click(screen.getByRole("button", { name: "add Skyline Heights" }));
    expect(screen.getByTestId("status")).toHaveTextContent("duplicate");

    for (const name of ["Green Valley", "Property 3", "Property 4"]) {
      fireEvent.click(screen.getByRole("button", { name: `add ${name}` }));
    }
    fireEvent.click(screen.getByRole("button", { name: "add Property 5" }));
    expect(screen.getByTestId("status")).toHaveTextContent("limit");
    expect(screen.getByText("4 selected")).toBeInTheDocument();
  });

  it("restores the list from localStorage on a fresh load", async () => {
    const { unmount } = renderApp();
    fireEvent.click(screen.getByRole("button", { name: "add Green Valley" }));
    await waitFor(() => expect(stored()).toHaveLength(1));
    unmount();

    renderApp("/compare");

    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Green Valley" })).toBeInTheDocument();
  });
});
