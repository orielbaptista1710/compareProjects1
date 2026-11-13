import {
  portfolioFilters,
  portfolioFilterLabels,
  portfolioItems,
} from "../../../database/interiorsData";

const countFor = (filter) =>
  filter === "all"
    ? portfolioItems.length
    : portfolioItems.filter((item) => item.category === filter).length;

export default function PortfolioSection({ activeFilter, setActiveFilter }) {
  return (
    <section id="interiors-work" className="intr-section intr-anchor" aria-labelledby="intr-work-title">
      <div className="intr-container">
        <div className="intr-section__head">
          <div>
            <h2 id="intr-work-title" className="intr-section__title">Our work</h2>
            <p className="intr-section__sub">
              Real projects, photographed after handover.
            </p>
          </div>

          <div className="intr-pills" role="group" aria-label="Filter projects by room">
            {portfolioFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`intr-pill ${activeFilter === filter ? "is-active" : ""}`}
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}
              >
                {portfolioFilterLabels[filter] ?? filter}
                <span className="intr-pill__count">{countFor(filter)}</span>
              </button>
            ))}
          </div>
        </div>

        <ul className="intr-work">
          {portfolioItems
            .filter((item) =>
              activeFilter === "all" ? true : item.category === activeFilter
            )
            .map((item) => (
              <li key={item.id} className="intr-work__item">
                <div className={`intr-work__media intr-tone--${item.category}`}>
                  {item.image && (
                    <img src={item.image} alt={item.title} loading="lazy" width="600" height="450" />
                  )}
                  <span className="intr-work__tag">
                    {portfolioFilterLabels[item.category] ?? item.category}
                  </span>
                </div>
                <h3 className="intr-work__title">{item.title}</h3>
                <p className="intr-work__meta">
                  {item.location}, {item.area}
                </p>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}
