import { memo, useRef } from "react";
import { Check, ExternalLink } from "lucide-react";
import HeaderCard from "../HeaderCard/HeaderCard";
import CompareStickyHeader from "../CompareStickyHeader/CompareStickyHeader";
import "./CompareTable.css";

const isHttpUrl = (value) => /^https?:\/\//i.test(value);

const Cell = ({ kind, value }) => {
  if (kind === "check") {
    return value ? (
      <span className="ct-yes">
        <Check size={14} strokeWidth={2.5} aria-hidden="true" /> Yes
      </span>
    ) : (
      <span className="ct-na" aria-label="Not specified">—</span>
    );
  }
  if (kind === "link") {
    return isHttpUrl(value) ? (
      <a href={value} target="_blank" rel="noopener noreferrer" className="ct-link">
        View on map <ExternalLink size={12} strokeWidth={1.5} aria-hidden="true" />
      </a>
    ) : (
      <span className="ct-na">—</span>
    );
  }
  return value;
};

// Blank cells under the empty-slot columns (hidden on phones by CSS).
const SlotCells = ({ count }) =>
  Array.from({ length: count }, (_, i) => <td key={`slot-${i}`} className="ct-slot" aria-hidden="true" />);

// Separately memoised so suggestions loading into the slot header cards
// never re-renders the (much larger) body.
const TableBody = memo(function TableBody({ properties, sections, slotCount }) {
  const cols = properties.length;
  return sections.map((section) => (
    <tbody
      key={section.id}
      id={`compare-${section.id}`}
      className={section.hasDiff ? "ct-section has-diff" : "ct-section"}
    >
      <tr className="ct-section__head">
        <th scope="rowgroup" colSpan={section.counts ? 1 : cols + 1}>
          {section.title}
          {/* `hidden` by default; CSS reveals it only in "Only differences" mode */}
          {!section.hasDiff && <span className="ct-same" hidden>All the same</span>}
        </th>
        {section.counts?.map((count, i) => (
          <td key={properties[i]._id} className="ct-count">
            {count} / {section.total}
          </td>
        ))}
        <SlotCells count={slotCount} />
      </tr>
      {section.rows.map((row) => (
        <tr key={row.id} className={row.isDiff ? "ct-row is-diff" : "ct-row"}>
          <th scope="row">{row.label}</th>
          {row.cells.map((value, i) => (
            <td key={properties[i]._id}>
              <Cell kind={row.kind} value={value} />
            </td>
          ))}
          <SlotCells count={slotCount} />
        </tr>
      ))}
    </tbody>
  ));
});

// `sections` comes from buildCompareModel and `slots` (one node per empty
// slot) from the page. Memoised; the "Only differences" toggle is pure CSS
// on an ancestor, so it never re-renders this. Callers must pass stable
// onRemove/onView (useCallback).
const CompareTable = memo(function CompareTable({ properties, sections, slots = [], onRemove, onView }) {
  const scrollRef = useRef(null);
  const headRef = useRef(null);
  const used = properties.length;

  return (
    <div
      className="ct-wrap"
      style={{ "--cols-filled": used, "--cols-all": used + slots.length }}
    >
      <CompareStickyHeader
        properties={properties}
        slotCount={slots.length}
        scrollRef={scrollRef}
        headRef={headRef}
      />

      <div className="ct-scroll" ref={scrollRef}>
        <table className="ct">
          <colgroup>
            <col className="ct-col-label" />
          </colgroup>

          <thead ref={headRef}>
            <tr>
              <td className="ct-corner">
                {slots.length > 0 && (
                  <p className="ct-corner__slots">
                    <strong>{used}</strong> of {used + slots.length} slots used
                  </p>
                )}
              </td>
              {properties.map((p) => (
                <th key={p._id} scope="col" className="ct-head">
                  <HeaderCard property={p} onRemove={onRemove} onView={onView} />
                </th>
              ))}
              {slots.map((slot, i) => (
                <td key={`slot-${i}`} className="ct-head ct-slot">
                  {slot}
                </td>
              ))}
            </tr>
          </thead>

          <TableBody properties={properties} sections={sections} slotCount={slots.length} />
        </table>
      </div>
    </div>
  );
});

export default CompareTable;
