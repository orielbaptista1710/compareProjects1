import React, { useState } from "react";

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  loading = "lazy",
  ...props
}) {
  const [loaded, setLoaded] = useState(false);

  const baseUrl = src.split("?")[0];
  const optimizedUrl = `${baseUrl}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

  return (
    <img
      src={optimizedUrl}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      onLoad={() => setLoaded(true)}
      className={`optimized-img ${loaded ? "loaded" : "loading"} ${className}`}
      {...props}
    />
  );
}
