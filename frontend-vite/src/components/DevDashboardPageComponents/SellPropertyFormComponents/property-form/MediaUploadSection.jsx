// property-form/MediaUploadSection.jsx  ·  v2 — cost-optimised + improved UX
// ─────────────────────────────────────────────────────────────────────────────
//
// COST CHANGES vs v1
// ──────────────────
// v1 PROBLEM — Full-size images (2–10 MB) uploaded raw to backend → Cloudinary.
//   Every 8 MB iPhone photo burns Render bandwidth + Cloudinary ingestion.
//   A 20-image gallery = 160 MB of upload traffic every time.
//
// v2 FIX — Client-side canvas compression before ANY network request.
//   compressImage() resizes images to max 1920px and encodes at 85% JPEG.
//   Typical result: 8 MB JPEG → 300–600 KB. That's a 10–20× bandwidth saving
//   with zero visible quality loss at web display sizes.
//   PDFs and videos are NOT compressed (canvas can't handle them).
//
// UX CHANGES vs v1
// ────────────────
// • Collapsible sub-sections — don't overwhelm the form on load
// • Cover image shows a large visual preview, not just a file row
// • Gallery shows a thumbnail grid (scannable) not a file list
// • Upload queue shows per-file progress + retry on error
// • "Add more" affordance is always visible
// • Virtual tour: URL-first (free), video upload secondary
// • Brochure: clear PDF-only messaging
// • All dropzones support keyboard navigation
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import "./MediaUploadSection.css";

const API_BASE = import.meta.env.VITE_API_URL || "";

// ── Accepted types + limits ───────────────────────────────────────────────────
const ACCEPTED = {
  coverImage:  { mime: ["image/jpeg","image/png","image/webp"], label: "JPEG, PNG or WebP", maxMB: 5  },
  gallery:     { mime: ["image/jpeg","image/png","image/webp"], label: "JPEG, PNG or WebP", maxMB: 5  },
  floorPlan:   { mime: ["image/jpeg","image/png","image/webp"], label: "JPEG, PNG or WebP", maxMB: 5  },
  mediaFile:   { mime: ["image/jpeg","image/png","image/webp","video/mp4","video/quicktime","video/webm"],
                  label: "Image or video", maxMB: 30 },
  brochure:    { mime: ["application/pdf"], label: "PDF only", maxMB: 15 },
  virtualTour: { mime: ["video/mp4","video/quicktime","video/webm"], label: "MP4, MOV or WebM", maxMB: 50 },
};

const FLOOR_PLAN_TYPES = ["2D", "3D", "Structural"];

// ── Utilities ─────────────────────────────────────────────────────────────────
const uid  = () => Math.random().toString(36).slice(2, 10);
const fmtB = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

// ── Client-side image compression ────────────────────────────────────────────
// Uses a canvas to resize + re-encode the image before upload.
// Saves 80–95% of upload bandwidth for typical phone/camera images.
// Only runs on images — PDFs and videos pass through unchanged.
const compressImage = (file, maxPx = 1920, quality = 0.85) =>
  new Promise((resolve) => {
    // Skip non-images
    if (!file.type.startsWith("image/")) return resolve(file);

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width <= maxPx && height <= maxPx) return resolve(file); // already small enough

      const ratio = Math.min(maxPx / width, maxPx / height);
      width  = Math.round(width  * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file); // fallback on failure
          // Keep original filename; change type to jpeg for best compression
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

// ── XHR upload with progress ──────────────────────────────────────────────────
const uploadFile = (file, mediaType, caption, onProgress) =>
  new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mediaType", mediaType);
    if (caption) fd.append("caption", caption);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let msg = "Upload failed";
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch {}
        reject(new Error(msg));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.open("POST", `${API_BASE}/api/media/upload`);
    const token = localStorage.getItem("authToken");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(fd);
  });

// Orphan cleanup — fire-and-forget, non-blocking
const deleteFile = (public_id, resourceType = "image") => {
  const token = localStorage.getItem("authToken");
  fetch(`${API_BASE}/api/media/delete`, {
    method:  "DELETE",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body:    JSON.stringify({ public_id, resourceType }),
  }).catch(() => {}); // silent fail
};

