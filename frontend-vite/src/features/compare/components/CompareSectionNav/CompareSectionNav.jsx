import { useEffect, useState } from "react";
import "./CompareSectionNav.css";

const cssPx = (el, name) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

// Section links + the "Only differences" switch. One markup: a sticky chip
// row on small screens, a sticky sidebar from 1100px (CSS only). The active
// section is local state, so scrolling re-renders only this component.
const CompareSectionNav = ({ sections, diffOnly, onDiffOnlyChange, diffDisabled }) => {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = sections.map((s) => document.getElementById(`compare-${s.id}`)).filter(Boolean);

    // A section is "active" while it crosses a band ~25–35% down the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id.replace("compare-", ""));
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const jumpTo = (e, id) => {
    const target = document.getElementById(`compare-${id}`);
    if (!target) return;
    e.preventDefault();
    // Land below the fixed site header, chip row and sticky property bar.
    const offset = cssPx(target, "--chrome-h") + cssPx(target, "--nav-h") + cssPx(target, "--mini-h") + 8;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
    setActive(id);
  };

  return (
    <nav className="csn" aria-label="Comparison sections">
      <ul className="csn__list">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#compare-${s.id}`}
              className={`csn__link ${active === s.id ? "is-active" : ""}`}
              aria-current={active === s.id ? "true" : undefined}
              onClick={(e) => jumpTo(e, s.id)}
            >
              {s.title}
            </a>
          </li>
        ))}
      </ul>

      <label className="csn__diff">
        <input
          type="checkbox"
          checked={diffOnly}
          disabled={diffDisabled}
          onChange={(e) => onDiffOnlyChange(e.target.checked)}
        />
        Only differences
      </label>
    </nav>
  );
};

export default CompareSectionNav;
