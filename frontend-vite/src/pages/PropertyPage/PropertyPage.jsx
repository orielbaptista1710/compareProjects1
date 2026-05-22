// src/pages/PropertyPage/PropertyPage.jsx
import React, {
  useEffect, useState, useContext,
  useRef, useCallback, useMemo, lazy, Suspense,
} from "react";
import { useParams } from "react-router-dom";

import useHeartProperty from "../../hooks/useHeartProperty";
import { AuthContext } from "../../contexts/AuthContext";
import { useCompare } from "../../contexts/CompareContext";
import Seo from "../../database/Seo";
import { formatCurrencyShort } from "../../utils/formatters";

import "./PropertyPage.css";

import {
  Heart, Share2, Download,
  ChevronLeft, ChevronRight,
  MapPin, BadgeCheck, Scale,
} from "lucide-react";

// ── Always-loaded (above fold, critical path) ────────────────
import PropertyGallery  from "./PropertyPageComponents/PropertyGallery";
import PropertyDetails  from "./PropertyPageComponents/PropertyDetails";
import ContactFormm     from "./PropertyPageComponents/ContactFormm";
import QuickLinks       from "./PropertyPageComponents/QuickLinks";
import CompareBar       from "../Home/HomePageComponents/CompareBar";


const LocationSection   = lazy(() => import("./PropertyPageComponents/LocationSection"));
const FloorPlanView     = lazy(() => import("./PropertyPageComponents/FloorPlanView"));
const FAQSection        = lazy(() => import("./PropertyPageComponents/FAQSection"));
const IconTabContent    = lazy(() => import("./PropertyPageComponents/IconTabContent"));
const BrochurePreview   = lazy(() => import("./PropertyPageComponents/BrochurePreview"));
const NewsReview        = lazy(() => import("../../components/NewsReview"));
const RelatedProperties = lazy(() => import("./PropertyPageComponents/RelatedProperties"));


// ── Cloudinary download URL helper (same logic as BrochurePreview)
// fl_attachment forces Cloudinary to serve as download cross-origin
const getDownloadUrl = (url) => {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/raw/upload/", "/raw/upload/fl_attachment/");
};

// ─────────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────────
const ALL_TABS = [
  { id: "overview",   label: "Overview"    },
  { id: "amenities",  label: "Amenities"   },
  { id: "locality",   label: "Location"    },
  { id: "floorplans", label: "Floor Plans" },
  { id: "builder",    label: "Brochure"    },
  { id: "faq",        label: "FAQ"         },
];

