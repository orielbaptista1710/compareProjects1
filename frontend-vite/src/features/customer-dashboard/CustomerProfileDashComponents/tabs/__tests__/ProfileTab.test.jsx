// Regression tests for a senior audit finding: the "Verified Account" badge
// was hardcoded/unconditional (no emailVerified field existed at all), and
// "Member Since" always rendered "—" because GET /me never returned
// createdAt. Both are now driven by real currentUser fields.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

function renderWithUser(currentUser) {
  return render(
    <AuthContext.Provider value={{ currentUser }}>
      <ProfileTab />
    </AuthContext.Provider>
  );
}

describe("ProfileTab", () => {
  it("shows the Verified Account badge when the customer's email is verified", () => {
    renderWithUser({
      customerName: "Momotaro",
      customerEmail: "momo@example.com",
      emailVerified: true,
    });

    expect(screen.getByText("Verified Account")).toBeInTheDocument();
    expect(screen.queryByText("Email not verified")).not.toBeInTheDocument();
  });

  it("shows an unverified badge instead of claiming the account is verified", () => {
    renderWithUser({
      customerName: "Momotaro",
      customerEmail: "momo@example.com",
      emailVerified: false,
    });

    expect(screen.getByText("Email not verified")).toBeInTheDocument();
    expect(screen.queryByText("Verified Account")).not.toBeInTheDocument();
  });

  it("treats a missing emailVerified field as unverified rather than assuming verified", () => {
    renderWithUser({
      customerName: "Momotaro",
      customerEmail: "momo@example.com",
    });

    expect(screen.getByText("Email not verified")).toBeInTheDocument();
  });

  it("renders the formatted join date when createdAt is present", () => {
    renderWithUser({
      customerName: "Momotaro",
      createdAt: "2026-01-15T00:00:00.000Z",
    });

    expect(screen.getByText("January 2026")).toBeInTheDocument();
  });

  it("falls back to an em dash when createdAt is missing", () => {
    renderWithUser({
      customerName: "Momotaro",
    });

    const memberSinceLabel = screen.getByText("Member Since");
    expect(memberSinceLabel.parentElement).toHaveTextContent("—");
  });

  it("does not show a resend button once the account is verified", () => {
    renderWithUser({ customerName: "Momotaro", emailVerified: true });

    expect(screen.queryByText("Resend verification email")).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByText("Resend verification email"));

    await waitFor(() => {
      expect(sendEmailVerification).toHaveBeenCalledWith(CustomerAuth.currentUser);
    });

    expect(toast.success).toHaveBeenCalledWith("Verification email sent — check your inbox!");
  });

  it("disables the button while the request is in flight", async () => {
    let resolveSend;
    sendEmailVerification.mockReturnValue(
      new Promise((resolve) => { resolveSend = resolve; })
    );

    renderWithUser({ customerName: "Momotaro", emailVerified: false });

    fireEvent.click(screen.getByText("Resend verification email"));

    const pendingButton = await screen.findByText("Sending…");
    expect(pendingButton).toBeDisabled();

    resolveSend();
    await waitFor(() => {
      expect(screen.getByText("Resend verification email")).not.toBeDisabled();
    });
  });

  it("shows a friendly message for a rate-limited resend instead of a generic error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendEmailVerification.mockRejectedValue({ code: "auth/too-many-requests" });

    renderWithUser({ customerName: "Momotaro", emailVerified: false });

    fireEvent.click(screen.getByText("Resend verification email"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Too many attempts — please wait a bit before trying again."
      );
    });

    consoleSpy.mockRestore();
  });

  it("falls back to a generic error message for an unrecognized failure", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sendEmailVerification.mockRejectedValue(new Error("boom"));

    renderWithUser({ customerName: "Momotaro", emailVerified: false });

    fireEvent.click(screen.getByText("Resend verification email"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Couldn't send the email. Please try again.");
    });

    consoleSpy.mockRestore();
  });

  it("does nothing if there's no live Firebase user (stale click racing a logout)", () => {
    CustomerAuth.currentUser = null;

    renderWithUser({ customerName: "Momotaro", emailVerified: false });

    fireEvent.click(screen.getByText("Resend verification email"));

    expect(sendEmailVerification).not.toHaveBeenCalled();
  });
});
