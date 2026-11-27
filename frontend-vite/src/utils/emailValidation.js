// Email checks for public forms.
//
// isValidEmail mirrors the backend's Zod 4 `.email()` regex (zod/v4/core/regexes
// `email`) plus its 254-char cap, so the form rejects exactly what the server
// would. The old inline regex only needed "x@y.z", so `a@b.c`, `a@b..com` and
// `a@-.com` passed here and then failed on the server. If the backend validator
// changes, update this to match.
const EMAIL_RE =
  /^(?:[A-Za-z0-9_'+-]+\.)*[A-Za-z0-9_'+-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;

export const isValidEmail = (value) => {
  const email = String(value ?? "").trim();
  return email.length <= 254 && EMAIL_RE.test(email);
};

// Common mistyped domains. These are syntactically valid, so no regex can catch
// them; they get a "did you mean" prompt instead of a hard error.
const TYPO_DOMAINS = {
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.comm": "gmail.com",
  "g.com": "gmail.com",
  "gm.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gnail.com": "gmail.com",
  "yahoo.con": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "hotmail.con": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "outlook.con": "outlook.com",
  "outlok.com": "outlook.com",
};

// Returns the corrected address for a known typo domain, else null.
export const suggestEmail = (value) => {
  const email = String(value ?? "").trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const fixed = TYPO_DOMAINS[email.slice(at + 1)];
  return fixed ? `${email.slice(0, at)}@${fixed}` : null;
};
