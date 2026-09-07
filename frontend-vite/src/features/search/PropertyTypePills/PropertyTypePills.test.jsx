// // src/pages/Home/PropertyTypePills/PropertyTypePills.test.jsx
// import { describe, it, expect, vi, beforeEach } from "vitest";
// import { render, screen, fireEvent, act } from "@testing-library/react";
// import PropertyTypePills from "./PropertyTypePills";

// // Real config content isn't relevant to this component's logic — swap in a
// // small fixture with the same shape it actually reads (key/group/target/items).
// vi.mock("../../../assests/constants/propertyTypeConfig", () => ({
//   PROPERTY_TYPE_CONFIG: [
//     {
//       key: "residential",
//       group: "Residential",
//       target: "propertyType",
//       items: [
//         { value: "apartment", label: "Apartment" },
//         { value: "villa", label: "Villa" },
//       ],
//     },
//     {
//       key: "commercial",
//       group: "Commercial",
//       target: "propertyType",
//       items: [{ value: "office", label: "Office" }],
//     },
//   ],
// }));

// // useOutsideClick has its own unit tests. Here we only need to confirm
// // PropertyTypePills wires it correctly, so capture the callback it registers
// // and invoke it directly to simulate an outside click.
// let capturedOutsideClickCallback = null;
// vi.mock("../../../hooks/useOutsideClick", () => ({
//   useOutsideClick: (active, refs, callback) => {
//     capturedOutsideClickCallback = active ? callback : null;
//   },
// }));

// describe("PropertyTypePills", () => {
//   beforeEach(() => {
//     capturedOutsideClickCallback = null;
//   });

//   it("starts closed, showing the default 'Property Type' label", () => {
//     render(<PropertyTypePills valueMap={{}} onChange={vi.fn()} />);
//     expect(screen.getByText("Property Type")).toBeInTheDocument();
//     expect(screen.queryByText("Apartment")).not.toBeInTheDocument();
//   });

//   it("opens the panel with the first section's pills expanded by default", () => {
//     render(<PropertyTypePills valueMap={{}} onChange={vi.fn()} />);
//     fireEvent.click(screen.getByRole("button", { name: /property type/i }));

//     expect(screen.getByText("Apartment")).toBeInTheDocument();
//     expect(screen.getByText("Villa")).toBeInTheDocument();
//     // Second section stays collapsed until its own header is clicked
//     expect(screen.queryByText("Office")).not.toBeInTheDocument();
//   });

//   it("expands a section and collapses the previous one on click", () => {
//     render(<PropertyTypePills valueMap={{}} onChange={vi.fn()} />);
//     fireEvent.click(screen.getByRole("button", { name: /property type/i }));
//     fireEvent.click(screen.getByRole("button", { name: /commercial/i }));

//     expect(screen.getByText("Office")).toBeInTheDocument();
//     expect(screen.queryByText("Apartment")).not.toBeInTheDocument();
//   });

//   it("calls onChange with the value added when an unselected pill is clicked", () => {
//     const onChange = vi.fn();
//     render(<PropertyTypePills valueMap={{}} onChange={onChange} />);
//     fireEvent.click(screen.getByRole("button", { name: /property type/i }));
//     fireEvent.click(screen.getByRole("button", { name: "Apartment" }));

//     expect(onChange).toHaveBeenCalledWith("propertyType", ["apartment"]);
//   });

//   it("calls onChange with the value removed when an active pill is clicked again", () => {
//     const onChange = vi.fn();
//     render(<PropertyTypePills valueMap={{ propertyType: ["apartment"] }} onChange={onChange} />);
//     fireEvent.click(screen.getByRole("button", { name: /apartment/i }));
//     fireEvent.click(screen.getByRole("button", { name: "Apartment (selected)" }));

//     expect(onChange).toHaveBeenCalledWith("propertyType", []);
//   });

//   it("shows a '+N' summary once more than one option is selected", () => {
//     render(
//       <PropertyTypePills valueMap={{ propertyType: ["apartment", "villa"] }} onChange={vi.fn()} />
//     );
//     expect(screen.getByText("Apartment +1")).toBeInTheDocument();
//   });

//   it("closes the panel when the outside-click hook fires", () => {
//     render(<PropertyTypePills valueMap={{}} onChange={vi.fn()} />);
//     fireEvent.click(screen.getByRole("button", { name: /property type/i }));
//     expect(screen.getByText("Apartment")).toBeInTheDocument();

//     act(() => capturedOutsideClickCallback());

//     expect(screen.queryByText("Apartment")).not.toBeInTheDocument();
//   });
// });