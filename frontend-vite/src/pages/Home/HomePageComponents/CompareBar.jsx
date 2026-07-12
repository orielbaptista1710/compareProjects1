import React, { useCallback, useState, useRef, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./CompareBar.css";

import { formatCurrencyShort } from "../../../utils/formatters";
import { getPropertyImage } from "../../../utils/propertyHelpers";

const CompareBar = ({ compareList, removeFromCompare, setCompareList }) => {
  const navigate = useNavigate();
  const [isClosed, setIsClosed] = useState(false);
  const prevLengthRef = useRef(compareList.length);

  const clearAll = useCallback(() => setCompareList([]), [setCompareList]);
  const goToComparePage = () => navigate("/compare");
  const closeBar = useCallback(() => setIsClosed(true), []);

  // If a new property gets added after the bar was closed, bring it back
  useEffect(() => {
    if (compareList.length > prevLengthRef.current) {
      setIsClosed(false);
    }
    prevLengthRef.current = compareList.length;
  }, [compareList.length]);

  if (isClosed || compareList.length === 0) return null;

  return (
    <div className="compare-bar-wrapper">
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
          <span className="compare-count">
            {compareList.length} selected
          </span>

          <button className="compare-clear-btn" onClick={clearAll}>
            <Trash2 size={14} strokeWidth={1.5} /> Clear All
          </button>

          <button className="compare-now-btn" onClick={goToComparePage}>
            Compare Now
          </button>

          <button
            className="compare-close-btn"
            onClick={closeBar}
            aria-label="Hide compare bar"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CompareBar);