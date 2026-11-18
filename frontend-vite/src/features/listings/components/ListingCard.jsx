// src/features/listings/components/ListingCard.jsx
//
// One of "my" listings: photo, status, price, the details grouped (Property /
// Status / Building), views, and Edit / Delete. Groups with no values are left
// out, so an owner's card has no empty RERA or Building block. Shown only with
// real data: enquiries and compare counts aren't tracked yet, so they aren't
// here. Class names are all `lc-` prefixed because this renders inside several
// dashboards and global CSS leaks between SPA routes.
import { memo, useState } from "react";
import { getOptimizedImageUrl } from "../../../utils/propertyHelpers";
import { formatCurrencyShort, formatIndianNumber, formatAreaText } from "../../../utils/formatters";
import { LISTING_STATUS } from "../../admin/listingStatus";
import { floorText } from "../floor";
import "./ListingCard.css";

const STATUS_BADGE = {
  [LISTING_STATUS.APPROVED]: { label: "Live", tone: "live" },
  [LISTING_STATUS.PENDING]: { label: "In review", tone: "review" },
  [LISTING_STATUS.REJECTED]: { label: "Rejected", tone: "rejected" },
  [LISTING_STATUS.SUSPENDED]: { label: "Hidden", tone: "rejected" },
};

const isBlank = (v) => v === null || v === undefined || v === "" || v === false;

const photoCount = (p) =>
  (p.coverImage?.url || p.coverImage?.thumbnail ? 1 : 0) + (p.galleryImages?.length ?? 0);

const pricePerSqft = (p) => {
  const value = Number(p.area?.value);
  const unit = p.area?.unit || "sqft";
  if (!p.price || !Number.isFinite(value) || value <= 0 || unit !== "sqft") return null;
  return `₹${formatIndianNumber(Math.round(p.price / value))} / sq ft`;
};

const LISTING_TYPE_LABEL = { sale: "New sale", resale: "Resale" };

const formatDate = (value) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;
};

const countOf = (list) => (Array.isArray(list) && list.length > 0 ? list.length : null);

const floorWithLabel = (p) => {
  if (isBlank(p.floor)) return p.floorLabel || null;
  const base = floorText(p.floor); // 0 → Ground, -1 → B1
  return p.floorLabel ? `${base} (${p.floorLabel})` : base;
};

// [group title, [label, value][]]; blank rows and empty groups are dropped
const detailGroups = (p) =>
  [
    ["Property", [
      ["Type", p.propertyType],
      ["BHK", p.bhk],
      ["Area", formatAreaText(p.area)],
      ["Bathrooms", p.bathrooms],
      ["Balconies", p.balconies],
      ["Facing", p.facing],
      ["Furnishing", p.furnishing],
      ["Parking", Array.isArray(p.parkings) ? p.parkings.join(", ") : p.parkings],
    ]],
    ["Status", [
      ["Listing", LISTING_TYPE_LABEL[p.listingType]],
      ["Possession", p.possessionStatus],
      ["Age", p.ageOfProperty === "New" ? "New property" : p.ageOfProperty],
      ["RERA", p.reraApproved ? "Approved" : null],
      ["RERA no.", p.reraNumber],
      ["RERA completion", formatDate(p.reraDate)],
    ]],
    ["Building", [
      ["Total floors", p.totalFloors],
      ["Floor", floorWithLabel(p)],
      ["Tower", p.tower],
      ["Wing", p.wing],
      ["Phase", p.phase],
      ["Units available", p.unitsAvailable],
    ]],
    ["Media", [
      ["Floor plans", countOf(p.floorPlans)],
      ["Virtual tours", countOf(p.virtualTours)],
      ["Brochure", p.brochure?.url ? "Available" : null],
    ]],
  ]
    .map(([title, rows]) => [title, rows.filter(([, value]) => !isBlank(value))])
    .filter(([, rows]) => rows.length > 0);

const textOf = (v) => (typeof v === "string" ? v.trim() : "");
const listOf = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : []);

const FULL_DESCRIPTION_MIN = 160;

// The long lists. Each is a toggle with its count; the contents open below the
// row, one at a time, so the card stays short until someone asks.
const expandables = (p) => {
  const description = textOf(p.description);
  const longDescription = textOf(p.long_description);
  const items = [];
  if (longDescription || description.length > FULL_DESCRIPTION_MIN) {
    items.push({ key: "about", label: "Full description", text: [description, longDescription].filter(Boolean) });
  }
  [["amenities", "Amenities"], ["facilities", "Facilities"], ["security", "Security"]].forEach(([key, label]) => {
    const list = listOf(p[key]);
    if (list.length) items.push({ key, label, list });
  });
  return items;
};

