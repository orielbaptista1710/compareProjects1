import { describe, it, expect } from "vitest";
import { posterLabel, posterName } from "../poster";

describe("admin poster helpers", () => {
  it("names a builder listing by its developer name", () => {
    const listing = { listedBy: "developer", developerName: "Lodha Group", userId: { displayName: "lodha-admin" } };

    expect(posterLabel(listing)).toBe("Builder");
    expect(posterName(listing)).toBe("Lodha Group");
  });

  it("names an agent listing by the agency, falling back to the agent's name", () => {
    const agent = { customerName: "Ravi", agent: { agencyName: "Prime Realty" } };

    expect(posterLabel({ listedBy: "agent", userId: agent })).toBe("Agent");
    expect(posterName({ listedBy: "agent", userId: agent })).toBe("Prime Realty");
    expect(posterName({ listedBy: "agent", userId: { customerName: "Ravi" } })).toBe("Ravi");
  });

  it("names an owner listing by the owner", () => {
    const listing = { listedBy: "owner", userId: { customerName: "Asha" } };

    expect(posterLabel(listing)).toBe("Owner");
    expect(posterName(listing)).toBe("Asha");
  });

  it("treats an old listing without listedBy but with a developer name as a builder", () => {
    expect(posterLabel({ developerName: "Old Dev" })).toBe("Builder");
  });

  it("never crashes on a listing whose poster wasn't populated", () => {
    expect(posterName({ listedBy: "owner" })).toBe("—");
  });
});
