// sections/ListingMediaSection.jsx
// Photos (in category tabs), a YouTube video link and, for developers and
// agents, a PDF brochure. All optional.
//
// The form holds only links, in the same shape the API stores:
//   coverImage    { url, thumbnail, category }   the photo buyers see first
//   galleryImages [{ url, thumbnail, category }] the rest, in display order
//   brochure      { url }
//   videoUrl      a YouTube link (sent as a virtualTours entry on submit)
// Files go straight from the browser to storage (features/listings/media).
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { Check, ChevronLeft, ChevronRight, FileText, ImagePlus, Star, Trash2, X } from "lucide-react";
import {
  BROCHURE_MAX_BYTES,
  MAX_PHOTOS,
  PHOTO_INPUT_TYPES,
  canAddBrochure,
  categoriesFor,
} from "../../../../constants/media";
import { PhotoError, resizePhoto } from "../../../listings/media/resizePhoto";
import { uploadFiles } from "../../../listings/media/uploadMedia";
import PhotoExamples from "./PhotoExamples";
import "./ListingMediaSection.css";

const DIRTY = { shouldDirty: true, shouldTouch: true };
const UPLOAD_FAILED = "Upload failed. Check your connection and try again.";

// One list for the screen: the cover first, then the gallery.
const toList = (cover, gallery) => [
  ...(cover?.url ? [{ ...cover, isCover: true }] : []),
  ...(Array.isArray(gallery) ? gallery : []),
];

// Only what the API stores for a photo
const toStored = ({ url, thumbnail, category, caption }) => ({
  url,
  ...(thumbnail && { thumbnail }),
  ...(category && { category }),
  ...(caption && { caption }),
});

// The API explains 4xx answers (not verified, too many uploads, uploads off)
const errorText = (err) => {
  if (err instanceof PhotoError) return err.message;
  return err?.response?.data?.message || err?.response?.data?.error || UPLOAD_FAILED;
};

// Every PDF starts with "%PDF-"; a renamed file doesn't. (The server checks
// the stored file's type and size again when the listing is saved.)
const firstBytes = (file, count) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new TextDecoder().decode(reader.result));
    reader.onerror = () => resolve("");
    reader.readAsArrayBuffer(file.slice(0, count));
  });
