// src/pages/HomeInteriors/InteriorsPageComponents/ServicesSection
import { homeServices, commercialServices, serviceTabs } from "../../../database/interiorsData";

export default function ServicesSection({ activeTab, setActiveTab }) {
  const services = activeTab === "home" ? homeServices : commercialServices;

  return (
    <section className="intr-band intr-section" aria-labelledby="intr-services-title">
      <div className="intr-container">
        <div className="intr-section__head">
          <h2 id="intr-services-title" className="intr-section__title">What we do</h2>

          <div className="intr-pills" role="group" aria-label="Service type">
            {serviceTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`intr-pill ${activeTab === tab.id ? "is-active" : ""}`}
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="intr-services">
          {services.map((service) => (
            <article key={service.id} className="intr-service">
              <h3 className="intr-service__title">{service.title}</h3>
              <p className="intr-service__text">{service.description}</p>
              {service.price && <p className="intr-service__price">{service.price}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
