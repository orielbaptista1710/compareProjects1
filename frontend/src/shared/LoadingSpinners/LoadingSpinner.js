import React from "react";
import { Spin, Typography } from "antd";

const { Text } = Typography;

const LoadingSpinner = ({ size = "md", text = "Loading..." }) => {
  // Map sizes to Ant Design spinner sizes
  const sizeMap = {
    sm: "small",
    md: "default",
    lg: "large",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: "2rem 0",
      }}
    >
      <Spin
        size={sizeMap[size]}
        style={{ color: "#9417E2" }}
      />
      {text && (
        <Text
          style={{
            marginTop: "0.5rem",
            color: "#9417E2",
            fontSize: size === "lg" ? "1.25rem" : size === "sm" ? "0.85rem" : "1rem",
            fontWeight: 500,
          }}
        >
          {text}
        </Text>
      )}
    </div>
  );
};

export default LoadingSpinner;
