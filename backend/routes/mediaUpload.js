// routes/mediaUpload.js  ·  v2 — cost-optimised
// ─────────────────────────────────────────────────────────────────────────────
//
// COST CHANGES vs v1  (read this first)
// ──────────────────────────────────────
//
// v1 PROBLEM 1 — Cloudinary transformations applied on UPLOAD (expensive)
//   v1 baked `transformation: [{ width: 1600 }, { fetch_format: "auto" }]`
//   into every upload call. Cloudinary bills a "transformation credit" per
//   uploaded transformation. For a free/starter plan that burns your quota fast.
//
//   v2 FIX — Upload the raw file, NO upload-time transformations.
//   Serve optimised URLs by injecting transform params into the CDN URL at
//   read time. Cloudinary generates + caches the derived image on first request
//   for FREE (it counts as a "fetch", not a billed transformation credit).
//   This is how Cloudinary is designed to be used efficiently.
//
// v1 PROBLEM 2 — `eager` async transforms on video (expensive)
//   v1 requested eager thumbnail generation for every video. Each eager
//   transform counts against your transformation quota even before anyone
//   views the video. Most videos never get viewed on the detail page.
//
//   v2 FIX — Generate video thumbnails lazily via URL params when first
//   requested. Zero transformation credits consumed until someone actually
//   views the property.
//
// v1 PROBLEM 3 — 100 MB video stored in Cloudinary (expensive bandwidth)
//   Cloudinary bills for both storage (GB/month) and bandwidth (GB delivered).
//   Storing raw 100MB walkthrough videos is the fastest way to exhaust both.
//
//   v2 FIX — Videos capped at 50 MB. External URL pattern encouraged for
//   virtual tours (YouTube / Matterport embed = free bandwidth, their CDN).
//   "mediaFile" videos capped at 30 MB — enough for a 1–2 min walkthrough
//   compressed to H.264.
//
// v1 PROBLEM 4 — No client-side compression (full-size files hit the server)
//   A developer uploads a 8MB iPhone photo. It hits your Render instance,
//   holds a Node.js worker thread, streams 8MB to Cloudinary, and burns
//   storage. Multiply by 20 gallery images.
//
//   v2 FIX — Frontend canvas-compresses images to ≤ 1.5MB BEFORE the
//   XHR even starts. The backend still enforces limits, but the common case
//   is a 200-400KB file hitting the wire. See MediaUploadSection.jsx.
//
// v1 PROBLEM 5 — Hash deduplication missing
//   Same image uploaded twice = two Cloudinary assets = double storage + CDN.
//   Common when developers test or re-submit a form.
//
//   v2 FIX — SHA-256 hash of the buffer used as public_id. Cloudinary's
//   `overwrite: false` + `unique_filename: false` means duplicate uploads
//   return the existing asset with zero additional storage cost.
//
// ─────────────────────────────────────────────────────────────────────────────

import express       from "express";
import multer        from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier   from "streamifier";
import crypto        from "crypto";

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ── Allowed mime types ───────────────────────────────────────────────────────
const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  pdf:   ["application/pdf"],
};
const ALL_ALLOWED_MIMES = Object.values(ALLOWED_TYPES).flat();

// ── Size limits — tightened vs v1 ────────────────────────────────────────────
// Images are already compressed client-side to ≤ 1.5 MB before upload.
// Backend enforces a generous cap to handle edge cases.
const SIZE_LIMITS = {
  coverImage:  5  * 1024 * 1024,   // 5 MB  (post client compression)
  gallery:     5  * 1024 * 1024,   // 5 MB
  floorPlan:   5  * 1024 * 1024,   // 5 MB
  mediaFile:   30 * 1024 * 1024,   // 30 MB (short walkthrough video)
  brochure:    15 * 1024 * 1024,   // 15 MB PDF
  virtualTour: 50 * 1024 * 1024,   // 50 MB (or just use external URL — free)
};

// ── Cloudinary config — NO upload-time transformations ───────────────────────
// Transformations happen lazily at CDN read time, not on upload.
// This is the #1 cost saving in v2.
const MEDIA_CONFIG = {
  coverImage:  { folder: "properties/cover",         resourceType: "image" },
  gallery:     { folder: "properties/gallery",        resourceType: "image" },
  floorPlan:   { folder: "properties/floorplans",     resourceType: "image" },
  mediaFile:   { folder: "properties/media",          resourceType: "auto"  },
  brochure:    { folder: "properties/brochures",      resourceType: "raw"   },
  virtualTour: { folder: "properties/virtual-tours",  resourceType: "video" },
};

// ── Image-to-mediaType constraint ────────────────────────────────────────────
const IMAGE_ONLY_TYPES = new Set(["coverImage", "gallery", "floorPlan"]);

// ── multer — memory storage, tightened hard cap ──────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB absolute max
  fileFilter: (_req, file, cb) => {
    ALL_ALLOWED_MIMES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`File type "${file.mimetype}" is not allowed.`));
  },
});

