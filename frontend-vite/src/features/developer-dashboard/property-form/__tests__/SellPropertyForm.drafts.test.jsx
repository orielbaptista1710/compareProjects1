// Autosave and the "continue where you left off" question.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { clickPublish } from "./consentHelpers";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("react-hot-toast", () => ({ default: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: () => ({ isLoaded: false, loadError: undefined }),
  GoogleMap: () => null,
  Marker: () => null,
  Autocomplete: ({ children }) => children,
}));

import SellPropertyForm from "../SellPropertyForm";
import { initialFormData } from "../../utils/developerDashPropertyHelpers";

const NEW_KEY = "spf-draft:c1:new";
const EDIT_KEY = "spf-draft:c1:p1";
const DAY = 24 * 60 * 60 * 1000;

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

const title = () => screen.getByLabelText(/Short description/);
const type = (el, value) => fireEvent.change(el, { target: { value } });
const stored = (key = NEW_KEY) => JSON.parse(window.localStorage.getItem(key) || "null");
const putDraft = (key, values, extra = {}) =>
  window.localStorage.setItem(
    key,
    JSON.stringify({ savedAt: Date.now(), values: { ...initialFormData, ...values }, ...extra })
  );
const wait = (ms) => act(() => vi.advanceTimersByTime(ms));

