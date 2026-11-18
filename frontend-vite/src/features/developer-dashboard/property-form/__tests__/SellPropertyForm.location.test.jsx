// The Location section: the map pin (place, keep inside India, remove), what a
// map search fills in, and typing a city or locality we have no list for.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";

// The stubbed map hands its handlers to the test, which then plays the part
// of Google Maps (a click, a drag, a chosen search result).
const maps = vi.hoisted(() => ({ map: null, marker: null, autocomplete: null }));
vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: () => ({ isLoaded: true, loadError: undefined }),
  GoogleMap: (props) => {
    maps.map = props;
    return props.children ?? null;
  },
  Marker: (props) => {
    maps.marker = props;
    return null;
  },
  Autocomplete: (props) => {
    maps.autocomplete = props;
    return props.children;
  },
}));
vi.mock("react-hot-toast", () => ({ default: { error: vi.fn(), success: vi.fn() } }));
vi.mock("../../../../config/features", () => ({
  CUSTOMER_LISTINGS_ENABLED: true,
  MEDIA_UPLOAD_ENABLED: false,
}));

import toast from "react-hot-toast";
import SellPropertyForm from "../SellPropertyForm";
import { initialFormData } from "../../utils/developerDashPropertyHelpers";

const SAVED = {
  ...initialFormData,
  developerName: "Lodha Group",
  title: "3 BHK Flat in Dombivli, Thane",
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
  bhk: 3,
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
      draftOwner="dev1"
      {...props}
    />
  );

const openLocation = () =>
  fireEvent.click(screen.getByRole("button", { name: /Location/, expanded: false }));

const at = (lat, lng) => ({ latLng: { lat: () => lat, lng: () => lng } });
const part = (long_name, ...types) => ({ long_name, types });
const choosePlace = (place) => {
  act(() => maps.autocomplete.onLoad({ getPlace: () => place }));
  act(() => maps.autocomplete.onPlaceChanged());
};

const NO_PIN = /click the map to pin the location/;
const HAS_PIN = /Drag the pin or click the map to move it/;

