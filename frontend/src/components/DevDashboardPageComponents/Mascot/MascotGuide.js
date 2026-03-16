// MascotGuide.js
import React, { useState } from "react";
import "./MascotGuide.css";
import mascot from "../../../assests/images/mascot.svg";

const MascotGuide = ({ steps = [] }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  if (!visible || steps.length === 0) return null;

  const isLast = stepIndex === steps.length - 1;

  const nextStep = () => {
    if (!isLast) setStepIndex((i) => i + 1);
  };

  return (
    <div className="mascot-container">
      <img src={mascot} alt="Guide Mascot" className="mascot-img" />

      <div className="speech-bubble">
        {/* close */}
        <button
          className="close-btn"
          onClick={() => setVisible(false)}
          aria-label="Close guide"
        >
          ✕
        </button>

        {/* step counter */}
        <span className="step-counter">
          {stepIndex + 1} / {steps.length}
        </span>

        <p>{steps[stepIndex]}</p>

        <div className="bubble-footer">
          <button className="next-btn" onClick={nextStep} disabled={isLast}>
            {isLast ? "Done ✓" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default React.memo(MascotGuide);