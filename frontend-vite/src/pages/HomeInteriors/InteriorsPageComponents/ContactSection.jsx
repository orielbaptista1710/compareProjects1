// HomeInteriors — consultation section.
// Layout only: the form is not wired to any endpoint yet, so the submit
// button stays disabled and the note points people to phone/email instead.

const SPACES = ["1 BHK", "2 BHK", "3 BHK", "4 BHK or larger", "Villa", "Office or shop"];
const CITIES = ["Mumbai", "Thane", "Navi Mumbai", "Pune"];
const BUDGETS = ["Under ₹5 L", "₹5 L to ₹10 L", "₹10 L to ₹20 L", "Above ₹20 L"];
const POSSESSION = ["Already have the keys", "Within 3 months", "3 to 6 months", "Later than 6 months"];

const Select = ({ id, label, options }) => (
  <div className="intr-field">
    <label htmlFor={id}>{label}</label>
    <select id={id} name={id} defaultValue={options[0]}>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  </div>
);

const ContactUsInfo = () => {
  return (
    <section
      id="interiors-contact"
      className="intr-section intr-anchor"
      aria-labelledby="intr-contact-title"
    >
      <div className="intr-container intr-contact">
        <div className="intr-contact__intro">
          <h2 id="intr-contact-title" className="intr-section__title intr-contact__title">
            Book a free consultation
          </h2>
          <p className="intr-contact__lede">
            Tell us about your space. A designer will call you within a working
            day to understand what you need and arrange a site visit.
          </p>

          <dl className="intr-contact__list">
            <div>
              <dt>Call</dt>
              <dd><a href="tel:+919876543210">+91 98765 43210</a></dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd><a href="mailto:info@compareprojects.com">info@compareprojects.com</a></dd>
            </div>
            <div>
              <dt>Studio</dt>
              <dd>Mumbai, Maharashtra</dd>
            </div>
          </dl>
        </div>

        <form className="intr-form" aria-labelledby="intr-contact-title">
          <div className="intr-form__grid">
            <div className="intr-field">
              <label htmlFor="intr-name">Full name</label>
              <input id="intr-name" name="name" type="text" autoComplete="name" />
            </div>
            <div className="intr-field">
              <label htmlFor="intr-mobile">Mobile number</label>
              <input
                id="intr-mobile"
                name="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10-digit number"
              />
            </div>
            <Select id="intr-space" label="Space" options={SPACES} />
            <Select id="intr-city" label="City" options={CITIES} />
            <Select id="intr-budget" label="Budget" options={BUDGETS} />
            <Select id="intr-possession" label="When do you get possession?" options={POSSESSION} />

            <div className="intr-field intr-field--full">
              <label htmlFor="intr-notes">
                Anything we should know? <span className="intr-field__opt">(optional)</span>
              </label>
              <textarea
                id="intr-notes"
                name="notes"
                rows="3"
                placeholder="e.g. We want lots of storage and a study corner"
              />
            </div>
          </div>

          <label className="intr-consent">
            <input type="checkbox" name="consent" />
            <span>
              I agree to be contacted by phone or WhatsApp about this request. See
              our <a href="/privacy-policy">privacy policy</a>.
            </span>
          </label>

          <div className="intr-form__footer">
            <button type="submit" className="intr-btn intr-btn--primary" disabled>
              Request a call back
            </button>
            <p className="intr-form__note">
              Online booking isn’t live yet. Call or email us to book a visit.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ContactUsInfo;
