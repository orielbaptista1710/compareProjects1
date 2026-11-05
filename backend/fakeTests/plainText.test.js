// backend/fakeTests/plainText.test.js
//
// Free text from posters (now including self-signup owners and agents) is
// stored as plain text: tags/scripts removed, ordinary characters kept as
// typed. sanitizeObject is not used for these fields because it stores
// "2 &amp; 3 BHK" and breaks links containing "&".
import { describe, it, expect } from "vitest";
import { toPlainText } from "../utils/sanitizeInput.js";
import { parsePropertyInput } from "../validators/propertyInputValidator.js";
import { agentApplicationSchema } from "../validators/agentApplicationValidator.js";

describe("toPlainText", () => {
  it.each([
    ["2 & 3 BHK", "2 & 3 BHK"],
    ["price < 1 Cr", "price < 1 Cr"],
    [`Tom's "Villa"`, `Tom's "Villa"`],
    ["<script>alert(1)</script>Sea view", "Sea view"],
    ["<img src=x onerror=alert(1)>View", "View"],
    ["<b>Bold</b> offer", "Bold offer"],
    ["&lt;b&gt;encoded&lt;/b&gt;", "encoded"], // pre-encoded markup can't decode back into a tag
    ["  padded  ", "padded"],
  ])("%j → %j", (input, expected) => {
    expect(toPlainText(input)).toBe(expected);
  });
});

describe("listing and agent input are stored as plain text", () => {
  it("strips markup from listing text but leaves links untouched", () => {
    const { data } = parsePropertyInput({
      title: "2 & 3 BHK <script>alert(1)</script>",
      description: "<p>Sea view</p>",
      amenities: "Gym, <b>Pool</b>",
      virtualTours: [{ type: "video", url: "https://www.youtube.com/watch?v=abc&t=10" }],
    });

    expect(data.title).toBe("2 & 3 BHK");
    expect(data.description).toBe("Sea view");
    expect(data.amenities).toEqual(["Gym", "Pool"]);
    expect(data.virtualTours[0].url).toBe("https://www.youtube.com/watch?v=abc&t=10");
  });

  it("strips markup from agent applications", () => {
    const parsed = agentApplicationSchema.parse({
      agencyName: "Prime <i>Realty</i> & Co",
      reraAgentId: "A518<script>x</script>00012345",
    });

    expect(parsed).toEqual({ agencyName: "Prime Realty & Co", reraAgentId: "A51800012345" });
  });
});
