// // frontend-vite/src/pages/Home/HomePageComponents/PropertyCardSmall.test.jsx
// //
// // ASSUMPTION: mock paths mirror this component's own source imports
// // ("../../../contexts/CompareContext", "../../../utils/formatters",
// // "../../../utils/propertyHelpers"). Re-check if the file has since moved.
// import { describe, it, expect, vi, beforeEach } from "vitest";
// import { render, screen, fireEvent } from "@testing-library/react";
// import PropertyCardSmall from "./PropertyCardSmall";

// const mockNavigate = vi.fn();
// vi.mock("react-router-dom", () => ({
//   useNavigate: () => mockNavigate,
// }));

// const mockAddToCompare = vi.fn();
// vi.mock("../../../contexts/CompareContext", () => ({
//   useCompare: () => ({ addToCompare: mockAddToCompare }),
// }));

// vi.mock("../../../utils/formatters", () => ({
//   formatCurrencyShort: (price) => `\u20b9${price}`,
// }));

// vi.mock("../../../utils/propertyHelpers", () => ({
//   getPropertyImage: (property) => property?.image || "http://img/original.jpg",
//   fallbackImg: "http://img/fallback.jpg",
// }));

// const baseProperty = {
//   _id: "p1",
//   title: "2BHK in Andheri",
//   propertyType: "Apartment",
//   developerName: "ABC Builders",
//   possessionStatus: "Ready to move",
//   locality: "Andheri West",
//   bhk: 2,
//   ageOfProperty: "New",
//   price: 9500000,
//   area: { value: 1200, unit: "sq ft" },
// };

// describe("PropertyCardSmall", () => {
//   beforeEach(() => {
//     mockNavigate.mockClear();
//     mockAddToCompare.mockClear();
//   });

//   it("navigates to the property page on click when navigation isn't disabled", () => {
//     render(<PropertyCardSmall property={baseProperty} />);
//     fireEvent.click(screen.getByRole("button"));
//     expect(mockNavigate).toHaveBeenCalledTimes(1);
//     expect(mockNavigate).toHaveBeenCalledWith("/property/p1");
//   });

//   it("does NOT navigate on click when the parent owns routing (disableNavigation) — regression guard for the double-nav bug", () => {
//     render(<PropertyCardSmall property={baseProperty} disableNavigation />);
//     fireEvent.click(screen.getByRole("presentation"));
//     expect(mockNavigate).not.toHaveBeenCalled();
//   });

//   it("adds to compare without also triggering the card's own navigation", () => {
//     render(<PropertyCardSmall property={baseProperty} />);
//     fireEvent.click(screen.getByRole("button", { name: /compare/i }));

//     expect(mockAddToCompare).toHaveBeenCalledWith(baseProperty);
//     expect(mockNavigate).not.toHaveBeenCalled();
//   });

//   it("navigates on Enter when the card is enabled/focusable", () => {
//     render(<PropertyCardSmall property={baseProperty} />);
//     fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
//     expect(mockNavigate).toHaveBeenCalledWith("/property/p1");
//   });

//   it("does not navigate on Enter when navigation is disabled", () => {
//     render(<PropertyCardSmall property={baseProperty} disableNavigation />);
//     fireEvent.keyDown(screen.getByRole("presentation"), { key: "Enter" });
//     expect(mockNavigate).not.toHaveBeenCalled();
//   });

//   it("swaps to the fallback image if the original fails to load", () => {
//     render(<PropertyCardSmall property={baseProperty} />);
//     const img = screen.getByRole("img");
//     fireEvent.error(img);
//     expect(img.src).toBe("http://img/fallback.jpg");
//   });

//   it("falls back to placeholder text for missing/malformed property fields (scraped/ETL data)", () => {
//     render(<PropertyCardSmall property={{ _id: "p2" }} />);
//     expect(screen.getByText("Untitled Property")).toBeInTheDocument();
//     expect(screen.getByText(/Apartment NA/)).toBeInTheDocument();
//     expect(screen.getByText(/Developer NA/)).toBeInTheDocument();
//     expect(screen.getByText("NA BHK")).toBeInTheDocument();
//     expect(screen.getAllByText("NA").length).toBeGreaterThan(0); // possession + locality
//   });

//   it("only renders the area feature when area.value is present", () => {
//     const { rerender } = render(<PropertyCardSmall property={baseProperty} />);
//     expect(screen.getByText(/1200 sq ft/)).toBeInTheDocument();

//     rerender(<PropertyCardSmall property={{ ...baseProperty, area: undefined }} />);
//     expect(screen.queryByText(/sq ft/)).not.toBeInTheDocument();
//   });

//   it("renders the formatted price", () => {
//     render(<PropertyCardSmall property={baseProperty} />);
//     expect(screen.getByText("\u20b99500000")).toBeInTheDocument();
//   });
// });