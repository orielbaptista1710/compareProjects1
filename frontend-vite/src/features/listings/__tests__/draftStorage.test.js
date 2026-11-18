import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DRAFT_MAX_AGE_MS,
  draftKeyFor,
  readDraft,
  writeDraft,
  removeDraft,
  clearListingDrafts,
  removeStaleDrafts,
} from "../draftStorage";

const DAY = 24 * 60 * 60 * 1000;
const put = (key, savedAt, values = { title: "x" }, extra = {}) =>
  window.localStorage.setItem(key, JSON.stringify({ savedAt, values, ...extra }));

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("draftKeyFor", () => {
  it("is one slot per account for a new listing and one per listing being edited", () => {
    expect(draftKeyFor("c1", null)).toBe("spf-draft:c1:new");
    expect(draftKeyFor("c1", "p9")).toBe("spf-draft:c1:p9");
  });

  it("has no slot until the account is known", () => {
    expect(draftKeyFor(undefined, null)).toBeNull();
  });
});

describe("writeDraft / readDraft", () => {
  it("round-trips the values and the version they were saved against", () => {
    expect(writeDraft("spf-draft:c1:p9", { values: { title: "Hello" }, baseVersion: "2026-11-01" })).toBe(true);

    const draft = readDraft("spf-draft:c1:p9");

    expect(draft.values).toEqual({ title: "Hello" });
    expect(draft.baseVersion).toBe("2026-11-01");
    expect(Number.isFinite(draft.savedAt)).toBe(true);
  });

  it("reports failure instead of throwing when storage is full or blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(writeDraft("spf-draft:c1:new", { values: { title: "x" } })).toBe(false);
  });

  it("ignores a corrupted or malformed draft", () => {
    window.localStorage.setItem("spf-draft:c1:new", "{not json");
    expect(readDraft("spf-draft:c1:new")).toBeNull();

    window.localStorage.setItem("spf-draft:c1:new", JSON.stringify({ savedAt: "x", values: { a: 1 } }));
    expect(readDraft("spf-draft:c1:new")).toBeNull();
  });

  it("does nothing without a slot", () => {
    expect(writeDraft(null, { values: {} })).toBe(false);
    expect(readDraft(null)).toBeNull();
  });
});

describe("30 day expiry", () => {
  it("still offers a draft just inside 30 days", () => {
    put("spf-draft:c1:new", Date.now() - (30 * DAY - 60_000));
    expect(readDraft("spf-draft:c1:new")).not.toBeNull();
  });

  it("drops a draft older than 30 days when it's read", () => {
    expect(DRAFT_MAX_AGE_MS).toBe(30 * DAY);
    put("spf-draft:c1:new", Date.now() - 31 * DAY);

    expect(readDraft("spf-draft:c1:new")).toBeNull();
    expect(window.localStorage.getItem("spf-draft:c1:new")).toBeNull();
  });

  it("sweeps expired and legacy drafts when a form opens, and keeps the rest", () => {
    put("spf-draft:c1:old", Date.now() - 40 * DAY);
    put("spf-draft:c1:fresh", Date.now() - DAY);
    put("spf-draft:new", Date.now()); // saved before drafts were scoped per account
    window.localStorage.setItem("something-else", "keep");

    removeStaleDrafts();

    expect(window.localStorage.getItem("spf-draft:c1:old")).toBeNull();
    expect(window.localStorage.getItem("spf-draft:new")).toBeNull();
    expect(window.localStorage.getItem("spf-draft:c1:fresh")).not.toBeNull();
    expect(window.localStorage.getItem("something-else")).toBe("keep");
  });
});

describe("removeDraft / clearListingDrafts", () => {
  it("removes one slot", () => {
    put("spf-draft:c1:new", Date.now());
    put("spf-draft:c1:p9", Date.now());

    removeDraft("spf-draft:c1:new");

    expect(window.localStorage.getItem("spf-draft:c1:new")).toBeNull();
    expect(window.localStorage.getItem("spf-draft:c1:p9")).not.toBeNull();
  });

  it("logout wipes every listing draft, for every account, and nothing else", () => {
    put("spf-draft:c1:new", Date.now());
    put("spf-draft:c1:p9", Date.now());
    put("spf-draft:dev1:new", Date.now());
    window.localStorage.setItem("compareList", "[]");

    clearListingDrafts();

    expect(window.localStorage.getItem("spf-draft:c1:new")).toBeNull();
    expect(window.localStorage.getItem("spf-draft:c1:p9")).toBeNull();
    expect(window.localStorage.getItem("spf-draft:dev1:new")).toBeNull();
    expect(window.localStorage.getItem("compareList")).toBe("[]");
  });

  it("doesn't throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => {
      removeDraft("spf-draft:c1:new");
      clearListingDrafts();
      removeStaleDrafts();
    }).not.toThrow();
  });
});