// ── SHA-256 hash for deduplication ───────────────────────────────────────────
// Same file = same hash = same public_id = Cloudinary returns existing asset.
// Zero additional storage cost for duplicates.
const fileHash = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 32);

// ── Stream buffer → Cloudinary ───────────────────────────────────────────────
const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });

// ── Build optimised CDN URL (no extra API call, no billed transform) ─────────
// Cloudinary generates the derived image on first CDN request and caches it.
// We never pay a "transformation credit" — only CDN bandwidth on delivery.
export const buildOptimisedUrl = (publicId, opts = {}) => {
  const {
    width       = 1200,
    height      = null,
    crop        = "limit",
    quality     = "auto:good",
    format      = "auto",
    resourceType = "image",
  } = opts;

  if (resourceType === "raw") return cloudinary.url(publicId, { resource_type: "raw", secure: true });
  if (resourceType === "video") return cloudinary.url(publicId, { resource_type: "video", secure: true });

  const transforms = [
    `w_${width}`,
    height ? `h_${height}` : null,
    `c_${crop}`,
    `f_${format}`,
    `q_${quality}`,
  ].filter(Boolean).join(",");

  // Manually insert into URL — avoids Cloudinary SDK building a different format
  const base = cloudinary.url(publicId, { secure: true });
  return base.replace("/upload/", `/upload/${transforms}/`);
};

export const buildThumbnailUrl = (publicId, resourceType = "image") => {
  if (resourceType === "raw")   return null;
  if (resourceType === "video") {
    // Video thumbnail: grab frame at 1s, convert to JPEG
    const base = cloudinary.url(publicId, { resource_type: "video", secure: true });
    return base.replace("/upload/", "/upload/w_400,h_300,c_fill,f_jpg,q_auto:eco,so_1/")
               .replace(/\.[^.]+$/, ".jpg");
  }
  return buildOptimisedUrl(publicId, { width: 400, height: 300, crop: "fill", quality: "auto:eco" });
};

// ── POST /api/media/upload ────────────────────────────────────────────────────
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { mediaType, caption = "" } = req.body;

    if (!mediaType || !MEDIA_CONFIG[mediaType]) {
      return res.status(400).json({
        error: `Invalid mediaType. Must be one of: ${Object.keys(MEDIA_CONFIG).join(", ")}`,
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file received." });
    }

    // Per-type size check
    if (req.file.size > SIZE_LIMITS[mediaType]) {
      return res.status(413).json({
        error: `File too large for ${mediaType}. Max: ${Math.round(SIZE_LIMITS[mediaType] / 1024 / 1024)} MB`,
      });
    }

    // mime × mediaType cross-check
    const mime = req.file.mimetype;
    if (IMAGE_ONLY_TYPES.has(mediaType) && !ALLOWED_TYPES.image.includes(mime)) {
      return res.status(400).json({ error: `${mediaType} must be an image (JPEG, PNG, WebP).` });
    }
    if (mediaType === "brochure" && !ALLOWED_TYPES.pdf.includes(mime)) {
      return res.status(400).json({ error: "Brochure must be a PDF." });
    }

    const config = MEDIA_CONFIG[mediaType];

    // Hash-based public_id for deduplication
    const hash      = fileHash(req.file.buffer);
    const publicId  = `${config.folder}/${hash}`;

    const uploadOptions = {
      public_id:        publicId,
      resource_type:    config.resourceType,
      overwrite:        false,   // returns existing asset if hash matches
      unique_filename:  false,
      use_filename:     false,
      // NO transformation here — applied lazily via CDN URL at read time
    };

    const result = await uploadToCloudinary(req.file.buffer, uploadOptions);

    const url       = buildOptimisedUrl(result.public_id, { resourceType: config.resourceType });
    const thumbnail = buildThumbnailUrl(result.public_id, config.resourceType);

    return res.status(200).json({
      url,
      thumbnail: thumbnail || url,
      public_id: result.public_id,
      mediaType,
      ...(caption ? { caption } : {}),
    });

  } catch (err) {
    console.error("[MediaUpload] Error:", err.message);
    if (err.http_code) {
      return res.status(502).json({ error: "Media service error. Please try again." });
    }
    return res.status(500).json({ error: "Upload failed. Please try again." });
  }
});

// ── DELETE /api/media/delete ──────────────────────────────────────────────────
// Only permits deletion within the "properties/" folder.
router.delete("/delete", async (req, res) => {
  try {
    const { public_id, resourceType = "image" } = req.body;

    if (!public_id)                              return res.status(400).json({ error: "public_id required." });
    if (!public_id.startsWith("properties/"))   return res.status(403).json({ error: "Deletion not permitted." });
    if (!["image","video","raw"].includes(resourceType)) return res.status(400).json({ error: "Invalid resourceType." });

    await cloudinary.uploader.destroy(public_id, { resource_type: resourceType });
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("[MediaDelete] Error:", err.message);
    return res.status(500).json({ error: "Delete failed." });
  }
});

export default router;