import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";
import API from "../../api/api";
import toast from "react-hot-toast";

vi.mock("../../api/api", () => ({
  default: { get: vi.fn() },
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

function renderProtectedRoute({
  roles,
  children = <div>Protected Content</div>,
  initialEntries = ["/dashboard"],
} = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ProtectedRoute roles={roles}>{children}</ProtectedRoute>
      <LocationDisplay />
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading state before the auth check resolves", () => {
    API.get.mockReturnValue(new Promise(() => {})); // never resolves within this test

    renderProtectedRoute();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to /login when there is no authenticated user", async () => {
    API.get.mockRejectedValue({ response: { status: 401 } });

    renderProtectedRoute();

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/login")
    );
  });

  it("renders children when the user is authenticated and has an allowed role", async () => {
    API.get.mockResolvedValue({ data: { user: { role: "admin", displayName: "Admin" } } });

    renderProtectedRoute({ roles: ["admin"] });

    await waitFor(() =>
      expect(screen.getByText("Protected Content")).toBeInTheDocument()
    );
  });

  it("redirects to / and shows a toast when the user's role isn't in the allowed list", async () => {
    API.get.mockResolvedValue({ data: { user: { role: "user", displayName: "Dev" } } });

    renderProtectedRoute({ roles: ["admin"] });

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/")
    );
    expect(toast.error).toHaveBeenCalledWith(
      "You don't have permission to access that page."
    );
  });

  it("shows a deactivated-account toast on 403 and still redirects to /login", async () => {
    API.get.mockRejectedValue({ response: { status: 403 } });

    renderProtectedRoute();

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/login")
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Your account has been deactivated. Contact admin."
    );
  });

  it("shows a server-unreachable state on a 5xx error instead of redirecting to /login (regression test: this used to fall through to the login redirect, misleadingly implying re-login would help during an outage)", async () => {
    API.get.mockRejectedValue({ response: { status: 500 } });

    renderProtectedRoute();

    await waitFor(() =>
      expect(screen.getByText(/server unreachable/i)).toBeInTheDocument()
    );
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
  });

  it("shows a server-unreachable state on a network error with no response at all", async () => {
    API.get.mockRejectedValue({});

    renderProtectedRoute();

    await waitFor(() =>
      expect(screen.getByText(/server unreachable/i)).toBeInTheDocument()
    );
  });
});
