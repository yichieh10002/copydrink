"use client";

import { useEffect } from "react";

export function MotionEffects() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover)").matches
    )
      return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = event.target instanceof Element ? event.target : null;
        const surface = target?.closest<HTMLElement>(
          ".home-hero, .store-card, .store-intro",
        );
        if (!surface) return;
        const rect = surface.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        surface.style.setProperty("--gx", `${x.toFixed(0)}px`);
        surface.style.setProperty("--gy", `${y.toFixed(0)}px`);
        surface.style.setProperty("--mx", (x / rect.width - 0.5).toFixed(3));
        surface.style.setProperty("--my", (y / rect.height - 0.5).toFixed(3));
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);
  return null;
}
