import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

const FilterSection = ({
  title,
  icon: Icon,
  children,
  initiallyOpen = true,
}) => {
  const [open, setOpen] = useState(initiallyOpen);
  const bodyId = useId();

  return (
    <div className="filter-section">
      {/* A real <button>: Enter/Space work natively (and Space doesn't scroll the page). */}
      <button
        type="button"
        className="filter-section-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={open ? bodyId : undefined} /* the body isn't rendered while collapsed */
      >
        <span className="filter-section-label">
          {Icon && <Icon size={14} aria-hidden="true" />}
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`filter-chevron ${open ? "open" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={bodyId} className="filter-body">
          {children}
        </div>
      )}
    </div>
  );
};

export default React.memo(FilterSection);
