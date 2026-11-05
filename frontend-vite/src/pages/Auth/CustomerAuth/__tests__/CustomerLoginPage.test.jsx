// Customer/agent login (/customer-login, /agent-login). The flow is:
// Firebase sign-in → backend firebase-login (creates the Mongo record if
// missing, refuses suspended accounts) → refreshUser() → /customer-profile.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CustomerLoginPage from "../CustomerLoginPage";
import { AuthContext } from "../../../../contexts/AuthContext";
import API from "../../../../api/api";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../../api/api", () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("../../../../config/firebase", () => ({
  CustomerAuth: {},
}));

function createDeferred() {
  let resolve;
  const promise = new Promise((res) => { resolve = res; });
  return { promise, resolve };
}

const credential = { user: { getIdToken: vi.fn().mockResolvedValue("id-token") } };

let refreshUser;

function renderPage(props = {}) {
  return render(
    <AuthContext.Provider value={{ refreshUser }}>
      <CustomerLoginPage {...props} />
    </AuthContext.Provider>
  );
}

// delay: null types instantly, so the suite doesn't hit the 5s test timeout.
async function fillAndSubmit({ email = "asha@example.com", password = "Passw0rd!", props } = {}) {
  const user = userEvent.setup({ delay: null });
  renderPage(props);
  await user.type(screen.getByLabelText("Email Address"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: /^login$/i }));
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  refreshUser = vi.fn().mockResolvedValue(undefined);
  signInWithEmailAndPassword.mockResolvedValue(credential);
  API.post.mockResolvedValue({ data: { customer: {} } });
  signOut.mockResolvedValue(undefined);
});

describe("CustomerLoginPage", () => {
  it("signs in with Firebase, then tells the backend, then opens the profile", async () => {
    await fillAndSubmit();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/customer-profile"));
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, "asha@example.com", "Passw0rd!");
    expect(API.post).toHaveBeenCalledWith("/api/customers/firebase-login", { token: "id-token" });
    expect(signInWithEmailAndPassword.mock.invocationCallOrder[0])
      .toBeLessThan(API.post.mock.invocationCallOrder[0]);
  });

  it("regression: waits for the profile to reload before opening the profile page", async () => {
    // AuthContext's own /me check can run before firebase-login has created
    // the Mongo record and come back 401. Without the reload, the profile
    // route guard saw no user and bounced the customer back to login.
    const reload = createDeferred();
    refreshUser.mockReturnValue(reload.promise);

    await fillAndSubmit();

    await waitFor(() => expect(refreshUser).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();

    reload.resolve();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/customer-profile"));
    expect(API.post.mock.invocationCallOrder[0]).toBeLessThan(refreshUser.mock.invocationCallOrder[0]);
  });

  it("shows a friendly message for a wrong password and never calls the backend", async () => {
    signInWithEmailAndPassword.mockRejectedValue({ code: "auth/invalid-credential" });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await fillAndSubmit({ password: "wrong-password" });

    await waitFor(() => expect(screen.getByText("Invalid email or password.")).toBeInTheDocument());
    expect(API.post).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows why the backend refused (suspended account) and signs them back out of Firebase", async () => {
    API.post.mockRejectedValue({
      response: { status: 403, data: { message: "Your account has been suspended. Contact support." } },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByText("Your account has been suspended. Contact support.")).toBeInTheDocument()
    );
    expect(signOut).toHaveBeenCalled();
    expect(refreshUser).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows a generic message (not server internals) when the backend errors", async () => {
    API.post.mockRejectedValue({ response: { status: 500, data: { message: "Server error" } } });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await fillAndSubmit();

    await waitFor(() => expect(screen.getByText("Login failed. Please try again.")).toBeInTheDocument());
    expect(signOut).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("doesn't contact Firebase when a field is empty", async () => {
    // fireEvent.submit skips the browser's own "required" check, so this
    // exercises the page's check.
    const { container } = renderPage();

    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => expect(screen.getByText("Please fill in both fields.")).toBeInTheDocument());
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("sends only one login while the first is still in progress (double-click)", async () => {
    const signIn = createDeferred();
    signInWithEmailAndPassword.mockReturnValue(signIn.promise);

    const user = await fillAndSubmit();
    const button = screen.getByRole("button", { name: /logging in/i });
    expect(button).toBeDisabled();
    await user.click(button);

    expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(1);

    signIn.resolve(credential);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
  });

  describe("forgot password", () => {
    it("always says the reset email was sent, even for an unknown email (no account enumeration)", async () => {
      sendPasswordResetEmail.mockRejectedValue({ code: "auth/user-not-found" });
      vi.spyOn(console, "error").mockImplementation(() => {});
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByLabelText("Email Address"), "nobody@example.com");
      await user.click(screen.getByRole("button", { name: /forgot password/i }));

      await waitFor(() => expect(screen.getByText(/reset email sent/i)).toBeInTheDocument());
      expect(sendPasswordResetEmail).toHaveBeenCalledWith({}, "nobody@example.com");
    });

    it("asks for an email first instead of calling Firebase", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole("button", { name: /forgot password/i }));

      expect(screen.getByText(/enter your email address above/i)).toBeInTheDocument();
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe("agent variant (/agent-login)", () => {
    it("is titled for agents and sends 'Sign up' to /agent-signup", async () => {
      const user = userEvent.setup();
      renderPage({ isAgent: true });

      expect(screen.getByRole("heading", { name: "Agent Login" })).toBeInTheDocument();
      await user.click(screen.getByText("Sign up"));

      expect(mockNavigate).toHaveBeenCalledWith("/agent-signup");
    });

    it("the customer page sends 'Sign up' to /customer-signup", async () => {
      const user = userEvent.setup();
      renderPage();

      expect(screen.getByRole("heading", { name: "Customer Login" })).toBeInTheDocument();
      await user.click(screen.getByText("Sign up"));

      expect(mockNavigate).toHaveBeenCalledWith("/customer-signup");
    });
  });
});
