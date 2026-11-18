// The listing form with uploads switched on (VITE_ENABLE_MEDIA_UPLOAD): the
// photo section replaces "coming soon", and a save carries the photos, the
// brochure and the video link in the shape the API stores.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../../../config/features", () => ({
  CUSTOMER_LISTINGS_ENABLED: true,
  MEDIA_UPLOAD_ENABLED: true,
}));
vi.mock("react-hot-toast", () => ({ default: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: () => ({ isLoaded: false, loadError: undefined }),
  GoogleMap: () => null,
  Marker: () => null,
  Autocomplete: ({ children }) => children,
}));

import SellPropertyForm from "../SellPropertyForm";
import { initialFormData } from "../../utils/developerDashPropertyHelpers";
import { LISTED_BY } from "../../../../constants/roles";

const COVER = { _id: "c", url: "https://media.test/1-image.webp", thumbnail: "https://media.test/1-thumb.webp", category: "exterior" };
const KITCHEN = { _id: "k", url: "https://media.test/2-image.webp", thumbnail: "https://media.test/2-thumb.webp", category: "kitchen" };
const VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

const SAVED_LISTING = {
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
  coverImage: COVER,
  galleryImages: [KITCHEN],
  virtualTours: [{ _id: "t", type: "video", url: VIDEO }],
};

const renderForm = (props = {}) =>
  render(
    <SellPropertyForm
      formData={SAVED_LISTING}
      onSubmit={vi.fn()}
      handleCancelEdit={vi.fn()}
      editingId="p1"
      isAdding={false}
      isUpdating={false}
      draftOwner="c1"
      role={LISTED_BY.OWNER}
      {...props}
    />
  );

describe("SellPropertyForm with uploads on", () => {
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

  it("shows the saved photos and video link instead of 'coming soon'", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: /Photos and documents/, expanded: false }));

    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    expect(screen.getByText("Cover photo")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Kitchen/ })).toHaveTextContent("1");
    expect(screen.getByLabelText(/YouTube video link/)).toHaveValue(VIDEO);
  });

  it("sends photos and the video link in the API's shape, without form-only fields", async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });

    const update = screen.getByRole("button", { name: "Update listing" });
    await waitFor(() => expect(update).toBeEnabled());
    update.click();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const payload = onSubmit.mock.calls[0][0];
    // Database ids on the saved photos are not sent back
    expect(payload.coverImage).toEqual({ url: COVER.url, thumbnail: COVER.thumbnail, category: "exterior" });
    expect(payload.galleryImages).toEqual([{ url: KITCHEN.url, thumbnail: KITCHEN.thumbnail, category: "kitchen" }]);
    expect(payload.virtualTours).toEqual([{ type: "video", url: VIDEO }]);
    expect(payload.videoUrl).toBeUndefined();
    expect(payload.brochure).toBeUndefined();
  });

  it("blocks a video link that isn't one YouTube video", async () => {
    const onSubmit = vi.fn();
    renderForm({ onSubmit });
    await userEvent.click(screen.getByRole("button", { name: /Photos and documents/, expanded: false }));

    const field = screen.getByLabelText(/YouTube video link/);
    await userEvent.clear(field);
    await userEvent.type(field, "https://example.com/video");
    await userEvent.tab();

    expect(await screen.findByText(/Paste the link to one YouTube video/)).toBeInTheDocument();
  });
});