describe("SellPropertyForm location", () => {
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

  it("places a pin on a map click, lets it be dragged, and removes it again", () => {
    renderForm();
    openLocation();
    expect(screen.getByText(NO_PIN)).toBeInTheDocument();

    act(() => maps.map.onClick(at(19.07, 72.87)));
    expect(screen.getByText(HAS_PIN)).toBeInTheDocument();
    expect(maps.marker.position).toEqual({ lat: 19.07, lng: 72.87 });
    expect(maps.marker.draggable).toBe(true);

    act(() => maps.marker.onDragEnd(at(19.2, 73.1)));
    expect(maps.marker.position).toEqual({ lat: 19.2, lng: 73.1 });

    fireEvent.click(screen.getByRole("button", { name: "Remove pin" }));
    expect(screen.getByText(NO_PIN)).toBeInTheDocument();
  });

  it("refuses a pin outside India and keeps the one it had", () => {
    renderForm();
    openLocation();
    act(() => maps.map.onClick(at(19.07, 72.87)));

    act(() => maps.map.onClick(at(51.5, -0.12))); // London
    expect(toast.error).toHaveBeenCalledWith("Place the pin inside India.");
    expect(maps.marker.position).toEqual({ lat: 19.07, lng: 72.87 });
  });

  it("sends the pin with the listing, and nothing once it is removed", async () => {
    const onSubmit = vi.fn();
    renderForm({ formData: SAVED, onSubmit });
    openLocation();

    act(() => maps.map.onClick(at(19.2, 73.1)));
    fireEvent.click(screen.getByRole("button", { name: "Publish listing" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].coordinates).toEqual({ lat: 19.2, lng: 73.1 });

    fireEvent.click(screen.getByRole("button", { name: "Remove pin" }));
    fireEvent.click(screen.getByRole("button", { name: "Publish listing" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1][0].coordinates).toBeUndefined();
  });

  it("removes a pin saved with the listing by sending null, so the API clears it", async () => {
    const onSubmit = vi.fn();
    renderForm({ formData: { ...SAVED, coordinates: { lat: 19.2, lng: 73.1 } }, editingId: "p1", onSubmit });
    openLocation();
    expect(screen.getByText(HAS_PIN)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove pin" }));
    expect(screen.getByText(NO_PIN)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Update listing" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].coordinates).toBeNull();
  });

  it("keeps a saved pin when the poster doesn't touch it", async () => {
    const onSubmit = vi.fn();
    const pin = { lat: 19.2, lng: 73.1 };
    renderForm({ formData: { ...SAVED, coordinates: pin }, editingId: "p1", onSubmit });

    fireEvent.click(screen.getByRole("button", { name: "Update listing" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].coordinates).toEqual(pin);
  });

  it("treats a saved listing without lat/lng as having no pin", async () => {
    // The API stores coordinates.source on every listing, pin or not
    const onSubmit = vi.fn();
    renderForm({ formData: { ...SAVED, coordinates: { source: "address" } }, editingId: "p1", onSubmit });
    openLocation();

    expect(screen.getByText(NO_PIN)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Update listing" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].coordinates).toBeUndefined();
  });

  it("refuses a map search result outside India", () => {
    renderForm({ formData: SAVED });
    openLocation();

    choosePlace({
      geometry: { location: { lat: () => 25.2, lng: () => 55.27 } }, // Dubai
      formatted_address: "Downtown Dubai, UAE",
      address_components: [part("Dubai", "locality")],
    });

    expect(toast.error).toHaveBeenCalledWith("Pick a place inside India.");
    expect(screen.getByText(NO_PIN)).toBeInTheDocument();
    expect(screen.getByLabelText(/^City/)).toHaveValue("Thane"); // address left as it was
  });

  it("shows the server's pin error under the map, and clears it once the pin moves", async () => {
    const onSubmit = vi.fn((_, { onError }) =>
      onError({ response: { data: { errors: { "coordinates.lat": "Place the pin inside India" } } } })
    );
    renderForm({ formData: { ...SAVED, coordinates: { lat: 19.2, lng: 73.1 } }, editingId: "p1", onSubmit });

    fireEvent.click(screen.getByRole("button", { name: "Update listing" }));

    expect(await screen.findByText("Place the pin inside India")).toBeInTheDocument();
    act(() => maps.map.onClick(at(19.07, 72.87)));
    expect(screen.queryByText("Place the pin inside India")).not.toBeInTheDocument();
  });

  it("fills the address from a map search and drops what the last search left behind", () => {
    renderForm({ formData: SAVED });
    openLocation();

    choosePlace({
      geometry: { location: { lat: () => 28.63, lng: () => 77.22 } },
      formatted_address: "Connaught Place, New Delhi, Delhi 110001, India",
      address_components: [
        part("New Delhi", "locality"),
        part("Delhi", "administrative_area_level_1"),
        part("110001", "postal_code"),
        // no sublocality in this result
      ],
    });

    expect(screen.getByLabelText(/^State/)).toHaveValue("Delhi");
    expect(screen.getByLabelText(/^City/)).toHaveValue("New Delhi");
    expect(screen.getByLabelText(/^Pincode/)).toHaveValue("110001");
    expect(screen.getByLabelText(/^Full address/)).toHaveValue("Connaught Place, New Delhi, Delhi 110001, India");
    // Dombivli belonged to the previous address
    expect(screen.getByLabelText(/^Locality/)).toHaveValue("");
    expect(maps.marker.position).toEqual({ lat: 28.63, lng: 77.22 });
  });

  it("lets the poster type a city and locality we have no list for", () => {
    renderForm({ formData: { ...SAVED, state: "Delhi", city: "New Delhi", locality: "" } });
    openLocation();

    const city = screen.getByLabelText(/^City/);
    const locality = screen.getByLabelText(/^Locality/);
    expect(city.tagName).toBe("INPUT");
    expect(locality.tagName).toBe("INPUT");

    fireEvent.change(locality, { target: { value: "Connaught Place" } });
    expect(locality).toHaveValue("Connaught Place");
  });

  it("keeps the dropdowns for a city we do list", () => {
    renderForm({ formData: { ...SAVED, city: "Mumbai", locality: "Andheri West" } });
    openLocation();

    expect(screen.getByLabelText(/^City/).tagName).toBe("SELECT");
    expect(screen.getByLabelText(/^Locality/).tagName).toBe("SELECT");
    expect(screen.getByLabelText(/^Locality/)).toHaveValue("Andheri West");

    // picking another city clears the locality that belonged to the old one
    fireEvent.change(screen.getByLabelText(/^City/), { target: { value: "Pune" } });
    expect(screen.getByLabelText(/^Locality/)).toHaveValue("");
  });
});
