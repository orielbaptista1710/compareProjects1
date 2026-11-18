import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import OffersTab from "../OffersTab";

const renderTab = (props = {}) =>
  render(
    <MemoryRouter>
      <OffersTab {...props} />
    </MemoryRouter>
  );

describe("OffersTab", () => {
  it("renders the six member benefits", () => {
    renderTab();
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(6);
  });

  it("links each benefit to its page", () => {
    renderTab();
    const href = (name) => screen.getByRole("link", { name: new RegExp(name) }).getAttribute("href");
    expect(href("How it works")).toBe("/property-guide");
    expect(href("Browse projects")).toBe("/properties");
    expect(href("Open compare")).toBe("/compare");
    expect(href("Check eligibility")).toBe("/apnaloan");
    expect(href("See our work")).toBe("/interior");
    expect(href("Talk to an advisor")).toBe("/supportHelp");
  });

  it("opens the notifications section of Settings from the notice", () => {
    const onNavigateTab = vi.fn();
    renderTab({ onNavigateTab });
    fireEvent.click(screen.getByRole("button", { name: /Notification settings/ }));
    expect(onNavigateTab).toHaveBeenCalledWith("settings", "notifications");
  });
});
