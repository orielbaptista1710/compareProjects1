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

describe("LocationSearchBar chips", () => {
  const bandra = { type: "locality", label: "Bandra West, Mumbai", city: "Mumbai", localities: ["Bandra West"] };
  const andheri = { type: "locality", label: "Andheri East, Mumbai", city: "Mumbai", localities: ["Andheri East"] };
  const baner = { type: "locality", label: "Baner, Pune", city: "Pune", localities: ["Baner"] };
  const group = {
    type: "locality-group", label: "Bandra — All areas, Mumbai", city: "Mumbai",
    localities: ["Bandra West", "Bandra East"], areaCount: 2,
  };

  // Types in the box, then picks the suggestion. The text differs every time
  // so the debounced search runs again.
  let typed = 0;
  const pick = async (user, input, item) => {
    API.get.mockResolvedValue({ data: { results: [item] } });
    await user.type(input, `q${typed++}`);
    await user.click(await screen.findByRole("option"));
  };

  it("shows the locality on the chip, not the city", async () => {
    const user = userEvent.setup();
    const { input } = renderBar();

    await pick(user, input, bandra);

    expect(screen.getByRole("button", { name: "Remove Bandra West" }).parentElement).toHaveTextContent("Bandra West");
    expect(screen.queryByText("Mumbai")).not.toBeInTheDocument();
  });

  it("labels a group chip as all areas", async () => {
    const user = userEvent.setup();
    const { input } = renderBar();

    await pick(user, input, group);

    expect(screen.getByRole("button", { name: "Remove Bandra (all areas)" })).toBeInTheDocument();
  });

  it("combines several localities of one city and reports them together", async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderBar();

    await pick(user, input, bandra);
    await pick(user, input, andheri);

    expect(screen.getByRole("button", { name: "Remove Bandra West" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Andheri East" })).toBeInTheDocument();
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "locality", city: "Mumbai", localities: ["Bandra West", "Andheri East"] })
    );
  });

  it("does not add the same locality twice", async () => {
    const user = userEvent.setup();
    const { input } = renderBar();

    await pick(user, input, bandra);
    await pick(user, input, bandra);

    expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(1);
  });

  it("replaces the selection when a locality from another city is picked", async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderBar();

    await pick(user, input, bandra);
    await pick(user, input, baner);

    expect(screen.queryByRole("button", { name: "Remove Bandra West" })).not.toBeInTheDocument();
    expect(onSelect).toHaveBeenLastCalledWith(baner);
  });

  it("replaces localities when a city is picked", async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderBar();

    await pick(user, input, bandra);
    await pick(user, input, pune);

    expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(1);
    expect(onSelect).toHaveBeenLastCalledWith(pune);
  });

  it("tells the user when a locality is already added", async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderBar();

    await pick(user, input, bandra);
    onSelect.mockClear();
    await pick(user, input, bandra);

    expect(input).toHaveAttribute("placeholder", "Already added");
    expect(input).toHaveValue(""); // empty, so the notice is actually visible
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("stops at 5 chips and says so", async () => {
    const user = userEvent.setup();
    const { input } = renderBar();
    const area = (n) => ({ type: "locality", label: `Area${n}, Mumbai`, city: "Mumbai", localities: [`Area${n}`] });

    for (let n = 1; n <= 6; n++) await pick(user, input, area(n));

    expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(5);
    expect(input).toHaveAttribute("placeholder", expect.stringMatching(/Limit reached/));
    expect(input).toHaveValue("");
  });

  it("also caps the merged localities, since a group chip carries many", async () => {
    const user = userEvent.setup();
    const { input } = renderBar();
    const big = (name, from) => ({
      type: "locality-group", label: `${name} — All areas, Mumbai`, city: "Mumbai",
      localities: Array.from({ length: 20 }, (_, i) => `L${from + i}`), areaCount: 20,
    });

    await pick(user, input, big("North", 0));
    await pick(user, input, big("South", 100)); // 40 localities > 25

    expect(screen.getAllByRole("button", { name: /^Remove/ })).toHaveLength(1);
    expect(input).toHaveAttribute("placeholder", expect.stringMatching(/Limit reached/));
  });

  it("does not merge an item that has no localities or city; it replaces instead", async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderBar();
    const odd = { type: "locality", label: "Mystery", city: "Mumbai" }; // no localities list

    await pick(user, input, bandra);
    await pick(user, input, odd);

    expect(screen.queryByRole("button", { name: "Remove Bandra West" })).not.toBeInTheDocument();
    expect(onSelect).toHaveBeenLastCalledWith(odd);

    // and a good item added next must not merge the odd one's undefined list
    await pick(user, input, bandra);
    expect(onSelect).toHaveBeenLastCalledWith(bandra);
  });

  it("a free-text suggestion replaces the chips so the box matches what is searched", async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderBar();
    const text = { type: "text", label: "lodha park", city: null };

    await pick(user, input, bandra);
    await pick(user, input, text);

    expect(screen.queryByRole("button", { name: /^Remove/ })).not.toBeInTheDocument();
    expect(onSelect).toHaveBeenLastCalledWith(text);
  });

  it("removing the last chip while text is typed keeps that text as the search", async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderBar();

    await pick(user, input, bandra);
    await user.type(input, "Andh");
    await user.click(screen.getByRole("button", { name: "Remove Bandra West" }));

    expect(onSelect).toHaveBeenLastCalledWith({ type: "text", label: "Andh", city: null, locality: null });
  });

  it("removing one chip keeps the rest; removing the last clears the search", async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderBar();

    await pick(user, input, bandra);
    await pick(user, input, andheri);
    await user.click(screen.getByRole("button", { name: "Remove Bandra West" }));
    expect(onSelect).toHaveBeenLastCalledWith(andheri);

    await user.click(screen.getByRole("button", { name: "Remove Andheri East" }));
    expect(onSelect).toHaveBeenLastCalledWith({ type: "text", label: "", city: null, locality: null });
  });
});

