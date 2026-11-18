import { describe, it, expect } from "vitest";
import { mediaPayload, videoUrlFrom } from "../mediaPayload";
import { categoriesFor, youtubeVideoId } from "../../../../constants/media";

const VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const photo = (n) => ({ url: `https://media.test/${n}.webp`, thumbnail: `https://media.test/${n}-t.webp` });

describe("mediaPayload", () => {
  it("sends the photos and brochure the form holds", () => {
    const data = { coverImage: photo(1), galleryImages: [photo(2)], brochure: { url: "https://media.test/b.pdf" }, videoUrl: "" };
    expect(mediaPayload(data)).toEqual({
      coverImage: photo(1),
      galleryImages: [photo(2)],
      brochure: { url: "https://media.test/b.pdf" },
      virtualTours: [],
    });
  });

  it("leaves cover and brochure out of a listing that never had them", () => {
    const sent = mediaPayload({ coverImage: "", galleryImages: [], brochure: "", videoUrl: "" });
    expect(sent.coverImage).toBeUndefined();
    expect(sent.brochure).toBeUndefined();
  });

  it("tells the API to remove a cover or brochure the poster took off", () => {
    const saved = { coverImage: photo(1), brochure: { url: "https://media.test/b.pdf" } };
    const sent = mediaPayload({ coverImage: "", galleryImages: [], brochure: "", videoUrl: "" }, saved);
    expect(sent.coverImage).toEqual({ url: "" });
    expect(sent.brochure).toEqual({ url: "" });
  });

  it("stores the video link as a tour and keeps the listing's other tours", () => {
    const saved = {
      virtualTours: [
        { type: "3d", url: "https://my.matterport.com/show/?m=abc", _id: "1" },
        { type: "video", url: "https://youtu.be/aaaaaaaaaaa", _id: "2" },
      ],
    };
    expect(videoUrlFrom(saved)).toBe("https://youtu.be/aaaaaaaaaaa");
    expect(mediaPayload({ videoUrl: ` ${VIDEO} ` }, saved).virtualTours).toEqual([
      { type: "3d", url: "https://my.matterport.com/show/?m=abc" },
      { type: "video", url: VIDEO },
    ]);
    // clearing the field removes only the YouTube video
    expect(mediaPayload({ videoUrl: "" }, saved).virtualTours).toEqual([
      { type: "3d", url: "https://my.matterport.com/show/?m=abc" },
    ]);
  });
});

describe("youtubeVideoId", () => {
  it.each([
    [VIDEO, "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=10", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["http://www.youtube.com/watch?v=dQw4w9WgXcQ", null],
    ["https://www.youtube.com/channel/UC123", null],
    ["https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ", null],
    ["javascript:alert(1)", null],
    ["", null],
  ])("%s → %s", (link, id) => {
    expect(youtubeVideoId(link)).toBe(id);
  });
});

describe("categoriesFor", () => {
  it("always includes Others, and gives land no room tabs", () => {
    const land = categoriesFor("Plot").map((c) => c.id);
    expect(land).toContain("other");
    expect(land).not.toContain("bedroom");
    expect(categoriesFor("Office Space").map((c) => c.id)).toContain("interior");
    expect(categoriesFor(undefined).map((c) => c.id)).toContain("bedroom");
  });
});
