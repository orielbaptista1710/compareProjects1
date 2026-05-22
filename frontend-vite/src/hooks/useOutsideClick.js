// hooks/useOutsideClick.js
import { useEffect } from "react";

export function useOutsideClick(isActive, refs, onClose) {
  useEffect(() => {
    if (!isActive || !refs?.length) return;

    const handler = (e) => {
      const clickedInside = refs.some(
        (ref) => ref.current && ref.current.contains(e.target)
      );

      if (!clickedInside) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isActive, refs, onClose]);
}