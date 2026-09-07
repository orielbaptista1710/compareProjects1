// src/pages/Home/HomePageComponents/ExpandableSearch.test.jsx
//
// ASSUMPTION: mock paths below mirror this component's OWN source imports
// ("../../../api", "../../../pages/Home/HomePageComponents/PropertyCardSmall").
// If ExpandableSearch has since moved into its own folder (like MainSearchBar
// did), re-check the real relative depth of those imports before trusting
// these mocks to actually intercept anything.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ExpandableSearch from "./ExpandableSearch";
import API from "../../../api";

vi.mock("../../../api", () => ({
  default: { get: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../pages/Home/HomePageComponents/PropertyCardSmall", () => ({
  default: ({ property }) => <div>{property.title}</div>,
}));

const property = (id, title) => ({ _id: id, title });

// Mirrors how axios rejects a request once its AbortController fires, so we
// can control exactly when each in-flight "request" resolves/rejects.
function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("ExpandableSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    API.get.mockReset();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const getInput = () => screen.getByLabelText("Search properties");

  it("does not call the API until 2+ chars are typed and the 350ms debounce settles", () => {
    render(<ExpandableSearch />);
    fireEvent.change(getInput(), { target: { value: "a" } });
    act(() => vi.advanceTimersByTime(400));
    expect(API.get).not.toHaveBeenCalled();

    fireEvent.change(getInput(), { target: { value: "ab" } });
    act(() => vi.advanceTimersByTime(300)); // still inside the debounce window
    expect(API.get).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(60));
    expect(API.get).toHaveBeenCalledTimes(1);
    expect(API.get).toHaveBeenCalledWith(expect.stringContaining("query=ab"), expect.any(Object));
  });

  it("collapses a burst of keystrokes into a single request", () => {
    render(<ExpandableSearch />);
    "flat".split("").forEach((_, i) => {
      fireEvent.change(getInput(), { target: { value: "flat".slice(0, i + 1) } });
      act(() => vi.advanceTimersByTime(100)); // < 350ms between keystrokes
    });
    act(() => vi.advanceTimersByTime(350));

    expect(API.get).toHaveBeenCalledTimes(1);
    expect(API.get).toHaveBeenCalledWith(expect.stringContaining("query=flat"), expect.any(Object));
  });

  it("aborts the in-flight request when the query changes before it resolves", () => {
    API.get.mockReturnValueOnce(deferred().promise).mockReturnValueOnce(deferred().promise);

    render(<ExpandableSearch />);
    fireEvent.change(getInput(), { target: { value: "ab" } });
    act(() => vi.advanceTimersByTime(350));
    const firstSignal = API.get.mock.calls[0][1].signal;

    fireEvent.change(getInput(), { target: { value: "abc" } });
    act(() => vi.advanceTimersByTime(350));

    expect(firstSignal.aborted).toBe(true);
    expect(API.get).toHaveBeenCalledTimes(2);
  });

  it("does not show an error banner when a stale request is aborted mid-typing", async () => {
    const first = deferred();
    API.get.mockReturnValueOnce(first.promise).mockReturnValueOnce(deferred().promise);

    render(<ExpandableSearch />);
    fireEvent.change(getInput(), { target: { value: "ab" } });
    act(() => vi.advanceTimersByTime(350));
    fireEvent.change(getInput(), { target: { value: "abc" } });
    act(() => vi.advanceTimersByTime(350));

    await act(async () => {
      const err = new Error("canceled");
      err.name = "CanceledError";
      first.reject(err);
      await Promise.resolve();
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a genuine fetch failure (not an abort)", async () => {
    const first = deferred();
    API.get.mockReturnValueOnce(first.promise);

    render(<ExpandableSearch />);
    fireEvent.change(getInput(), { target: { value: "ab" } });
    act(() => vi.advanceTimersByTime(350));

    await act(async () => {
      first.reject(new Error("network down"));
      await Promise.resolve();
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to fetch results");
  });

  it("blocks submit while a request is in flight, so it can't navigate to a stale first result", async () => {
    const first = deferred();
    API.get.mockReturnValueOnce(first.promise);

    render(<ExpandableSearch />);
    fireEvent.change(getInput(), { target: { value: "ab" } });
    act(() => vi.advanceTimersByTime(350));

    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(mockNavigate).not.toHaveBeenCalled();

    await act(async () => {
      first.resolve({ data: [property("p1", "Flat A")] });
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/property/p1");
  });

  it("aborts the in-flight request on unmount", () => {
    API.get.mockReturnValueOnce(deferred().promise);
    const { unmount } = render(<ExpandableSearch />);
    fireEvent.change(getInput(), { target: { value: "ab" } });
    act(() => vi.advanceTimersByTime(350));
    const signal = API.get.mock.calls[0][1].signal;

    unmount();
    expect(signal.aborted).toBe(true);
  });

  it("clears the query and aborts the request on Escape", () => {
    API.get.mockReturnValueOnce(deferred().promise);
    render(<ExpandableSearch />);
    fireEvent.change(getInput(), { target: { value: "ab" } });
    act(() => vi.advanceTimersByTime(350));
    const signal = API.get.mock.calls[0][1].signal;

    fireEvent.keyDown(document, { key: "Escape" });

    expect(getInput().value).toBe("");
    expect(signal.aborted).toBe(true);
  });

  it("navigates to the clicked result and resets the search", async () => {
    API.get.mockResolvedValueOnce({ data: [property("p1", "Flat A"), property("p2", "Flat B")] });

    render(<ExpandableSearch />);
    fireEvent.change(getInput(), { target: { value: "flat" } });
    await act(async () => {
      vi.advanceTimersByTime(350);
      await Promise.resolve();
    });

    fireEvent.click(screen.getByText("Flat B"));
    expect(mockNavigate).toHaveBeenCalledWith("/property/p2");
    expect(getInput().value).toBe("");
  });
});