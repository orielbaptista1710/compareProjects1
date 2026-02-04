import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FilterSection = ({ title, icon: Icon, children, initiallyOpen = true }) => {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <div className="filter-section">
      <header onClick={() => setOpen(!open)}>
        <span>{Icon && <Icon size={16} />} {title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </header>
      {open && <div className="filter-body">{children}</div>}
    </div>
  );
};

export default React.memo(FilterSection);