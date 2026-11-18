// features/listings/media/uploadMedia.js
//
// Uploads a listing's files straight to storage. Our API only hands out a
// short-lived link per file (it checks the account, type and size first); the
// file itself goes from the browser to storage and never through our server.
import API from "../../../api/api";
import { LISTED_BY } from "../../../constants/roles";

// Developers sign in with the dashboard cookie, owners and agents with
// Firebase; api.js picks the credential from the URL, so each has its own path.
const signUrlFor = (role) =>
  role === LISTED_BY.DEVELOPER ? "/api/properties/media/sign" : "/api/customers/listings/media/sign";

const put = async ({ uploadUrl, headers }, blob) => {
  // A plain fetch on purpose: no cookies or login token go to the storage host.
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers,
    body: blob,
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
};

/**
 * @param {string} role   a LISTED_BY value (who is posting)
 * @param {{ kind: "image" | "thumb" | "brochure", blob: Blob }[]} files  at most 4
 * @returns {Promise<string[]>} the public link of each file, in the same order
 */
export const uploadFiles = async (role, files) => {
  const { data } = await API.post(signUrlFor(role), {
    files: files.map(({ kind, blob }) => ({ kind, contentType: blob.type, size: blob.size })),
  });
  await Promise.all(data.uploads.map((upload, i) => put(upload, files[i].blob)));
  return data.uploads.map((upload) => upload.url);
};
