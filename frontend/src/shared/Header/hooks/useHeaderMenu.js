// shared/components/Header/hooks/useHeaderMenu.js

import { useState, useCallback } from "react";

export function useHeaderMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return { isMenuOpen, toggleMenu, closeMenu, setIsMenuOpen };
}