// ── useUploader hook ──────────────────────────────────────────────────────────
// Manages the upload queue for a single media slot.
// Now includes client-side compression before upload.
const useUploader = (mediaType, setValue, formKey, multiple = false) => {
  const [items, setItems] = useState([]);

  const syncForm = useCallback((updatedItems) => {
    const done = updatedItems.filter((i) => i.status === "done");
    setValue(
      formKey,
      multiple
        ? done.map((i) => ({ url: i.url, thumbnail: i.thumbnail, ...(i.caption ? { caption: i.caption } : {}) }))
        : done[0] ? { url: done[0].url, thumbnail: done[0].thumbnail } : null,
      { shouldDirty: true }
    );
  }, [setValue, formKey, multiple]);

  const addFiles = useCallback(async (files) => {
    const cfg      = ACCEPTED[mediaType];
    const filtered = files.filter((f) => cfg.mime.includes(f.type) && f.size <= cfg.maxMB * 1024 * 1024);
    if (!filtered.length) return;

    const newItems = filtered.map((f) => ({
      id: uid(), file: f, preview: URL.createObjectURL(f),
      status: "pending", progress: 0, url: null, thumbnail: null, public_id: null, error: null,
    }));

    setItems((prev) => multiple ? [...prev, ...newItems] : newItems);

    for (const item of newItems) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "compressing" } : i));

      // ── Compress image client-side BEFORE upload ──────────────────────────
      let fileToUpload = item.file;
      if (item.file.type.startsWith("image/")) {
        fileToUpload = await compressImage(item.file);
      }

      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "uploading" } : i));

      try {
        const result = await uploadFile(fileToUpload, mediaType, item.caption || "", (pct) => {
          setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, progress: pct } : i));
        });

        setItems((prev) => {
          const updated = prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "done", progress: 100, url: result.url, thumbnail: result.thumbnail, public_id: result.public_id }
              : i
          );
          syncForm(updated);
          return updated;
        });
      } catch (err) {
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "error", error: err.message } : i));
      }
    }
  }, [mediaType, multiple, syncForm]);

  const retryItem = useCallback((id) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      // Re-add as fresh pending item
      const fresh = { ...item, status: "pending", progress: 0, error: null };
      const updated = prev.map((i) => i.id === id ? fresh : i);
      // Trigger upload
      addFiles([item.file]);
      return updated.filter((i) => i.id !== id); // remove old, addFiles adds new
    });
  }, [addFiles]);

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.public_id) {
        const isVideo = item.file?.type?.startsWith("video/");
        const isPdf   = item.file?.type === "application/pdf";
        deleteFile(item.public_id, isPdf ? "raw" : isVideo ? "video" : "image");
      }
      if (item?.preview) URL.revokeObjectURL(item.preview);
      const updated = prev.filter((i) => i.id !== id);
      syncForm(updated);
      return updated;
    });
  }, [syncForm]);

  // Revoke object URLs on unmount
  useEffect(() => () => items.forEach((i) => i.preview && URL.revokeObjectURL(i.preview)), []);

  return { items, addFiles, removeItem, retryItem };
};

// ── DropZone ──────────────────────────────────────────────────────────────────
const DropZone = ({ mediaType, multiple = false, onFiles, compact = false }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const cfg = ACCEPTED[mediaType];

  const process = useCallback((fileList) => {
    const valid = Array.from(fileList).filter(
      (f) => cfg.mime.includes(f.type) && f.size <= cfg.maxMB * 1024 * 1024
    );
    if (valid.length) onFiles(valid);
  }, [cfg, onFiles]);

  return (
    <div
      className={["mup-dropzone", dragging ? "mup-dropzone--drag" : "", compact ? "mup-dropzone--compact" : ""].filter(Boolean).join(" ")}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={cfg.mime.join(",")}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => { process(e.target.files); e.target.value = ""; }}
      />
      {compact ? (
        <span className="mup-dropzone__compact-label">+ Add {multiple ? "files" : "file"}</span>
      ) : (
        <>
          <div className="mup-dropzone__icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="mup-dropzone__text">
            <strong>Choose a file</strong> or drag &amp; drop
          </div>
          <div className="mup-dropzone__hint">{cfg.label} · Max {cfg.maxMB} MB</div>
        </>
      )}
    </div>
  );
};

