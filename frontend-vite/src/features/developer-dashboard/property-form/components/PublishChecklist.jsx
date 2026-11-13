// features/developer-dashboard/property-form/components/PublishChecklist.jsx
// "Before you publish": sections done, a progress bar, and each section's
// status (computed from real validation in useSectionStatus). Each item
// opens its section.
import { SECTIONS } from "../sectionConfig";

const STATUS_LABEL = {
  done: "Done",
  progress: "In progress",
  error: "To fix",
  todo: "To do",
  soon: "Coming soon",
};

const PublishChecklist = ({ status, onOpen }) => {
  const { byId, done, total } = status;
  const percent = Math.round((done / total) * 100);

  return (
    <section className="spf-rail-card" aria-labelledby="spf-checklist-heading">
      <div className="spf-checklist__top">
        <h2 id="spf-checklist-heading" className="spf-rail-card__title">Before you publish</h2>
        <span className="spf-checklist__count">{done} of {total} done</span>
      </div>
      <div
        className="spf-checklist__bar"
        role="progressbar"
        aria-label="Sections done"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} sections done`}
      >
        <span style={{ width: `${percent}%` }} />
      </div>

      <ul className="spf-checklist">
        {SECTIONS.map((s) => {
          const st = byId[s.id];
          return (
            <li key={s.id}>
              <button
                type="button"
                className={`spf-checklist__item is-${st.state}`}
                onClick={() => onOpen(s.id)}
              >
                <span className="spf-checklist__dot" aria-hidden="true" />
                <span className="spf-checklist__name">{s.title}</span>
                <span className="spf-checklist__status">
                  {st.state === "error" ? `${st.errorCount} to fix` : STATUS_LABEL[st.state]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default PublishChecklist;
