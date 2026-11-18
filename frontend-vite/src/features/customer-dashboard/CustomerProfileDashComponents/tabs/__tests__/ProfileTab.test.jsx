// Regression tests for a senior audit finding: the "Verified" badge was once
// hardcoded/unconditional (no emailVerified field existed at all), and
// "Member since" always rendered "—" because GET /me never returned
// createdAt. Both are now driven by real currentUser fields.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sendEmailVerification } from "firebase/auth";
import toast from "react-hot-toast";

import ProfileTab from "../ProfileTab";
import { AuthContext } from "../../../../../contexts/AuthContext";
import { CustomerAuth } from "../../../../../config/firebase";

vi.mock("firebase/auth", () => ({
  sendEmailVerification: vi.fn(),
}));

// Only the pieces ProfileTab actually touches — CustomerAuth.currentUser is
// the live Firebase user object sendEmailVerification() is called with.
vi.mock("../../../../../config/firebase", () => ({
  CustomerAuth: { currentUser: null },
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// The listing count fetch is off unless VITE_ENABLE_CUSTOMER_LISTINGS is set;
// mock the client anyway so a test can never hit the network.
vi.mock("../../../../../api/api", () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: [] })) },
}));

function renderWithUser(currentUser, props = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthContext.Provider value={{ currentUser }}>
          <ProfileTab {...props} />
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const contactRow = (label) => screen.getByText(label, { selector: "dt" }).parentElement;
const firstResend = () => screen.getAllByRole("button", { name: "Resend email" })[0];

describe("ProfileTab — contact details", () => {
  it("shows a Verified pill when the customer's email is verified", () => {
    renderWithUser({ customerName: "Momotaro", customerEmail: "momo@example.com", emailVerified: true });

    expect(within(contactRow("Email")).getByText("Verified")).toBeInTheDocument();
    expect(screen.queryByText("Not verified")).not.toBeInTheDocument();
  });

  it("shows Not verified instead of claiming the email is verified", () => {
    renderWithUser({ customerName: "Momotaro", customerEmail: "momo@example.com", emailVerified: false });

    expect(within(contactRow("Email")).getByText("Not verified")).toBeInTheDocument();
  });

  it("treats a missing emailVerified field as unverified rather than assuming verified", () => {
    renderWithUser({ customerName: "Momotaro", customerEmail: "momo@example.com" });

    expect(within(contactRow("Email")).getByText("Not verified")).toBeInTheDocument();
  });

  it("masks the phone number and email", () => {
    renderWithUser({ customerName: "Jo", customerEmail: "jo.anderson@gmail.com", customerPhone: "+919938812334" });

    expect(within(contactRow("Email")).getByText("jo.an•••@gmail.com")).toBeInTheDocument();
    expect(within(contactRow("Mobile")).getByText("+9199388•••34")).toBeInTheDocument();
    expect(screen.queryByText(/jo\.anderson/)).not.toBeInTheDocument();
  });

  it("renders the formatted join date when createdAt is present", () => {
    renderWithUser({ customerName: "Momotaro", createdAt: "2026-01-15T00:00:00.000Z" });

    expect(within(contactRow("Member since")).getByText("January 2026")).toBeInTheDocument();
  });

  it("falls back to an em dash when createdAt is missing", () => {
    renderWithUser({ customerName: "Momotaro" });

    expect(contactRow("Member since")).toHaveTextContent("—");
  });

  it("opens Settings from 'Edit in Settings'", () => {
    const onNavigateTab = vi.fn();
    renderWithUser({ customerName: "Momotaro" }, { onNavigateTab });

    fireEvent.click(screen.getByRole("button", { name: "Edit in Settings" }));
    expect(onNavigateTab).toHaveBeenCalledWith("settings", "account");
  });

  it("does not show a resend button once the account is verified", () => {
    renderWithUser({ customerName: "Momotaro", emailVerified: true });

    expect(screen.queryByRole("button", { name: "Resend email" })).not.toBeInTheDocument();
  });
});

describe("ProfileTab — resend verification email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    CustomerAuth.currentUser = { uid: "firebase-uid-1" };
  });

  it("sends the verification email to the live Firebase user and shows a success toast", async () => {
    sendEmailVerification.mockResolvedValue(undefined);

    renderWithUser({ customerName: "Momotaro", emailVerified: false });

    fireEvent.click(firstResend());

    await waitFor(() => {
      expect(sendEmailVerification).toHaveBeenCalledWith(CustomerAuth.currentUser);
    });

    expect(toast.success).toHaveBeenCalledWith("Verification email sent — check your inbox!");
  });

  it("disables every resend button while the request is in flight", async () => {
    let resolveSend;
    sendEmailVerification.mockReturnValue(
      new Promise((resolve) => {
        resolveSend = resolve;
      })
    );

    renderWithUser({ customerName: "Momotaro", emailVerified: false });

    fireEvent.click(firstResend());

    const pending = await screen.findAllByRole("button", { name: "Sending…" });
    pending.forEach((b) => expect(b).toBeDisabled());

    resolveSend();
    await waitFor(() => {
      expect(firstResend()).not.toBeDisabled();
    });
  });

  it("shows a friendly message for a rate-limited resend instead of a generic error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendEmailVerification.mockRejectedValue({ code: "auth/too-many-requests" });

    renderWithUser({ customerName: "Momotaro", emailVerified: false });

    fireEvent.click(firstResend());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Too many attempts — please wait a bit before trying again.");
    });

    consoleSpy.mockRestore();
  });

  it("falls back to a generic error message for an unrecognized failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendEmailVerification.mockRejectedValue(new Error("boom"));

    renderWithUser({ customerName: "Momotaro", emailVerified: false });

    fireEvent.click(firstResend());

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Couldn't send the email. Please try again.");
    });

    consoleSpy.mockRestore();
  });

  it("does nothing if there's no live Firebase user (stale click racing a logout)", () => {
    CustomerAuth.currentUser = null;

    renderWithUser({ customerName: "Momotaro", emailVerified: false });

    fireEvent.click(firstResend());

    expect(sendEmailVerification).not.toHaveBeenCalled();
  });
});

