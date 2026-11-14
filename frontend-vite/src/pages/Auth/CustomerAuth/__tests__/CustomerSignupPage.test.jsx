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
  await user.click(screen.getByRole("checkbox"));
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
    await user.click(screen.getByRole("checkbox"));
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

  it.each([400, 409])(
    "on a %s from the backend: shows its message, stays on the page and removes the new Firebase login",
    async (status) => {
      const credential = makeUserCredential();
      createUserWithEmailAndPassword.mockResolvedValue(credential);
      API.post.mockRejectedValue({ response: { status, data: { message: "Agency name is too short." } } });

      await fillAgentAndSubmit();

      await waitFor(() => expect(screen.getByText("Agency name is too short.")).toBeInTheDocument());
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(sendEmailVerification).not.toHaveBeenCalled();
      // Otherwise the email is stuck: a retry says "already in use", and a
      // login would turn it into a customer account that can't become an agent.
      await waitFor(() => expect(credential.user.delete).toHaveBeenCalledTimes(1));
    }
  );

  it("keeps the Firebase login when the failure isn't a backend answer (e.g. offline)", async () => {
    const credential = makeUserCredential();
    createUserWithEmailAndPassword.mockResolvedValue(credential);
    API.post.mockRejectedValue(new Error("Network Error"));

    await fillAgentAndSubmit();

    await waitFor(() => expect(screen.getByText(/signup failed/i)).toBeInTheDocument());
    expect(credential.user.delete).not.toHaveBeenCalled();
  });
});

// Owner vs agent can't be changed after signup, so the user must confirm which
// one they are before anything is created.
describe("CustomerSignupPage — confirm owner/agent before signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function fillWithoutConfirming(props = {}) {
    const user = userEvent.setup({ delay: null });
    const view = render(<CustomerSignupPage {...props} />);
    await user.type(screen.getByLabelText("Full Name"), "Asha");
    await user.type(screen.getByLabelText("Email Address"), "asha@example.com");
    await user.type(screen.getByLabelText("WhatsApp Number"), "9876543210");
    if (props.isAgent) {
      await user.type(screen.getByLabelText("Agency Name"), "Prime Realty");
      await user.type(screen.getByLabelText("RERA Agent Registration No."), "A51800012345");
    }
    await user.type(screen.getByLabelText("Password"), "Passw0rd!");
    await user.type(screen.getByLabelText("Confirm Password"), "Passw0rd!");
    return { user, ...view };
  }

  it.each([
    [{}, "Please confirm you're the owner"],
    [{ isAgent: true }, "Please confirm you're a RERA-registered agent"],
  ])("with props %o: refuses to create the account until confirmed", async (props, message) => {
    const { user } = await fillWithoutConfirming(props);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("asks owners and agents to confirm different things", () => {
    const { unmount } = render(<CustomerSignupPage />);
    expect(screen.getByRole("checkbox", { name: /not an agent or broker/i })).toBeInTheDocument();
    unmount();

    render(<CustomerSignupPage isAgent />);
    expect(screen.getByRole("checkbox", { name: /RERA-registered real estate agent/i })).toBeInTheDocument();
  });

  it("un-ticks the confirmation when the page switches between owner and agent", async () => {
    const { user, rerender } = await fillWithoutConfirming();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("checkbox")).toBeChecked();

    rerender(<CustomerSignupPage isAgent />);

    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });
});
