import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// The posting feature flag, switchable per test
const flag = vi.hoisted(() => ({ on: true }));
vi.mock("../../../config/features", () => ({
  get CUSTOMER_LISTINGS_ENABLED() {
    return flag.on;
  },
}));

vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../../../contexts/CompareContext", () => ({ useCompare: () => ({ compareList: [] }) }));

// Every tab is a stub that shows which tab rendered
const stub = (name) => ({ default: () => <div data-testid="tab">{name}</div> });
vi.mock("../../../features/customer-dashboard/CustomerProfileDashComponents/tabs/ProfileTab", () => stub("profile"));
vi.mock("../../../features/customer-dashboard/CustomerProfileDashComponents/tabs/ShortlistTab", () => stub("shortlist"));
vi.mock("../../../features/customer-dashboard/CustomerProfileDashComponents/tabs/CompareTab", () => stub("compare"));
vi.mock("../../../features/customer-dashboard/CustomerProfileDashComponents/tabs/OffersTab", () => stub("offers"));
vi.mock("../../../features/customer-dashboard/CustomerProfileDashComponents/tabs/SettingsTab", () => stub("settings"));
vi.mock("../../../features/customer-dashboard/CustomerProfileDashComponents/tabs/PostPropertyTab", () => stub("post"));
vi.mock("../../../features/customer-dashboard/CustomerProfileDashComponents/tabs/MyListingsTab", () => stub("listings"));

// What the shared workspace reports; the real hook is tested on its own
const workspace = vi.hoisted(() => ({ value: null, args: null }));
vi.mock("../../../features/listings/hooks/useListingsWorkspace", () => ({
  default: (args) => {
    workspace.args = args;
    return workspace.value;
  },
}));

import CustomerProfilePage from "../CustomerProfilePage";
import { AuthContext } from "../../../contexts/AuthContext";

const CUSTOMER = {
  _id: "c1",
  customerName: "Test User",
  customerEmail: "t@example.com",
  emailVerified: true,
  agent: { status: "none" },
};

const renderPage = ({ url = "/customer-profile", user = CUSTOMER } = {}) =>
  render(
    <AuthContext.Provider value={{ currentUser: user, loading: false, logout: vi.fn() }}>
      <MemoryRouter initialEntries={[url]}>
        <CustomerProfilePage />
      </MemoryRouter>
    </AuthContext.Provider>
  );

const shownTab = async () => (await screen.findByTestId("tab")).textContent;

describe("CustomerProfilePage posting tabs", () => {
  beforeEach(() => {
    flag.on = true;
    workspace.args = null;
    workspace.value = {
      handleStartNew: vi.fn(),
      properties: [
        { _id: "a", status: "pending" },
        { _id: "b", status: "pending" },
        { _id: "c", status: "approved" },
      ],
    };
  });

  it("shows the Post a property button and My listings with the pending count", async () => {
    renderPage();

    expect(screen.getByRole("button", { name: "Post a property" })).toBeInTheDocument();
    const listings = screen.getByRole("button", { name: "My listings" });
    expect(listings).toHaveTextContent("2");
    expect(await shownTab()).toBe("profile");
  });

  it("opens the Post tab from the button and My listings from the menu", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Post a property" }));
    expect(await shownTab()).toBe("post");

    fireEvent.click(screen.getByRole("button", { name: "My listings" }));
    expect(await screen.findByText("listings")).toBeInTheDocument();
  });

  it("the Post a property button starts a fresh listing, not the one that was being edited", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Post a property" }));

    expect(workspace.value.handleStartNew).toHaveBeenCalledTimes(1);
    expect(await shownTab()).toBe("post");
  });

  it("opens the tab named in ?tab=", async () => {
    renderPage({ url: "/customer-profile?tab=post" });

    expect(await shownTab()).toBe("post");
  });

  it("ignores an unknown ?tab= value", async () => {
    renderPage({ url: "/customer-profile?tab=constructor" });

    expect(await shownTab()).toBe("profile");
  });

  it("with the feature off: no button, no menu item, no fetching, and ?tab=post is ignored", async () => {
    flag.on = false;
    renderPage({ url: "/customer-profile?tab=post" });

    expect(screen.queryByRole("button", { name: "Post a property" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "My listings" })).not.toBeInTheDocument();
    expect(await shownTab()).toBe("profile");
    expect(workspace.args.enabled).toBe(false);
  });

  it("posts as an agent only once approved, and says so in the sidebar", () => {
    renderPage({ user: { ...CUSTOMER, agent: { status: "approved" } } });

    expect(workspace.args.role).toBe("agent");
    expect(screen.getByText("Agent account")).toBeInTheDocument();
  });

  it("a plain customer posts as an owner", () => {
    renderPage();

    expect(workspace.args.role).toBe("owner");
    expect(screen.getByText("Customer account")).toBeInTheDocument();
  });

  it("after a save the page switches to My listings; Edit switches to Post", async () => {
    renderPage();

    act(() => workspace.args.onSaved());
    expect(await screen.findByText("listings")).toBeInTheDocument();

    act(() => workspace.args.onEdit());
    expect(await screen.findByText("post")).toBeInTheDocument();
  });
});
