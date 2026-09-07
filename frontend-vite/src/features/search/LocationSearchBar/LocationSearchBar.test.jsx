// // src/pages/Home/HomePageComponents/LocationSearchBar.test.jsx
// //
// // ASSUMPTION: mock path below ("../../../api") mirrors this component's own
// // source import. Re-check if the file has since moved into its own folder.
// import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// import { render, screen, fireEvent, act } from "@testing-library/react";
// import LocationSearchBar from "./LocationSearchBar";
// import API from "../../../api";

// vi.mock("../../../api", () => ({
//   default: { get: vi.fn() },
// }));

// function deferred() {
//   let resolve, reject;
//   const promise = new Promise((res, rej) => {
//     resolve = res;
//     reject = rej;
//   });
//   return { promise, resolve, reject };
// }

// const suggestion = (overrides = {}) => ({
//   type: "city",
//   label: "Mumbai",
//   city: "Mumbai",
//   ...overrides,
// });

// describe("LocationSearchBar", () => {
//   beforeEach(() => {
//     vi.useFakeTimers();
//     API.get.mockReset();
//     window.localStorage.clear();
//   });

//   afterEach(() => {
//     vi.useRealTimers();
//   });

//   const getInput = () => screen.getByRole("combobox");

//   it("does not query until 2+ chars are typed and the 300ms debounce settles", () => {
//     render(<LocationSearchBar onSelect={vi.fn()} />);
//     fireEvent.change(getInput(), { target: { value: "m" } });
//     act(() => vi.advanceTimersByTime(400));
//     expect(API.get).not.toHaveBeenCalled();

//     fireEvent.change(getInput(), { target: { value: "mu" } });
//     act(() => vi.advanceTimersByTime(299));
//     expect(API.get).not.toHaveBeenCalled();
//     act(() => vi.advanceTimersByTime(50));
//     expect(API.get).toHaveBeenCalledTimes(1);
//   });

//   it("aborts the previous suggestion request when the query changes again", () => {
//     API.get.mockReturnValueOnce(deferred().promise).mockReturnValueOnce(deferred().promise);

//     render(<LocationSearchBar onSelect={vi.fn()} />);
//     fireEvent.change(getInput(), { target: { value: "mu" } });
//     act(() => vi.advanceTimersByTime(300));
//     const firstSignal = API.get.mock.calls[0][1].signal;

//     fireEvent.change(getInput(), { target: { value: "mum" } });
//     act(() => vi.advanceTimersByTime(300));

//     expect(firstSignal.aborted).toBe(true);
//     expect(API.get).toHaveBeenCalledTimes(2);
//   });

//   it("swallows a genuine fetch failure without crashing (logs, keeps suggestions empty)", async () => {
//     const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
//     API.get.mockReturnValueOnce(Promise.reject(new Error("network down")));

//     render(<LocationSearchBar onSelect={vi.fn()} />);
//     fireEvent.change(getInput(), { target: { value: "mu" } });
//     await act(async () => {
//       vi.advanceTimersByTime(300);
//       await Promise.resolve();
//       await Promise.resolve();
//     });

//     expect(consoleSpy).toHaveBeenCalled();
//     expect(screen.queryByRole("option")).not.toBeInTheDocument();
//     consoleSpy.mockRestore();
//   });

//   it("commits a city suggestion as a chip, clears the input, calls onSelect, and saves it to recents", async () => {
//     const onSelect = vi.fn();
//     API.get.mockResolvedValueOnce({ data: { results: [suggestion()] } });

//     render(<LocationSearchBar onSelect={onSelect} />);
//     fireEvent.change(getInput(), { target: { value: "mu" } });
//     await act(async () => {
//       vi.advanceTimersByTime(300);
//       await Promise.resolve();
//     });

//     fireEvent.mouseDown(screen.getByRole("option"));

//     expect(onSelect).toHaveBeenCalledWith(suggestion());
//     expect(getInput().value).toBe("");
//     expect(screen.getByText("Mumbai")).toBeInTheDocument(); // the chip
//     expect(JSON.parse(window.localStorage.getItem("recentLocationSearches"))).toEqual([
//       suggestion(),
//     ]);
//   });

//   it("commits a non-locality suggestion into the input instead of turning it into a chip", async () => {
//     const onSelect = vi.fn();
//     const landmark = suggestion({ type: "landmark", label: "Gateway of India" });
//     API.get.mockResolvedValueOnce({ data: { results: [landmark] } });

