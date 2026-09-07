//CHECK THIS IS sHARED ui where it is used d sjslvns;vksv;svns;vkv;ekvnekvkerv; CHECK THIS MAN

export const Section = ({ title, children }) => (
  <div className="section">
    <h5 className="section__title">{title}</h5>
    {children}
  </div>
);

export const Row = ({ label, value, highlight }) => (
  <div className={`row ${highlight ? "row--highlight" : ""}`}>
    <span className="row__label">{label}</span>
    <span className="row__value">{value}</span>
  </div>
);

export const AmenityGroup = ({ title, items }) => (
  <Section title={title}>
    {items?.length ? (
      <div className="chip-list">
        {items.map((item, i) => (
          <span key={i} className="chip">
            {item}
          </span>
        ))}
      </div>
    ) : (
      <p className="empty-list">None listed</p>
    )}
  </Section>
);

// export const safeText = (val) => (val != null && val !== "" ? val : "—");
// export const fmtArea = (area) =>
//   area?.value ? `${area.value.toLocaleString("en-IN")} ${area.unit || "sq.ft"}` : "—";
// export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");