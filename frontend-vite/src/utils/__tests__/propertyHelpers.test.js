import { describe, it, expect } from "vitest";

import {
  fallbackImg,
  getPropertyImage,
  getPropertyLocation,
  getDownloadUrl,
} from "../propertyHelpers";

describe("propertyHelpers", () => {
  describe("getPropertyImage", () => {
    it("returns the fallback image when property is undefined", () => {
      expect(getPropertyImage()).toBe(fallbackImg);
    });

    it("returns the fallback image when property is null", () => {
      expect(getPropertyImage(null)).toBe(fallbackImg);
    });

    it("prefers cover image thumbnail", () => {
      const property = {
        coverImage: {
          thumbnail: "https://example.com/cover-thumb.jpg",
          url: "https://example.com/cover.jpg",
        },
        galleryImages: [
          {
            thumbnail: "https://example.com/gallery-thumb.jpg",
            url: "https://example.com/gallery.jpg",
          },
        ],
      };

      expect(getPropertyImage(property)).toBe(
        "https://example.com/cover-thumb.jpg"
      );
    });

    it("uses the first gallery thumbnail when cover thumbnail is missing", () => {
      const property = {
        coverImage: {
          url: "https://example.com/cover.jpg",
        },
        galleryImages: [
          {
            thumbnail: "https://example.com/gallery-thumb.jpg",
          },
        ],
      };

      expect(getPropertyImage(property)).toBe(
        "https://example.com/gallery-thumb.jpg"
      );
    });

    it("uses cover image URL when thumbnails are unavailable", () => {
      const property = {
        coverImage: {
          url: "https://example.com/cover.jpg",
        },
      };

      expect(getPropertyImage(property)).toBe(
        "https://example.com/cover.jpg"
      );
    });

    it("uses first gallery image URL when cover image is unavailable", () => {
      const property = {
        galleryImages: [
          {
            url: "https://example.com/gallery.jpg",
          },
        ],
      };

      expect(getPropertyImage(property)).toBe(
        "https://example.com/gallery.jpg"
      );
    });

    it("uses fallback image when property has no images", () => {
      expect(getPropertyImage({})).toBe(fallbackImg);
    });

    it("uses fallback image when image objects are empty", () => {
      const property = {
        coverImage: {},
        galleryImages: [{}],
      };

      expect(getPropertyImage(property)).toBe(fallbackImg);
    });

    it("follows the expected image priority order", () => {
      const property = {
        coverImage: {
          thumbnail: "cover-thumbnail",
          url: "cover-url",
        },
        galleryImages: [
          {
            thumbnail: "gallery-thumbnail",
            url: "gallery-url",
          },
        ],
      };

      expect(getPropertyImage(property)).toBe("cover-thumbnail");
    });
  });

  describe("getPropertyLocation", () => {
    it("returns an empty string when property is undefined", () => {
      expect(getPropertyLocation()).toBe("");
    });

    it("returns an empty string when property is null", () => {
      expect(getPropertyLocation(null)).toBe("");
    });

    it("formats locality, city, and state", () => {
      const property = {
        locality: "Bandra West",
        city: "Mumbai",
        state: "Maharashtra",
      };

      expect(getPropertyLocation(property)).toBe(
        "Bandra West, Mumbai, Maharashtra"
      );
    });

    it("handles missing locality", () => {
      const property = {
        city: "Mumbai",
        state: "Maharashtra",
      };

      expect(getPropertyLocation(property)).toBe(
        "Mumbai, Maharashtra"
      );
    });

    it("handles missing city", () => {
      const property = {
        locality: "Bandra West",
        state: "Maharashtra",
      };

      expect(getPropertyLocation(property)).toBe(
        "Bandra West, Maharashtra"
      );
    });

    it("handles missing state", () => {
      const property = {
        locality: "Bandra West",
        city: "Mumbai",
      };

      expect(getPropertyLocation(property)).toBe(
        "Bandra West, Mumbai"
      );
    });

    it("returns only the available location value", () => {
      expect(
        getPropertyLocation({
          city: "Mumbai",
        })
      ).toBe("Mumbai");
    });

    it("returns an empty string when no location fields exist", () => {
      expect(getPropertyLocation({})).toBe("");
    });

    it("ignores null location values", () => {
      const property = {
        locality: null,
        city: "Mumbai",
        state: null,
      };

      expect(getPropertyLocation(property)).toBe("Mumbai");
    });
  });

  describe("getDownloadUrl", () => {
    it("returns undefined when URL is undefined", () => {
      expect(getDownloadUrl()).toBeUndefined();
    });

    it("returns null when URL is null", () => {
      expect(getDownloadUrl(null)).toBeNull();
    });

    it("returns an empty string unchanged", () => {
      expect(getDownloadUrl("")).toBe("");
    });

    it("returns non-Cloudinary URLs unchanged", () => {
      const url = "https://example.com/document.pdf";

      expect(getDownloadUrl(url)).toBe(url);
    });

    it("adds fl_attachment to a Cloudinary raw upload URL", () => {
      const url =
        "https://res.cloudinary.com/demo/raw/upload/document.pdf";

      expect(getDownloadUrl(url)).toBe(
        "https://res.cloudinary.com/demo/raw/upload/fl_attachment/document.pdf"
      );
    });

    it("does not modify a Cloudinary image upload URL", () => {
      const url =
        "https://res.cloudinary.com/demo/image/upload/sample.jpg";

      expect(getDownloadUrl(url)).toBe(url);
    });

    it("does not modify a Cloudinary video upload URL", () => {
      const url =
        "https://res.cloudinary.com/demo/video/upload/sample.mp4";

      expect(getDownloadUrl(url)).toBe(url);
    });

    it("does not modify a Cloudinary raw URL that does not contain the expected upload path", () => {
      const url =
        "https://res.cloudinary.com/demo/raw/sample.pdf";

      expect(getDownloadUrl(url)).toBe(url);
    });
  });
});