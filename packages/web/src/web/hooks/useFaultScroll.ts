import { useEffect } from "react";

/**
 * Drives the site-wide "Street ↔ Crown" fault line.
 * Sets --fault (0 → 1) on <html> based on overall page scroll progress.
 * rAF-throttled, passive listener — cheap enough to run on every scroll frame.
 */
export function useFaultScroll() {
  useEffect(() => {
    let ticking = false;

    function update() {
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const scrollHeight = doc.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;
      doc.style.setProperty("--fault", progress.toFixed(4));
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
}
