import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { publishButton, tickConsent } from "./consentHelpers";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: () => ({ isLoaded: false, loadError: undefined }),
  GoogleMap: () => null,
  Marker: () => null,
  Autocomplete: ({ children }) => children,
}));

import SellPropertyForm from "../SellPropertyForm";
import { FORM_ROLES, formRoleConfig } from "../roleConfig";
import { initialFormData } from "../../utils/developerDashPropertyHelpers";
import { LISTED_BY } from "../../../../constants/roles";

// Valid for an owner: nothing about developer, units or possession
const OWNER_LISTING = {
  ...initialFormData,
  title: "2 BHK flat in Andheri West",
  description: "Well kept flat close to the metro and market.",
  state: "Maharashtra",
  city: "Mumbai",
  locality: "Andheri West",
  address: "Lokhandwala Complex, Andheri West",
  pincode: "400053",
  price: 9500000,
  propertyType: "Flats/Apartments",
  furnishing: "Semi Furnished",
  area: { value: 900, unit: "sqft" },
  bhk: 2,
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
      draftOwner="c1"
      {...props}
    />
  );

// The section rows are the only buttons with aria-expanded="false"; the
// checklist in the right rail has same-named items that aren't.
const collapsedRow = (name) => screen.getByRole("button", { name, expanded: false });

describe("form roles", () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    if (originalScrollIntoView) Element.prototype.scrollIntoView = originalScrollIntoView;
    else delete Element.prototype.scrollIntoView;
  });

  describe("roleConfig", () => {
    it("falls back to the developer form for an unknown role", () => {
      expect(formRoleConfig("admin")).toBe(FORM_ROLES[LISTED_BY.DEVELOPER]);
      expect(formRoleConfig(undefined)).toBe(FORM_ROLES[LISTED_BY.DEVELOPER]);
    });

    it("only asks owners and agents for what the backend needs", () => {
      expect(FORM_ROLES.developer.requiredFields).toEqual(
        expect.arrayContaining(["developerName", "possessionStatus", "unitsAvailable"])
      );
      expect(FORM_ROLES.agent.requiredFields).toContain("possessionStatus");
      expect(FORM_ROLES.agent.requiredFields).not.toContain("developerName");
      expect(FORM_ROLES.owner.requiredFields).not.toContain("possessionStatus");
      expect(FORM_ROLES.owner.requiredFields).not.toContain("unitsAvailable");
      // everything the backend itself requires stays required for everyone
      for (const role of Object.values(FORM_ROLES)) {
        expect(role.requiredFields).toEqual(
          expect.arrayContaining(["title", "description", "address", "price", "propertyType"])
        );
      }
    });
  });

  describe("editing a live listing", () => {
    const NOTICE = /This listing is live\. Saving your changes sends it back for review/;

    it("warns, before saving, that a live listing goes back to review", () => {
      renderForm({ role: LISTED_BY.OWNER, formData: OWNER_LISTING, editingId: "p1", editingStatus: "approved" });

      expect(screen.getByRole("note")).toHaveTextContent(NOTICE);
    });

    it("doesn't warn for a listing that isn't live, or when adding", () => {
      const { unmount } = renderForm({ formData: OWNER_LISTING, editingId: "p1", editingStatus: "pending" });
      expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
      unmount();

      renderForm({ editingStatus: "approved" }); // adding: no editingId
      expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    });

    it("says which fields can't change on a listing approved before", () => {
      const LOCKED = /Property type, BHK and location .* can't be changed on an approved listing/;
      const { unmount } = renderForm({ formData: OWNER_LISTING, editingId: "p1", editingLocked: true });
      expect(screen.getByText(LOCKED)).toBeInTheDocument();
      unmount();

      renderForm({ formData: OWNER_LISTING, editingId: "p1" });
      expect(screen.queryByText(LOCKED)).not.toBeInTheDocument();
    });
  });

  describe("developer (default)", () => {
    it("shows every section and the developer fields", () => {
      renderForm();

      expect(screen.getByLabelText(/Developer or builder name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Project name/)).toBeInTheDocument();
      expect(collapsedRow(/^Building/)).toBeInTheDocument();
      expect(collapsedRow(/RERA and possession/)).toBeInTheDocument();
    });
  });

  describe("owner", () => {
    it("has no Building or RERA section and no developer fields", () => {
      renderForm({ role: LISTED_BY.OWNER });

      // Neither the section rows nor the checklist items exist
      expect(screen.queryByRole("button", { name: /^Building/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /RERA and possession/ })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Developer or builder name/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Project name/)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Short description/)).toBeInTheDocument();
    });

    it("counts only the sections it shows", () => {
      renderForm({ role: LISTED_BY.OWNER });

      // info, location, price, details, amenities (photos aren't counted)
      expect(screen.getByText("0 of 5 done")).toBeInTheDocument();
    });

    it("lets a listing without developer, units or possession be published", async () => {
      const onSubmit = vi.fn();
      renderForm({ role: LISTED_BY.OWNER, formData: OWNER_LISTING, editingId: "p1", onSubmit });

      tickConsent();
      const update = publishButton("Update listing");
      await waitFor(() => expect(update).toBeEnabled());
      update.click();

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0].title).toBe("2 BHK flat in Andheri West");
    });
  });

  describe("agent", () => {
    it("keeps RERA and Building but drops the developer fields", () => {
      renderForm({ role: LISTED_BY.AGENT });

      expect(collapsedRow(/RERA and possession/)).toBeInTheDocument();
      expect(collapsedRow(/^Building/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Developer or builder name/)).not.toBeInTheDocument();
    });

    it("still needs a possession status", async () => {
      renderForm({ role: LISTED_BY.AGENT, formData: OWNER_LISTING, editingId: "p1" });

      // The same listing is publishable for an owner but not for an agent
      expect(publishButton("Update listing")).toBeDisabled();
    });
  });
});
