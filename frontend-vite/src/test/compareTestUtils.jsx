/* eslint-disable react-refresh/only-export-components */
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Fresh client per render so cached query results never leak between tests.
export const makeTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

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
// Pass `initialEntries` to start with in-app history behind the page.
export const renderWithRouter = (ui, { initialPath = "/", initialEntries = [initialPath] } = {}) =>
  render(
    <QueryClientProvider client={makeTestQueryClient()}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
        <Routes>
          <Route path="*" element={ui} />
        </Routes>
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>
  );
