const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=70";

export default function InteriorsHeroSection() {
  return (
    <section className="intr-hero">
      <div className="intr-container intr-hero__inner">
        <div className="intr-hero__copy">
          <h1 className="intr-hero__title">Interiors for the home you just bought</h1>
          <p className="intr-hero__lede">
            Design and fit-out for new apartments and offices in Mumbai, Thane,
            Navi Mumbai and Pune. One team from first sketch to handover, with a
            fixed quote before work starts.
          </p>
          <div className="intr-hero__actions">
            <a href="#interiors-contact" className="intr-btn intr-btn--primary">
              Book a free consultation
            </a>
            <a href="#interiors-work" className="intr-btn intr-btn--outline">
              See our work
            </a>
          </div>
        </div>

        <div className="intr-hero__media">
          <img
            src={HERO_IMAGE}
            alt="A finished living room with a sofa and large windows"
            width="1200"
            height="800"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
