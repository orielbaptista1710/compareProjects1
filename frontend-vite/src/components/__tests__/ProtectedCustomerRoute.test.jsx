import { describe, it, expect , vi} from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";


vi.mock("../../config/firebase.js", () => ({
  CustomerAuth: {},
  default: {},
}));

/*
 * Mock the spinner so these tests focus only on
 * ProtectedCustomerRoute's routing behavior.
 */
vi.mock("../../shared/LoadingSpinners/LoadingSpinner", () => ({
  default: ({ text = "Loading..." }) => (
    <div data-testid="loading-spinner">{text}</div>
  ),
}));

import ProtectedCustomerRoute from "../ProtectedCustomerRoute";
import { AuthContext } from "../../contexts/AuthContext";



/*
 * Helper component used to verify redirects.
 */
const LocationDisplay = () => {
  const location = useLocation();

  return (
    <div data-testid="location">
      {location.pathname}
    </div>
  );
};

/*
 * Reusable test helper.
 */
const renderProtectedRoute = ({
  currentUser = null,
  loading = false,
  syncingProfile = false,
  children = <div>Protected Content</div>,
  initialEntries = ["/customer-profile"],
} = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider
        value={{
          currentUser,
          loading,
          syncingProfile,
        }}
      >
        <ProtectedCustomerRoute>
          {children}
        </ProtectedCustomerRoute>

        <LocationDisplay />
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("ProtectedCustomerRoute", () => {
  describe("loading state", () => {
    it("shows the loading spinner while Firebase auth state is loading", () => {
      renderProtectedRoute({
        loading: true,
        syncingProfile: false,
        currentUser: null,
      });

      expect(
        screen.getByTestId("loading-spinner")
      ).toBeInTheDocument();
    });

    it("does not render protected content while Firebase auth state is loading", () => {
      renderProtectedRoute({
        loading: true,
        syncingProfile: false,
        currentUser: {
          id: "customer-1",
        },
      });

      expect(
        screen.queryByText("Protected Content")
      ).not.toBeInTheDocument();
    });

    it("does not redirect while Firebase auth state is loading", () => {
      renderProtectedRoute({
        loading: true,
        syncingProfile: false,
        currentUser: null,
      });

      expect(
        screen.getByTestId("location")
      ).toHaveTextContent("/customer-profile");
    });
  });

  describe("profile syncing state", () => {
    it("shows the loading spinner while the customer profile is syncing", () => {
      renderProtectedRoute({
        loading: false,
        syncingProfile: true,
        currentUser: null,
      });

      expect(
        screen.getByTestId("loading-spinner")
      ).toBeInTheDocument();
    });

    it("does not render protected content while the customer profile is syncing", () => {
      renderProtectedRoute({
        loading: false,
        syncingProfile: true,
        currentUser: null,
      });

      expect(
        screen.queryByText("Protected Content")
      ).not.toBeInTheDocument();
    });

    it("does not redirect to login while the customer profile is syncing", () => {
      renderProtectedRoute({
        loading: false,
        syncingProfile: true,
        currentUser: null,
      });

      expect(
        screen.getByTestId("location")
      ).toHaveTextContent("/customer-profile");
    });
  });

  describe("authenticated customer", () => {
    it("renders protected content when the customer is authenticated", () => {
      const customer = {
        _id: "customer-1",
        name: "Test Customer",
        email: "customer@example.com",
      };

      renderProtectedRoute({
        currentUser: customer,
        loading: false,
        syncingProfile: false,
      });

      expect(
        screen.getByText("Protected Content")
      ).toBeInTheDocument();
    });

    it("does not show the loading spinner for an authenticated customer", () => {
      renderProtectedRoute({
        currentUser: {
          _id: "customer-1",
        },
        loading: false,
        syncingProfile: false,
      });

      expect(
        screen.queryByTestId("loading-spinner")
      ).not.toBeInTheDocument();
    });

    it("keeps the customer on the protected route", () => {
      renderProtectedRoute({
        currentUser: {
          _id: "customer-1",
        },
        loading: false,
        syncingProfile: false,
      });

      expect(
        screen.getByTestId("location")
      ).toHaveTextContent("/customer-profile");
    });

    it("renders custom protected children", () => {
      renderProtectedRoute({
        currentUser: {
          _id: "customer-1",
        },
        loading: false,
        syncingProfile: false,
        children: (
          <section>
            <h1>Customer Dashboard</h1>
            <p>Private customer information</p>
          </section>
        ),
      });

      expect(
        screen.getByRole("heading", {
          name: "Customer Dashboard",
        })
      ).toBeInTheDocument();

      expect(
        screen.getByText("Private customer information")
      ).toBeInTheDocument();
    });
  });

  describe("unauthenticated customer", () => {
    it("redirects to customer login when no customer exists", () => {
      renderProtectedRoute({
        currentUser: null,
        loading: false,
        syncingProfile: false,
      });

      expect(
        screen.getByTestId("location")
      ).toHaveTextContent("/customer-login");
    });

    it("does not render protected content when no customer exists", () => {
      renderProtectedRoute({
        currentUser: null,
        loading: false,
        syncingProfile: false,
      });

      expect(
        screen.queryByText("Protected Content")
      ).not.toBeInTheDocument();
    });

    it("does not show the loading spinner after authentication has finished", () => {
      renderProtectedRoute({
        currentUser: null,
        loading: false,
        syncingProfile: false,
      });

      expect(
        screen.queryByTestId("loading-spinner")
      ).not.toBeInTheDocument();
    });
  });

  describe("state priority", () => {
    it("prioritizes loading over syncingProfile", () => {
      renderProtectedRoute({
        currentUser: null,
        loading: true,
        syncingProfile: true,
      });

      expect(
        screen.getByTestId("loading-spinner")
      ).toBeInTheDocument();

      expect(
        screen.getByTestId("location")
      ).toHaveTextContent("/customer-profile");
    });

    it("does not redirect if a user temporarily becomes null while syncing", () => {
      renderProtectedRoute({
        currentUser: null,
        loading: false,
        syncingProfile: true,
      });

      expect(
        screen.getByTestId("loading-spinner")
      ).toBeInTheDocument();

      expect(
        screen.getByTestId("location")
      ).toHaveTextContent("/customer-profile");
    });

    it("renders children only when both loading states are false and a user exists", () => {
      renderProtectedRoute({
        currentUser: {
          _id: "customer-1",
        },
        loading: false,
        syncingProfile: false,
      });

      expect(
        screen.getByText("Protected Content")
      ).toBeInTheDocument();
    });
  });
});