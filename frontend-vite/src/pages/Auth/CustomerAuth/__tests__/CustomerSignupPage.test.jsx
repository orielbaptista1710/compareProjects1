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

async function fillAndSubmit() {
  const user = userEvent.setup();
  render(<CustomerSignupPage />);

  await user.type(screen.getByLabelText("Full Name"), "Momotaro");
  await user.type(screen.getByLabelText("Email Address"), "momo@example.com");
  await user.type(screen.getByLabelText("Phone Number"), "9876543210");
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
