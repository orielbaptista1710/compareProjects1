import { describe, it, expect } from "vitest";
import { isValidEmail, suggestEmail } from "../emailValidation";

describe("isValidEmail (mirrors backend Zod .email())", () => {
  it.each([
    "asha@example.com",
    "a.b+tag@mail.example.co.in",
    "a@x.co",
    "  padded@example.com  ",
  ])("accepts %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  // Each of these passed the old frontend regex but the backend rejects them.
  it.each([
    "a@b.c",
    "a@b..com",
    "a@-.com",
    "a@x.1",
    "a@gmail.com.",
    "a@b.c-",
    "<script>@x.com",
    "a@gmail",
    "a@.com",
    "a b@x.com",
    "a@@x.com",
    "a@x.y@z.com",
    "",
    null,
    undefined,
  ])("rejects %s", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it("enforces the 254-character cap exactly", () => {
    const pad = (n) => `${"a".repeat(n - "@example.com".length)}@example.com`;
    expect(isValidEmail(pad(254))).toBe(true);
    expect(isValidEmail(pad(255))).toBe(false);
  });

  it.each([".a@x.com", "a..b@x.com", "a'@x.com", "a@-x.com"])(
    "rejects local-part and label edge case %s",
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    }
  );
});

describe("suggestEmail", () => {
  it("suggests the fix for common typo domains", () => {
    expect(suggestEmail("asha@gmail.con")).toBe("asha@gmail.com");
    expect(suggestEmail("Asha@Gmial.com")).toBe("asha@gmail.com");
    expect(suggestEmail("x@hotmail.con")).toBe("x@hotmail.com");
    expect(suggestEmail("orielbaptista1710@g.com")).toBe("orielbaptista1710@gmail.com");
    expect(suggestEmail("a@gm.com")).toBe("a@gmail.com");
  });

  it("returns null for correct or unknown domains", () => {
    expect(suggestEmail("asha@gmail.com")).toBeNull();
    expect(suggestEmail("asha@company.in")).toBeNull();
    expect(suggestEmail("no-at-sign")).toBeNull();
    expect(suggestEmail("")).toBeNull();
    expect(suggestEmail(undefined)).toBeNull();
  });
});
