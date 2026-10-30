import { useEffect, useRef, useState } from "react";
import { getOptimizedPropertyImage } from "../../../../utils/propertyHelpers";

// Slim, one-line copy of the property headers that appears once the big
// header cards scroll out of view. Styles live in CompareTable.css because
// the columns must match the table's.
const CompareStickyHeader = ({ properties, slotCount = 0, scrollRef, headRef }) => {
  const [visible, setVisible] = useState(false);
  const trackRef = useRef(null);

  // Show once the table's header row has scrolled up under the sticky bars.
  useEffect(() => {
    const head = headRef.current;
    if (!head || typeof IntersectionObserver === "undefined") return;

    const styles = getComputedStyle(head);
    const top =
      (parseFloat(styles.getPropertyValue("--chrome-h")) || 0) +
      (parseFloat(styles.getPropertyValue("--nav-h")) || 0);

    // The root extends far below the viewport, so the header only stops
    // "intersecting" by going above the sticky bars. Otherwise a fast jump
    // from below-the-fold straight past it (phones, section links) never
    // changes its state and the observer never fires.
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < top),
      { rootMargin: `-${top}px 0px 100000px 0px` }
    );
    observer.observe(head);
    return () => observer.disconnect();
  }, [headRef]);

  // Follow the table's horizontal scroll by writing the transform directly,
  // so scrolling never goes through React state.
  useEffect(() => {
    const scroller = scrollRef.current;
    const track = trackRef.current;
    if (!scroller || !track) return;

    const sync = () => {
      track.style.transform = `translateX(${-scroller.scrollLeft}px)`;
    };
    sync();
    scroller.addEventListener("scroll", sync, { passive: true });
    return () => scroller.removeEventListener("scroll", sync);
  }, [scrollRef]);

  return (
    <div className={`ct-mini ${visible ? "is-visible" : ""}`} aria-hidden="true">
      <div className="ct-mini__bar">
        <div className="ct-mini__corner" />
        <div className="ct-mini__viewport">
          <div className="ct-mini__track" ref={trackRef}>
            {properties.map((p) => (
              <div key={p._id} className="ct-mini__cell">
                <img src={getOptimizedPropertyImage(p, { width: 48, height: 48 })} alt="" width="24" height="24" />
                <span>{p.title || "Untitled"}</span>
              </div>
            ))}
            {Array.from({ length: slotCount }, (_, i) => (
              <div key={`slot-${i}`} className="ct-mini__cell ct-mini__cell--empty ct-slot">
                <span>Empty slot</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareStickyHeader;
