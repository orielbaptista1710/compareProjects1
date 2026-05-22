import React, { useState, useCallback, useEffect } from "react";
import "./MascotGuide.css";
import mascot from "../../../assests/images/mascot.svg";

const MascotGuide = ({ steps = [], pageName = "" }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState("open"); // "open" | "minimised" | "dismissed"

  useEffect(() => {
    setStepIndex(0);
    setStatus("open");
  }, [pageName]);

  const next = useCallback(() => {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
    else setStatus("dismissed");
  }, [stepIndex, steps.length]);

  const back = useCallback(() => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }, [stepIndex]);

  if (steps.length === 0 || status === "dismissed") return null;

  const isLast = stepIndex === steps.length - 1;
  const remaining = steps.length - stepIndex;

  return (
    <>
      {status === "minimised" && (
        <button
          className="mg-fab"
          onClick={() => setStatus("open")}
          aria-label="Reopen property guide"
        >
          <img src={mascot} alt="" className="mg-fab-mascot" />
          {remaining > 0 && (
            <span className="mg-fab-badge" aria-label={`${remaining} tips remaining`}>
              {remaining}
            </span>
          )}
        </button>
      )}

      {status === "open" && (
        <div className="mg-container" role="dialog" aria-label="Property guide">
          <div className="mg-mascot-wrap">
            <img src={mascot} alt="Apna Guide" className="mg-mascot-img" />
          </div>

          <div className="mg-bubble">
            <button
              className="mg-close"
              onClick={() => setStatus("minimised")}
              aria-label="Minimise guide"
            >
              ✕
            </button>

            <div className="mg-meta">
              <span className="mg-name">Apna Guide</span>
              <span className="mg-counter" aria-live="polite">
                {stepIndex + 1} / {steps.length}
              </span>
            </div>

            <div className="mg-pips" role="list" aria-label="Step progress">
              {steps.map((_, i) => (
                <span
                  key={i}
                  role="listitem"
                  className={`mg-pip ${
                    i === stepIndex ? "active" : i < stepIndex ? "done" : ""
                  }`}
                  aria-current={i === stepIndex ? "step" : undefined}
                />
              ))}
            </div>

            <p className="mg-text" aria-live="polite">
              {steps[stepIndex]}
            </p>

            <div className="mg-footer">
              {stepIndex > 0 && (
                <button className="mg-btn-back" onClick={back}>
                  ← Back
                </button>
              )}
              <button
                className={`mg-btn-next${isLast ? " last" : ""}`}
                onClick={next}
              >
                {isLast ? "Got it ✓" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(MascotGuide);