describe("LocationSearchBar accessibility", () => {
  const thane = { type: "city", label: "Thane", city: "Thane", localities: [] };

  it("has an accessible name and no list reference while closed", () => {
    const { input } = renderBar();

    expect(input).toHaveAccessibleName("Search location");
    expect(input).not.toHaveAttribute("aria-controls");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("points aria-activedescendant at the highlighted option", async () => {
    API.get.mockResolvedValue({ data: { results: [pune, thane] } });
    const user = userEvent.setup();
    const { input } = renderBar();

    await user.type(input, "th");
    await screen.findAllByRole("option");
    await user.keyboard("{ArrowDown}{ArrowDown}");

    const options = screen.getAllByRole("option");
    expect(input).toHaveAttribute("aria-controls", screen.getByRole("listbox").id);
    expect(input).toHaveAttribute("aria-activedescendant", options[1].id);
    expect(options[1]).toHaveAttribute("aria-selected", "true");
  });

  it("does not let Enter pick an option highlighted in the previous list", async () => {
    API.get.mockResolvedValue({ data: { results: [pune, thane] } });
    const user = userEvent.setup();
    const { input, onSelect } = renderBar();

    await user.type(input, "th");
    await screen.findAllByRole("option");
    await user.keyboard("{ArrowDown}");
    await user.type(input, "a"); // list is about to change
    onSelect.mockClear();
    await user.keyboard("{Enter}");

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("announces the empty state as a status message", async () => {
    API.get.mockResolvedValue({ data: { results: [] } });
    const user = userEvent.setup();
    const { input } = renderBar();

    await user.type(input, "zzz");

    expect(await screen.findByRole("status")).toHaveTextContent(/No matches/);
  });

  it("opens the list with ArrowDown after it was closed with Escape", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify([pune]));
    const user = userEvent.setup();
    const { input } = renderBar();

    await user.click(input);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("clears the highlight when the list is re-opened, so Enter picks nothing", async () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify([pune]));
    const user = userEvent.setup();
    const { input, onSelect } = renderBar();

    await user.click(input);
    await user.keyboard("{ArrowDown}"); // highlight Pune
    await user.keyboard("{Escape}");
    await user.keyboard("{ArrowDown}"); // re-open
    expect(input).not.toHaveAttribute("aria-activedescendant");
    await user.keyboard("{Enter}");

    expect(onSelect).not.toHaveBeenCalled();
  });
});
