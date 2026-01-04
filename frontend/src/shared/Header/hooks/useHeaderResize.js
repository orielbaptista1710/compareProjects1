// hooks/useHeaderResize.js
import { useEffect, useState } from "react";

export function useHeaderResize(breakpoint, onAboveBreakpoint) {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    let timeoutId;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWidth(window.innerWidth);
        if (window.innerWidth > breakpoint) {
          onAboveBreakpoint?.();
        }
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [breakpoint, onAboveBreakpoint]);

  return width;
}
