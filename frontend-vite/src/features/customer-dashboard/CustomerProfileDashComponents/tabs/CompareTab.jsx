// src/features/customer-dashboard/CustomerProfileDashComponents/tabs/CompareTab.jsx
import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { useCompare } from "../../../../contexts/CompareContext";
import { CustomerActivityContext } from "../../../../contexts/CustomerActivityContext";
import { MAX_COMPARE } from "../../../../hooks/useCompareList";
import { formatCurrencyShort } from "../../../../utils/formatters";
import { getOptimizedPropertyImage } from "../../../../utils/propertyHelpers";
import { buildQuickLook } from "./compareQuickLook";

const nameOf = (p) => p.projectName || p.title;
const placeOf = (p) => [p.locality, p.city].filter(Boolean).join(", ");

const CompareCard = ({ property, onRemove }) => (
  <article className="ctab-card">
    <Link to={`/property/${property._id}`} className="ctab-card-link">
      <img
        className="ctab-card-img"
        src={getOptimizedPropertyImage(property, { width: 480, height: 240 })}
        alt=""
        loading="lazy"
      />
      <div className="ctab-card-body">
        <h4 className="ctab-card-name">{nameOf(property)}</h4>
        <p className="ctab-card-place">{placeOf(property)}</p>
        <p className="ctab-card-price">{formatCurrencyShort(property.price)}</p>
      </div>
    </Link>
    <button
      type="button"
      className="ctab-card-remove"
      onClick={() => onRemove(property._id)}
      aria-label={`Remove ${nameOf(property)} from comparison`}
    >
      <X size={14} strokeWidth={2.25} />
    </button>
  </article>
);

const ShortlistPicker = ({ compareIds, onAdd, onClose }) => {
  const { heartProperties = [], loading } = useContext(CustomerActivityContext) ?? {};
  const options = heartProperties.filter((p) => p?._id && !compareIds.has(p._id));

  return (
    <section className="ctab-picker" aria-label="Add from your shortlist">
      <div className="ctab-picker-head">
        <h4>Add from your shortlist</h4>
        <button type="button" className="ctab-icon-btn" onClick={onClose} aria-label="Close shortlist">
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <p className="ctab-picker-note">Loading your shortlist…</p>
      ) : options.length === 0 ? (
        <p className="ctab-picker-note">
          {heartProperties.length ? "Everything on your shortlist is already here." : "Your shortlist is empty."}{" "}
          <Link to="/properties">Browse projects &rarr;</Link>
        </p>
      ) : (
        <ul className="ctab-picker-list">
          {options.map((p) => (
            <li key={p._id} className="ctab-picker-item">
              <div className="ctab-picker-text">
                <strong>{nameOf(p)}</strong>
                <span>
                  {placeOf(p)} · {formatCurrencyShort(p.price)}
                </span>
              </div>
              <button type="button" className="ctab-btn ctab-btn-outline" onClick={() => onAdd(p)}>
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const CompareTab = () => {
  const { compareList, setCompareList, addToCompare, removeFromCompare } = useCompare();
  const [pickerOpen, setPickerOpen] = useState(false);

  const items = useMemo(() => compareList.slice(0, MAX_COMPARE), [compareList]);
  const compareIds = useMemo(() => new Set(items.map((p) => p._id)), [items]);
  const quickLook = useMemo(() => buildQuickLook(items), [items]);
  const emptySlots = MAX_COMPARE - items.length;

  const handleAdd = (property) => {
    addToCompare(property);
    if (items.length + 1 >= MAX_COMPARE) setPickerOpen(false);
  };

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>Compare</h2>
        <p className="panel-subtitle">Compare up to {MAX_COMPARE} projects side by side.</p>
      </div>

      <section className="ctab-box" aria-labelledby="ctab-current">
        <div className="ctab-box-head">
          <h3 id="ctab-current">
            Current comparison{" "}
            <span className="ctab-count">
              ({items.length} of {MAX_COMPARE})
            </span>
          </h3>
          {items.length > 0 && (
            <div className="ctab-actions">
              <button type="button" className="ctab-btn ctab-btn-ghost" onClick={() => setCompareList([])}>
                Clear
              </button>
              <Link to="/compare" className="ctab-btn ctab-btn-primary">
                Open full comparison <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          )}
        </div>

        <div className="ctab-slots">
          {items.map((p) => (
            <CompareCard key={p._id} property={p} onRemove={removeFromCompare} />
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <div key={`empty-${i}`} className="ctab-slot">
              <button
                type="button"
                className="ctab-slot-btn"
                onClick={() => setPickerOpen(true)}
                aria-expanded={pickerOpen}
              >
                <Plus size={18} aria-hidden="true" />
                <span>Add from your shortlist</span>
              </button>
              <Link to="/properties" className="ctab-slot-link">
                or browse projects
              </Link>
            </div>
          ))}
        </div>

        {pickerOpen && emptySlots > 0 && (
          <ShortlistPicker compareIds={compareIds} onAdd={handleAdd} onClose={() => setPickerOpen(false)} />
        )}

        {items.length > 0 && (
          <>
            <div className="ctab-quick-head">
              <h4>Quick look</h4>
              {items.length > 1 && <p>Highlighted = best value in each row</p>}
            </div>
            <div className="ctab-table-wrap">
              <table className="ctab-table">
                <thead className="ctab-sr-only">
                  <tr>
                    <th scope="col">Detail</th>
                    {items.map((p) => (
                      <th scope="col" key={p._id}>
                        {nameOf(p)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quickLook.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">{row.label}</th>
                      {row.cells.map((cell, i) => (
                        <td key={items[i]._id} className={cell.best ? "is-best" : undefined}>
                          {cell.text}
                          {cell.best && <span className="ctab-sr-only"> (best)</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default CompareTab;