const isPdf = async (file) => file.type === "application/pdf" && (await firstBytes(file, 5)) === "%PDF-";

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const ListingMediaSection = ({ role }) => {
  const {
    control,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext();

  const propertyType = useWatch({ control, name: "propertyType" });
  const cover = useWatch({ control, name: "coverImage" });
  const gallery = useWatch({ control, name: "galleryImages" });
  const brochure = useWatch({ control, name: "brochure" });

  const tabs = categoriesFor(propertyType);
  const tabIds = tabs.map((t) => t.id);
  // Photos saved before categories existed (or under a tab this property type
  // doesn't have) show under "Others".
  const tabOf = (photo) => (tabIds.includes(photo.category) ? photo.category : "other");

  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const active = tabIds.includes(activeTab) ? activeTab : tabs[0].id;

  // Photos being resized/uploaded, or that failed: { id, file, category, preview, status, message }
  const [pending, setPending] = useState([]);
  const [brochureState, setBrochureState] = useState({ busy: false, message: "" });
  const [dragging, setDragging] = useState(false);
  const photoInput = useRef(null);
  const brochureInput = useRef(null);

  // The card unmounts when another section opens. Uploads still finish and
  // land in the form; only this component's own state must not be touched.
  const mounted = useRef(true);
  const previews = useRef(new Set());
  useEffect(() => {
    mounted.current = true;
    const urls = previews.current;
    return () => {
      mounted.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const photos = toList(cover, gallery);
  const working = pending.filter((p) => p.status === "working").length;

  const currentList = useCallback(
    () => toList(getValues("coverImage"), getValues("galleryImages")),
    [getValues]
  );

  // A listing with photos always has a cover: the starred one, else the first.
  const writeList = useCallback(
    (list) => {
      const nextCover = list.find((p) => p.isCover) ?? list[0];
      setValue("coverImage", nextCover ? toStored(nextCover) : "", DIRTY);
      setValue("galleryImages", list.filter((p) => p !== nextCover).map(toStored), DIRTY);
    },
    [setValue]
  );

  const dropPending = useCallback((id) => {
    setPending((list) => {
      const entry = list.find((p) => p.id === id);
      if (entry) {
        URL.revokeObjectURL(entry.preview);
        previews.current.delete(entry.preview);
      }
      return list.filter((p) => p.id !== id);
    });
  }, []);

  const uploadOne = useCallback(
    async (entry) => {
      try {
        const { image, thumb } = await resizePhoto(entry.file);
        const [url, thumbnail] = await uploadFiles(role, [
          { kind: "image", blob: image },
          { kind: "thumb", blob: thumb },
        ]);
        writeList([...currentList(), { url, thumbnail, category: entry.category }]);
        if (mounted.current) dropPending(entry.id);
      } catch (err) {
        if (!mounted.current) return;
        setPending((list) =>
          list.map((p) =>
            p.id === entry.id
              ? { ...p, status: "error", message: errorText(err), canRetry: !(err instanceof PhotoError) }
              : p
          )
        );
      }
    },
    [role, writeList, currentList, dropPending]
  );

  const addPhotos = useCallback(
    async (fileList) => {
      const files = [...(fileList ?? [])];
      if (!files.length) return;
      const room = Math.max(0, MAX_PHOTOS - photos.length - working);
      if (files.length > room) toast.error(`A listing can have up to ${MAX_PHOTOS} photos.`);

      const entries = files.slice(0, room).map((file) => {
        const preview = URL.createObjectURL(file);
        previews.current.add(preview);
        return { id: newId(), file, category: active, preview, status: "working", message: "" };
      });
      setPending((list) => [...list, ...entries]);
      // One at a time: resizing a camera photo is heavy work for a phone.
      for (const entry of entries) await uploadOne(entry);
    },
    [photos.length, working, active, uploadOne]
  );

  const retry = (entry) => {
    setPending((list) => list.map((p) => (p.id === entry.id ? { ...p, status: "working", message: "" } : p)));
    uploadOne(entry);
  };

  const removePhoto = (url) => writeList(photos.filter((p) => p.url !== url));
  const makeCover = (url) => writeList(photos.map((p) => ({ ...p, isCover: p.url === url })));

  // Swap with the previous/next photo in the same tab (the cover stays put).
  const move = (url, step) => {
    const inTab = photos.filter((p) => !p.isCover && tabOf(p) === active);
    const from = inTab.findIndex((p) => p.url === url);
    const other = inTab[from + step];
    if (from < 0 || !other) return;
    const next = [...photos];
    const a = next.findIndex((p) => p.url === url);
    const b = next.findIndex((p) => p.url === other.url);
    [next[a], next[b]] = [next[b], next[a]];
    writeList(next);
  };

  const addBrochure = async (file) => {
    if (!file) return;
    if (!(await isPdf(file))) return setBrochureState({ busy: false, message: "The brochure must be a PDF file." });
    if (file.size > BROCHURE_MAX_BYTES) {
      return setBrochureState({ busy: false, message: "The brochure is over 10 MB. Choose a smaller PDF." });
    }
    setBrochureState({ busy: true, message: "" });
    try {
      const [url] = await uploadFiles(role, [{ kind: "brochure", blob: file }]);
      setValue("brochure", { url }, DIRTY);
      if (mounted.current) setBrochureState({ busy: false, message: "" });
    } catch (err) {
      if (mounted.current) setBrochureState({ busy: false, message: errorText(err) });
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addPhotos(e.dataTransfer?.files);
  };

  const tabPhotos = photos.filter((p) => tabOf(p) === active);
  const tabPending = pending.filter((p) => p.category === active);
  const movable = tabPhotos.filter((p) => !p.isCover);
  const isEmpty = !tabPhotos.length && !tabPending.length;
  const isFull = photos.length + working >= MAX_PHOTOS;
  const activeLabel = tabs.find((t) => t.id === active).label;

  return (
    <section aria-labelledby="media-section-title" className="form-section lms">
      <h3 id="media-section-title" className="section-title">Photos</h3>
      <p className="lms-lead">Photos are optional. You can publish now and add them later.</p>

      <div className="lms-tabs" role="tablist" aria-label="Photo categories">
        {tabs.map((tab) => {
          const count = photos.filter((p) => tabOf(p) === tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`lms-tab-${tab.id}`}
              aria-selected={tab.id === active}
              aria-controls="lms-panel"
              className="lms-tab"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {count > 0 && <span className="lms-tab__count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div
        id="lms-panel"
        role="tabpanel"
        aria-labelledby={`lms-tab-${active}`}
        className={`lms-drop${dragging ? " lms-drop--over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {isEmpty ? (
          <div className="lms-empty">
            {photos.length === 0 && (
              <p className="lms-nudge">
                <ImagePlus aria-hidden="true" size={28} />
                <span>
                  <strong>Buyers look at listings with photos first.</strong>
                  <br />
                  Add a few clear photos of the property.
                </span>
              </p>
            )}
            <button
              type="button"
              className="spf-btn spf-btn--secondary lms-add"
              onClick={() => photoInput.current?.click()}
              disabled={isFull}
            >
              Add {activeLabel.toLowerCase()} photos
            </button>
            <p className="lms-drop__hint">or drag photos here</p>
          </div>
        ) : (
          <ul className="lms-grid" aria-label={`${activeLabel} photos`}>
            {tabPhotos.map((photo) => {
              const at = movable.findIndex((p) => p.url === photo.url);
              return (
                <li key={photo.url} className="lms-tile">
                  <img src={photo.thumbnail || photo.url} alt="" loading="lazy" className="lms-tile__img" />
                  {photo.isCover && <span className="lms-tile__badge">Cover photo</span>}
                  <div className="lms-tile__actions">
                    {!photo.isCover && (
                      <>
                        <button
                          type="button"
                          className="lms-icon-btn"
                          aria-label="Move photo earlier"
                          disabled={at <= 0}
                          onClick={() => move(photo.url, -1)}
                        >
                          <ChevronLeft aria-hidden="true" size={18} />
                        </button>
                        <button
                          type="button"
                          className="lms-icon-btn"
                          aria-label="Move photo later"
                          disabled={at === movable.length - 1}
                          onClick={() => move(photo.url, 1)}
                        >
                          <ChevronRight aria-hidden="true" size={18} />
                        </button>
                        <button
                          type="button"
                          className="lms-icon-btn"
                          aria-label="Use as cover photo"
                          onClick={() => makeCover(photo.url)}
                        >
                          <Star aria-hidden="true" size={18} />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="lms-icon-btn lms-icon-btn--danger"
                      aria-label="Remove photo"
                      onClick={() => removePhoto(photo.url)}
                    >
                      <Trash2 aria-hidden="true" size={18} />
                    </button>
                  </div>
                </li>
              );
            })}

            {tabPending.map((entry) => (
              <li key={entry.id} className={`lms-tile lms-tile--${entry.status}`}>
                <img src={entry.preview} alt="" className="lms-tile__img" />
                {entry.status === "working" ? (
                  <span className="lms-tile__status">Uploading…</span>
                ) : (
                  <div className="lms-tile__error" role="alert">
                    <span>{entry.message}</span>
                    <span className="lms-tile__error-actions">
                      {/* A photo that is itself the problem can't be retried */}
                      {entry.canRetry && (
                        <button type="button" className="lms-link" onClick={() => retry(entry)}>
                          Try again
                        </button>
                      )}
                      <button type="button" className="lms-link" onClick={() => dropPending(entry.id)}>
                        Remove
                      </button>
                    </span>
                  </div>
                )}
              </li>
            ))}

            {!isFull && (
              <li className="lms-tile lms-tile--add">
                <button type="button" className="lms-add-tile" onClick={() => photoInput.current?.click()}>
                  <ImagePlus aria-hidden="true" size={24} />
                  Add photos
                </button>
              </li>
            )}
          </ul>
        )}

        <input
          ref={photoInput}
          type="file"
          className="lms-file"
          accept={PHOTO_INPUT_TYPES.join(",")}
          multiple
          tabIndex={-1}
          aria-label={`Choose ${activeLabel.toLowerCase()} photos`}
          onChange={(e) => {
            addPhotos(e.target.files);
            e.target.value = ""; // picking the same file again must fire a change
          }}
        />
      </div>

      <p className="lms-sr" role="status">
        {working > 0 ? `Uploading ${working} ${working === 1 ? "photo" : "photos"}` : ""}
      </p>

      <div className="lms-notes">
        <p className="lms-help">
          JPG, PNG or WebP, up to 20 MB each and at least 600 × 400 pixels. Up to {MAX_PHOTOS} photos
          ({photos.length} added). The cover photo is the one buyers see first.
        </p>
        <ul className="lms-rules" aria-label="Photo guidelines">
          <li className="lms-rule lms-rule--ok">
            <Check aria-hidden="true" size={16} /> Clear, well-lit photos of this property
          </li>
          <li className="lms-rule">
            <X aria-hidden="true" size={16} /> No text, phone numbers or logos on the photo
          </li>
          <li className="lms-rule">
            <X aria-hidden="true" size={16} /> No blurry photos
          </li>
          <li className="lms-rule">
            <X aria-hidden="true" size={16} /> No watermarks
          </li>
        </ul>
        <PhotoExamples />
      </div>

      <div className="form-row">
        <div className="form-col">
          <label htmlFor="videoUrl">
            YouTube video link <span className="lms-optional">(optional)</span>
          </label>
          <input
            id="videoUrl"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://www.youtube.com/watch?v=…"
            {...register("videoUrl")}
            aria-invalid={errors.videoUrl ? "true" : undefined}
            aria-describedby="videoUrl-help"
          />
          <span id="videoUrl-help" className="lms-help">
            Upload your walkthrough video to YouTube, then paste its link here.
          </span>
          {errors.videoUrl && (
            <span className="field-error" role="alert">{errors.videoUrl.message}</span>
          )}
        </div>
      </div>

      {canAddBrochure(role) && (
        <div className="lms-brochure">
          <h4 className="lms-subtitle">Brochure <span className="lms-optional">(optional)</span></h4>
          {brochure?.url ? (
            <p className="lms-brochure__file">
              <FileText aria-hidden="true" size={20} />
              <a href={brochure.url} target="_blank" rel="noopener noreferrer">View brochure</a>
              <button type="button" className="lms-link" onClick={() => setValue("brochure", "", DIRTY)}>
                Remove
              </button>
            </p>
          ) : (
            <button
              type="button"
              className="spf-btn spf-btn--secondary"
              disabled={brochureState.busy}
              onClick={() => brochureInput.current?.click()}
            >
              {brochureState.busy ? "Uploading…" : "Add brochure"}
            </button>
          )}
          <p className="lms-help">One PDF, up to 10 MB.</p>
          {brochureState.message && (
            <span className="field-error" role="alert">{brochureState.message}</span>
          )}
          <input
            ref={brochureInput}
            type="file"
            className="lms-file"
            accept="application/pdf"
            tabIndex={-1}
            aria-label="Choose a brochure PDF"
            onChange={(e) => {
              addBrochure(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </section>
  );
};

export default ListingMediaSection;
