import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../LoginPage";
import API from "../../../../api/api";
import toast from "react-hot-toast";

const mockNavigate = vi.fn();
const mockClear = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  // The owner/agent sign-in links render as plain anchors in tests.
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ clear: mockClear }),
}));

vi.mock("../../../../api/api", () => ({
  default: { post: vi.fn() },
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// Stubbed so this test only exercises LoginPage itself; each renders a marker
// while open so the tests can check which button opens which popup.
vi.mock("../../../../shared/Popups/DeveloperPopup", () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="developer-popup" /> : null),
}));
vi.mock("../../../../shared/Popups/ForgotPasswordPopup", () => ({
  default: ({ isOpen }) => (isOpen ? <div data-testid="forgot-password-popup" /> : null),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

async function fillAndSubmit({ username = "devuser", password = "Password123!" } = {}) {
  const user = userEvent.setup();
  render(<LoginPage />);
  if (username) await user.type(screen.getByPlaceholderText("Enter username"), username);
  if (password) await user.type(screen.getByPlaceholderText("Enter password"), password);
  await user.click(screen.getByRole("button", { name: /^sign in$/i }));
}

describe("LoginPage", () => {
  it("shows a client-side error and never calls the API when fields are empty", async () => {
    // fireEvent.submit dispatches the submit event directly, bypassing jsdom's
    // native HTML5 "required" validation (which a real userEvent.click would
    // correctly respect and block before handleSubmit ever runs) — this test
    // targets the component's own manual empty-fields check, not the browser's.
    const { container } = render(<LoginPage />);

    fireEvent.submit(container.querySelector("form"));

    await waitFor(() =>
      expect(
        screen.getByText("Please enter both username and password")
      ).toBeInTheDocument()
    );
    expect(API.post).not.toHaveBeenCalled();
  });

  it("submits credentials to /api/auth/login and navigates to /admin for an admin role", async () => {
    API.post.mockResolvedValue({ data: { user: { role: "admin", displayName: "Ada" } } });

    await fillAndSubmit();

    expect(API.post).toHaveBeenCalledWith(
      "/api/auth/login",
      { username: "devuser", password: "Password123!" },
      expect.objectContaining({ withCredentials: true })
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin"));
    expect(mockClear).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Welcome back, Ada!");
  });

  // 'user' is the legacy name for 'developer'; both must keep working until
  // and after scripts/migrateRoles.js renames them in production.
  it.each(["user", "developer"])("navigates to /dashboard for the %s role", async (role) => {
    API.post.mockResolvedValue({ data: { user: { role, displayName: "Dev" } } });

    await fillAndSubmit();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard"));
  });

  it.each([
    [403, undefined, "Your account has been deactivated. Contact admin."],
    [429, undefined, "Too many attempts. Try again in 15 minutes."],
    [401, undefined, "Invalid username or password."],
    [400, "Custom server message", "Custom server message"],
  ])(
    "maps a %s response to the right user-facing message",
    async (status, serverMsg, expected) => {
      API.post.mockRejectedValue({
        response: { status, data: serverMsg ? { message: serverMsg } : {} },
      });

      await fillAndSubmit();

      await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(expected));
      // Shown once inline only — a toast too would be announced twice.
      expect(toast.error).not.toHaveBeenCalled();
    }
  );

  it("links owners and agents to their own sign-in pages", () => {
    render(<LoginPage />);

    expect(screen.getByRole("link", { name: "Owner sign in" })).toHaveAttribute("href", "/customer-login");
    expect(screen.getByRole("link", { name: "Agent sign in" })).toHaveAttribute("href", "/agent-login");
  });

  it("opens the developer enquiry popup from Request access", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    expect(screen.queryByTestId("developer-popup")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Request access" }));
    expect(screen.getByTestId("developer-popup")).toBeInTheDocument();
  });

  it("opens the forgot-password popup without submitting the form", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(screen.getByTestId("forgot-password-popup")).toBeInTheDocument();
    expect(API.post).not.toHaveBeenCalled();
  });

  it("shows and hides the password with the eye button", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    const password = screen.getByPlaceholderText("Enter password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(password).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(password).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(password).toHaveAttribute("type", "password");
    expect(API.post).not.toHaveBeenCalled();
  });

  it("shows a server-unreachable message when there is no response at all (network error)", async () => {
    API.post.mockRejectedValue({});

    await fillAndSubmit();

    await waitFor(() =>
      expect(
        screen.getByText(
          "Server unreachable. It may be waking up — try again in 30 seconds."
        )
      ).toBeInTheDocument()
    );
  });
});
