import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LocationSearchBar from "../LocationSearchBar";
import API from "../../../../api/api";

vi.mock("../../../../api/api", () => ({
  default: { get: vi.fn() },
}));

const RECENT_KEY = "recentLocationSearches";
const pune = { type: "city", label: "Pune", city: "Pune", localities: [] };

beforeEach(() => {
  localStorage.clear();
  API.get.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

const renderBar = (onSelect = vi.fn()) => {
  render(<LocationSearchBar onSelect={onSelect} />);
  return { onSelect, input: screen.getByRole("combobox") };
};

describe("LocationSearchBar recent searches storage", () => {
  it("shows saved recent searches when focused", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify([pune]));
    const user = userEvent.setup();
    const { input } = renderBar();

    await user.click(input);

    expect(screen.getByText("Recent searches")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Pune/ })).toBeInTheDocument();
  });

  it("ignores stored data that isn't a list instead of crashing", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify({ label: "Pune" }));
    const user = userEvent.setup();
    const { input } = renderBar();

    await user.click(input);

    expect(screen.queryByText("Recent searches")).not.toBeInTheDocument();
  });

  it("skips malformed items in the stored list", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify([null, { label: 5 }, "Thane", pune]));
    const user = userEvent.setup();
    const { input } = renderBar();

    await user.click(input);

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: /Pune/ })).toBeInTheDocument();
  });

  it("still selects a suggestion when storage can't be written", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    API.get.mockResolvedValue({ data: { results: [pune] } });
    const user = userEvent.setup();
    const { input, onSelect } = renderBar();

    await user.type(input, "pu");
    const option = await screen.findByRole("option", { name: /Pune/ });
    await user.click(option);

    await waitFor(() => expect(onSelect).toHaveBeenLastCalledWith(pune));
  });

  it("saves a selected suggestion to recent searches", async () => {
    API.get.mockResolvedValue({ data: { results: [pune] } });
    const user = userEvent.setup();
    const { input } = renderBar();

    await user.type(input, "pu");
    await user.click(await screen.findByRole("option", { name: /Pune/ }));

    expect(JSON.parse(localStorage.getItem(RECENT_KEY))).toEqual([pune]);
  });
});
