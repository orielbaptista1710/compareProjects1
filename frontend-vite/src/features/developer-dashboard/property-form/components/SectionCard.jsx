// features/developer-dashboard/property-form/components/SectionCard.jsx
// One numbered section. Collapsed: a full-width button row. Open: a card with
// header, fields and a footer with the "Continue to …" action. The header
// stays the accordion button in both states (aria-expanded). The body is only
// rendered while open; RHF keeps closed sections' values.
import { ChevronDown } from "lucide-react";

const SectionCard = ({ section, number, isOpen, onToggle, footer, children }) => {
  const headId = `spf-head-${section.id}`;
  const bodyId = `spf-body-${section.id}`;

  return (
    <section className={`spf-card${isOpen ? " is-open" : ""}`} data-section={section.id}>
      <h2 className="spf-card__heading">
        <button
          type="button"
          id={headId}
          className="spf-card__toggle"
          aria-expanded={isOpen}
          aria-controls={bodyId}
          onClick={() => onToggle(section.id)}
        >
          <span className="spf-card__number" aria-hidden="true">{number}</span>
          <span className="spf-card__titles">
            <span className="spf-card__title">{section.title}</span>{" "}
            <span className="spf-card__desc">{section.description}</span>
          </span>
          <ChevronDown className="spf-card__chevron" size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </h2>

      {isOpen && (
        <div id={bodyId} role="region" aria-labelledby={headId}>
          <div className="spf-card__body">{children}</div>
          {footer && <div className="spf-card__foot">{footer}</div>}
        </div>
      )}
    </section>
  );
};

export default SectionCard;
