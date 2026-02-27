
//backend/utils/sanitizeInput.js
//it is used to sanitize the input data before it is saved to the database
// backend/utils/sanitizeInput.js
// import sanitizeHtml from "sanitize-html";
// export const sanitizeObject = (obj) => {
//   if (!obj || typeof obj !== "object") return obj;

//   const sanitized = {};

//   for (const key in obj) {
//     const value = obj[key];

//     if (typeof value === "string") {
//       sanitized[key] = sanitizeHtml(value, {
//         allowedTags: [], 
//         allowedAttributes: {}, 
//         disallowedTagsMode: "discard", 
//       }).trim();
//     } 
//     else if (Array.isArray(value)) {
//       sanitized[key] = value.map((item) =>
//         typeof item === "string"
//           ? sanitizeHtml(item, {
//               allowedTags: [],
//               allowedAttributes: {},
//               disallowedTagsMode: "discard",
//             }).trim()
//           : item
//       );
//     } 
//     else if (typeof value === "object" && value !== null) {
//       sanitized[key] = sanitizeObject(value); 
//     } 
//     else {
//       sanitized[key] = value;
//     }
//   }

//   return sanitized;
// };

