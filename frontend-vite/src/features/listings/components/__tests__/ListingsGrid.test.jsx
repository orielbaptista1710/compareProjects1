import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ListingsGrid from "../ListingsGrid";

const LISTINGS = [
  { _id: "p1", title: "First flat", status: "approved", price: 5000000 },
  { _id: "p2", title: "Second flat", status: "pending", price: 6000000 },
];

const renderGrid = (props = {}) =>
  render(
    <ListingsGrid
      listings={LISTINGS}
      isLoading={false}
      isError={false}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      empty={<p>Nothing here</p>}
      {...props}
    />
  );

describe("ListingsGrid", () => {
  it("shows a card per listing", () => {
    renderGrid();

    expect(screen.getByRole("heading", { name: "First flat" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Second flat" })).toBeInTheDocument();
  });

  it("shows the empty content when there are no listings", () => {
    renderGrid({ listings: [] });

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("shows an error message instead of the empty content when loading failed", () => {
    renderGrid({ listings: [], isError: true });

    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't load your listings/i);
    expect(screen.queryByText("Nothing here")).not.toBeInTheDocument();
  });

  it("shows neither cards nor the empty content while loading", () => {
    renderGrid({ isLoading: true });

    expect(screen.queryByRole("heading", { name: "First flat" })).not.toBeInTheDocument();
    expect(screen.queryByText("Nothing here")).not.toBeInTheDocument();
  });

  it("asks before deleting and only then calls onDelete with the id", () => {
    const onDelete = vi.fn();
    renderGrid({ onDelete });

    fireEvent.click(screen.getAllByRole("button", { name: /^Delete/ })[1]);
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Second flat");
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("p2");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("cancelling the dialog deletes nothing", () => {
    const onDelete = vi.fn();
    renderGrid({ onDelete });

    fireEvent.click(screen.getAllByRole("button", { name: /^Delete/ })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
