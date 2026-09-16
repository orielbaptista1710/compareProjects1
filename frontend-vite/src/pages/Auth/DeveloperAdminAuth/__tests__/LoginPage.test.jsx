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

// Irrelevant to auth logic — stubbed out so this test only exercises LoginPage itself.
vi.mock("../../../../shared/Popups/DeveloperPopup", () => ({ default: () => null }));
vi.mock("../../../../shared/Popups/ForgotPasswordPopup", () => ({ default: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
});

async function fillAndSubmit({ username = "devuser", password = "Password123!" } = {}) {
  const user = userEvent.setup();
  render(<LoginPage />);
  if (username) await user.type(screen.getByPlaceholderText("Enter username"), username);
  if (password) await user.type(screen.getByPlaceholderText("Enter password"), password);
  await user.click(screen.getByRole("button", { name: /login/i }));
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

  it("navigates to /dashboard for a non-admin role", async () => {
    API.post.mockResolvedValue({ data: { user: { role: "user", displayName: "Dev" } } });

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

      await waitFor(() => expect(screen.getByText(expected)).toBeInTheDocument());
      expect(toast.error).toHaveBeenCalledWith(expected);
    }
  );

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
