//frontend-vite/src/pages/Home/HomePageComponents/CompareBar.jsx
import React, { useCallback, useEffect, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./CompareBar.css";

import { formatCurrencyShort } from "../../utils/formatters";
import { getPropertyImage } from "../../utils/propertyHelpers";

const CompareBar = ({ compareList, removeFromCompare, setCompareList, isOpen, onClose }) => {
  const navigate = useNavigate();

  const clearAll = useCallback(() => setCompareList([]), [setCompareList]);
  // Close the bar too, so it doesn't sit over the compare page
  const goToComparePage = () => {
    navigate("/compare");
    onClose?.();
  };

  const visible = isOpen && compareList.length > 0;
  const wrapperRef = useRef(null);

  // The bar is fixed to the bottom of the screen, so publish its height as
  // --compare-bar-height; CompareBar.css pads the page by that much so the bar
  // never covers the last of the content.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!visible || !el) return undefined;
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--compare-bar-height", `${el.offsetHeight}px`);
    publish();
    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(publish);
      observer.observe(el);
    }
    return () => {
      observer?.disconnect();
      root.style.removeProperty("--compare-bar-height");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="compare-bar-wrapper" ref={wrapperRef}>
      <div className="compare-bar">
        <div className="compare-scroll">
          {compareList.map((property) => (
            <div key={property._id} className="compare-item">
              <img
                src={getPropertyImage(property)}
                alt={property?.title}
                className="compare-item-image"
              />
              <div className="compare-item-info">
                <p className="compare-item-title">{property.title}</p>
                <p className="compare-item-price">
                  {formatCurrencyShort(property.price)}
                </p>
              </div>
              <button
                className="compare-remove-btn"
                onClick={() => removeFromCompare(property._id)}
                aria-label={`Remove ${property.title} from compare`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="comparebar-actions">
          <span className="compare-count">{compareList.length} selected</span>
          <button className="compare-clear-btn" onClick={clearAll}>
            <Trash2 size={14} strokeWidth={1.5} /> Clear All
          </button>
          <button className="compare-now-btn" onClick={goToComparePage}>
            Compare Now
          </button>
          <button className="compare-close-btn" onClick={onClose} aria-label="Hide compare bar">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CompareBar);