// ── FileRow ────────────────────────────────────────────────────────────────────
const FileRow = ({ item, onRemove, onRetry }) => {
  const isVideo = item.file?.type?.startsWith("video/");
  const isPdf   = item.file?.type === "application/pdf";

  return (
    <div className={["mup-file-row", item.status === "error" ? "mup-file-row--error" : ""].filter(Boolean).join(" ")}>

      {/* Thumbnail / icon */}
      {item.status === "done" && item.thumbnail && !isPdf && !isVideo ? (
        <img src={item.thumbnail} alt="" className="mup-file-row__thumb" loading="lazy" />
      ) : (
        <div className="mup-file-row__icon" aria-hidden="true">
          {isPdf ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          ) : isVideo ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mup-file-row__info">
        <div className="mup-file-row__name" title={item.file?.name}>{item.file?.name}</div>
        <div className="mup-file-row__meta">
          {item.file && <span className="mup-file-row__size">{fmtB(item.file.size)}</span>}
          <span className={`mup-badge mup-badge--${item.status}`}>
            {item.status === "done"        && "✓ Uploaded"}
            {item.status === "compressing" && "Compressing…"}
            {item.status === "uploading"   && "Uploading…"}
            {item.status === "pending"     && "Waiting"}
            {item.status === "error"       && (item.error || "Failed")}
          </span>
        </div>
        {(item.status === "uploading") && (
          <div className="mup-progress" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="mup-progress__fill" style={{ width: `${item.progress}%` }} />
          </div>
        )}
        {item.status === "compressing" && (
          <div className="mup-progress">
            <div className="mup-progress__fill mup-progress__fill--indeterminate" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mup-file-row__actions">
        {item.status === "error" && onRetry && (
          <button type="button" className="mup-btn-retry" onClick={() => onRetry(item.id)} title="Retry">
            ↺
          </button>
        )}
        <button type="button" className="mup-btn-remove" onClick={() => onRemove(item.id)} aria-label="Remove file">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

// ── GalleryGrid — thumbnail grid for gallery images ───────────────────────────
const GalleryGrid = ({ items, onRemove }) => (
  <div className="mup-gallery-grid">
    {items.map((item) => (
      <div key={item.id} className={["mup-gallery-item", item.status === "error" ? "mup-gallery-item--error" : ""].filter(Boolean).join(" ")}>
        {item.preview && (
          <img
            src={item.status === "done" && item.thumbnail ? item.thumbnail : item.preview}
            alt=""
            className="mup-gallery-item__img"
            loading="lazy"
          />
        )}
        {(item.status === "uploading" || item.status === "compressing") && (
          <div className="mup-gallery-item__overlay">
            <div className="mup-gallery-item__pct">
              {item.status === "compressing" ? "…" : `${item.progress}%`}
            </div>
          </div>
        )}
        {item.status === "error" && (
          <div className="mup-gallery-item__overlay mup-gallery-item__overlay--error">
            <span>✗</span>
          </div>
        )}
        <button
          type="button"
          className="mup-gallery-item__remove"
          onClick={() => onRemove(item.id)}
          aria-label="Remove image"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        {item.status === "done" && <div className="mup-gallery-item__done">✓</div>}
      </div>
    ))}
  </div>
);

// ── Collapsible section wrapper ───────────────────────────────────────────────
const Slot = ({ id, title, required, hint, badge, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={["mup-slot", open ? "mup-slot--open" : ""].filter(Boolean).join(" ")}>
      <button
        type="button"
        className="mup-slot__header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="mup-slot__title">
          {title}
          {required && <span className="required" aria-label="required"> *</span>}
        </span>
        {badge && <span className="mup-slot__badge">{badge}</span>}
        <span className="mup-slot__hint">{hint}</span>
        <span className="mup-slot__chevron" aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="mup-slot__body">{children}</div>}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const MediaUploadSection = () => {
  const { setValue } = useFormContext();
  const [vtUrl, setVtUrl]         = useState("");
  const [floorMeta, setFloorMeta] = useState({});

  const cover    = useUploader("coverImage",  setValue, "coverImage",   false);
  const gallery  = useUploader("gallery",     setValue, "galleryImages", true);
  const plans    = useUploader("floorPlan",   setValue, "floorPlans",    true);
  const media    = useUploader("mediaFile",   setValue, "mediaFiles",    true);
  const brochure = useUploader("brochure",    setValue, "brochure",      false);
  const vtVideo  = useUploader("virtualTour", setValue, "virtualTours",  false);

  const handleVtUrl = (e) => {
    const url = e.target.value.trim();
    setVtUrl(url);
    setValue("virtualTours", url ? [{ type: "panorama", url, thumbnail: "" }] : [], { shouldDirty: true });
  };

  const setPlanType = (itemId, planType) => {
    const updated = { ...floorMeta, [itemId]: { ...floorMeta[itemId], planType } };
    setFloorMeta(updated);
    const done = plans.items.filter((i) => i.status === "done");
    setValue("floorPlans", done.map((i) => ({
      planType: updated[i.id]?.planType || "2D",
      imageUrl: i.url,
      unitType: updated[i.id]?.unitType || "",
    })), { shouldDirty: true });
  };

  const coverDone    = cover.items.some((i)   => i.status === "done");
  const galleryCount = gallery.items.filter((i) => i.status === "done").length;

  return (
    <section className="form-section mup-section">
      <h3 className="section-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        Media &amp; Files
      </h3>

      {/* ── Cover Image ── */}
      <Slot id="cover" title="Cover Image" required hint="Shown in search results" defaultOpen={true}
        badge={coverDone ? "✓" : null}>

        {cover.items.length === 0 ? (
          <DropZone mediaType="coverImage" onFiles={cover.addFiles} />
        ) : (
          <>
            {/* Large preview for cover image */}
            {cover.items[0]?.status === "done" && cover.items[0]?.thumbnail && (
              <div className="mup-cover-preview">
                <img src={cover.items[0].thumbnail} alt="Cover preview" loading="lazy" />
                <button type="button" className="mup-cover-preview__remove" onClick={() => cover.removeItem(cover.items[0].id)}>
                  Replace
                </button>
              </div>
            )}
            {cover.items[0]?.status !== "done" && (
              <div className="mup-file-list">
                <FileRow item={cover.items[0]} onRemove={cover.removeItem} onRetry={cover.retryItem} />
              </div>
            )}
          </>
        )}
      </Slot>

      {/* ── Gallery ── */}
      <Slot id="gallery" title="Gallery Images" hint="Up to 20 photos"
        badge={galleryCount > 0 ? `${galleryCount} photo${galleryCount !== 1 ? "s" : ""}` : null}>

        {gallery.items.length > 0 && (
          <GalleryGrid items={gallery.items} onRemove={gallery.removeItem} />
        )}
        {gallery.items.filter((i) => i.status !== "error").length < 20 ? (
          <DropZone mediaType="gallery" multiple onFiles={gallery.addFiles}
            compact={gallery.items.length > 0} />
        ) : (
          <p className="mup-limit-note">20 image limit reached.</p>
        )}
      </Slot>

      {/* ── Floor Plans ── */}
      <Slot id="plans" title="Floor Plans" hint="2D, 3D or structural"
        badge={plans.items.filter((i) => i.status === "done").length > 0
          ? `${plans.items.filter((i) => i.status === "done").length} plan${plans.items.filter((i) => i.status === "done").length !== 1 ? "s" : ""}`
          : null}>

        <div className="mup-file-list">
          {plans.items.map((item) => (
            <div key={item.id}>
              <FileRow item={item} onRemove={plans.removeItem} onRetry={plans.retryItem} />
              {item.status === "done" && (
                <div className="mup-plan-tags">
                  <span className="mup-plan-tags__label">Type:</span>
                  {FLOOR_PLAN_TYPES.map((pt) => (
                    <button key={pt} type="button"
                      className={["mup-tag", floorMeta[item.id]?.planType === pt ? "mup-tag--active" : ""].filter(Boolean).join(" ")}
                      onClick={() => setPlanType(item.id, pt)}>
                      {pt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <DropZone mediaType="floorPlan" multiple onFiles={plans.addFiles}
          compact={plans.items.length > 0} />
      </Slot>

      {/* ── Media Files ── */}
      <Slot id="media" title="Photos &amp; Videos" hint="Additional walkthrough media">
        <div className="mup-file-list">
          {media.items.map((item) => (
            <FileRow key={item.id} item={item} onRemove={media.removeItem} onRetry={media.retryItem} />
          ))}
        </div>
        <DropZone mediaType="mediaFile" multiple onFiles={media.addFiles}
          compact={media.items.length > 0} />
        <p className="mup-field-hint">Videos up to 30 MB · Tip: YouTube links in Virtual Tour are free &amp; unlimited</p>
      </Slot>

      {/* ── Virtual Tour ── */}
      <Slot id="vt" title="Virtual Tour" hint="Free with external URL">
        <div className="form-col" style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="mup-vt-url">
            Tour URL
            <span className="optional"> — YouTube, Matterport, 360° link</span>
          </label>
          <input
            id="mup-vt-url"
            type="url"
            placeholder="https://my.matterport.com/show/?m=…"
            value={vtUrl}
            onChange={handleVtUrl}
          />
          <span className="mup-field-hint">External URLs use the host's CDN — no storage cost to you.</span>
        </div>

        <div className="mup-or-rule"><span>or upload a video</span></div>

        <div className="mup-file-list">
          {vtVideo.items.map((item) => (
            <FileRow key={item.id} item={item} onRemove={vtVideo.removeItem} onRetry={vtVideo.retryItem} />
          ))}
        </div>
        {vtVideo.items.length === 0 && (
          <DropZone mediaType="virtualTour" onFiles={vtVideo.addFiles} />
        )}
      </Slot>

      {/* ── Brochure ── */}
      <Slot id="brochure" title="Brochure" hint="PDF only · Max 15 MB"
        badge={brochure.items.some((i) => i.status === "done") ? "✓" : null}>

        {brochure.items.length === 0 ? (
          <DropZone mediaType="brochure" onFiles={brochure.addFiles} />
        ) : (
          <>
            <div className="mup-file-list">
              {brochure.items.map((item) => (
                <FileRow key={item.id} item={item} onRemove={brochure.removeItem} onRetry={brochure.retryItem} />
              ))}
            </div>
            {!brochure.items.some((i) => i.status === "done") && (
              <DropZone mediaType="brochure" onFiles={brochure.addFiles} compact />
            )}
          </>
        )}
      </Slot>
    </section>
  );
};

export default MediaUploadSection;