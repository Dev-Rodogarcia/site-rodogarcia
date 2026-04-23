"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Detecta direção do scroll para esconder/mostrar a navbar.
 * Portado de site-shell.js updateNavVisibility().
 */
export function useScrollDirection(threshold = 4) {
  const [isHidden, setIsHidden] = useState(false);
  const lastY = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    lastY.current = window.scrollY;

    function update() {
      const currentY = window.scrollY;
      const delta = currentY - lastY.current;

      if (currentY < 80) {
        setIsHidden(false);
      } else if (delta > threshold) {
        setIsHidden(true);
      } else if (delta < -threshold) {
        setIsHidden(false);
      }

      lastY.current = currentY;
      rafId.current = null;
    }

    function onScroll() {
      if (rafId.current !== null) return;
      rafId.current = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [threshold]);

  return isHidden;
}
