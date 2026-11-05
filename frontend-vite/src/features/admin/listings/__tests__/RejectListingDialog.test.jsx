import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RejectListingDialog from "../RejectListingDialog";

const renderDialog = (props = {}) => {
  const onConfirm = vi.fn();
  const utils = render(
    <RejectListingDialog open isPending={false} onConfirm={onConfirm} onClose={vi.fn()} {...props} />
  );
  return { ...utils, onConfirm };
};

describe("RejectListingDialog", () => {
  it("can't confirm without a reason, and sends it trimmed", async () => {
    const user = userEvent.setup({ delay: null });
    const { onConfirm } = renderDialog();
    const confirm = screen.getByRole("button", { name: "Reject" });

    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText(/Reason for rejection/), "   ");
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/Reason for rejection/), "Price looks wrong  ");
    await user.click(confirm);

    expect(onConfirm).toHaveBeenCalledWith("Price looks wrong");
  });

  it("says how many listings a bulk reject covers", () => {
    renderDialog({ count: 3 });

    expect(screen.getByText("Reject 3 properties")).toBeInTheDocument();
  });

  it("starts empty each time it opens", async () => {
    const user = userEvent.setup({ delay: null });
    const { rerender, onConfirm } = renderDialog();
    await user.type(screen.getByLabelText(/Reason for rejection/), "Old reason");

    rerender(<RejectListingDialog open={false} isPending={false} onConfirm={onConfirm} onClose={vi.fn()} />);
    rerender(<RejectListingDialog open isPending={false} onConfirm={onConfirm} onClose={vi.fn()} />);

    expect(screen.getByLabelText(/Reason for rejection/)).toHaveValue("");
  });

  it("is disabled while the reject is being saved", () => {
    renderDialog({ isPending: true });

    expect(screen.getByRole("button", { name: "Rejecting…" })).toBeDisabled();
  });
});
