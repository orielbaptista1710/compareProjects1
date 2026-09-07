// // src/pages/Home/HeroSearch/MainSearchBar.test.jsx
// import { describe, it, expect, vi, beforeEach } from "vitest";
// import { render, screen, fireEvent } from "@testing-library/react";
// import MainSearchBar from "./MainSearchBar";

// const mockNavigate = vi.fn();
// vi.mock("react-router-dom", () => ({
//   useNavigate: () => mockNavigate,
// }));

// const mockSetCity = vi.fn();
// vi.mock("../../../contexts/CityContext", () => ({
//   useCity: () => ({ setCity: mockSetCity }),
// }));

// // LocationSearchBar, PropertyTypePills, and ExpandableSearch each have their
// // own suites. Here we only care that MainSearchBar wires their callbacks into
// // the right /properties query string, so they're stubbed to controls that
// // let a test fire the exact onSelect/onChange shapes the real components emit.
// vi.mock("../ExpandableSearch/ExpandableSearch", () => ({
//   default: () => <div data-testid="expandable-search" />,
// }));

// vi.mock("../LocationSearchBar/LocationSearchBar", () => ({
//   default: ({ onSelect }) => (
//     <div>
//       <button onClick={() => onSelect({ type: "city", label: "Mumbai", city: "Mumbai" })}>
//         select-city
//       </button>
//       <button
//         onClick={() =>
//           onSelect({
//             type: "locality-group",
//             label: "Andheri",
//             city: "Mumbai",
//             localities: ["Andheri East", "Andheri West"],
//           })
//         }
//       >
//         select-locality-group
//       </button>
//       <button
//         onClick={() =>
//           onSelect({ type: "text", label: "  2bhk near station  ", city: null, locality: null })
//         }
//       >
//         select-text
//       </button>
//       <button onClick={() => onSelect({ type: "text", label: "", city: null, locality: null })}>
//         clear-selection
//       </button>
//     </div>
//   ),
// }));

// vi.mock("../PropertyTypePills/PropertyTypePills", () => ({
//   default: ({ onChange }) => (
//     <button onClick={() => onChange("propertyType", ["apartment", "villa"])}>
//       select-pills
//     </button>
//   ),
// }));

// describe("MainSearchBar", () => {
//   beforeEach(() => {
//     mockNavigate.mockClear();
//     mockSetCity.mockClear();
//   });

//   it("renders the location search, pills, and quick search", () => {
//     render(<MainSearchBar />);
//     expect(screen.getByText("select-city")).toBeInTheDocument();
//     expect(screen.getByText("select-pills")).toBeInTheDocument();
//     expect(screen.getByTestId("expandable-search")).toBeInTheDocument();
//   });

//   it("navigates with a city param and updates CityContext when a city is picked", () => {
//     render(<MainSearchBar />);
//     fireEvent.click(screen.getByText("select-city"));
//     fireEvent.click(screen.getByRole("button", { name: /search/i }));

//     expect(mockSetCity).toHaveBeenCalledWith("Mumbai");
//     expect(mockNavigate).toHaveBeenCalledWith("/properties?city=Mumbai");
//   });

//   it("navigates with city + repeated locality params for a locality-group pick", () => {
//     render(<MainSearchBar />);
//     fireEvent.click(screen.getByText("select-locality-group"));
//     fireEvent.click(screen.getByRole("button", { name: /search/i }));

//     const url = mockNavigate.mock.calls[0][0];
//     expect(url).toContain("city=Mumbai");
//     expect(url).toContain("locality=Andheri+East");
//     expect(url).toContain("locality=Andheri+West");
//     expect(mockSetCity).toHaveBeenCalledWith("Mumbai");
//   });

//   it("navigates with a trimmed free-text search param and leaves CityContext alone", () => {
//     render(<MainSearchBar />);
//     fireEvent.click(screen.getByText("select-text"));
//     fireEvent.click(screen.getByRole("button", { name: /search/i }));

//     expect(mockNavigate).toHaveBeenCalledWith("/properties?search=2bhk+near+station");
//     expect(mockSetCity).not.toHaveBeenCalled();
//   });

//   it("does not add a search param for blank/whitespace-only text", () => {
//     render(<MainSearchBar />);
//     fireEvent.click(screen.getByText("select-text"));
//     fireEvent.click(screen.getByText("clear-selection"));
//     fireEvent.click(screen.getByRole("button", { name: /search/i }));

//     expect(mockNavigate).toHaveBeenCalledWith("/properties?");
//     expect(mockSetCity).not.toHaveBeenCalled();
//   });

//   it("merges pill filters with the location params", () => {
//     render(<MainSearchBar />);
//     fireEvent.click(screen.getByText("select-city"));
//     fireEvent.click(screen.getByText("select-pills"));
//     fireEvent.click(screen.getByRole("button", { name: /search/i }));

//     const url = mockNavigate.mock.calls[0][0];
//     expect(url).toContain("city=Mumbai");
//     expect(url).toContain("propertyType=apartment");
//     expect(url).toContain("propertyType=villa");
//   });

//   it("navigates to /properties with no params when nothing is selected", () => {
//     render(<MainSearchBar />);
//     fireEvent.click(screen.getByRole("button", { name: /search/i }));

//     expect(mockNavigate).toHaveBeenCalledWith("/properties?");
//     expect(mockSetCity).not.toHaveBeenCalled();
//   });
// });