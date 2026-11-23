import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MainSearchBar from "../MainSearchBar";

const navigate = vi.fn();
const setCity = vi.fn();

vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("../../../../contexts/CityContext", () => ({ useCity: () => ({ setCity }) }));
vi.mock("../../ExpandableSearch/ExpandableSearch", () => ({ default: () => null }));

// Stand-in for the location box: each button reports one kind of selection.
vi.mock("../../LocationSearchBar/LocationSearchBar", () => ({
  default: ({ onSelect }) => (
    <div>
      <button onClick={() => onSelect({ type: "city", label: "Pune", city: "Pune" })}>pick-city</button>
      <button
        onClick={() =>
          onSelect({ type: "locality", label: "Baner, Pune", city: "Pune", localities: ["Baner"] })
        }
      >
        pick-locality
      </button>
      <button onClick={() => onSelect({ type: "text", label: "  lodha park  ", city: null })}>
        pick-text
      </button>
      <button onClick={() => onSelect({ type: "text", label: "   ", city: null })}>pick-blank</button>
    </div>
  ),
}));

beforeEach(() => {
  navigate.mockReset();
  setCity.mockReset();
});

const search = () => screen.getByRole("button", { name: "Search" });

describe("MainSearchBar", () => {
  it("searches every city when nothing is chosen", async () => {
    await userEvent.setup().click((render(<MainSearchBar />), search()));

    expect(navigate).toHaveBeenCalledWith("/properties?");
    expect(setCity).not.toHaveBeenCalled();
  });

  it("sends a chosen city and updates the header city", async () => {
    const user = userEvent.setup();
    render(<MainSearchBar />);

    await user.click(screen.getByText("pick-city"));
    await user.click(search());

    expect(navigate).toHaveBeenCalledWith("/properties?city=Pune");
    expect(setCity).toHaveBeenCalledWith("Pune");
  });

  it("sends city and locality for a chosen locality", async () => {
    const user = userEvent.setup();
    render(<MainSearchBar />);

    await user.click(screen.getByText("pick-locality"));
    await user.click(search());

    expect(navigate).toHaveBeenCalledWith("/properties?city=Pune&locality=Baner");
  });

  it("sends typed text as a trimmed search without touching the city", async () => {
    const user = userEvent.setup();
    render(<MainSearchBar />);

    await user.click(screen.getByText("pick-text"));
    await user.click(search());

    expect(navigate).toHaveBeenCalledWith("/properties?search=lodha+park");
    expect(setCity).not.toHaveBeenCalled();
  });

  it("drops blank typed text", async () => {
    const user = userEvent.setup();
    render(<MainSearchBar />);

    await user.click(screen.getByText("pick-blank"));
    await user.click(search());

    expect(navigate).toHaveBeenCalledWith("/properties?");
  });

  it("includes property-type pills in the query", async () => {
    const user = userEvent.setup();
    render(<MainSearchBar />);

    await user.click(screen.getByText("pick-city"));
    await user.click(screen.getByRole("button", { name: /Property Type/ }));
    await user.click(screen.getByRole("button", { name: "Villa" }));
    await user.click(search());

    expect(navigate).toHaveBeenCalledWith("/properties?propertyType=Villa&city=Pune");
  });
});
