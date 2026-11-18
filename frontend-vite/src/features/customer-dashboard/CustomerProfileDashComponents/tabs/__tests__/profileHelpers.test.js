import { describe, it, expect } from "vitest";
import { agentSteps, initialsOf, maskEmail, maskPhone, memberSince, ownerSteps } from "../profileHelpers";

const states = (steps) => steps.map((s) => s.state);

describe("masking", () => {
  it("masks a phone number, keeping the start and the last two digits", () => {
    expect(maskPhone("+919938812334")).toBe("+9199388•••34");
    expect(maskPhone("")).toBe("");
    expect(maskPhone("12345")).toBe("12345");
  });

  it("masks the local part of an email", () => {
    expect(maskEmail("jo.anderson@gmail.com")).toBe("jo.an•••@gmail.com");
    expect(maskEmail("abc@x.com")).toBe("ab•••@x.com");
    expect(maskEmail("")).toBe("");
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });
});

describe("display helpers", () => {
  it("builds initials", () => {
    expect(initialsOf("agent test 2")).toBe("AT");
    expect(initialsOf("")).toBe("?");
  });

  it("formats member since, with a dash for missing or bad dates", () => {
    expect(memberSince("2026-11-03T00:00:00.000Z")).toBe("November 2026");
    expect(memberSince(undefined)).toBe("—");
    expect(memberSince("nope")).toBe("—");
  });
});

describe("agentSteps", () => {
  it("asks for email verification before approval", () => {
    const steps = agentSteps({ emailVerified: false, agent: { reraAgentId: "A5", agencyName: "Skyline" } });
    expect(states(steps)).toEqual(["done", "action", "todo"]);
    expect(steps[0].detail).toBe("RERA A5 · Skyline");
  });

  it("only waits on the team once the email is verified", () => {
    expect(states(agentSteps({ emailVerified: true, agent: {} }))).toEqual(["done", "done", "todo"]);
  });
});

describe("ownerSteps", () => {
  it("needs a verified email before posting is the next action", () => {
    expect(states(ownerSteps({ emailVerified: false }, { listingsEnabled: true, listingCount: 0 }))).toEqual([
      "done",
      "action",
      "todo",
    ]);
    expect(states(ownerSteps({ emailVerified: true }, { listingsEnabled: true, listingCount: 0 }))).toEqual([
      "done",
      "done",
      "action",
    ]);
  });

  it("marks posting done once there is a listing", () => {
    const steps = ownerSteps({ emailVerified: true }, { listingsEnabled: true, listingCount: 2 });
    expect(states(steps)).toEqual(["done", "done", "done"]);
    expect(steps[2].detail).toBe("2 listings so far");
  });

  it("says posting opens soon while customer listings are switched off", () => {
    const steps = ownerSteps({ emailVerified: true }, { listingsEnabled: false, listingCount: null });
    expect(steps[2].state).toBe("todo");
    expect(steps[2].detail).toBe("Posting opens soon.");
  });
});
