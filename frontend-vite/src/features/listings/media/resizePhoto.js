// features/listings/media/resizePhoto.js
//
// Turns the photo a poster picked into the two files that get uploaded: a
// large one for the listing page and a small one for cards. Doing this in the
// browser keeps uploads small on mobile data, and re-drawing the picture drops
// everything hidden in the original file, including where it was taken (GPS).
import {
  PHOTO_INPUT_MAX_BYTES,
  PHOTO_INPUT_TYPES,
  PHOTO_LARGE_EDGE,
  PHOTO_LARGE_MAX_BYTES,
  PHOTO_MIN_HEIGHT,
  PHOTO_MIN_WIDTH,
  PHOTO_THUMB_EDGE,
  PHOTO_THUMB_MAX_BYTES,
} from "../../../constants/media";

/** A problem the poster can fix; `message` is shown as is. */
export class PhotoError extends Error {}

const decode = async (file) => {
  try {
    // from-image: phones store portrait photos sideways plus a "rotate" note
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new PhotoError("This file isn't a photo we can read. Use a JPG, PNG or WebP.");
  }
};

const encode = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

// Longest side at most `edge`; never enlarged.
const draw = (bitmap, edge) => {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
};

// WebP where the browser can write it (a browser that can't hands back a PNG),
// otherwise JPEG. Quality steps down until the file fits.
const toFile = async (canvas, maxBytes) => {
  for (const quality of [0.8, 0.65, 0.5]) {
    let blob = await encode(canvas, "image/webp", quality);
    if (blob?.type !== "image/webp") blob = await encode(canvas, "image/jpeg", quality);
    if (blob && blob.size <= maxBytes) return blob;
  }
  throw new PhotoError("This photo is too detailed to shrink enough. Try a different one.");
};

/**
 * @param {File} file
 * @returns {Promise<{ image: Blob, thumb: Blob }>}
 * @throws {PhotoError} wrong type, too big, too small or unreadable
 */
export const resizePhoto = async (file) => {
  if (!PHOTO_INPUT_TYPES.includes(file.type)) {
    throw new PhotoError("Use a JPG, PNG or WebP photo.");
  }
  if (file.size > PHOTO_INPUT_MAX_BYTES) {
    throw new PhotoError("This photo is over 20 MB. Choose a smaller one.");
  }

  const bitmap = await decode(file);
  try {
    const [long, short] = [Math.max(bitmap.width, bitmap.height), Math.min(bitmap.width, bitmap.height)];
    if (long < PHOTO_MIN_WIDTH || short < PHOTO_MIN_HEIGHT) {
      throw new PhotoError(`This photo is too small. It needs to be at least ${PHOTO_MIN_WIDTH} × ${PHOTO_MIN_HEIGHT} pixels.`);
    }
    return {
      image: await toFile(draw(bitmap, PHOTO_LARGE_EDGE), PHOTO_LARGE_MAX_BYTES),
      thumb: await toFile(draw(bitmap, PHOTO_THUMB_EDGE), PHOTO_THUMB_MAX_BYTES),
    };
  } finally {
    bitmap.close?.();
  }
};
