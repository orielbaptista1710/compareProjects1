import React, { memo } from "react";

const DetailRow = memo(
  ({ label, value, icon }) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === false
    ) {
      return null;
    }

    const display =
      value === true ? "Yes" : value;

    return (
      <div className="detail-row">
        <div className="detail-label">
          {icon}
          {label}
        </div>

        <div className="detail-value">
          {display}
        </div>
      </div>
    );
  }
);

export default DetailRow;