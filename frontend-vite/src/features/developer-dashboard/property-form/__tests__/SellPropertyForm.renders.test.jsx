// Render-count checks: typing in the listing form must only update what shows
// the typed value, not the whole page.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("react-hot-toast", () => ({ default: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: () => ({ isLoaded: false, loadError: undefined }),
  GoogleMap: () => null,
  Marker: () => null,
  Autocomplete: ({ children }) => children,
}));

// The real SectionCard, wrapped to count how often it renders
const cardRenders = vi.hoisted(() => ({ count: 0 }));
vi.mock("../components/SectionCard", async (importOriginal) => {
  const Actual = (await importOriginal()).default;
  return {
    default: (props) => {
      cardRenders.count += 1;
      return <Actual {...props} />;
    },
  };
});

import SellPropertyForm from "../SellPropertyForm";
import { initialFormData } from "../../utils/developerDashPropertyHelpers";

const renderForm = () =>
  render(
    <SellPropertyForm
      formData={initialFormData}
      onSubmit={vi.fn()}
      handleCancelEdit={vi.fn()}
      editingId={null}
      isAdding={false}
      isUpdating={false}
      draftOwner="dev1"
    />
  );

describe("SellPropertyForm re-renders", () => {
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeEach(() => {
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    cardRenders.count = 0;
  });

  afterEach(() => {
    if (originalScrollIntoView) Element.prototype.scrollIntoView = originalScrollIntoView;
    else delete Element.prototype.scrollIntoView;
  });

  it("typing doesn't re-render the section cards", () => {
    renderForm();
    const afterFirstRender = cardRenders.count;
    expect(afterFirstRender).toBeGreaterThan(0);

    const title = screen.getByLabelText(/Short description/);
    for (const value of ["L", "Lo", "Lod", "Lodh", "Lodha Palava"]) {
      fireEvent.change(title, { target: { value } });
    }

    expect(cardRenders.count).toBe(afterFirstRender);
  });

  it("autosaving doesn't re-render the section cards either", () => {
    vi.useFakeTimers();
    try {
      renderForm();
      const afterFirstRender = cardRenders.count;

      fireEvent.change(screen.getByLabelText(/Short description/), { target: { value: "Lodha Palava" } });
      act(() => vi.advanceTimersByTime(2000)); // the save happens, "Saved on this device" appears

      expect(screen.getByText("Saved on this device.")).toBeInTheDocument();
      expect(cardRenders.count).toBe(afterFirstRender);
    } finally {
      vi.useRealTimers();
    }
  });

  it("still updates what does show the typed value: the preview and the checklist", () => {
    renderForm();
    expect(screen.getByText("Your listing title")).toBeInTheDocument();

    // The title is written for the poster from the details they give
    fireEvent.change(screen.getByLabelText(/Property type/), { target: { value: "Villa" } });
    fireEvent.change(screen.getByLabelText(/Project name/), { target: { value: "Palava City" } });

    expect(screen.getByText("Villa in Palava City", { selector: ".spf-preview__title" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Basic information\s*In progress/ })).toBeInTheDocument();
  });

  it("opening another section still re-renders the cards (their open state changed)", () => {
    renderForm();
    const afterFirstRender = cardRenders.count;

    fireEvent.click(screen.getByRole("button", { name: /Location/, expanded: false }));

    expect(cardRenders.count).toBeGreaterThan(afterFirstRender);
  });
});
