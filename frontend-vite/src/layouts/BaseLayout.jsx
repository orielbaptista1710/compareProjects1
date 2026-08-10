// components/layouts/BaseLayout.js
import "./BaseLayout.css";

const BaseLayout = ({ children }) => {
  return (
    <div className="base-layout">
      <div className="base-container">{children}</div>
    </div>
  );
};

export default BaseLayout;
