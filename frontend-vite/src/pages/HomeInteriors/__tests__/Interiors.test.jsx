// Home Interiors (/interior): service tabs swap the cards, room filters narrow
// the project grid, and the consultation form can't be submitted (not wired yet).
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Interiors from "../Interiors";

const renderPage = () =>
  render(
    <MemoryRouter>
      <Interiors />
    </MemoryRouter>
  );

describe("Interiors", () => {
  it("shows the hero with links to the work grid and the consultation form", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { level: 1, name: /interiors for the home you just bought/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /book a free consultation/i })).toHaveAttribute(
      "href",
      "#interiors-contact"
    );
    expect(screen.getByRole("link", { name: /see our work/i })).toHaveAttribute(
      "href",
      "#interiors-work"
    );
  });

  it("swaps the service cards when the tab changes", async () => {
    const user = userEvent.setup();
    renderPage();
    const services = screen.getByRole("region", { name: /what we do/i });

    expect(within(services).getByText("Full home interiors")).toBeInTheDocument();
    await user.click(within(services).getByRole("button", { name: /offices and shops/i }));

    expect(within(services).getByText("Offices, shops and cafés")).toBeInTheDocument();
    expect(within(services).queryByText("Full home interiors")).not.toBeInTheDocument();
  });

  it("filters the project grid by room", async () => {
    const user = userEvent.setup();
    renderPage();
    const work = screen.getByRole("region", { name: /our work/i });

    expect(within(work).getAllByRole("listitem")).toHaveLength(8);
    await user.click(within(work).getByRole("button", { name: /^kitchen/i }));

    const items = within(work).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(work).getByRole("button", { name: /^kitchen/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("keeps the consultation submit disabled and points to phone/email", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /request a call back/i })).toBeDisabled();
    expect(screen.getByText(/online booking isn’t live yet/i)).toBeInTheDocument();
  });
});