const ListingCard = ({ listing, onEdit, onDelete }) => {
  const p = listing;
  const [openKey, setOpenKey] = useState(null);
  const more = expandables(p);
  const openItem = more.find((m) => m.key === openKey);
  const panelId = `lc-panel-${p._id}`;
  const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE[LISTING_STATUS.PENDING];
  const cover = p.coverImage?.thumbnail || p.coverImage?.url;
  const photos = photoCount(p);
  const location = [p.sub_locality, p.locality, p.city].filter(Boolean).join(", ");
  const perSqft = pricePerSqft(p);
  const views = p.metadata?.analytics?.viewCount ?? 0;
  // Project (and developer, when it differs) sits above the title
  const byline = [p.projectName, p.developerName].filter(Boolean).join(" · ");
  const description = textOf(p.description);
  const groups = detailGroups(p);
  const submitted = formatDate(p.submittedAt);
  const edited = formatDate(p.lastEditedAt);

  return (
    <article className="lc-card">
      <div className="lc-media">
        {cover ? (
          <img
            className="lc-media__img"
            src={getOptimizedImageUrl(cover, { width: 640 })}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="lc-media__empty" aria-hidden="true" />
        )}
        <span className={`lc-badge lc-badge--${badge.tone}`}>{badge.label}</span>
        {p.featured && <span className="lc-featured">Featured</span>}
        {photos > 0 && (
          <span className="lc-photos">{photos} {photos === 1 ? "photo" : "photos"}</span>
        )}
      </div>

      <div className="lc-body">
      <div className="lc-head">
        {byline && <p className="lc-byline">{byline}</p>}
        <h3 className="lc-title" title={p.title}>{p.title}</h3>
        {(location || p.pincode) && (
          <p className="lc-location">{[location, p.pincode].filter(Boolean).join(" ")}</p>
        )}
        {p.address && <p className="lc-address">{p.address}</p>}
        <p className="lc-price">
          <strong>{formatCurrencyShort(p.price, { fallback: "Price on request" })}</strong>
          {p.priceNegotiable && <span className="lc-tag">Negotiable</span>}
          {perSqft && <span className="lc-price__per">{perSqft}</span>}
        </p>
        {p.emiStarts > 0 && (
          <p className="lc-emi">EMI from {formatCurrencyShort(p.emiStarts)}/month</p>
        )}
        {description && <p className="lc-desc">{description}</p>}
      </div>

      {groups.length > 0 && (
        <div className="lc-groups">
          {groups.map(([title, rows]) => (
            <div className="lc-group" key={title} role="group" aria-label={title}>
              <p className="lc-group__title" aria-hidden="true">{title}</p>
              <div className="lc-group__rows">
                {rows.map(([label, value]) => (
                  <span className="lc-row" key={label}>
                    <span className="lc-row__label">{label}</span>
                    <span className="lc-row__value">{value}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {more.length > 0 && (
        <div className="lc-more">
          <div className="lc-more__bar">
            {more.map((m) => (
              <button
                type="button"
                key={m.key}
                className="lc-chip"
                aria-expanded={openKey === m.key}
                aria-controls={panelId}
                onClick={() => setOpenKey(openKey === m.key ? null : m.key)}
              >
                {m.label}
                {m.list && <span className="lc-chip__count">{m.list.length}</span>}
                <span className="lc-chip__caret" aria-hidden="true" />
              </button>
            ))}
          </div>
          <div id={panelId} className="lc-panel" hidden={!openItem}>
            {openItem?.text && openItem.text.map((t) => <p key={t} className="lc-panel__text">{t}</p>)}
            {openItem?.list && (
              <ul className="lc-tags">
                {openItem.list.map((t) => <li key={t}>{t}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      {p.status === LISTING_STATUS.REJECTED && p.rejectionReason && (
        <div className="lc-reject" role="note">
          <span className="lc-reject__label">Why it was rejected</span>
          <p>{p.rejectionReason}</p>
        </div>
      )}

      <div className="lc-foot">
        <p className="lc-stats">
          <strong>{formatIndianNumber(views)}</strong> {views === 1 ? "view" : "views"}
          {submitted && <span className="lc-stats__date">Submitted {submitted}</span>}
          {edited && <span className="lc-stats__date">Edited {edited}</span>}
        </p>
        <div className="lc-actions">
          <button type="button" className="lc-btn lc-btn--primary" onClick={() => onEdit(p)}>
            Edit<span className="lc-sr"> {p.title}</span>
          </button>
          <button type="button" className="lc-btn lc-btn--danger" onClick={() => onDelete(p._id, p.title)}>
            Delete<span className="lc-sr"> {p.title}</span>
          </button>
        </div>
      </div>
      {p.status === LISTING_STATUS.APPROVED && (
        <p className="lc-note">Editing sends a live listing back for review.</p>
      )}
      </div>
    </article>
  );
};

export default memo(ListingCard);
