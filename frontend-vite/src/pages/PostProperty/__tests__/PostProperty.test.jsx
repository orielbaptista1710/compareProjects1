// src/pages/PostProperty/__tests__/PostProperty.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../../contexts/AuthContext";
import PostProperty from "../PostProperty";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));

// The real popup posts a lead; here we only care that it opens.
vi.mock("../../../shared/Popups/DeveloperPopup", () => ({
  default: ({ isOpen }) => (isOpen ? <div role="dialog">Partner form</div> : null),
}));

const customer = { customerName: "Asha", agent: { status: "none" } };
const agent = { customerName: "Ravi", agent: { status: "pending" } };

const renderAs = (currentUser = null) =>
  render(
    <AuthContext.Provider value={{ currentUser }}>
      <MemoryRouter>
        <PostProperty />
      </MemoryRouter>
    </AuthContext.Provider>
  );

const pick = (role) => fireEvent.click(screen.getByRole("radio", { name: role }));
const mainButton = () => screen.getByRole("button", { name: /start now|go to my profile|sign up as an agent|partner with us/i });

beforeEach(() => vi.clearAllMocks());

describe("PostProperty", () => {
  it("starts with Owner selected", () => {
    renderAs();

    expect(screen.getByRole("radio", { name: "Owner" })).toHaveAttribute("aria-checked", "true");
  });

  it.each([
    ["Owner", "/customer-signup", "/customer-login"],
    ["Agent", "/agent-signup", "/agent-login"],
  ])("%s, logged out → signup %s, login link %s", (role, signup, login) => {
    renderAs();
    pick(role);

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", login);
    fireEvent.click(mainButton());
    expect(mockNavigate).toHaveBeenCalledWith(signup);
  });

  it("Developer opens the partner enquiry form and links to the developer login", async () => {
    renderAs();
    pick("Developer");

    expect(screen.getByRole("link", { name: "Developer login" })).toHaveAttribute("href", "/login");
    fireEvent.click(screen.getByRole("button", { name: "Partner with us" }));

    expect(await screen.findByRole("dialog")).toHaveTextContent("Partner form");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("a logged-in customer picking Owner goes to their profile", () => {
    renderAs(customer);

    fireEvent.click(screen.getByRole("button", { name: "Go to my profile" }));

    expect(mockNavigate).toHaveBeenCalledWith("/customer-profile");
  });

  it("a logged-in customer picking Agent is told agents need their own sign-up", () => {
    renderAs(customer);
    pick("Agent");

    expect(screen.getByText(/agent accounts need their own sign-up/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign up as an agent" }));
    expect(mockNavigate).toHaveBeenCalledWith("/agent-signup");
  });

  it("a logged-in agent picking Agent goes to their profile", () => {
    renderAs(agent);
    pick("Agent");

    fireEvent.click(screen.getByRole("button", { name: "Go to my profile" }));

    expect(mockNavigate).toHaveBeenCalledWith("/customer-profile");
  });
});