//     render(<LocationSearchBar onSelect={onSelect} />);
//     fireEvent.change(getInput(), { target: { value: "gate" } });
//     await act(async () => {
//       vi.advanceTimersByTime(300);
//       await Promise.resolve();
//     });

//     fireEvent.mouseDown(screen.getByRole("option"));

//     expect(getInput().value).toBe("Gateway of India");
//     expect(onSelect).toHaveBeenCalledWith(landmark);
//   });

//   it("reports free-typed text on every change while no chip is active", () => {
//     const onSelect = vi.fn();
//     render(<LocationSearchBar onSelect={onSelect} />);
//     fireEvent.change(getInput(), { target: { value: "hi" } });
//     expect(onSelect).toHaveBeenCalledWith({ type: "text", label: "hi", city: null, locality: null });
//   });

//   it("stops reporting keystrokes to the parent once a chip is active", async () => {
//     const onSelect = vi.fn();
//     API.get.mockResolvedValueOnce({ data: { results: [suggestion()] } });

//     render(<LocationSearchBar onSelect={onSelect} />);
//     fireEvent.change(getInput(), { target: { value: "mu" } });
//     await act(async () => {
//       vi.advanceTimersByTime(300);
//       await Promise.resolve();
//     });
//     fireEvent.mouseDown(screen.getByRole("option"));
//     onSelect.mockClear();

//     fireEvent.change(getInput(), { target: { value: "more text" } });
//     expect(onSelect).not.toHaveBeenCalled();
//   });

//   it("clears the chip and reports a blank selection when the remove button is clicked", async () => {
//     const onSelect = vi.fn();
//     API.get.mockResolvedValueOnce({ data: { results: [suggestion()] } });

//     render(<LocationSearchBar onSelect={onSelect} />);
//     fireEvent.change(getInput(), { target: { value: "mu" } });
//     await act(async () => {
//       vi.advanceTimersByTime(300);
//       await Promise.resolve();
//     });
//     fireEvent.mouseDown(screen.getByRole("option"));

//     fireEvent.click(screen.getByLabelText("Remove location"));

//     expect(onSelect).toHaveBeenLastCalledWith({ type: "text", label: "", city: null, locality: null });
//     expect(screen.queryByText("Mumbai")).not.toBeInTheDocument();
//   });

//   it("does not throw when localStorage holds corrupted JSON", () => {
//     window.localStorage.setItem("recentLocationSearches", "{not-json");
//     render(<LocationSearchBar onSelect={vi.fn()} />);
//     fireEvent.focus(getInput());
//     expect(screen.queryByRole("option")).not.toBeInTheDocument();
//   });

//   it("Enter with nothing highlighted just closes the dropdown (no accidental commit)", async () => {
//     const onSelect = vi.fn();
//     API.get.mockResolvedValueOnce({ data: { results: [suggestion()] } });

//     render(<LocationSearchBar onSelect={onSelect} />);
//     fireEvent.change(getInput(), { target: { value: "mu" } });
//     await act(async () => {
//       vi.advanceTimersByTime(300);
//       await Promise.resolve();
//     });
//     onSelect.mockClear();

//     fireEvent.keyDown(getInput(), { key: "Enter" });
//     expect(onSelect).not.toHaveBeenCalled();
//     expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
//   });

//   it("clamps ArrowDown navigation at the last suggestion", async () => {
//     API.get.mockResolvedValueOnce({
//       data: { results: [suggestion({ label: "A" }), suggestion({ label: "B" })] },
//     });

//     render(<LocationSearchBar onSelect={vi.fn()} />);
//     fireEvent.change(getInput(), { target: { value: "mu" } });
//     await act(async () => {
//       vi.advanceTimersByTime(300);
//       await Promise.resolve();
//     });

//     const input = getInput();
//     fireEvent.keyDown(input, { key: "ArrowDown" });
//     fireEvent.keyDown(input, { key: "ArrowDown" });
//     fireEvent.keyDown(input, { key: "ArrowDown" }); // should stay clamped at index 1
//     const options = screen.getAllByRole("option");
//     expect(options[1]).toHaveClass("lsb-option-active");
//   });

//   it("aborts the in-flight suggestion request on unmount", () => {
//     API.get.mockReturnValueOnce(deferred().promise);
//     const { unmount } = render(<LocationSearchBar onSelect={vi.fn()} />);
//     fireEvent.change(getInput(), { target: { value: "mu" } });
//     act(() => vi.advanceTimersByTime(300));
//     const signal = API.get.mock.calls[0][1].signal;

//     unmount();
//     expect(signal.aborted).toBe(true);
//   });
// });