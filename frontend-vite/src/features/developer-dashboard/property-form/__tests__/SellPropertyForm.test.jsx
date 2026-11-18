import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// The Maps SDK is never really loaded; by default the section shows its
// loading hint. A test can flip maps.isLoaded to render the (stubbed) map.
const maps = vi.hoisted(() => ({ isLoaded: false }));
vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: () => ({ isLoaded: maps.isLoaded, loadError: undefined }),
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
  "state", "city", "locality", "address", "pincode", "coordinates",
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
      draftOwner="dev1"
      {...props}
    />
  );

const NEW_DRAFT_KEY = "spf-draft:dev1:new";
const putDraft = (values, key = NEW_DRAFT_KEY, savedAt = Date.now()) =>
  window.localStorage.setItem(key, JSON.stringify({ savedAt, values: { ...initialFormData, ...values } }));

// Collapsed section rows are the only buttons with aria-expanded="false"
const openSection = (name) =>
  fireEvent.click(screen.getByRole("button", { name, expanded: false }));

describe("SellPropertyForm", () => {
  // jsdom has no scrollIntoView; stub it per test and put back what was there
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    maps.isLoaded = false;
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
    expect(screen.getByLabelText(/Short description/)).toBeInTheDocument();

    openSection(/Location/);

    expect(screen.getByLabelText(/^State/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Short description/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Location/, expanded: true })).toBeInTheDocument();
  });

  it("Continue stays on an incomplete section and moves on once it's valid", async () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Continue to location" }));
    expect(await screen.findByText(/Short description must be at least 20 characters/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^State/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Property type/), { target: { value: "Villa" } });
    fireEvent.change(screen.getByLabelText(/Developer or builder name/), { target: { value: "Lodha Group" } });
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

  it("lists every property type, grouped as Residential and Commercial", () => {
    renderForm();
    const select = screen.getByLabelText(/Property type/);

    const residential = within(select).getByRole("group", { name: "Residential" });
    const commercial = within(select).getByRole("group", { name: "Commercial" });
    expect(within(residential).getAllByRole("option").map((o) => o.value)).toEqual([
      "Flats/Apartments", "Villa", "Plot",
    ]);
    expect(within(commercial).getAllByRole("option").map((o) => o.value)).toEqual([
      "Shop/Showroom", "Office Space", "Industrial Warehouse/Godown", "Industrial Building", "Commercial Land",
    ]);
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

  it("autosaves what you type and offers it back when the form is reopened", () => {
    const { unmount } = renderForm();
    fireEvent.change(screen.getByLabelText(/Short description/), { target: { value: "Draft title here" } });
    unmount(); // leaving the form saves right away, no button involved

    renderForm();
    expect(screen.getByLabelText(/Short description/)).toHaveValue("");
    expect(screen.getByText(/You have an unfinished listing/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByLabelText(/Short description/)).toHaveValue("Draft title here");
  });

  it("keeps drafts separate per developer", () => {
    putDraft({ description: "Someone else's draft" }, "spf-draft:dev2:new");

    renderForm();

    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
  });

  it("removes drafts saved before they were scoped per developer", () => {
    window.localStorage.setItem("spf-draft:new", JSON.stringify({ savedAt: Date.now(), values: {} }));

    renderForm();

    expect(window.localStorage.getItem("spf-draft:new")).toBeNull();
  });

  it("ignores a corrupted draft instead of crashing", () => {
    window.localStorage.setItem(NEW_DRAFT_KEY, JSON.stringify({ savedAt: "x", values: { description: "t" } }));

    renderForm();

    expect(screen.getByLabelText(/Short description/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
  });

  it("shows a restored draft's commercial property type", () => {
    putDraft({ propertyType: "Office Space" });
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText(/Property type/)).toHaveValue("Office Space");
  });

  it("puts the map pin back when a draft with a location is restored", () => {
    maps.isLoaded = true;
    putDraft({ lat: 19.07, lng: 72.87 });
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    openSection(/Location/);

    expect(screen.getByText("Drag the pin or click the map to move it.")).toBeInTheDocument();
  });

  it("keeps the draft when the save fails and clears it once the save succeeds", async () => {
    putDraft({ description: "Draft title here" });
    const onSubmit = vi.fn();
    renderForm({ formData: VALID_LISTING, editingId: null, onSubmit });

    fireEvent.click(screen.getByRole("button", { name: "Publish listing" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    // Save still in flight / failed: the parent never calls onSuccess
    expect(window.localStorage.getItem(NEW_DRAFT_KEY)).not.toBeNull();

    onSubmit.mock.calls[0][1].onSuccess();
    expect(window.localStorage.getItem(NEW_DRAFT_KEY)).toBeNull();
  });

  it("marks the fields the server refused, with its reason, and opens that section", async () => {
    const onSubmit = vi.fn();
    renderForm({ formData: VALID_LISTING, editingId: null, onSubmit });

    fireEvent.click(screen.getByRole("button", { name: "Publish listing" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    // The save comes back 400 with a reason per field
    onSubmit.mock.calls[0][1].onError({
      response: { status: 400, data: { errors: { pincode: "Pincode must be exactly 6 digits", title: "Use 200 characters or fewer" } } },
    });

    expect(await screen.findByText("Pincode must be exactly 6 digits")).toBeInTheDocument();
    // The title isn't a form field (it's generated), so it's only in the toast
    expect(screen.queryByText("Use 200 characters or fewer")).not.toBeInTheDocument();
  });

  it("shows what a saved listing already fails when it's opened for editing", async () => {
    renderForm({ formData: { ...VALID_LISTING, description: "Too short" }, editingId: "p1" });

    expect(await screen.findByText(/Short description must be at least 20 characters/)).toBeInTheDocument();
    expect(screen.getByText("Fix the fields marked in the checklist to publish")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update listing" })).toBeDisabled();
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
    // type "" = not specified (clears a saved type on the server, FORM-07)
    expect(payload.area).toEqual({ value: 1200, unit: "sqft", type: "" });
    expect(payload.bhk).toBe(3);
    expect(payload.floor).toBe(0);
    expect(payload.possessionStatus).toBe("Ready to Move");
    // Saved with a number but reraApproved=false → box is ticked, number kept
    expect(payload.reraNumber).toBe("P51700045678");
  });

  it("shows a saved price in Lakh and sends whole rupees for Lakh or Crore (FORM-06)", async () => {
    const payload = await submitEdit(VALID_LISTING, () => {
      openSection(/Price and area/);
      const amount = screen.getByLabelText(/Total Price/);
      const unit = screen.getByLabelText("Price unit");
      expect(amount).toHaveValue("75");
      expect(unit).toHaveValue("lakh");
      expect(screen.getByText("₹75,00,000 (75 Lakh)")).toBeInTheDocument();

      fireEvent.change(amount, { target: { value: "1.25" } });
      fireEvent.change(unit, { target: { value: "crore" } });
      expect(screen.getByText("₹1,25,00,000 (1.25 Crore)")).toBeInTheDocument();
    });

    expect(payload.price).toBe(12500000);
  });

  it("refuses a price under ₹1 lakh and says so", async () => {
    renderForm({ formData: VALID_LISTING, editingId: "p1" });
    openSection(/Price and area/);

    const amount = screen.getByLabelText(/Total Price/);
    fireEvent.change(screen.getByLabelText("Price unit"), { target: { value: "rupees" } });
    fireEvent.change(amount, { target: { value: "50000" } });
    fireEvent.blur(amount);

    expect(await screen.findByText("Price must be at least ₹1 Lakh")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update listing" })).toBeDisabled();
  });

  it("keeps a saved area type and sends it back", async () => {
    const payload = await submitEdit({ ...VALID_LISTING, area: { value: 1200, unit: "sqft", type: "carpet" } });

    expect(payload.area).toEqual({ value: 1200, unit: "sqft", type: "carpet" });
  });

  it("doesn't ask a plot for bedrooms, furnishing or floors, and doesn't send them (FORM-08)", async () => {
    const plot = { ...VALID_LISTING, propertyType: "Plot", furnishing: "", totalFloors: 10 };
    const payload = await submitEdit(plot, () => {
      openSection(/Property details/);
      expect(screen.queryByText("BHK Configuration")).not.toBeInTheDocument();
      expect(screen.queryByText(/^Furnishing/)).not.toBeInTheDocument();
      expect(screen.getByText("Facing")).toBeInTheDocument();
      openSection(/Building/);
      expect(screen.queryByLabelText("Unit Floor")).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Units Available/)).toBeInTheDocument();
    });

    for (const field of ["bhk", "furnishing", "floor", "totalFloors"]) {
      expect(payload[field]).toBeUndefined();
    }
  });

  it("marks furnishing optional for a shop", () => {
    renderForm({ formData: { ...VALID_LISTING, propertyType: "Shop/Showroom" }, editingId: "p1" });
    openSection(/Property details/);

    expect(screen.getByText(/^Furnishing/).parentElement).toHaveTextContent("(optional)");
    expect(screen.queryByText("BHK Configuration")).not.toBeInTheDocument();
    expect(screen.getByText("Bathrooms")).toBeInTheDocument();
  });

  it("sends one submission id with a new listing and reuses it on a retry (FORM-11)", async () => {
    const outcomes = ["error", "success", "success"];
    const onSubmit = vi.fn((_, { onSuccess, onError }) =>
      outcomes.shift() === "error" ? onError({ response: { status: 504 } }) : onSuccess()
    );
    renderForm({ formData: VALID_LISTING, onSubmit });
    const publish = () => fireEvent.click(screen.getByRole("button", { name: "Publish listing" }));

    publish(); // times out
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    publish(); // retried: same id, so the API can't create it twice
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    publish(); // saved before, so this is another listing
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(3));

    const [first, retry, next] = onSubmit.mock.calls.map(([body]) => body.submissionId);
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(retry).toBe(first);
    expect(next).toMatch(/^[0-9a-f-]{36}$/);
    expect(next).not.toBe(first);
  });

  it("sends no submission id with an edit", async () => {
    const payload = await submitEdit(VALID_LISTING);

    expect(payload).not.toHaveProperty("submissionId");
  });

  it("keeps a basement floor and an older numeric tower through an edit (FORM-18)", async () => {
    const payload = await submitEdit({ ...VALID_LISTING, floor: -1, tower: 3 });

    expect(payload.floor).toBe(-1);
    expect(payload.tower).toBe("3");
  });

  it("shows a saved basement as B1 and sends a lettered tower", async () => {
    const payload = await submitEdit({ ...VALID_LISTING, floor: -1 }, () => {
      fireEvent.click(screen.getByRole("button", { name: /Building/, expanded: false }));
      expect(screen.getByLabelText(/Unit Floor/)).toHaveValue("B1");
      fireEvent.change(screen.getByLabelText(/^Tower/), { target: { value: "T2" } });
    });

    expect(payload.tower).toBe("T2");
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

  it("writes the title for a new listing from its details", async () => {
    const onSubmit = vi.fn();
    renderForm({ formData: { ...VALID_LISTING, title: "" }, onSubmit });
    expect(screen.queryByLabelText(/Listing title/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Publish listing" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(onSubmit.mock.calls[0][0].title).toBe("3 BHK Flat in Dombivli, Thane");
  });

  it("keeps the title an existing listing already has", async () => {
    const onSubmit = vi.fn();
    renderForm({ formData: VALID_LISTING, editingId: "p1", onSubmit });

    fireEvent.click(screen.getByRole("button", { name: "Update listing" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(onSubmit.mock.calls[0][0].title).toBe("Lodha Palava Phase 3");
  });

  it("clears the fields when an edit is cancelled", () => {
    const { rerender } = renderForm({ formData: VALID_LISTING, editingId: "p1" });
    expect(screen.getByLabelText(/Short description/)).toHaveValue(VALID_LISTING.description);

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

    expect(screen.getByLabelText(/Short description/)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Publish listing" })).toBeInTheDocument();
  });

  it("keeps photos and documents as coming soon", () => {
    renderForm();

    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    openSection(/Photos and documents/);
    expect(screen.getByText(/uploads are coming soon/)).toBeInTheDocument();
  });
});
