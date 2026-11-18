// features/listings/media/mediaPayload.js
//
// Between the listing form's media fields and what the API stores.
import { youtubeVideoId } from "../../../constants/media";

const isYoutubeVideo = (tour) => tour?.type === "video" && youtubeVideoId(tour.url) !== null;

/** The YouTube link shown in the form's video field, from a saved listing. */
export const videoUrlFrom = (listing = {}) =>
  (listing.virtualTours ?? []).find(isYoutubeVideo)?.url ?? "";

/**
 * The media part of the save request.
 * @param {object} data   validated form values
 * @param {object} saved  the listing being edited ({} for a new one)
 *
 * A cover photo or brochure the poster removed is sent as { url: "" }, which
 * the API reads as "remove it". Leaving the field out would keep the old one.
 */
export const mediaPayload = (data, saved = {}) => {
  const videoUrl = data.videoUrl?.trim();
  return {
    coverImage: data.coverImage?.url
      ? data.coverImage
      : saved.coverImage?.url ? { url: "" } : undefined,
    galleryImages: data.galleryImages ?? [],
    brochure: data.brochure?.url
      ? { url: data.brochure.url }
      : saved.brochure?.url ? { url: "" } : undefined,
    // 3D tours and panoramas already on the listing are kept as they are.
    virtualTours: [
      ...(saved.virtualTours ?? [])
        .filter((tour) => !isYoutubeVideo(tour))
        .map(({ type, url, thumbnail }) => ({ type, url, ...(thumbnail && { thumbnail }) })),
      ...(videoUrl ? [{ type: "video", url: videoUrl }] : []),
    ],
  };
};