describe("ProfileTab — owner vs agent content", () => {
  it.each([undefined, { status: "none" }])("agent %j is an owner with the 'Ready to post' checklist", (agent) => {
    renderWithUser({ customerName: "Ravi", agent });

    expect(within(contactRow("Account type")).getByText("Owner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ready to post your property" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "How buyers see you" })).not.toBeInTheDocument();
  });

  it("shows a pending agent the approval checklist and the buyer preview", () => {
    renderWithUser({
      customerName: "agent test 2",
      emailVerified: false,
      agent: { status: "pending", agencyName: "Skyline Realty Advisors", reraAgentId: "A51800012345" },
    });

    expect(screen.getByText("Approval pending", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Getting approved as an agent" })).toBeInTheDocument();
    expect(screen.getByText("1 of 3 done")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How buyers see you" })).toBeInTheDocument();
    expect(screen.getByText("Not public yet")).toBeInTheDocument();
    expect(screen.getByText("RERA A51800012345")).toBeInTheDocument();
    expect(within(contactRow("Account type")).getByText("Agent")).toBeInTheDocument();
  });

  it("shows an approved agent as a RERA agent with no checklist", () => {
    renderWithUser({ customerName: "Ravi", emailVerified: true, agent: { status: "approved", reraAgentId: "A1" } });

    expect(screen.getByRole("heading", { name: "You're an approved agent" })).toBeInTheDocument();
    expect(screen.getByText("RERA agent")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows the admin's reason and a support link when the agent application was rejected", () => {
    renderWithUser({ customerName: "Ravi", agent: { status: "rejected", rejectionReason: "RERA id not found" } });

    expect(screen.getByRole("heading", { name: "Agent application not approved" })).toBeInTheDocument();
    expect(screen.getByText("RERA id not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Contact support/ })).toHaveAttribute("href", "/supportHelp");
    expect(screen.queryByRole("heading", { name: "How buyers see you" })).not.toBeInTheDocument();
  });

  it("shows a suspended agent an alert explaining the impact, with a support link", () => {
    renderWithUser({ customerName: "Ravi", agent: { status: "suspended" } });

    const alert = screen.getByRole("alert");
    expect(within(alert).getByRole("heading", { name: "Agent account suspended" })).toBeInTheDocument();
    expect(within(alert).getByText("Your listings are hidden from buyers")).toBeInTheDocument();
    expect(within(alert).getByText("You can't post or edit listings")).toBeInTheDocument();
    expect(within(alert).getByRole("link", { name: "Contact support" })).toHaveAttribute("href", "/supportHelp");
    expect(screen.queryByRole("heading", { name: "How buyers see you" })).not.toBeInTheDocument();
  });

  it("leaves out the reason box when a rejection has no reason", () => {
    renderWithUser({ customerName: "Ravi", agent: { status: "rejected" } });

    expect(within(screen.getByRole("alert")).queryByText("Reason from our team")).not.toBeInTheDocument();
  });
});
