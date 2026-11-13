const STEPS = [
  {
    title: "Free consultation",
    text: "A designer visits your space, takes measurements and talks through how you live.",
  },
  {
    title: "3D design and fixed quote",
    text: "You see every room in 3D and get a line-by-line quote before you pay anything.",
  },
  {
    title: "Build with weekly updates",
    text: "Our team runs the site. You get photos and a progress update every week.",
  },
  {
    title: "Handover",
    text: "We walk through every room with you, fix any snags and hand over the keys.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="intr-band intr-section" aria-labelledby="intr-steps-title">
      <div className="intr-container">
        <h2 id="intr-steps-title" className="intr-section__title">How it works</h2>
        <ol className="intr-steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="intr-step">
              <span className="intr-step__num">Step {i + 1}</span>
              <h3 className="intr-step__title">{step.title}</h3>
              <p className="intr-step__text">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
