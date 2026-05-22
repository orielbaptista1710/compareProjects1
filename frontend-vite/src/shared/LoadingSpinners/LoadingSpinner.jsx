

import React from "react";
import { Spin } from "antd";

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backdropFilter: "blur(6px)",
        background: "rgba(255,255,255,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        flexDirection: "column"
      }}
    >
      <Spin size="large" />

      <p
        style={{
          marginTop: "12px",
          fontWeight: 500,
          color: "#9417E2"
        }}
      >
        {text}
      </p>
    </div>
  );
};

export default LoadingSpinner;
