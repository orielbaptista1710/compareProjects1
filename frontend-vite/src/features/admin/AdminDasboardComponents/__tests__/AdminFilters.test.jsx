import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminFilters from "../AdminFilters";
import { DEFAULT_LISTING_FILTERS } from "../../listings/listingFilters";

// Pick an option in the Status dropdown (the first combobox after the search box),
// then hand back the new filters the component asked for.
async function changeStatusTo(optionName, filters) {
  const setFilters = vi.fn();
  render(<AdminFilters filters={filters} setFilters={setFilters} />);

  await userEvent.click(screen.getAllByRole("combobox")[0]);
  await userEvent.click(screen.getByRole("option", { name: optionName }));

  const updater = setFilters.mock.calls.at(-1)[0];
  return updater(filters);
}

describe("AdminFilters — the default order follows the status", () => {
  it("moving from the pending queue to another status switches to newest first", async () => {
    const next = await changeStatusTo("Approved", { ...DEFAULT_LISTING_FILTERS });

    expect(next).toMatchObject({ status: "approved", sortBy: "latest" });
  });

  it("moving back to pending returns to oldest waiting first", async () => {
    const next = await changeStatusTo("Pending", { ...DEFAULT_LISTING_FILTERS, status: "approved", sortBy: "latest" });

    expect(next).toMatchObject({ status: "pending", sortBy: "waiting" });
  });

  it("keeps an order the admin picked themselves", async () => {
    const next = await changeStatusTo("Approved", { ...DEFAULT_LISTING_FILTERS, sortBy: "priceLow" });

    expect(next).toMatchObject({ status: "approved", sortBy: "priceLow" });
  });
});
