import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
    }
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        const frame = window.requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return () => window.cancelAnimationFrame(frame);
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return null;
}