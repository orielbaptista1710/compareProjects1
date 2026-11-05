// backend/utils/sanitizeInput.js
// it is used to sanitize the input data before it is saved to the database
// backend/utils/sanitizeInput.js
import sanitizeHtml from "sanitize-html";
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === "string") {
      sanitized[key] = sanitizeHtml(value, {
        allowedTags: [], 
        allowedAttributes: {}, 
        disallowedTagsMode: "discard", 
      }).trim();
    } 
    else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeHtml(item, {
              allowedTags: [],
              allowedAttributes: {},
              disallowedTagsMode: "discard",
            }).trim()
          : item
      );
    } 
    else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value); 
    } 
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

const STRIP_ALL_TAGS = { allowedTags: [], allowedAttributes: {}, disallowedTagsMode: "discard" };

// sanitize-html escapes the text it keeps; undo that so plain text stays as
// typed ("2 & 3 BHK", not "2 &amp; 3 BHK"). &amp; last, so "&amp;lt;" → "&lt;".
const decodeBasicEntities = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

// User-typed free text (listing titles, descriptions, agency names…) stored
// as plain text: HTML tags and scripts removed, ordinary characters kept.
// ⚠ The result is TEXT, not safe HTML: it can contain "<" and "&". Render it as
// text (React does by default) — never via innerHTML / dangerouslySetInnerHTML
// or unescaped in an HTML email.
// Repeats until stable so pre-encoded markup ("&lt;b&gt;") can't decode back
// into a tag. Use this, not sanitizeObject, for fields shown back as text.
export const toPlainText = (value) => {
  let text = value;
  for (let i = 0; i < 5; i++) {
    const next = decodeBasicEntities(sanitizeHtml(text, STRIP_ALL_TAGS));
    if (next === text) return text.trim();
    text = next;
  }
  // Still changing after 5 rounds: deliberately nested encoding — keep the
  // escaped form rather than risk returning markup.
  return sanitizeHtml(text, STRIP_ALL_TAGS).trim();
};