describe("listing form drafts", () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalScrollIntoView) Element.prototype.scrollIntoView = originalScrollIntoView;
    else delete Element.prototype.scrollIntoView;
  });

  describe("autosave", () => {
    it("says work is saved automatically, with no Save draft button", () => {
      renderForm();

      expect(screen.getByText("Your work is saved automatically on this device.")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /save draft/i })).not.toBeInTheDocument();
    });

    it("saves a moment after you stop typing, not on every keystroke", () => {
      renderForm();

      type(title(), "Lodha");
      wait(300);
      type(title(), "Lodha Palava");
      wait(300);
      expect(stored()).toBeNull(); // still inside the pause

      wait(900);
      expect(stored().values.description).toBe("Lodha Palava");
      expect(screen.getByText("Saved on this device.")).toBeInTheDocument();
    });

    it("doesn't save a form nobody has touched", () => {
      renderForm();

      wait(5000);

      expect(window.localStorage.length).toBe(0);
    });

    it("drops the draft again if you put everything back the way it was", () => {
      renderForm();
      type(title(), "Lodha");
      wait(1000);
      expect(stored()).not.toBeNull();

      type(title(), "");
      wait(1000);

      expect(stored()).toBeNull();
    });

    it("keeps only the form's own fields, not the saved listing's ids or review data", () => {
      renderForm({
        formData: { ...VALID_LISTING, _id: "p1", status: "approved", reviewedAt: "2026-01-01", userId: "u1" },
        editingId: "p1",
      });

      type(title(), "A new title for this listing");
      wait(1000);

      const { values } = stored(EDIT_KEY);
      expect(values.description).toBe("A new title for this listing");
      expect(values).not.toHaveProperty("_id");
      expect(values).not.toHaveProperty("status");
      expect(values).not.toHaveProperty("reviewedAt");
      expect(values).not.toHaveProperty("userId");
    });

    it("saves right away when you leave the form within the pause", () => {
      const { unmount } = renderForm();

      type(title(), "Typed just before switching tabs");
      unmount();

      expect(stored().values.description).toBe("Typed just before switching tabs");
    });

    it("saves nothing until the account is known", () => {
      const { unmount } = renderForm({ draftOwner: undefined });

      type(title(), "No account yet");
      wait(2000);
      unmount();

      expect(window.localStorage.length).toBe(0);
    });

    it("says so when the browser won't let it save", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      renderForm();

      type(title(), "Lodha");
      wait(1000);

      expect(screen.getByText(/Couldn't save on this device/)).toBeInTheDocument();
    });
  });

  describe("coming back to a saved draft", () => {
    it("asks first, and only saves what you type after you choose", () => {
      putDraft(NEW_KEY, { description: "Old draft title" });
      renderForm();

      expect(screen.getByText(/You have an unfinished listing, saved on/)).toBeInTheDocument();
      expect(screen.getByText(/isn't saved until you choose/)).toBeInTheDocument();

      type(title(), "Typed before choosing");
      wait(2000);
      expect(stored().values.description).toBe("Old draft title"); // not overwritten

      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(title()).toHaveValue("Old draft title");
      expect(screen.queryByText(/isn't saved until you choose/)).not.toBeInTheDocument();

      type(title(), "Old draft title, extended");
      wait(1000);
      expect(stored().values.description).toBe("Old draft title, extended");
    });

    it("Start over removes the draft and leaves the form empty", () => {
      putDraft(NEW_KEY, { description: "Old draft title" });
      renderForm();

      fireEvent.click(screen.getByRole("button", { name: "Start over" }));

      expect(title()).toHaveValue("");
      expect(stored()).toBeNull();
      expect(screen.getByText("Your work is saved automatically on this device.")).toBeInTheDocument();
    });

    it("words the question for an edit, and Discard changes keeps the saved listing", () => {
      putDraft(EDIT_KEY, { description: "Unsaved new title for it" });
      renderForm({ formData: VALID_LISTING, editingId: "p1" });

      expect(screen.getByText(/You have unsaved changes to this listing/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));

      expect(title()).toHaveValue(VALID_LISTING.description);
      expect(stored(EDIT_KEY)).toBeNull();
    });

    it("offers a draft that is not out of date as a plain Continue", () => {
      putDraft(EDIT_KEY, { description: "Unsaved new title for it" }, { baseVersion: "2026-11-01T10:00:00Z" });
      renderForm({
        formData: { ...VALID_LISTING, updatedAt: "2026-11-01T10:00:00Z" },
        editingId: "p1",
      });

      expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
      expect(screen.queryByText(/changed after you saved/)).not.toBeInTheDocument();
    });

    it("warns when the listing changed after the draft was saved, and lets you choose", () => {
      putDraft(EDIT_KEY, { description: "Unsaved new title for it" }, { baseVersion: "2026-11-01T10:00:00Z" });
      renderForm({
        formData: { ...VALID_LISTING, updatedAt: "2026-11-05T09:00:00Z" },
        editingId: "p1",
      });

      expect(screen.getByText(/This listing changed after you saved these edits/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Use my draft" }));
      expect(title()).toHaveValue("Unsaved new title for it");
    });

    it("'Use the latest version' drops the out-of-date draft", () => {
      putDraft(EDIT_KEY, { description: "Unsaved new title for it" }, { baseVersion: "2026-11-01T10:00:00Z" });
      renderForm({
        formData: { ...VALID_LISTING, updatedAt: "2026-11-05T09:00:00Z" },
        editingId: "p1",
      });

      fireEvent.click(screen.getByRole("button", { name: "Use the latest version" }));

      expect(title()).toHaveValue(VALID_LISTING.description);
      expect(stored(EDIT_KEY)).toBeNull();
    });

    it("never offers a draft older than 30 days", () => {
      window.localStorage.setItem(
        NEW_KEY,
        JSON.stringify({ savedAt: Date.now() - 31 * DAY, values: { ...initialFormData, description: "Ancient" } })
      );

      renderForm();

      expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
      expect(window.localStorage.getItem(NEW_KEY)).toBeNull();
    });
  });

  describe("after the listing is saved", () => {
    it("removes the draft, and a pending autosave can't bring it back", async () => {
      const onSubmit = vi.fn();
      const { unmount } = renderForm({ formData: VALID_LISTING, onSubmit });

      type(title(), "Lodha Palava Phase 4");
      wait(1000);
      expect(stored()).not.toBeNull(); // autosaved

      clickPublish("Publish listing");
      await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      act(() => onSubmit.mock.calls[0][1].onSuccess()); // the server saved it
      expect(stored()).toBeNull();

      // A save is pending as the form closes (a tab switch would flush it)
      type(title(), "Typed as the form closes");
      unmount();
      wait(2000);

      expect(stored()).toBeNull();
    });
  });
});
