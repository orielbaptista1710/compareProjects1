import { describe, it, expect } from "vitest";
import { getMapEmbedUrl, isGoogleEmbedUrl } from "../mapUtils";

// SEC-09 (docs/review): a stored mapLink is framed on the property page, so it
// must only ever be passed through when it's a genuine Google Maps embed URL.
describe("isGoogleEmbedUrl", () => {
  it.each([
    ["https://www.google.com/maps/embed?pb=!1m18", true],
    ["https://www.google.com/maps/embed/v1/place?q=Andheri", true],
    ["https://attacker.example/maps/embed/login", false],
    ["https://www.google.com.attacker.example/maps/embed", false],
    ["http://www.google.com/maps/embed?pb=1", false],
    ["https://www.google.com/search?q=/maps/embed", false],
    ["javascript:alert(1)//maps/embed", false],
    ["not a url", false],
  ])("%s → %s", (link, expected) => {
    expect(isGoogleEmbedUrl(link)).toBe(expected);
  });
});

describe("getMapEmbedUrl with a stored mapLink", () => {
  it("passes a genuine Google embed link through unchanged", () => {
    const link = "https://www.google.com/maps/embed?pb=!1m18";
    expect(getMapEmbedUrl({ mapLink: link })).toBe(link);
  });

  it("never returns a non-Google link as the iframe src", () => {
    const src = getMapEmbedUrl({ mapLink: "https://attacker.example/maps/embed/login" });
    expect(src === null || new URL(src).hostname === "www.google.com").toBe(true);
  });
});
