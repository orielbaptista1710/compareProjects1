import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const FilterSection = ({
  title,
  icon: Icon,
  children,
  initiallyOpen = true,
}) => {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <div className="filter-section">
      <header
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((p) => !p)}
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
      </header>

      {open && <div className="filter-body">{children}</div>}
    </div>
  );
};

export default React.memo(FilterSection);