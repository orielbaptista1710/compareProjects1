import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

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

// Every field the form collects, by the name it's submitted under
const SUBMITTED_FIELDS = [
  "developerName", "projectName", "title", "description", "long_description",
  "state", "city", "locality", "address", "pincode", "mapLink", "coordinates",
  "price", "emiStarts", "priceNegotiable", "area",
  "propertyType", "bhk", "bathrooms", "balconies", "facing", "parkings",
  "furnishing", "possessionStatus", "ageOfProperty",
  "totalFloors", "floor", "wing", "phase", "tower", "unitsAvailable",
  "reraApproved", "reraNumber", "reraDate",
  "amenities", "facilities", "security",
];

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

// Collapsed section rows are the only buttons with aria-expanded="false"
const openSection = (name) =>
  fireEvent.click(screen.getByRole("button", { name, expanded: false }));

describe("SellPropertyForm", () => {
  // jsdom has no scrollIntoView; stub it per test and put back what was there
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    if (originalScrollIntoView) {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    } else {
      delete Element.prototype.scrollIntoView;
    }
  });

  it("opens one section at a time from its row", () => {
    renderForm();
    expect(screen.getByLabelText(/Listing title/)).toBeInTheDocument();

    openSection(/Location/);

    expect(screen.getByLabelText(/^State/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Listing title/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Location/, expanded: true })).toBeInTheDocument();
  });

  it("Continue stays on an incomplete section and moves on once it's valid", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Continue to location" }));
    expect(await screen.findByText(/Title must be at least 5 characters/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^State/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Property type/), { target: { value: "Villa" } });
    fireEvent.change(screen.getByLabelText(/Developer or builder name/), { target: { value: "Lodha Group" } });
    fireEvent.change(screen.getByLabelText(/Listing title/), { target: { value: "Lodha Palava Phase 3" } });
    fireEvent.change(screen.getByLabelText(/Short description/), {
      target: { value: "Spacious homes close to the station and schools." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to location" }));

    expect(await screen.findByLabelText(/^State/)).toBeInTheDocument();
  });

  it("keeps Publish disabled until every required field is valid", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Publish listing" })).toBeDisabled();
    expect(screen.getByText("Complete every section to publish")).toBeInTheDocument();
  });

  it("filters property types by category", () => {
    renderForm();
    const select = screen.getByLabelText(/Property type/);
    expect(within(select).getByRole("option", { name: "Villa" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Commercial" }));

    expect(screen.getByRole("button", { name: "Commercial" })).toHaveAttribute("aria-pressed", "true");
    expect(within(select).queryByRole("option", { name: "Villa" })).not.toBeInTheDocument();
    expect(within(select).getByRole("option", { name: "Office Space" })).toBeInTheDocument();
  });

  it("shows the live listing in the buyer preview", () => {
    renderForm({ formData: VALID_LISTING, editingId: "p1" });
    const preview = screen.getByRole("region", { name: "How buyers will see it" });

    expect(within(preview).getByText("Lodha Palava Phase 3")).toBeInTheDocument();
    expect(within(preview).getByText("₹75.00 L")).toBeInTheDocument();
    expect(within(preview).getByText("3 BHK Flats/Apartments")).toBeInTheDocument();
    expect(within(preview).getByText("Dombivli, Thane")).toBeInTheDocument();
    expect(within(preview).getByText("P51700045678")).toBeInTheDocument();
  });

  it("shows Not listed for empty rows", () => {
    renderForm();
    const preview = screen.getByRole("region", { name: "How buyers will see it" });

    expect(within(preview).getAllByText("Not listed")).toHaveLength(6);
  });

  it("counts finished sections from the saved values in edit mode", () => {
    renderForm({ formData: VALID_LISTING, editingId: "p1" });

    // Everything but Amenities (nothing ticked yet); Photos isn't counted
    expect(screen.getByText("6 of 7 done")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Sections done" })).toHaveAttribute("aria-valuenow", "6");
  });

  it("saves a draft in this browser and restores it", () => {
    const { unmount } = renderForm();
    fireEvent.change(screen.getByLabelText(/Listing title/), { target: { value: "Draft title here" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    unmount();

    renderForm();
    expect(screen.getByLabelText(/Listing title/)).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Restore draft" }));
    expect(screen.getByLabelText(/Listing title/)).toHaveValue("Draft title here");
  });

  const submitEdit = async (formData, beforeSubmit) => {
    const onSubmit = vi.fn();
    renderForm({ formData, editingId: "p1", onSubmit });
    beforeSubmit?.();
    fireEvent.click(screen.getByRole("button", { name: "Update listing" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    return onSubmit.mock.calls[0][0];
  };

  it("submits every collected field under its existing name", async () => {
    const payload = await submitEdit(VALID_LISTING);

    expect(Object.keys(payload)).toEqual(expect.arrayContaining(SUBMITTED_FIELDS));
    expect(payload).not.toHaveProperty("propertyGroup");
    expect(payload.area).toEqual({ value: 1200, unit: "sqft" });
    expect(payload.bhk).toBe(3);
    expect(payload.floor).toBe(0);
    expect(payload.possessionStatus).toBe("Ready to Move");
    // Saved with a number but reraApproved=false → box is ticked, number kept
    expect(payload.reraNumber).toBe("P51700045678");
  });

  it("sends the project name", async () => {
    const payload = await submitEdit(VALID_LISTING, () =>
      fireEvent.change(screen.getByLabelText(/Project name/), { target: { value: "Palava City" } })
    );

    expect(payload.projectName).toBe("Palava City");
  });

  it("clears the RERA number when the box is unticked", async () => {
    const payload = await submitEdit(VALID_LISTING, () => {
      openSection(/RERA and possession/);
      fireEvent.click(screen.getByLabelText("RERA Approved"));
    });

    expect(payload.reraNumber).toBe("");
  });

  it("saves an unchanged 5+ BHK listing with its real count", async () => {
    const payload = await submitEdit({ ...VALID_LISTING, bhk: 7, bathrooms: 6 });

    expect(payload.bhk).toBe(7);
    expect(payload.bathrooms).toBe(6);
  });

  it("shows the saved BHK as selected in edit mode", () => {
    renderForm({ formData: VALID_LISTING, editingId: "p1" });
    openSection(/Property details/);

    expect(screen.getByRole("radio", { name: "3 BHK" })).toBeChecked();
  });

  it("shows a saved count above the cap on the top pill", () => {
    renderForm({ formData: { ...VALID_LISTING, bhk: 7 }, editingId: "p1" });
    openSection(/Property details/);

    expect(screen.getByRole("radio", { name: "5+ BHK" })).toBeChecked();
  });

  it("clears the fields when an edit is cancelled", () => {
    const { rerender } = renderForm({ formData: VALID_LISTING, editingId: "p1" });
    expect(screen.getByLabelText(/Listing title/)).toHaveValue("Lodha Palava Phase 3");

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

    expect(screen.getByLabelText(/Listing title/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Publish listing" })).toBeInTheDocument();
  });

  it("keeps photos and documents as coming soon", () => {
    renderForm();

    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    openSection(/Photos and documents/);
    expect(screen.getByText(/uploads are coming soon/)).toBeInTheDocument();
  });
});
