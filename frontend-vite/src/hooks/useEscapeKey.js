//hook is used for closing modals when the escape key is pressed
import { useEffect } from "react";

export function useEscapeKey(isActive, onClose) {
  useEffect(() => {
    if (!isActive || !onClose) return;

    const handler = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [isActive, onClose]);
}