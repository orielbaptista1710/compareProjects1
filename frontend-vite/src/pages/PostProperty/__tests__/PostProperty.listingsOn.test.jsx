// PostProperty with owner/agent posting switched on (the flag is a build-time
// constant, so it needs its own file; PostProperty.test.jsx covers it off).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";

vi.mock("../../../config/features", () => ({ CUSTOMER_LISTINGS_ENABLED: true }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../shared/Popups/DeveloperPopup", () => ({ default: () => null }));

import PostProperty from "../PostProperty";

const renderAs = (currentUser) =>
  render(
    <AuthContext.Provider value={{ currentUser }}>
      <MemoryRouter>
        <PostProperty />
      </MemoryRouter>
    </AuthContext.Provider>
  );

beforeEach(() => vi.clearAllMocks());

describe("PostProperty with posting on", () => {
  it("sends a logged-in customer straight to the Post tab", () => {
    renderAs({ customerName: "Asha", agent: { status: "none" } });

    fireEvent.click(screen.getByRole("button", { name: "Post a property" }));

    expect(mockNavigate).toHaveBeenCalledWith("/customer-profile?tab=post");
  });

  it("sends a logged-in agent to the Post tab too", () => {
    renderAs({ customerName: "Ravi", agent: { status: "approved" } });
    fireEvent.click(screen.getByRole("radio", { name: "Agent" }));

    fireEvent.click(screen.getByRole("button", { name: "Post a property" }));

    expect(mockNavigate).toHaveBeenCalledWith("/customer-profile?tab=post");
  });

  it("still sends logged-out visitors to sign up", () => {
    renderAs(null);

    fireEvent.click(screen.getByRole("button", { name: "Start now" }));

    expect(mockNavigate).toHaveBeenCalledWith("/customer-signup");
  });
});
