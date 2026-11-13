import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import API from "../../../api/api";
import Footer from "../Footer";

vi.mock("../../../api/api", () => ({ default: { get: vi.fn() } }));

const EMPTY = { residential: [], commercial: [], retail: [], industrial: [], plot: [] };

const respond = (data, success = true) =>
  API.get.mockResolvedValue({ data: { success, data: { ...EMPTY, ...data } } });

const renderFooter = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Footer />
    </QueryClientProvider>
  );
};

beforeEach(() => vi.clearAllMocks());

describe("Footer popular searches", () => {
  it("shows a tab only for categories that have links, Residential first", async () => {
    respond({
      residential: [{ label: "Flats in Mumbai", params: { propertyType: "Flats/Apartments", city: "Mumbai" } }],
      plot: [{ label: "Plots in Panvel", params: { propertyType: "Plot", locality: "Panvel" } }],
    });
    renderFooter();

    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Residential", "Plots"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("tab", { name: "Commercial" })).not.toBeInTheDocument();
  });

  it("links each search to the matching /properties filters", async () => {
    respond({
      residential: [
        { label: "Flats in Thane West", params: { propertyType: "Flats/Apartments", locality: "Thane West" } },
        {
          label: "2 BHK in Thane West",
          params: { propertyType: ["Flats/Apartments", "Villa"], locality: "Thane West", bhk: 2 },
        },
      ],
    });
    renderFooter();

    expect(await screen.findByRole("link", { name: "Flats in Thane West" })).toHaveAttribute(
      "href",
      "/properties?propertyType=Flats%2FApartments&locality=Thane+West"
    );
    // Arrays become repeated keys, not "Flats/Apartments,Villa".
    expect(screen.getByRole("link", { name: "2 BHK in Thane West" })).toHaveAttribute(
      "href",
      "/properties?propertyType=Flats%2FApartments&propertyType=Villa&locality=Thane+West&bhk=2"
    );
  });

  it("hides the social row while no real profile URLs are set", () => {
    respond({});
    renderFooter();

    expect(screen.queryByRole("list", { name: /social media/i })).not.toBeInTheDocument();
  });

  it("switches the list on click and with the arrow keys", async () => {
    const user = userEvent.setup();
    respond({
      residential: [{ label: "Flats in Mumbai", params: { city: "Mumbai" } }],
      commercial: [{ label: "Office spaces in BKC", params: { locality: "BKC" } }],
    });
    renderFooter();

    await user.click(await screen.findByRole("tab", { name: "Commercial" }));
    expect(screen.getByRole("link", { name: "Office spaces in BKC" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Flats in Mumbai" })).not.toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Residential" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "Flats in Mumbai" })).toBeInTheDocument();
  });

  it("hides the whole section when no category has listings", async () => {
    respond({});
    renderFooter();

    expect(await screen.findByRole("link", { name: "Privacy policy" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Popular searches")).not.toBeInTheDocument());
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("ignores the old plain-string response shape instead of rendering broken links", async () => {
    respond({ residential: ["Andheri", "Powai"] });
    renderFooter();

    expect(await screen.findByRole("link", { name: "Privacy policy" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByLabelText("Popular searches")).not.toBeInTheDocument());
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("hides the section when the request fails, but keeps the rest of the footer", async () => {
    API.get.mockRejectedValue(new Error("network"));
    renderFooter();

    await waitFor(() => expect(screen.queryByLabelText("Popular searches")).not.toBeInTheDocument());
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About us" })).toHaveAttribute("href", "/#about");
  });
});
