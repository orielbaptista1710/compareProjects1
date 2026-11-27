// sections/PhotoExamples.jsx
// One good and four spoiled example photos, drawn inline (no image files to
// load). Closed by default so the Photos card stays short on a phone.

// One drawn house; the CSS modifier spoils it (dark, blurry, tilted, text on it).
const Example = ({ good, label, variant }) => (
  <figure className={`lms-eg ${good ? "is-good" : "is-bad"}`}>
    <svg className={`lms-eg__img${variant ? ` is-${variant}` : ""}`} viewBox="0 0 120 80" role="img" aria-label={label}>
      <rect className="lms-eg__sky" width="120" height="80" />
      <rect className="lms-eg__ground" y="58" width="120" height="22" />
      <rect className="lms-eg__wall" x="28" y="30" width="64" height="32" />
      <polygon className="lms-eg__roof" points="22,32 60,10 98,32" />
      <rect className="lms-eg__door" x="54" y="42" width="12" height="20" />
      <rect className="lms-eg__window" x="35" y="38" width="12" height="10" />
      <rect className="lms-eg__window" x="73" y="38" width="12" height="10" />
      {variant === "text" && (
        <text className="lms-eg__mark" x="60" y="72" textAnchor="middle">98xxxxxx00</text>
      )}
    </svg>
    <figcaption className="lms-eg__caption">
      <span aria-hidden="true">{good ? "✓" : "✕"}</span> {label}
    </figcaption>
  </figure>
);

const PhotoExamples = () => (
  <details className="lms-examples">
    <summary className="lms-examples__summary">See good and bad photo examples</summary>
    <div className="lms-eg-row">
      <Example good label="Bright, straight and in focus" />
      <Example label="Too dark" variant="dark" />
      <Example label="Blurry" variant="blurry" />
      <Example label="Tilted" variant="tilted" />
      <Example label="Phone number or watermark" variant="text" />
    </div>
  </details>
);

export default PhotoExamples;
