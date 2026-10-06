/* eslint-disable react-refresh/only-export-components */
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

export const makeProperty = (overrides = {}) => ({
  _id: "p1",
  title: "Skyline Heights",
  propertyType: "Apartment",
  developerName: "Acme Developers",
  city: "Mumbai",
  locality: "Andheri",
  state: "Maharashtra",
  price: 10000000,
  bhk: 2,
  area: { value: 1000, unit: "sqft" },
  amenities: ["Gym", "Swimming Pool"],
  facilities: [],
  security: [],
  possessionStatus: "Ready to Move",
  reraApproved: true,
  reraNumber: "P51800012345",
  ...overrides,
});

export const skyline = makeProperty();
export const greenValley = makeProperty({
  _id: "p2",
  title: "Green Valley",
  city: "Pune",
  locality: "Baner",
  price: 15000000,
  possessionStatus: "Under Construction",
  reraApproved: false,
  reraNumber: undefined,
});

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

// Renders `ui` at `initialPath` inside a real router, with a probe that
// exposes the current pathname so tests can assert on navigation.
export const renderWithRouter = (ui, { initialPath = "/" } = {}) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={ui} />
      </Routes>
      <LocationDisplay />
    </MemoryRouter>
  );
