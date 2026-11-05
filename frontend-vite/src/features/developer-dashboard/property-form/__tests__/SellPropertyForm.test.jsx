import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// The Maps SDK is never loaded in tests; the section shows its loading hint.
vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: () => ({ isLoaded: false, loadError: undefined }),
  GoogleMap: () => null,
  Marker: () => null,
  Autocomplete: ({ children }) => children,
}));

import toast from "react-hot-toast";
import SellPropertyForm from "../SellPropertyForm";
import { initialFormData } from "../../utils/developerDashPropertyHelpers";

// A saved listing as normalizePropertyData() hands it to the form in edit mode
const VALID_LISTING = {
  ...initialFormData,
  developerName: "Lodha Group",
  title: "Lodha Palava Phase 3",
  description: "Spacious homes close to the station and schools.",
  state: "Maharashtra",
  city: "Thane",
  locality: "Dombivli",
  address: "Palava City, Dombivli East",
  pincode: "421204",
  price: 7500000,
  propertyType: "Flats/Apartments",
  furnishing: "Unfurnished",
  possessionStatus: "Ready to Move",
  unitsAvailable: 4,
  area: { value: 1200, unit: "sqft" },
  bhk: 3,
  floor: "Ground",
  reraApproved: false,
  reraNumber: "P51700045678",
};

const renderForm = (props = {}) =>
  render(
    <SellPropertyForm
      formData={initialFormData}
      onSubmit={vi.fn()}
      handleCancelEdit={vi.fn()}
      editingId={null}
      isAdding={false}
      isUpdating={false}
      {...props}
    />
  );

describe("SellPropertyForm", () => {
  // jsdom has no scrollIntoView; stub it per test and put back what was there
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    if (originalScrollIntoView) {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    } else {
      delete Element.prototype.scrollIntoView;
    }
  });

  it("scrolls to a section when its progress step is clicked", () => {
    renderForm();

    const step = screen.getByRole("button", { name: "Location" });
    fireEvent.click(step);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    expect(step).toHaveAttribute("aria-current", "step");
  });

  it("blocks an incomplete submit and says how many fields need attention", async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    fireEvent.click(screen.getByRole("button", { name: "Submit Property" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/fields? needs? your attention/))
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  const submitEdit = async (formData, beforeSubmit) => {
    const onSubmit = vi.fn();
    renderForm({ formData, editingId: "p1", onSubmit });
    beforeSubmit?.();
    fireEvent.click(screen.getByRole("button", { name: "Update Property" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    return onSubmit.mock.calls[0][0];
  };

  it("sends area, counts and floor in the payload, keeping the saved RERA number", async () => {
    const payload = await submitEdit(VALID_LISTING);

    expect(payload.area).toEqual({ value: 1200, unit: "sqft" });
    expect(payload.bhk).toBe(3);
    expect(payload.floor).toBe(0);
    // Saved with a number but reraApproved=false → box is ticked, number kept
    expect(payload.reraNumber).toBe("P51700045678");
    expect(payload).not.toHaveProperty("propertyGroup");
  });

  it("clears the RERA number when the box is unticked", async () => {
    const payload = await submitEdit(VALID_LISTING, () =>
      fireEvent.click(screen.getByLabelText("RERA Approved"))
    );

    expect(payload.reraNumber).toBe("");
  });

  it("saves an unchanged 5+ BHK listing with its real count", async () => {
    const payload = await submitEdit({ ...VALID_LISTING, bhk: 7, bathrooms: 6 });

    expect(payload.bhk).toBe(7);
    expect(payload.bathrooms).toBe(6);
  });

  it("shows the saved BHK as selected in edit mode", () => {
    renderForm({ formData: VALID_LISTING, editingId: "p1" });

    expect(screen.getByRole("radio", { name: "3 BHK" })).toBeChecked();
  });

  it("shows a saved count above the cap on the top pill", () => {
    renderForm({ formData: { ...VALID_LISTING, bhk: 7 }, editingId: "p1" });

    expect(screen.getByRole("radio", { name: "5+ BHK" })).toBeChecked();
  });

  it("clears the fields when an edit is cancelled", () => {
    const { rerender } = renderForm({ formData: VALID_LISTING, editingId: "p1" });
    expect(screen.getByLabelText(/Property Title/)).toHaveValue("Lodha Palava Phase 3");

    rerender(
      <SellPropertyForm
        formData={initialFormData}
        onSubmit={vi.fn()}
        handleCancelEdit={vi.fn()}
        editingId={null}
        isAdding={false}
        isUpdating={false}
      />
    );

    expect(screen.getByLabelText(/Property Title/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Submit Property" })).toBeInTheDocument();
  });

  it("keeps media upload as coming soon", () => {
    renderForm();

    expect(screen.getByRole("heading", { name: "Photos & Media" })).toBeInTheDocument();
    expect(screen.getByText(/Coming soon/)).toBeInTheDocument();
  });
});
