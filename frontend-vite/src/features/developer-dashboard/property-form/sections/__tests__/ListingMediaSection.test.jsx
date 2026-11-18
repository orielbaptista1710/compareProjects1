// Photos, video link and brochure in the listing form. Resizing and the upload
// itself are replaced with fakes; what is checked here is what ends up in the
// form (cover, gallery, category, order) and what each poster is offered.
import { useEffect } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";

vi.mock("react-hot-toast", () => ({ default: { error: vi.fn(), success: vi.fn() } }));
vi.mock("../../../../listings/media/uploadMedia", () => ({ uploadFiles: vi.fn() }));
vi.mock("../../../../listings/media/resizePhoto", () => {
  class PhotoError extends Error {}
  return { PhotoError, resizePhoto: vi.fn() };
});

import toast from "react-hot-toast";
import ListingMediaSection from "../ListingMediaSection";
import { uploadFiles } from "../../../../listings/media/uploadMedia";
import { PhotoError, resizePhoto } from "../../../../listings/media/resizePhoto";
import { LISTED_BY } from "../../../../../constants/roles";
import { MAX_PHOTOS } from "../../../../../constants/media";

let form;
const Harness = ({ role = LISTED_BY.OWNER, values = {} }) => {
  const methods = useForm({
    defaultValues: {
      propertyType: "Flats/Apartments",
      coverImage: "",
      galleryImages: [],
      brochure: "",
      videoUrl: "",
      ...values,
    },
  });
  useEffect(() => {
    form = methods; // lets the tests read what the section wrote
  });
  return (
    <FormProvider {...methods}>
      <ListingMediaSection role={role} />
    </FormProvider>
  );
};

const photoFile = (name) => new File(["x"], name, { type: "image/jpeg" });
const stored = (n, category) => ({
  url: `https://media.test/${n}-image.webp`,
  thumbnail: `https://media.test/${n}-thumb.webp`,
  ...(category && { category }),
});

let uploads;
beforeEach(() => {
  vi.clearAllMocks();
  uploads = 0;
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  resizePhoto.mockResolvedValue({ image: new Blob(["i"]), thumb: new Blob(["t"]) });
  uploadFiles.mockImplementation(async () => {
    uploads += 1;
    return [`https://media.test/${uploads}-image.webp`, `https://media.test/${uploads}-thumb.webp`];
  });
});

const pick = (label, files) => userEvent.upload(screen.getByLabelText(label), files);

