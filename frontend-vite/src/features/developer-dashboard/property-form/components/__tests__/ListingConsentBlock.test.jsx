import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ListingConsentBlock from "../ListingConsentBlock";
import { SectionStatusContext } from "../../hooks/sectionStatusContext";

const schema = z.object({
  termsAccepted: z.literal(true, { message: "Accept the Terms and Privacy Policy to continue" }),
  detailsConfirmed: z.literal(true, { message: "Confirm the details are accurate to continue" }),
});

const OK = { canPublish: true, byId: {}, onlyConsentMissing: false };

const Harness = ({ onSubmit = vi.fn(), status = OK, ...props }) => {
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: { termsAccepted: false, detailsConfirmed: false },
  });
  return (
    <FormProvider {...methods}>
      <SectionStatusContext.Provider value={status}>
        <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
          <ListingConsentBlock isEditing={false} isSubmitting={false} isAdding={false} isUpdating={false} {...props} />
        </form>
      </SectionStatusContext.Provider>
    </FormProvider>
  );
};

describe("ListingConsentBlock", () => {
  it("links the Terms and Privacy Policy in a new tab", () => {
    render(<Harness />);

    const terms = screen.getByRole("link", { name: "Terms" });
    expect(terms).toHaveAttribute("href", "/terms");
    expect(terms).toHaveAttribute("target", "_blank");
    expect(terms).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy-policy");
  });

  it("submits only once both boxes are ticked, and says what's missing before that", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Publish listing" }));
    expect(await screen.findByText("Accept the Terms and Privacy Policy to continue")).toBeInTheDocument();
    expect(screen.getByText("Confirm the details are accurate to continue")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox", { name: /I agree to the/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /I confirm the details/ }));
    fireEvent.click(screen.getByRole("button", { name: "Publish listing" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ termsAccepted: true, detailsConfirmed: true });
  });

  it("keeps the button off, with the reason, when the form can't be published yet", () => {
    render(<Harness status={{ canPublish: false, byId: {}, onlyConsentMissing: false }} />);

    expect(screen.getByRole("button", { name: "Publish listing" })).toBeDisabled();
    expect(screen.getByText("Complete every section to publish")).toBeInTheDocument();
  });

  it("points at the boxes when every section is done but they aren't ticked", () => {
    render(<Harness status={{ canPublish: false, byId: {}, onlyConsentMissing: true }} />);

    expect(screen.getByText("Tick both boxes at the end of the form to publish")).toBeInTheDocument();
  });

  it("labels the button for an edit, and while saving", () => {
    render(<Harness isEditing isUpdating isSubmitting />);

    const button = screen.getByRole("button", { name: "Updating…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
