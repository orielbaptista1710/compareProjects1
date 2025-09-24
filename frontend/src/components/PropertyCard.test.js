// src/components/PropertyCard.test.js
import { render, screen } from "@testing-library/react";
import PropertyCard from "./PropertyCard";

// Mock react-router-dom so Link just renders a <div>
jest.mock("react-router-dom", () => ({
  Link: ({ children }) => <div>{children}</div>,
}));

// Fake property
const fakeProperty = {
  _id: "123",
  title: "Luxury Apartment",
  price: 5000000,
  location: { city: "Mumbai" },
};

test("renders PropertyCard with title, price, and location", () => {
  render(<PropertyCard property={fakeProperty} />);

  expect(screen.getByText(/Luxury Apartment/i)).toBeInTheDocument();
  expect(screen.getByText(/5000000/)).toBeInTheDocument();
  expect(screen.getByText(/Mumbai/i)).toBeInTheDocument();
});