describe("ListingMediaSection", () => {
  it("offers the tabs that fit the property type", () => {
    const { unmount } = render(<Harness />);
    expect(screen.getByRole("tab", { name: "Bedrooms" })).toBeInTheDocument();
    unmount();

    render(<Harness values={{ propertyType: "Plot" }} />);
    expect(screen.queryByRole("tab", { name: "Bedrooms" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Master plan" })).toBeInTheDocument();
  });

  it("makes the first photo the cover and files the next ones under the open tab", async () => {
    render(<Harness role={LISTED_BY.AGENT} />);
    await pick("Choose exterior view photos", [photoFile("a.jpg")]);
    await waitFor(() => expect(form.getValues("coverImage")).toEqual(stored(1, "exterior")));
    expect(uploadFiles).toHaveBeenCalledWith(LISTED_BY.AGENT, [
      expect.objectContaining({ kind: "image" }),
      expect.objectContaining({ kind: "thumb" }),
    ]);
    expect(screen.getByText("Cover photo")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Kitchen" }));
    await pick("Choose kitchen photos", [photoFile("b.jpg")]);
    await waitFor(() => expect(form.getValues("galleryImages")).toEqual([stored(2, "kitchen")]));
    expect(form.getValues("coverImage")).toEqual(stored(1, "exterior"));
  });

  it("lets the poster choose another cover, reorder and remove photos", async () => {
    render(
      <Harness
        values={{
          coverImage: stored(1, "exterior"),
          galleryImages: [stored(2, "exterior"), stored(3, "exterior")],
        }}
      />
    );
    const tiles = () => within(screen.getByRole("list", { name: "Exterior view photos" })).getAllByRole("listitem");

    // photo 3 moves ahead of photo 2
    await userEvent.click(within(tiles()[2]).getByRole("button", { name: "Move photo earlier" }));
    expect(form.getValues("galleryImages")).toEqual([stored(3, "exterior"), stored(2, "exterior")]);

    // photo 2 becomes the cover; the old cover goes back into the gallery
    await userEvent.click(within(tiles()[2]).getByRole("button", { name: "Use as cover photo" }));
    expect(form.getValues("coverImage")).toEqual(stored(2, "exterior"));
    expect(form.getValues("galleryImages")).toEqual([stored(1, "exterior"), stored(3, "exterior")]);

    // removing the cover hands the cover to the next photo
    await userEvent.click(within(tiles()[0]).getByRole("button", { name: "Remove photo" }));
    expect(form.getValues("coverImage")).toEqual(stored(1, "exterior"));
    expect(form.getValues("galleryImages")).toEqual([stored(3, "exterior")]);
  });

  it("clears the cover when the last photo is removed", async () => {
    render(<Harness values={{ coverImage: stored(1, "exterior") }} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(form.getValues("coverImage")).toBe("");
    expect(form.getValues("galleryImages")).toEqual([]);
  });

  it("shows older photos that have no category under Others", async () => {
    render(<Harness values={{ coverImage: stored(1), galleryImages: [stored(2)] }} />);
    expect(screen.getByRole("tab", { name: /Others/ })).toHaveTextContent("2");
  });

  it("explains a photo that can't be used, without a retry", async () => {
    resizePhoto.mockRejectedValue(new PhotoError("This photo is too small."));
    render(<Harness />);
    await pick("Choose exterior view photos", [photoFile("tiny.jpg")]);

    expect(await screen.findByText("This photo is too small.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(uploadFiles).not.toHaveBeenCalled();
    expect(form.getValues("coverImage")).toBe("");
  });

  it("offers a retry when the upload itself fails, and shows the server's reason", async () => {
    uploadFiles.mockRejectedValueOnce({ response: { data: { message: "Please verify your email address before posting a property." } } });
    render(<Harness />);
    await pick("Choose exterior view photos", [photoFile("a.jpg")]);
    expect(await screen.findByText(/verify your email/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(form.getValues("coverImage")).toEqual(stored(1, "exterior")));
  });

  it("stops at the photo limit", async () => {
    const gallery = Array.from({ length: MAX_PHOTOS - 1 }, (_, i) => stored(i + 2, "exterior"));
    render(<Harness values={{ coverImage: stored(1, "exterior"), galleryImages: gallery }} />);
    expect(screen.queryByRole("button", { name: "Add photos" })).not.toBeInTheDocument();

    await pick("Choose exterior view photos", [photoFile("extra.jpg")]);
    expect(toast.error).toHaveBeenCalledWith(`A listing can have up to ${MAX_PHOTOS} photos.`);
    expect(uploadFiles).not.toHaveBeenCalled();
  });

  it("offers a brochure to developers and agents, not to owners", () => {
    const { unmount } = render(<Harness role={LISTED_BY.OWNER} />);
    expect(screen.queryByRole("button", { name: "Add brochure" })).not.toBeInTheDocument();
    unmount();
    render(<Harness role={LISTED_BY.DEVELOPER} />);
    expect(screen.getByRole("button", { name: "Add brochure" })).toBeInTheDocument();
  });

  it("refuses a brochure that isn't really a PDF", async () => {
    render(<Harness role={LISTED_BY.DEVELOPER} />);
    const fake = new File(["<html>"], "brochure.pdf", { type: "application/pdf" });
    await pick("Choose a brochure PDF", fake);
    expect(await screen.findByText("The brochure must be a PDF file.")).toBeInTheDocument();
    expect(uploadFiles).not.toHaveBeenCalled();
  });

  it("uploads a real PDF and can remove it again", async () => {
    uploadFiles.mockResolvedValue(["https://media.test/b-brochure.pdf"]);
    render(<Harness role={LISTED_BY.DEVELOPER} />);
    await pick("Choose a brochure PDF", new File(["%PDF-1.7 …"], "b.pdf", { type: "application/pdf" }));
    await waitFor(() => expect(form.getValues("brochure")).toEqual({ url: "https://media.test/b-brochure.pdf" }));

    await userEvent.click(within(screen.getByText("View brochure").closest("p")).getByRole("button", { name: "Remove" }));
    expect(form.getValues("brochure")).toBe("");
  });
});