// ─────────────────────────────────────────────────────────────
// STICKY TAB BAR
// ─────────────────────────────────────────────────────────────
const StickyTabBar = React.memo(({ activeTab, onTabClick, tabs }) => {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const btn = bar.querySelector(".pp-tab-btn--active");
    if (btn) {
      bar.scrollTo({
        left: btn.offsetLeft - bar.clientWidth / 2 + btn.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeTab]);

  const scroll = (dir) =>
    barRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });

  return (
    <div className="pp-tab-wrapper">
      <button className="pp-tab-chevron" onClick={() => scroll(-1)} aria-label="Scroll tabs left">
        <ChevronLeft size={14} />
      </button>
      <nav className="pp-tab-bar" ref={barRef}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`pp-tab-btn${activeTab === t.id ? " pp-tab-btn--active" : ""}`}
            onClick={() => onTabClick(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <button className="pp-tab-chevron" onClick={() => scroll(1)} aria-label="Scroll tabs right">
        <ChevronRight size={14} />
      </button>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────
// CARD
// ─────────────────────────────────────────────────────────────
const Card = ({ title, children }) => (
  <div className="pp-card">
    {title && <h2 className="pp-card__title">{title}</h2>}
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────
// SECTION FALLBACK (used by Suspense while lazy components load)
// ─────────────────────────────────────────────────────────────
const SectionFallback = () => <div className="pp-section-skeleton" aria-hidden="true" />;

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
function PropertyPage() {
  const { id }          = useParams();
  const { currentUser } = useContext(AuthContext);

  const [property,  setProperty]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [showFull,  setShowFull]  = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [stuck,     setStuck]     = useState(false);

  const sectionRefs = useRef({});
  const sentinelRef = useRef(null);
  const spyPaused   = useRef(false);

  const { isSaved, handleToggleHeart } = useHeartProperty(property?._id);
  const { compareList, addToCompare, removeFromCompare } = useCompare();

  const isCompared = useMemo(
    () => compareList.some((p) => p._id === property?._id),
    [compareList, property]
  );

  const handleCompareToggle = useCallback(() => {
    if (!property) return;
    isCompared ? removeFromCompare(property._id) : addToCompare(property);
  }, [property, isCompared, addToCompare, removeFromCompare]);

  // ── Fetch property ───────────────────────────────────────────
  useEffect(() => {
    if (!id) { setError("Invalid property ID"); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/properties/${id}`);
        if (!r.ok) throw new Error("Failed to load property");
        const d = await r.json();
        if (!cancelled) setProperty(d);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    // Cleanup: prevents state update if user navigates away mid-fetch
    return () => { cancelled = true; };
  }, [id]);

  // ── Sticky tab bar ───────────────────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: `-71px 0px 0px 0px` }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  // ── Scroll spy ───────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (spyPaused.current) return;
      const y = window.scrollY + 140;
      let cur = "overview";
      ALL_TABS.forEach(({ id: tid }) => {
        const el = sectionRefs.current[tid];
        if (el && el.offsetTop <= y) cur = tid;
      });
      setActiveTab(cur);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Tab click ────────────────────────────────────────────────
  const handleTabClick = useCallback((tabId) => {
    const el = sectionRefs.current[tabId];
    if (!el) return;
    spyPaused.current = true;
    setActiveTab(tabId);
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 128,
      behavior: "smooth",
    });
    setTimeout(() => { spyPaused.current = false; }, 900);
  }, []);

  const setRef = useCallback((tid) => (el) => {
    sectionRefs.current[tid] = el;
  }, []);

  // ── Derived data ─────────────────────────────────────────────
  const keyDetails = useMemo(() => {
    if (!property) return [];
    return [
      { label: "Property Type",   value: property.propertyType },
      { label: "BHK",             value: property.bhk },
      { label: "Bathrooms",       value: property.bathrooms },
      {
        label: "Property Area",
        value: property.area?.value
          ? `${new Intl.NumberFormat("en-IN").format(property.area.value)} ${property.area.unit || "sqft"}`
          : null,
      },
      { label: "Furnishing",      value: property.furnishing },
      {
        label: "Parking",
        value: Array.isArray(property.parkings) && property.parkings.length
          ? property.parkings.join(", ") : null,
      },
      { label: "Age of Property", value: property.ageOfProperty },
      { label: "Total Floors",    value: property.totalFloors },
      { label: "Floor No.",       value: property.floor },
      { label: "Facing",          value: property.facing },
      { label: "Balconies",       value: property.balconies },
      { label: "Wing",            value: property.wing },
    ].filter(({ value }) => value != null && value !== "");
  }, [property]);

  const additionalInfo = useMemo(() => {
    if (!property) return [];
    return [
      { label: "Developer",        value: property.developerName },
      { label: "RERA Approved",    value: property.reraApproved != null ? (property.reraApproved ? "Yes" : "No") : null },
      { label: "RERA Number",      value: property.reraApproved && property.reraNumber ? property.reraNumber : null },
      { label: "Price Negotiable", value: property.priceNegotiable != null ? (property.priceNegotiable ? "Yes" : "No") : null },
      {
        label: "Available From",
        value: property.reraDate
          ? new Date(property.reraDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : null,
      },
      { label: "Units Available",  value: property.unitsAvailable },
    ].filter(({ value }) => value != null && value !== "");
  }, [property]);

  const visibleTabs = useMemo(() => {
    if (!property) return ALL_TABS;
    const amenCount =
      (property.amenities?.length || 0) +
      (property.facilities?.length || 0) +
      (property.security?.length || 0);
    return ALL_TABS.filter(({ id: tid }) => {
      if (tid === "amenities")  return amenCount > 0;
      if (tid === "floorplans") return (property.floorPlans?.length || 0) > 0;
      if (tid === "builder")    return !!property.brochure;
      if (tid === "locality")   return !!(property.address || property.mapLink || property.landmarks?.length);
      return true;
    });
  }, [property]);

  const hasAmenities = useMemo(() =>
    property && ((property.amenities?.length || 0) + (property.facilities?.length || 0) + (property.security?.length || 0)) > 0,
  [property]);

  const hasLocation = useMemo(() =>
    property && !!(property.address || property.mapLink || property.landmarks?.length),
  [property]);

  // ── Share handler ────────────────────────────────────────────
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: property?.title, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  }, [property?.title]);

  // ── Loading / error states ───────────────────────────────────
  if (loading) return (
    <div className="pp-loading" role="status">
      <div className="pp-loading__ring" />
      <span>Loading property…</span>
    </div>
  );
  if (error)     return <div className="pp-state pp-state--error">⚠ {error}</div>;
  if (!property) return <div className="pp-state">Property not found</div>;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="pp-root">
      <Seo title={property.title} description={property.description} />

      <div className="pp-layout">

        <main className="pp-content">

          <PropertyGallery
            coverImage={property.coverImage}
            galleryImages={property.galleryImages}
            mediaFiles={property.mediaFiles}
          />

          {/* hero */}
          <div className="pp-hero">
            <div className="pp-hero__row">
              <div className="pp-hero__meta">
                {(property.bhk || property.propertyType) && (
                  <span className="pp-hero__chip">
                    {[property.bhk && `${property.bhk} BHK`, property.propertyType].filter(Boolean).join(" · ")}
                  </span>
                )}
                <h1 className="pp-hero__title">{property.title}</h1>
                {(property.locality || property.city) && (
                  <p className="pp-hero__loc">
                    <MapPin size={13} strokeWidth={2} />
                    {[property.locality, property.city, property.state].filter(Boolean).join(", ")}
                    {property.pincode ? ` – ${property.pincode}` : ""}
                  </p>
                )}
              </div>

              <div className="pp-hero__aside">
                <div>
                  <span className="pp-price-block__main">{formatCurrencyShort(property.price)}</span>
                  {property.area?.value && (
                    <span className="pp-price-block__sub">
                      {new Intl.NumberFormat("en-IN").format(property.area.value)}&thinsp;{property.area.unit || "sqft"}
                    </span>
                  )}
                </div>
                <div className="pp-hero__btns">
                  <button
                    type="button"
                    className={`pc-icon-btn ${isSaved ? "pc-liked" : ""}`}
                    onClick={(e) => { e.stopPropagation(); handleToggleHeart(); }}
                    aria-label={isSaved ? "Unlike" : "Save"}
                  >
                    <Heart size={16} strokeWidth={1.8} fill={isSaved ? "#D90429" : "none"} color={isSaved ? "#D90429" : "#1a1a1a"} />
                  </button>
                  <button className="pp-action-btn" onClick={handleShare} aria-label="Share">
                    <Share2 size={15} strokeWidth={2} /> Share
                  </button>
                </div>
              </div>
            </div>

            {(property.reraApproved || property.reraNumber) && (
              <div className="pp-trust-strip">
                {property.reraApproved && (
                  <span className="pp-trust-badge"><BadgeCheck size={12} strokeWidth={2.5} /> RERA Approved</span>
                )}
                {property.reraNumber && (
                  <span className="pp-trust-badge pp-trust-badge--pill">{property.reraNumber}</span>
                )}
                {property.possessionStatus && (
                  <span className="pp-trust-badge">{property.possessionStatus}</span>
                )}
              </div>
            )}
          </div>

          <section>
          {compareList.length > 0 && (
                  <CompareBar 
                    compareList={compareList}
                    removeFromCompare={removeFromCompare}
                    
                  />
                )}
          </section>

          <PropertyDetails property={property} />

          <div ref={sentinelRef} className="pp-sentinel" aria-hidden="true" />

          <div className={`pp-tab-container${stuck ? " pp-tab-container--stuck" : ""}`}>
            <StickyTabBar activeTab={activeTab} onTabClick={handleTabClick} tabs={visibleTabs} />
          </div>

          {/* ═══ § OVERVIEW ═══════════════════════════ */}
          <section id="overview" ref={setRef("overview")} className="pp-section" aria-label="Overview">
            {keyDetails.length > 0 && (
              <Card title="Key Details">
                <div className="pp-key-grid">
                  {keyDetails.map(({ label, value }) => (
                    <div className="pp-key-item" key={label}>
                      <span className="pp-key-item__lbl">{label}</span>
                      <span className="pp-key-item__val">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {property.description && (
              <Card title="Description">
                <p className="pp-desc-text">
                  {showFull ? (property.long_description || property.description) : property.description}
                </p>
                {property.long_description && property.long_description !== property.description && (
                  <button className="pp-read-more" onClick={() => setShowFull(v => !v)}>
                    {showFull ? "Show Less" : "Show More"}
                  </button>
                )}
              </Card>
            )}

            {additionalInfo.length > 0 && (
              <Card title="Project Information">
                <div className="pp-info-table">
                  {additionalInfo.map(({ label, value }) => (
                    <div className="pp-info-row" key={label}>
                      <span className="pp-info-row__lbl">{label}</span>
                      <span className="pp-info-row__val">{value}</span>
                    </div>
                  ))}
                </div>
                <button
                  className={`pp-action-btn pp-compare-inline ${isCompared ? "pp-action-btn--active" : ""}`}
                  onClick={handleCompareToggle}
                >
                  <Scale size={15} strokeWidth={2} />
                  {isCompared ? "Compared" : "Compare"}
                </button>
              </Card>
            )}
          </section>

          {/*amenities*/}
          {hasAmenities && (
            <section id="amenities" ref={setRef("amenities")} className="pp-section" aria-label="Amenities">
              <Card title="Amenities &amp; Facilities">
                <Suspense fallback={<SectionFallback />}>
                  <IconTabContent property={property} />
                </Suspense>
              </Card>
            </section>
          )}

          {/* loc da cation */}
          {hasLocation && (
            <section id="pp-locality" ref={setRef("locality")} className="pp-section" aria-label="Location">
              <Suspense fallback={<SectionFallback />}>
                <LocationSection property={property} />
              </Suspense>
            </section>
          )}

          {/* plan of floor */}
          {property.floorPlans?.length > 0 && (
            <section id="floorplans" ref={setRef("floorplans")} className="pp-section" aria-label="Floor Plans">
              <Card title="Floor Plans">
                <Suspense fallback={<SectionFallback />}>
                  <FloorPlanView floorPlans={property.floorPlans} property={property} />
                </Suspense>
              </Card>
            </section>
          )}

          {/* brochure */}
          {property.brochure && (
            <section id="builder" ref={setRef("builder")} className="pp-section" aria-label="Project Brochure">
              <Card title="Project Brochure">
                <Suspense fallback={<SectionFallback />}>
                  <BrochurePreview brochure={property.brochure} title="Project Brochure" />
                </Suspense>
              </Card>
            </section>
          )}

          {/* faq */}
          <section id="faq" ref={setRef("faq")} className="pp-section" aria-label="FAQ">
            <Card title="Frequently Asked Questions">
              <Suspense fallback={<SectionFallback />}>
                <FAQSection property={property} />
              </Suspense>
            </Card>
          </section>

          {/* ═══ § NEWS ═══════════════════════════════ */}
          <section aria-label="News and Insights">
            <Card title="News &amp; Insights">
              <Suspense fallback={<SectionFallback />}>
                <NewsReview />
              </Suspense>
            </Card>
          </section>

          <Suspense fallback={null}>
            <RelatedProperties propertyId={property._id} />
          </Suspense>

        </main>

        {/* ═══════════════ SIDEBAR ═══════════════════ */}
        <aside className="pp-sidebar" aria-label="Enquiry">

          <button
            className={`pp-compare-btn ${isCompared ? "active" : ""}`}
            onClick={handleCompareToggle}
          >
            <Scale size={16} />
            {isCompared ? "Added to Compare" : "Add to Compare"}
          </button>

          <ContactFormm property={property} />

          <div className="pp-price-summary">
            <div className="pp-price-summary__top">
              <span className="pp-price-summary__label">Listed Price</span>
              <span className="pp-price-summary__amount">{formatCurrencyShort(property.price)}</span>
            </div>
            {[
              property.area?.value      && { k: "Area",          v: `${new Intl.NumberFormat("en-IN").format(property.area.value)} ${property.area.unit || "sqft"}` },
              property.possessionStatus && { k: "Possession",    v: property.possessionStatus },
              property.bhk              && { k: "Configuration", v: `${property.bhk} BHK` },
            ].filter(Boolean).map(({ k, v }) => (
              <div className="pp-price-summary__row" key={k}>
                <span>{k}</span><span>{v}</span>
              </div>
            ))}
          </div>

          {/* ✅ Sidebar Download button — uses Cloudinary fl_attachment for real download */}
          {property.brochure ? (
            <a
              href={getDownloadUrl(property.brochure)}
              target="_blank"
              rel="noopener noreferrer"
              className="pp-dl-btn"
              aria-label="Download Brochure"
            >
              <Download size={15} strokeWidth={2.2} /> Download Brochure
            </a>
          ) : (
            <button className="pp-dl-btn pp-dl-btn--disabled" disabled aria-label="No brochure available">
              <Download size={15} strokeWidth={2.2} /> No Brochure Available
            </button>
          )}

        </aside>
      </div>

      <QuickLinks property={property} />
    </div>
  );
}

export default PropertyPage;