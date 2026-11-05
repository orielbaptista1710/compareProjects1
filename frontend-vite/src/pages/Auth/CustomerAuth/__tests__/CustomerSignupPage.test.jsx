// Covers the new email-verification wiring added to signup: sendEmailVerification
// is called only after the backend record is confirmed created, and a failure to
// send it must never block the user from reaching their new account.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CustomerSignupPage from "../CustomerSignupPage";
import API from "../../../../api/api";
import toast from "react-hot-toast";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../../api/api", () => ({
  default: { post: vi.fn() },
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: vi.fn(),
  sendEmailVerification: vi.fn(),
}));

vi.mock("../../../../config/firebase", () => ({
  CustomerAuth: {},
}));

function makeUserCredential(overrides = {}) {
  return {
    user: {
      getIdToken: vi.fn().mockResolvedValue("id-token"),
      delete: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    },
  };
}

// delay: null types instantly — seven fields typed key by key ran past the
// 5s test timeout when the whole suite runs in parallel.
async function fillAndSubmit() {
  const user = userEvent.setup({ delay: null });
  render(<CustomerSignupPage />);

  await user.type(screen.getByLabelText("Full Name"), "Momotaro");
  await user.type(screen.getByLabelText("Email Address"), "momo@example.com");
  await user.type(screen.getByLabelText("WhatsApp Number"), "9876543210");
  // Strong enough to pass validate()'s strength.score >= 3 check:
  // length >= 8, an uppercase letter, a number, a special character.
  await user.type(screen.getByLabelText("Password"), "Passw0rd!");
  await user.type(screen.getByLabelText("Confirm Password"), "Passw0rd!");
  await user.click(screen.getByRole("button", { name: /sign up/i }));
}

describe("CustomerSignupPage — email verification wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a verification email after the backend account is created, and navigates", async () => {
    createUserWithEmailAndPassword.mockResolvedValue(makeUserCredential());
    API.post.mockResolvedValue({ data: { customer: {} } });
    sendEmailVerification.mockResolvedValue(undefined);

    await fillAndSubmit();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/customer-profile");
    });

    expect(sendEmailVerification).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Verification email sent — check your inbox!");

    // Ordering matters: the backend call must resolve before the email is
    // sent, so a failed backend signup (which deletes the Firebase account)
    // never leaves a verification link pointing at a nonexistent account.
    const postOrder = API.post.mock.invocationCallOrder[0];
    const verifyOrder = sendEmailVerification.mock.invocationCallOrder[0];
    expect(postOrder).toBeLessThan(verifyOrder);
  });

  it("still navigates the user through when sending the verification email fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    createUserWithEmailAndPassword.mockResolvedValue(makeUserCredential());
    API.post.mockResolvedValue({ data: { customer: {} } });
    sendEmailVerification.mockRejectedValue(new Error("rate limited"));

    await fillAndSubmit();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/customer-profile");
    });

    // Non-blocking on failure: no error toast, no thrown error surfaced to
    // the signup form — the user can resend later from the Profile tab.
    expect(toast.error).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("does not attempt to send a verification email when the backend signup call fails", async () => {
    createUserWithEmailAndPassword.mockResolvedValue(makeUserCredential());
    API.post.mockRejectedValue({ response: { status: 500 } });

    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/signup failed/i)).toBeInTheDocument();
    });

    expect(sendEmailVerification).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("CustomerSignupPage — agent variant (/agent-signup)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function fillAgentAndSubmit({ agencyName = "Prime Realty", reraAgentId = "A51800012345" } = {}) {
    const user = userEvent.setup({ delay: null });
    render(<CustomerSignupPage isAgent />);

    await user.type(screen.getByLabelText("Full Name"), "Ravi");
    await user.type(screen.getByLabelText("Email Address"), "ravi@example.com");
    await user.type(screen.getByLabelText("WhatsApp Number"), "9876543210");
    if (agencyName) await user.type(screen.getByLabelText("Agency Name"), agencyName);
    if (reraAgentId) await user.type(screen.getByLabelText("RERA Agent Registration No."), reraAgentId);
    await user.type(screen.getByLabelText("Password"), "Passw0rd!");
    await user.type(screen.getByLabelText("Confirm Password"), "Passw0rd!");
    await user.click(screen.getByRole("button", { name: /sign up/i }));
  }

  it("sends the agent application inside the signup call (one request), then navigates", async () => {
    createUserWithEmailAndPassword.mockResolvedValue(makeUserCredential());
    API.post.mockResolvedValue({ data: {} });
    sendEmailVerification.mockResolvedValue(undefined);

    await fillAgentAndSubmit();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/customer-profile"));
    expect(API.post).toHaveBeenCalledTimes(1);
    expect(API.post).toHaveBeenCalledWith(
      "/api/customers/firebase-signup",
      expect.objectContaining({
        agentApplication: { agencyName: "Prime Realty", reraAgentId: "A51800012345" },
      })
    );
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/agent application submitted/i));
  });

  it("a plain customer signup sends no agent application", async () => {
    createUserWithEmailAndPassword.mockResolvedValue(makeUserCredential());
    API.post.mockResolvedValue({ data: { customer: {} } });
    sendEmailVerification.mockResolvedValue(undefined);

    await fillAndSubmit();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/customer-profile"));
    expect(API.post.mock.calls[0][1]).not.toHaveProperty("agentApplication");
  });

  it("requires the agency name and RERA number before creating anything", async () => {
    await fillAgentAndSubmit({ agencyName: "", reraAgentId: "" });

    expect(screen.getByText("Enter your agency name")).toBeInTheDocument();
    expect(screen.getByText("Enter your RERA agent registration number")).toBeInTheDocument();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("shows the server's message and stays on the page when the backend refuses the agent signup", async () => {
    createUserWithEmailAndPassword.mockResolvedValue(makeUserCredential());
    API.post.mockRejectedValue({
      response: { status: 409, data: { message: "Use a different email to sign up as an agent." } },
    });

    await fillAgentAndSubmit();

    await waitFor(() =>
      expect(screen.getByText("Use a different email to sign up as an agent.")).toBeInTheDocument()
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(sendEmailVerification).not.toHaveBeenCalled();
  });
});
