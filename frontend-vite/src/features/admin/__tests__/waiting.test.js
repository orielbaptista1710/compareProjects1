import { describe, it, expect } from "vitest";
import { waitingLabel } from "../waiting";

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-06-15T12:00:00Z").getTime();
const ago = (ms) => new Date(NOW - ms).toISOString();

describe("waitingLabel", () => {
  it("says 'since today' for under a day", () => {
    expect(waitingLabel(ago(0), NOW)).toBe("Waiting since today");
    expect(waitingLabel(ago(DAY - 1000), NOW)).toBe("Waiting since today");
  });

  it("counts whole days, singular for one", () => {
    expect(waitingLabel(ago(DAY), NOW)).toBe("Waiting 1 day");
    expect(waitingLabel(ago(3 * DAY + 5 * 60 * 60 * 1000), NOW)).toBe("Waiting 3 days");
    expect(waitingLabel(ago(40 * DAY), NOW)).toBe("Waiting 40 days");
  });

  it("has nothing to say for a missing, invalid or future date", () => {
    expect(waitingLabel(undefined, NOW)).toBeNull();
    expect(waitingLabel("not a date", NOW)).toBeNull();
    expect(waitingLabel(new Date(NOW + DAY).toISOString(), NOW)).toBeNull();
  });
});
